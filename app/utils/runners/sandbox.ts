import type { RunResult } from './types'

/**
 * Run untrusted code in a throwaway iframe.
 *
 * `sandbox="allow-scripts"` without `allow-same-origin` puts the frame in an
 * opaque origin: it cannot read this page's DOM, its cookies or its storage, and
 * it cannot navigate the top frame. The only channel back out is `postMessage`,
 * which is why console output is shimmed rather than read.
 *
 * Shared by the html, css and javascript adapters — the only difference between
 * them is what gets written into the document.
 */

const TIMEOUT_MS = 5000

/**
 * The prelude every sandboxed document gets: console redirected to
 * postMessage, errors caught, and a `done` signal once the code has settled.
 * The token is handed in so that a stale frame from a previous run cannot post
 * into this one.
 *
 * "Settled" is not "the last line ran". A lesson about promises, timers or
 * fetch prints its output later, so the harness counts pending timers and
 * requests and only says `done` once none are left (or the parent's timeout
 * gives up on it). With no `body`, the harness is being put in front of the
 * author's own markup, and it waits for the page to load before counting.
 */
export function harness(token: string, body = '') {
  // `await` at the top level needs an async wrapper. Only then, because an
  // async function changes nothing else a beginner would notice, but a plain
  // function is closer still to a script.
  const wrapped = /\bawait\b/.test(body)
    ? `return (async function () {\n${body}\n})()`
    : body

  return `<script>
(function () {
  var TOKEN = ${JSON.stringify(token)};

  // Print a value the way a browser console does: undefined is "undefined",
  // NaN is "NaN", a function is its source. JSON only for objects and arrays.
  function show(a) {
    if (typeof a === 'string') return a;
    if (a === undefined || a === null || typeof a === 'number' || typeof a === 'boolean' || typeof a === 'bigint' || typeof a === 'symbol' || typeof a === 'function') return String(a);
    if (a instanceof Error) return a.stack || String(a);
    try {
      var text = JSON.stringify(a, function (key, value) {
        if (value === undefined) return 'undefined';
        if (typeof value === 'number' && !isFinite(value)) return String(value);
        if (typeof value === 'function') return 'function ' + (value.name || '') + '()';
        return value;
      }, 2);
      return text === undefined ? String(a) : text;
    } catch (e) { return String(a) }
  }

  function send(type, args) {
    parent.postMessage({ token: TOKEN, type: type, text: Array.prototype.map.call(args, show).join(' ') }, '*');
  }

  console.log = function () { send('log', arguments) };
  console.info = console.log;
  console.debug = console.log;
  console.warn = function () { send('log', arguments) };
  console.error = function () { send('error', arguments) };
  window.onerror = function (message) { send('error', [message]); return true };
  window.addEventListener('unhandledrejection', function (e) { send('error', ['Uncaught (in promise) ' + show(e.reason)]) });

  // Count the work that will finish later.
  var pending = 0;
  var live = {};
  var realSetTimeout = window.setTimeout;
  var realClearTimeout = window.clearTimeout;
  var realSetInterval = window.setInterval;
  var realClearInterval = window.clearInterval;

  function settle(id) { if (live[id]) { delete live[id]; pending-- } }

  window.setTimeout = function (fn, ms) {
    var args = Array.prototype.slice.call(arguments, 2);
    var id = realSetTimeout(function () {
      settle(id);
      if (typeof fn === 'function') fn.apply(null, args);
    }, ms);
    live[id] = true; pending++;
    return id;
  };
  window.clearTimeout = function (id) { settle(id); realClearTimeout(id) };
  window.setInterval = function () {
    var id = realSetInterval.apply(null, arguments);
    live[id] = true; pending++;
    return id;
  };
  window.clearInterval = function (id) { settle(id); realClearInterval(id) };

  if (window.fetch) {
    var realFetch = window.fetch;
    window.fetch = function () {
      pending++;
      return realFetch.apply(this, arguments).finally(function () { pending-- });
    };
  }

  // Done once nothing is pending across two consecutive macrotasks, so any
  // promise callbacks queued by the last timer have had their turn.
  function finish() { parent.postMessage({ token: TOKEN, type: 'done' }, '*') }
  function watch() {
    realSetTimeout(function () {
      if (pending > 0) return watch();
      realSetTimeout(function () { pending > 0 ? watch() : finish() }, 0);
    }, 15);
  }

  var result;
  try {
    result = (function () {
${wrapped}
    })();
  } catch (e) {
    send('error', [e && e.stack ? e.stack : String(e)]);
  }

  function start() {
    if (result && typeof result.then === 'function') {
      result.then(watch, function (e) { send('error', [e && e.stack ? e.stack : String(e)]); watch() });
    } else {
      watch();
    }
  }

  ${body ? 'start()' : 'document.readyState === "complete" ? start() : window.addEventListener("load", start)'};
})()
</script>`
}

interface SandboxOptions {
  /** Builds the full document. Receives the token to pass to `harness`. */
  build: (token: string) => string
  /** Return the document as rendered output, for html and css. */
  visual?: boolean
}

export function runInSandbox({ build, visual }: SandboxOptions): Promise<RunResult> {
  return new Promise((resolve) => {
    const token = Math.random().toString(36).slice(2)
    const srcdoc = build(token)
    const started = performance.now()

    const frame = document.createElement('iframe')
    frame.setAttribute('sandbox', 'allow-scripts')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden'

    const out: string[] = []
    const err: string[] = []
    let settled = false

    function finish(ok: boolean, extra?: string) {
      if (settled) {
        return
      }
      settled = true

      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      frame.remove()

      if (extra) {
        err.push(extra)
      }

      resolve({
        stdout: out.join('\n'),
        stderr: err.join('\n'),
        ok: ok && !err.length,
        ms: Math.round(performance.now() - started),
        html: visual ? srcdoc : undefined
      })
    }

    function onMessage(event: MessageEvent) {
      const data = event.data
      if (!data || data.token !== token) {
        return
      }

      if (data.type === 'log') {
        out.push(data.text)
      } else if (data.type === 'error') {
        err.push(data.text)
      } else if (data.type === 'done') {
        finish(true)
      }
    }

    const timer = setTimeout(
      () => finish(false, `Stopped after ${TIMEOUT_MS / 1000}s — the code did not finish. An infinite loop is the usual reason.`),
      TIMEOUT_MS
    )

    window.addEventListener('message', onMessage)

    frame.srcdoc = srcdoc
    document.body.appendChild(frame)
  })
}
