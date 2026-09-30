/**
 * Structural checks on every lesson under content/1.path/.
 *
 * Not a linter for prose — `pnpm lint` does not read markdown at all, and the
 * failures this catches are the ones that render as a wall of raw YAML or eat
 * half a lesson without erroring anywhere. Every rule here exists because it
 * went wrong while the curriculum was being written:
 *
 *   · An MDC block closed with ``` instead of `::`, which swallows everything
 *     until the next code fence.
 *   · A nested component opened with `::` instead of `:::`, so the parent's
 *     closing fence closes the child and the rest of the lesson is inside it.
 *   · A `::flow-step{... highlight"}` with a stray quote, which renders the
 *     attribute as text.
 *   · An em dash in lesson prose, banned in AUTHORING.md as the loudest tell that
 *     a machine wrote the page.
 *
 * Run with `pnpm check:lessons`. Exits non-zero with file:line for each.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const PATH_DIR = join(ROOT, 'content/1.path')

/** Every `.md` under content/1.path, recursively. */
function lessons(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return lessons(full)
    return full.endsWith('.md') ? [full] : []
  })
}

const problems = []
const emDashes = []
const report = (file, line, message) =>
  problems.push(`${relative(ROOT, file)}:${line}  ${message}`)

for (const file of lessons(PATH_DIR)) {
  const lines = readFileSync(file, 'utf8').split('\n')

  /* Front matter is delimited by `---`, and so is a component's YAML block, so
     the scan has to know which one it is in. */
  let inFrontMatter = lines[0] === '---'
  let inCode = false
  let inYaml = false
  const open = []

  lines.forEach((line, index) => {
    const number = index + 1

    if (inFrontMatter) {
      if (number > 1 && line === '---') inFrontMatter = false
      return
    }

    /* A fenced code block. Its contents are not markdown and are skipped.
       The fence may be indented inside a list item, and it may follow a list
       marker — `  - ```bash` — which is not valid markdown but is easy to write
       and produced exactly one silent failure while this curriculum was being
       drafted. Matching it here means the checker reports the real problem on
       the next rule rather than a confusing "unclosed code fence". */
    if (/^\s*(?:[-*+]\s+|\d+\.\s+)?```/.test(line)) {
      inCode = !inCode
      return
    }
    if (inCode) return

    // A component's YAML block, between two `---` lines inside a component.
    if (line === '---' && open.length) {
      inYaml = !inYaml
      return
    }
    if (inYaml) return

    const fence = line.match(/^(:{2,})(\S*)/)
    if (!fence) {
      /* The em dash is banned in lesson prose (AUTHORING.md §1). Three exclusions,
         and each one is a place where it is not prose: inside an inline SVG,
         inside a component's attribute string, and on a line that is quoting
         the rule itself. */
      const isSvg = /^\s*<|\/>\s*$|<\/(text|svg|tspan)>/.test(line)
      const isAttribute = /^\s*:{2,}\S+\{/.test(line)
      const isTheRule = /em dash/i.test(line)

      if (line.includes('—') && !isSvg && !isAttribute && !isTheRule) {
        emDashes.push(`${relative(ROOT, file)}:${number}`)
      }
      return
    }

    const [, colons, name] = fence

    if (name) {
      if (line.includes('"}') && /\s\w+"\}/.test(line) && !/=\s*"[^"]*"\}/.test(line)) {
        report(file, number, `stray quote in the attributes of ::${name}`)
      }
      // MDC has no escape for a quote inside an attribute: `caption="the \"x\""`
      // ends the value at the backslash and the whole block renders as text.
      // Use curly quotes “ ” or single quotes inside the value instead.
      const attributes = line.match(/\{(.*)\}\s*$/)?.[1]
      if (attributes && !/^(\s*[:\w-]+(=("[^"]*"|'[^']*'))?)*\s*$/.test(attributes)) {
        report(file, number, `broken quoting in the attributes of ::${name} (a " inside a value? use “ ” instead)`)
      }
      const expected = ':'.repeat(open.length + 2)
      if (colons !== expected) {
        report(file, number,
          `::${name} opens with ${colons.length} colons; nested ${open.length} deep, so it needs ${expected.length}`)
      }
      open.push({ name, colons, number })
      return
    }

    // A bare fence closes the innermost open component.
    const last = open.pop()
    if (!last) {
      report(file, number, `closing fence "${colons}" with nothing open`)
    } else if (last.colons !== colons) {
      report(file, number,
        `closing "${colons}" does not match ::${last.name} opened with "${last.colons}" on line ${last.number}`)
    }
  })

  if (inCode) report(file, lines.length, 'unclosed code fence')
  open.forEach(o => report(file, o.number, `::${o.name} is never closed`))
}

/* Structural problems fail the run: they render as a wall of raw YAML or eat
   half a lesson, and there is never a reason to keep one. */
if (problems.length) {
  console.error(`\n${problems.length} structural problem${problems.length === 1 ? '' : 's'}:\n`)
  problems.forEach(p => console.error('  ' + p))
}

/* Em dashes are reported and do not fail the run, for one reason: the lessons
   written before this checker existed contain a great many, and mechanically
   substituting punctuation across somebody's finished prose makes it worse.
   New lessons should come out of here clean; the backlog is a deliberate
   decision to fix by hand, not a rule that has been quietly dropped. */
if (emDashes.length) {
  console.warn(`\n${emDashes.length} em dash${emDashes.length === 1 ? '' : 'es'} in prose (AUTHORING.md bans these):\n`)
  emDashes.slice(0, 40).forEach(p => console.warn('  ' + p))
  if (emDashes.length > 40) console.warn(`  …and ${emDashes.length - 40} more`)
}

if (problems.length) process.exit(1)

console.log(`All ${emDashes.length ? 'structures sound' : 'lessons clean'}.`)
