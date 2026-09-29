/**
 * The technologies the path teaches, with the icon and brand colour each one
 * should be drawn in.
 *
 * One registry rather than icons scattered through markdown, for two reasons.
 * Brand colours are not in the site palette and would otherwise be pasted as
 * hex into components; and Simple Icons does not ship a `java` icon — Oracle's
 * mark is trademarked — so every author who reaches for `i-simple-icons-java`
 * gets a blank box. Here, `java` maps to OpenJDK once.
 */

export interface Tech {
  /** Display name. */
  label: string
  /** Iconify name, from the locally installed collections. */
  icon: string
  /** Brand colour, used at low opacity for the tile and full for the glyph. */
  color: string
  /** One line, for the tooltip and the caption under a large thumbnail. */
  note?: string
}

export const tech = {
  'java': {
    label: 'Java',
    // Simple Icons has no `java` — the Oracle mark is trademarked. OpenJDK is
    // the icon the ecosystem actually uses, and it is the JDK you install.
    icon: 'i-simple-icons-openjdk',
    color: '#ea580c',
    note: 'The default language of this path. Most entry-level roles in this market.'
  },
  'sql': {
    label: 'SQL',
    icon: 'i-lucide-database',
    color: '#0d9488',
    note: 'Not a language you finish. A language you keep getting better at.'
  },
  'mysql': { label: 'MySQL', icon: 'i-simple-icons-mysql', color: '#00758f' },
  'postgres': { label: 'PostgreSQL', icon: 'i-simple-icons-postgresql', color: '#336791' },
  'sqlite': { label: 'SQLite', icon: 'i-simple-icons-sqlite', color: '#003b57' },
  'oracle': { label: 'Oracle', icon: 'i-simple-icons-oracle', color: '#c74634' },
  'mongodb': { label: 'MongoDB', icon: 'i-simple-icons-mongodb', color: '#47a248' },
  'html': { label: 'HTML', icon: 'i-simple-icons-html5', color: '#e34f26' },
  'css': { label: 'CSS', icon: 'i-simple-icons-css', color: '#1572b6' },
  'javascript': { label: 'JavaScript', icon: 'i-simple-icons-javascript', color: '#c79c00' },
  'typescript': { label: 'TypeScript', icon: 'i-simple-icons-typescript', color: '#3178c6' },
  'python': { label: 'Python', icon: 'i-simple-icons-python', color: '#3776ab' },
  'react': { label: 'React', icon: 'i-simple-icons-react', color: '#0d94b8' },
  'node': { label: 'Node.js', icon: 'i-simple-icons-nodedotjs', color: '#5fa04e' },
  'spring': { label: 'Spring', icon: 'i-simple-icons-spring', color: '#6db33f' },
  'maven': { label: 'Maven', icon: 'i-simple-icons-apachemaven', color: '#c71a36' },
  'git': { label: 'Git', icon: 'i-simple-icons-git', color: '#f05032' },
  'github': { label: 'GitHub', icon: 'i-simple-icons-github', color: '#6b7280' },
  'linux': { label: 'Linux', icon: 'i-simple-icons-linux', color: '#8a6d00' },
  'docker': { label: 'Docker', icon: 'i-simple-icons-docker', color: '#2496ed' },
  'salesforce': {
    label: 'Salesforce',
    icon: 'i-simple-icons-salesforce',
    color: '#00a1e0',
    note: 'Where this path led me. Not where it has to lead you.'
  },

  // The subjects that are ideas rather than products, so they take Lucide.
  'os': { label: 'Operating Systems', icon: 'i-lucide-cpu', color: '#475569' },
  'networks': { label: 'Networks', icon: 'i-lucide-network', color: '#9333ea' },
  'data-structures': { label: 'Data Structures', icon: 'i-lucide-binary', color: '#0891b2' },
  'system-design': { label: 'System Design', icon: 'i-lucide-layout-dashboard', color: '#4f46e5' },
  'resume': { label: 'Resume', icon: 'i-lucide-file-text', color: '#d97706' },

  // Every track, keyed by its URL slug. `trackStyle()` reads these, so the
  // sidebar, the home page, the track header and the generated thumbnails all
  // draw a track in the same colour. Neighbouring tracks are kept on
  // different hues, so the rail reads as a sequence of distinct stops.
  'bangalore': { label: 'Moving to Bangalore', icon: 'i-lucide-train-front', color: '#c026d3' },
  'dsa': { label: 'DSA', icon: 'i-lucide-binary', color: '#0891b2' },
  'dbms': { label: 'DBMS', icon: 'i-lucide-server', color: '#2563eb' },
  'oops': { label: 'OOPs', icon: 'i-lucide-boxes', color: '#7c3aed' },
  'operating-systems': { label: 'Operating Systems', icon: 'i-lucide-cpu', color: '#475569' },
  'computer-networks': { label: 'Computer Networks', icon: 'i-lucide-network', color: '#9333ea' },
  'other-subjects': { label: 'Other subjects', icon: 'i-lucide-git-branch', color: '#65a30d' },
  'quantitative-aptitude': { label: 'Quantitative aptitude', icon: 'i-lucide-calculator', color: '#16a34a' },
  'logical-reasoning': { label: 'Logical reasoning', icon: 'i-lucide-puzzle', color: '#d97706' },
  'verbal-ability': { label: 'Verbal ability', icon: 'i-lucide-languages', color: '#db2777' },
  'interview': { label: 'The interview', icon: 'i-lucide-messages-square', color: '#0284c7' },
  'my-story': { label: 'My story', icon: 'i-lucide-footprints', color: '#f22f46' }
} as const satisfies Record<string, Tech>

export type TechKey = keyof typeof tech

export function findTech(key: string): Tech | undefined {
  return (tech as Record<string, Tech>)[key]
}

/** The house accent, for a track the registry has not heard of. */
const fallback: Tech = { label: '', icon: 'i-lucide-book-open', color: '#f22f46' }

/**
 * How a track is drawn: its icon and its colour.
 *
 * The registry wins over the track's own `icon:` front matter, so one file
 * decides what a track looks like everywhere. A slug that is not registered
 * keeps its front-matter icon and takes the house red, rather than rendering
 * as a hole.
 */
export function trackStyle(slug: string | undefined, icon?: string): Tech {
  const entry = slug ? findTech(slug) : undefined
  if (entry) {
    return entry
  }
  return { ...fallback, icon: icon || fallback.icon }
}

/** The slug of the track a URL sits in: `/java/strings/x` is `java`. */
export function trackSlug(url: string | undefined): string | undefined {
  return url?.split('/').filter(Boolean)[0]
}
