/**
 * /llms.txt — the whole guide as one plain-markdown map, following the
 * llms.txt convention (llmstxt.org): an H1, a one-paragraph summary in a
 * blockquote, then a section per track listing every lesson as an absolute
 * link with a one-line description.
 *
 * Built from the content collection at request time, and prerendered at build
 * time (nitro.prerender.routes in nuxt.config.ts), so in production it ships
 * as a static file and costs nothing.
 */

// The explicit import rather than the auto-import: the auto-imported name is
// typed twice (two arguments in nitro, one in Vue) and the project-references
// typecheck picks the wrong one for a file in server/routes — and during
// prerender the auto-import was not injected at all ("queryCollection is not
// defined"). The package's server entry has the real, two-argument function.
import { queryCollection } from '@nuxt/content/server'

interface PathDoc {
  path: string
  title?: string
  description?: string
  minutes?: number
}

const SITE = 'https://jobseekers.imswarnil.com'

const SUMMARY = 'I am Swarnil. I went from Mahroni, a small town in Uttar Pradesh, to Bangalore '
  + 'with no computer science degree worth the name and no skills, failed 33 walk-ins, and was '
  + 'selected in the 34th. This guide is the whole route written down for the next job seeker: '
  + 'the move itself, Java, DSA and SQL taken from zero, the CS subjects interviews ask about, '
  + 'web basics, the written round, and the interview. Everything is free, in plain English, '
  + 'and assumes the reader has never opened a terminal.'

const COMMUNITY: { path: string, title: string, note: string }[] = [
  { path: '/stories', title: 'Stories', note: 'Readers who made the same move, in their own words, with packages and timelines.' },
  { path: '/stories/new', title: 'Share your story', note: 'Post your own route to a first job.' },
  { path: '/guestbook', title: 'Guestbook', note: 'One line from readers: what they learned, where they are.' },
  { path: '/stats', title: 'Stats', note: 'Live, public numbers: readers, countries, stories, jobs got.' },
  { path: '/leaderboard', title: 'Supporters', note: 'Everyone who has sponsored or supported the guide.' },
  { path: '/sponsor', title: 'Sponsor', note: 'The one sponsor spot, held by the highest bid.' },
  { path: '/support', title: 'Support', note: 'Keep the guide free with a one-time gift.' },
  { path: '/contact', title: 'Contact', note: 'How to reach Swarnil.' }
]

/** "12 min" for a lesson that declares one; nothing when it does not. */
function timeNote(minutes?: number): string {
  return minutes ? ` (${minutes} min)` : ''
}

function line(doc: PathDoc): string {
  const description = (doc.description || '').replace(/\s+/g, ' ').trim()
  return `- [${doc.title || doc.path}](${SITE}${doc.path})${timeNote(doc.minutes)}${description ? `: ${description}` : ''}`
}

export default defineEventHandler(async (event) => {
  // Stem order is folder order, which is the order the curriculum is read in.
  // The `.navigation.yml` files ride along in the collection as `/.navigation`
  // paths; they are chapter metadata, not pages, and are dropped here.
  const docs: PathDoc[] = (await queryCollection(event, 'path')
    .order('stem', 'ASC')
    .all())
    .filter(doc => !doc.path.includes('/.'))

  const out: string[] = [
    '# Bangalore Job Seekers Guide',
    '',
    `> ${SUMMARY}`,
    '',
    'Every page below is plain prose with runnable examples; the markdown source lives at',
    'https://github.com/imswarnil/job-seekers-guide under content/1.path/.',
    ''
  ]

  // Subjects are the depth-1 pages; everything deeper inside the same folder
  // is one of that subject's lessons.
  const subjects = docs.filter(doc => doc.path.split('/').filter(Boolean).length === 1)

  for (const subject of subjects) {
    out.push(`## ${subject.title || subject.path}`)
    if (subject.description) {
      out.push('', subject.description.replace(/\s+/g, ' ').trim())
    }
    out.push('', `- [Track overview](${SITE}${subject.path})`)
    for (const doc of docs) {
      if (doc.path !== subject.path && doc.path.startsWith(`${subject.path}/`)) {
        out.push(line(doc))
      }
    }
    out.push('')
  }

  out.push('## Community')
  out.push('')
  for (const page of COMMUNITY) {
    out.push(`- [${page.title}](${SITE}${page.path}): ${page.note}`)
  }
  out.push('')

  setResponseHeaders(event, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=3600'
  })
  return out.join('\n')
})
