#!/usr/bin/env node
/**
 * Scaffold a chapter of the course.
 *
 *   pnpm lesson:new <track>/<chapter>
 *   pnpm lesson:new sql/joins
 *
 * Resolves the track against the real folder tree under `content/1.path/`
 * (folders carry numeric prefixes; the slug is what you type), reads
 * `content-plan.md` to find the lessons mapped for that chapter, and creates:
 *
 *   - the chapter folder (next free numeric prefix)
 *   - a `.navigation.yml`
 *   - one file per mapped lesson, from the matching template in
 *     `plan/templates/`, with front matter filled in and every `## Next`
 *     block pre-wired with the mapped hook so the chain is welded before a
 *     word is written
 *   - the three bookend files every chapter ends with: glossary, interview
 *     Q&A, exercises
 *
 * If the chapter cannot be found in `content-plan.md`, it asks how many
 * lessons you want (or generates three numbered stubs when not interactive)
 * and says so plainly.
 *
 * It never overwrites an existing file, and it prints exactly what it made.
 *
 * Options:
 *   --count <n>   skip the plan and the prompt; create n stub lessons
 *   --root <dir>  use a different content root (testing only)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = join(REPO, 'plan', 'templates')
const PLAN = join(REPO, 'content-plan.md')
const RESERVED_MODULE = join(REPO, 'modules', 'reserved-slugs.ts')

// ---------------------------------------------------------------- utilities

function fail(message) {
  console.error(`\n  ${message}\n`)
  process.exit(1)
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripPrefix(name) {
  return name.replace(/^\d+\./, '')
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function wrap(text, width = 78) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    if (line && (line + ' ' + word).length > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines.join('\n')
}

function yamlQuote(text) {
  return /[:#[\]{}&*!|>'"%@`]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text
}

// ------------------------------------------------------------ reserved slugs

function readReservedSlugs() {
  try {
    const source = readFileSync(RESERVED_MODULE, 'utf8')
    const match = source.match(/const RESERVED = \[([\s\S]*?)\]/)
    if (!match) return []
    return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1])
  } catch {
    return []
  }
}

// -------------------------------------------------------- resolving folders

function findBySlug(parent, slug) {
  const dirs = readdirSync(parent, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
  return {
    dirs,
    match: dirs.find(name => stripPrefix(name) === slug)
  }
}

function nextPrefix(dirs) {
  const numbers = dirs
    .map(name => name.match(/^(\d+)\./))
    .filter(Boolean)
    .map(m => Number(m[1]))
  return numbers.length ? Math.max(...numbers) + 1 : 1
}

// ------------------------------------------------------- parsing the plan

/**
 * Chapter headings in content-plan.md look like:
 *   ### Chapter B8.3 — Joins
 * Lessons under them look like:
 *   1. **Why one table is never enough** `[C]` `[DIAGRAM]` — description...
 *      → *the hook, in italics, possibly wrapped over lines*
 */
function findPlanChapter(planText, chapterSlug) {
  const headings = [...planText.matchAll(/^### Chapter\s+\S+\s*—\s*(.+)$/gm)]
  const scored = headings.map((m) => {
    const title = m[1].trim()
    const slug = slugify(title)
    let score = 0
    if (slug === chapterSlug) {
      score = 2
    } else {
      const a = slug.split('-')
      const b = chapterSlug.split('-')
      const [small, large] = a.length <= b.length ? [a, b] : [b, a]
      if (small.every(token => large.includes(token))) score = 1
    }
    return { title, index: m.index, headingLength: m[0].length, score }
  })
  const best = scored.filter(c => c.score > 0).sort((a, b) => b.score - a.score)[0]
  if (!best) return null

  const bodyStart = best.index + best.headingLength
  const rest = planText.slice(bodyStart)
  const end = rest.search(/^#{1,3}\s/m)
  const block = end === -1 ? rest : rest.slice(0, end)

  // The hook this chapter's first lesson must resolve is the last hook set
  // before the chapter heading (the previous chapter's final cliffhanger).
  const before = planText.slice(0, best.index)
  const previousHooks = [...before.matchAll(/→\s*\*([^*]+)\*/g)]
  const previousHook = previousHooks.length
    ? previousHooks[previousHooks.length - 1][1].replace(/\s+/g, ' ').trim()
    : null

  const lessons = []
  const entryPattern = /^\s*\d+\.\s+\*\*/
  let current = null
  for (const line of block.split('\n')) {
    if (entryPattern.test(line)) {
      if (current) lessons.push(current)
      current = line
    } else if (current !== null && /^\s+\S/.test(line)) {
      current += '\n' + line
    } else if (current !== null && line.trim() === '') {
      lessons.push(current)
      current = null
    }
  }
  if (current) lessons.push(current)

  const parsed = lessons.map((entry) => {
    const title = entry.match(/\*\*([^*]+)\*\*/)?.[1].trim()
    if (!title) return null
    const tags = [...entry.matchAll(/`\[([A-Z]+)\]`/g)].map(m => m[1])
    const hook = entry.match(/→\s*\*([^*]+)\*/)?.[1].replace(/\s+/g, ' ').trim() ?? null
    const summary = entry
      .replace(/→[\s\S]*$/, '')
      .replace(/\*\*[^*]+\*\*/, '')
      .replace(/`\[[A-Z]+\]`/g, '')
      .replace(/^\s*\d+\.\s*/, '')
      .replace(/\s+/g, ' ')
      .replace(/^[\s—–-]+/, '')
      .trim()
    return { title, tags, hook, summary }
  }).filter(Boolean)

  return { title: best.title, exact: best.score === 2, previousHook, lessons: parsed }
}

// ------------------------------------------------------------- templates

const KIND_DEFAULTS = {
  lesson: { template: 'lesson.md', minutes: 10 },
  practice: { template: 'practice.md', minutes: 20 },
  debugging: { template: 'debugging.md', minutes: 15 },
  project: { template: 'project.md', minutes: 30 },
  quiz: { template: 'quiz.md', minutes: 12 },
  reading: { template: 'reading.md', minutes: 6 }
}

function kindFromTags(tags) {
  if (tags.includes('A')) return { kind: 'project', variant: 'project' }
  if (tags.includes('Q')) return { kind: 'quiz', variant: 'quiz' }
  if (tags.includes('D')) return { kind: 'practice', variant: 'debugging' }
  if (tags.includes('P') || tags.includes('T')) return { kind: 'practice', variant: 'practice' }
  return { kind: 'lesson', variant: 'lesson' }
}

function loadTemplate(variant) {
  const file = join(TEMPLATES, KIND_DEFAULTS[variant].template)
  if (!existsSync(file)) fail(`Template missing: ${file}`)
  const text = readFileSync(file, 'utf8')
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
  return body
}

function renderLesson({ title, kind, variant, minutes, resolveHook, nextHook, summary, tags }) {
  let body = loadTemplate(variant)

  const weldLines = []
  if (resolveHook) {
    weldLines.push('Weld: the first sentence below must resolve this hook, set by the')
    weldLines.push(`previous page: "${resolveHook}"`)
  } else {
    weldLines.push('Weld: resolve the previous page\'s cliffhanger in the first sentence.')
    weldLines.push('Check the file before this one (or content-plan.md) for the exact hook.')
  }
  if (summary) weldLines.push(`Mapped scope: ${summary}`)
  if (tags?.length) weldLines.push(`Spec tags: ${tags.map(t => `[${t}]`).join(' ')}`)
  const weld = `<!--\n  ${weldLines.join('\n  ')}\n-->\n\n`

  if (nextHook) {
    body = body.replace(
      /(::callout\{icon="i-lucide-arrow-right"\}\n)[\s\S]*?(\n::\s*)$/,
      `$1${wrap(nextHook)}$2`
    )
  }

  const frontMatter = [
    '---',
    `title: ${yamlQuote(title)}`,
    'description: TODO one sentence for a stranger, rewritten before publishing.',
    `minutes: ${minutes}`,
    `kind: ${kind}`,
    '---'
  ].join('\n')

  return `${frontMatter}\n\n${weld}${body}`
}

// ------------------------------------------------------------------ main

async function main() {
  const args = process.argv.slice(2)
  const flags = { count: null, root: null }
  const positional = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count') flags.count = Number(args[++i])
    else if (args[i] === '--root') flags.root = resolve(args[++i])
    else positional.push(args[i])
  }

  const target = positional[0]
  if (!target || !target.includes('/')) {
    fail('Usage: pnpm lesson:new <track>/<chapter>   e.g. pnpm lesson:new sql/joins')
  }
  const [trackSlug, chapterSlug, ...extra] = target.split('/').map(part => slugify(part))
  if (extra.length || !trackSlug || !chapterSlug) {
    fail('Give exactly two segments: <track>/<chapter>, e.g. java/collections')
  }

  const reserved = readReservedSlugs()
  if (reserved.includes(trackSlug)) {
    fail(`"${trackSlug}" is a reserved slug (see modules/reserved-slugs.ts). A track there would be shadowed by an existing page and never render.`)
  }

  const contentRoot = flags.root ?? join(REPO, 'content', '1.path')
  if (!existsSync(contentRoot)) fail(`Content root not found: ${contentRoot}`)

  const { dirs: trackDirs, match: trackDir } = findBySlug(contentRoot, trackSlug)
  if (!trackDir) {
    fail(`No track "${trackSlug}" under ${contentRoot}.\n  Available: ${trackDirs.map(stripPrefix).join(', ')}`)
  }
  const trackPath = join(contentRoot, trackDir)

  // Chapter folder: reuse it if it exists, otherwise take the next prefix.
  const { dirs: chapterDirs, match: existingChapter } = findBySlug(trackPath, chapterSlug)
  const chapterDir = existingChapter ?? `${pad(nextPrefix(chapterDirs))}.${chapterSlug}`
  const chapterPath = join(trackPath, chapterDir)

  // What does the plan say this chapter contains?
  let plan = null
  if (existsSync(PLAN) && flags.count === null) {
    plan = findPlanChapter(readFileSync(PLAN, 'utf8'), chapterSlug)
  }

  let lessons
  let chapterTitle
  let planNote
  if (plan && plan.lessons.length) {
    chapterTitle = plan.title
    planNote = plan.exact
      ? `Found "${plan.title}" in content-plan.md with ${plan.lessons.length} mapped lessons.`
      : `Matched "${plan.title}" in content-plan.md (closest title to "${chapterSlug}") with ${plan.lessons.length} mapped lessons. Check it is the chapter you meant.`
    lessons = plan.lessons.map((entry) => {
      const { kind, variant } = kindFromTags(entry.tags)
      return {
        slug: slugify(entry.title),
        title: entry.title,
        kind,
        variant,
        minutes: KIND_DEFAULTS[variant].minutes,
        summary: entry.summary,
        tags: entry.tags,
        hook: entry.hook
      }
    })
  } else {
    chapterTitle = chapterSlug.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
    let count = flags.count
    if (!count && process.stdin.isTTY && process.stdout.isTTY) {
      const { createInterface } = await import('node:readline/promises')
      const rl = createInterface({ input: process.stdin, output: process.stdout })
      const answer = await rl.question(`Chapter "${chapterSlug}" is not in content-plan.md. How many lessons? [3] `)
      rl.close()
      count = Number(answer) || 3
    }
    count = count || 3
    planNote = `Could not find "${chapterSlug}" in content-plan.md, so these are ${count} numbered stubs. Retitle the files, fix the front matter, and weld the hooks by hand.`
    lessons = Array.from({ length: count }, (_, i) => ({
      slug: `lesson-${i + 1}`,
      title: `Lesson ${i + 1} (stub: retitle me)`,
      kind: 'lesson',
      variant: 'lesson',
      minutes: KIND_DEFAULTS.lesson.minutes,
      summary: null,
      tags: [],
      hook: null
    }))
  }

  // Every chapter ends the same way: glossary, interview Q&A, exercises.
  const bookends = [
    { slug: 'glossary', title: 'Glossary', kind: 'reading', variant: 'reading', minutes: 6 },
    { slug: 'the-interview-questions', title: 'The interview questions', kind: 'quiz', variant: 'quiz', minutes: 12 },
    { slug: 'your-turn', title: 'Your turn', kind: 'practice', variant: 'practice', minutes: 20 }
  ]

  // Weld the chain before a word is written. Hooks flow:
  //   lesson n resolves lesson n-1's mapped hook and sets its own; the last
  //   mapped hook belongs to the END of the chapter, which after the bookends
  //   is the exercises file. The three bookend welds in between are the
  //   author's job, and the files say so.
  const lastMappedHook = lessons.length ? lessons[lessons.length - 1].hook : null
  const files = []
  lessons.forEach((lesson, i) => {
    files.push({
      ...lesson,
      resolveHook: i === 0 ? plan?.previousHook ?? null : lessons[i - 1].hook,
      nextHook: i < lessons.length - 1 ? lesson.hook : null
    })
  })
  bookends.forEach((bookend, i) => {
    files.push({
      ...bookend,
      summary: null,
      tags: [],
      resolveHook: null,
      nextHook: i === bookends.length - 1 ? lastMappedHook : null
    })
  })

  // ------------------------------------------------------------- write out
  const created = []
  const skipped = []

  if (!existsSync(chapterPath)) {
    mkdirSync(chapterPath, { recursive: true })
    created.push(`${chapterPath}/`)
  }

  const navFile = join(chapterPath, '.navigation.yml')
  if (existsSync(navFile)) {
    skipped.push(navFile)
  } else {
    writeFileSync(navFile, [
      `title: ${yamlQuote(chapterTitle)}`,
      'icon: i-lucide-circle-dashed # TODO pick a lucide icon for this chapter',
      'description: TODO one sentence saying what this chapter covers, why it exists, and how it hangs off the previous chapter\'s final hook.',
      ''
    ].join('\n'))
    created.push(navFile)
  }

  files.forEach((file, i) => {
    const name = `${pad(i + 1)}.${file.slug}.md`
    const path = join(chapterPath, name)
    if (existsSync(path)) {
      skipped.push(path)
      return
    }
    writeFileSync(path, renderLesson(file))
    created.push(path)
  })

  // -------------------------------------------------------------- report
  console.log('')
  console.log(`  ${planNote}`)
  console.log('')
  if (created.length) {
    console.log('  Created:')
    for (const path of created) console.log(`    ${path}`)
  } else {
    console.log('  Created nothing.')
  }
  if (skipped.length) {
    console.log('')
    console.log('  Left alone (already existed, refusing to overwrite):')
    for (const path of skipped) console.log(`    ${path}`)
  }
  console.log('')
  console.log('  Before writing: the mapped hooks are welded into each ## Next block,')
  console.log('  but the three bookend files (glossary, interview questions, your turn)')
  console.log('  need their in-between hooks written by hand. Each file says which hook')
  console.log('  it must resolve in a comment at the top.')
  console.log('')
  console.log(`  New chapter folder: ${basename(chapterPath)} (check the numeric prefix matches the chapter's place in content-plan.md).`)
  console.log('')
}

main()
