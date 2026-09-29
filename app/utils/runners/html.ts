import type { RunnerAdapter } from './types'
import { harness, runInSandbox } from './sandbox'

/**
 * HTML, rendered in a sandboxed frame.
 *
 * The author writes a fragment, not a document — teaching "here is a form"
 * should not require boilerplate — so the doctype and charset are added here.
 * A full document is passed through untouched.
 */
export default {
  run(source) {
    const isDocument = /<!doctype|<html[\s>]/i.test(source)

    return runInSandbox({
      visual: true,
      // The harness goes first, so the console is shimmed before any
      // <script> the author wrote runs.
      build: token => isDocument
        ? injectFirst(source, harness(token))
        : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${harness(token)}</head><body>${source}</body></html>`
    })
  }
} satisfies RunnerAdapter

/** Put the harness at the top of the author's own document. */
function injectFirst(source: string, script: string) {
  if (/<head[^>]*>/i.test(source)) {
    return source.replace(/<head[^>]*>/i, match => match + script)
  }
  if (/<html[^>]*>/i.test(source)) {
    return source.replace(/<html[^>]*>/i, match => match + script)
  }
  return script + source
}
