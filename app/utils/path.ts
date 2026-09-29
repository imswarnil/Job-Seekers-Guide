import type { ContentNavigationItem } from '@nuxt/content'

/**
 * The learning path, derived from the folder tree.
 *
 * `content/1.path/` is three levels deep and the levels mean something: subject
 * folder → module folder → lesson file. The numeric prefixes on those folders
 * are the only place the order of the curriculum is written down, so reordering
 * it is a `git mv` and there is no manifest to drift out of sync.
 *
 * Nuxt Content hands the tree back generically; these helpers give it the names
 * the player actually thinks in, and — the part that matters — flatten it into
 * one ordered array of every lesson on the platform. That flat array is what
 * makes the path end to end: the last lesson of a subject knows that the thing
 * after it is the first lesson of the next subject, not the end of the road.
 */

/**
 * The parts of the guide, in the order they are read. A part is a stretch of
 * the same road: every track inside one sits next to its neighbours in folder
 * order too, so the sidebar never numbers 8, 14, 9.
 */
export type Stage = 'move' | 'code' | 'cs' | 'web' | 'written' | 'interview' | 'story'

export interface Lesson {
  title: string
  path: string
  description?: string
  icon?: string
  minutes?: number
  kind?: string
  moduleTitle?: string
  modulePath?: string
  subjectTitle?: string
  subjectPath?: string
}

export interface Module {
  title: string
  path: string
  icon?: string
  description?: string
  lessons: Lesson[]
  minutes: number
}

export interface Subject {
  title: string
  path: string
  slug: string
  description?: string
  icon?: string
  /** A real photo for the track's cards and header. Absent means a generated thumbnail. */
  image?: string
  code?: string
  duration?: string
  stage?: Stage
  modules: Module[]
  lessons: Lesson[]
  minutes: number
}

export interface LearningPath {
  subjects: Subject[]
  /** Every lesson on the platform, in path order. The spine of the player. */
  lessons: Lesson[]
  minutes: number
}

/**
 * The navigation tree carries titles, icons and structure; it does not carry the
 * front matter of the page behind each item. That arrives separately as a flat
 * list of pages, keyed by path, and is merged in here — so a subject card can
 * show its code and duration without fetching every subject page.
 */
export interface PageMeta {
  path: string
  title?: string
  description?: string
  icon?: string
  image?: string
  code?: string
  duration?: string
  stage?: Stage
  minutes?: number
  kind?: string
}

type NavItem = ContentNavigationItem & Partial<Omit<PageMeta, 'path'>> & {
  children?: NavItem[]
}

const kindIcons: Record<string, string> = {
  lesson: 'i-lucide-book-open',
  reading: 'i-lucide-book-marked',
  practice: 'i-lucide-terminal',
  quiz: 'i-lucide-list-checks',
  guide: 'i-lucide-map',
  story: 'i-lucide-footprints'
}

export function lessonIcon(lesson: Pick<Lesson, 'kind' | 'icon'>): string {
  return lesson.icon || kindIcons[lesson.kind || 'lesson'] || kindIcons.lesson!
}

export interface StageMeta {
  /** The divider heading, in the rail and on `/start`. */
  label: string
  /** One line under the heading. Says why this section exists. */
  blurb: string
  icon: string
}

/** The parts, as the reader sees them. The tracks inside come from the folder tree. */
export const stages: Record<Stage, StageMeta> = {
  move: {
    label: 'The move',
    blurb: 'Which city, how to tell your family, where to live, how to learn, and how walk-ins work. Everything before the first line of code.',
    icon: 'i-lucide-train-front'
  },
  code: {
    label: 'Learn to code',
    blurb: 'Java taken all the way, DSA in Java, and SQL. The three subjects every fresher interview in Bangalore opens with.',
    icon: 'i-lucide-code'
  },
  cs: {
    label: 'Computer science',
    blurb: 'DBMS, OOPs, operating systems, networks and the rest. The subjects I skipped in college and had to learn properly in a PG in BTM.',
    icon: 'i-lucide-cpu'
  },
  web: {
    label: 'Web basics',
    blurb: 'HTML, CSS and JavaScript: enough to explain how a web page works and to answer the questions a web interview asks.',
    icon: 'i-lucide-globe'
  },
  written: {
    label: 'The written round',
    blurb: 'Quantitative aptitude, logical reasoning and verbal ability. The gate that rejected me in college, and that I cleared once I practised it.',
    icon: 'i-lucide-clipboard-list'
  },
  interview: {
    label: 'The interview',
    blurb: 'Tell me about yourself, how to answer a technical question, the HR round, the offer and the negotiation.',
    icon: 'i-lucide-messages-square'
  },
  story: {
    label: 'My story',
    blurb: 'Mahroni to Bangalore to Europe, chapter by chapter, with the rejections left in.',
    icon: 'i-lucide-footprints'
  }
}

export const stageLabels: Record<Stage, string> = Object.fromEntries(
  Object.entries(stages).map(([stage, meta]) => [stage, meta.label])
) as Record<Stage, string>

/** The order stages are shown in on `/start`, when a subject declares one. */
export const stageOrder: Stage[] = ['move', 'code', 'cs', 'web', 'written', 'interview', 'story']

/**
 * A directory that has an `index.md` shows up both as the directory item and, in
 * some shapes, as a child pointing at the same path. Drop the duplicate so a
 * subject overview never appears as its own first lesson.
 */
function realChildren(item: NavItem): NavItem[] {
  return ((item.children || []) as NavItem[]).filter(child => child.path !== item.path)
}

export const emptyPath: LearningPath = { subjects: [], lessons: [], minutes: 0 }

export function toPath(
  navigation: ContentNavigationItem[] | null | undefined,
  pages?: PageMeta[] | null
): LearningPath {
  const root = (navigation || []) as NavItem[]
  const meta = new Map((pages || []).map(page => [page.path, page]))

  // With `prefix: '/'` on the collection the subjects arrive at the top level
  // already. The unwrap is kept for the shape where they don't.
  const subjectItems = root.length === 1 && root[0]?.path === '/'
    ? realChildren(root[0])
    : root.filter(item => item.path !== '/')

  const subjects = subjectItems.map((subjectItem) => {
    const subjectMeta = meta.get(subjectItem.path)
    const subjectTitle = subjectItem.title
    const subjectPath = subjectItem.path

    const modules: Module[] = []
    const lessons: Lesson[] = []

    function toLesson(item: NavItem, module?: NavItem): Lesson {
      const lessonMeta = meta.get(item.path)

      return {
        title: item.title,
        path: item.path,
        description: item.description ?? lessonMeta?.description,
        icon: item.icon ?? lessonMeta?.icon,
        minutes: item.minutes ?? lessonMeta?.minutes,
        kind: item.kind ?? lessonMeta?.kind,
        moduleTitle: module?.title,
        modulePath: module?.path,
        subjectTitle,
        subjectPath
      }
    }

    for (const child of realChildren(subjectItem)) {
      const grandchildren = realChildren(child)
      const childMeta = meta.get(child.path)

      if (grandchildren.length) {
        const moduleLessons = grandchildren.map(lesson => toLesson(lesson, child))

        modules.push({
          title: child.title,
          path: child.path,
          icon: child.icon ?? childMeta?.icon,
          description: child.description ?? childMeta?.description,
          lessons: moduleLessons,
          minutes: moduleLessons.reduce((total, lesson) => total + (lesson.minutes || 0), 0)
        })
        lessons.push(...moduleLessons)
      } else {
        // A lesson sitting directly in the subject folder, with no module around
        // it. Legal, and short subjects are written this way.
        lessons.push(toLesson(child))
      }
    }

    return {
      title: subjectTitle,
      path: subjectPath,
      slug: subjectPath.split('/').filter(Boolean).pop() || '',
      description: subjectItem.description ?? subjectMeta?.description,
      icon: subjectItem.icon ?? subjectMeta?.icon,
      image: subjectItem.image ?? subjectMeta?.image,
      code: subjectItem.code ?? subjectMeta?.code,
      duration: subjectItem.duration ?? subjectMeta?.duration,
      stage: subjectItem.stage ?? subjectMeta?.stage,
      modules,
      lessons,
      minutes: lessons.reduce((total, lesson) => total + (lesson.minutes || 0), 0)
    } satisfies Subject
  })

  const lessons = subjects.flatMap(subject => subject.lessons)

  return {
    subjects,
    lessons,
    minutes: lessons.reduce((total, lesson) => total + (lesson.minutes || 0), 0)
  }
}

export function findSubject(path: LearningPath, url: string): Subject | undefined {
  return path.subjects.find(subject => url === subject.path || url.startsWith(`${subject.path}/`))
}

export function findModule(path: LearningPath, url: string): Module | undefined {
  return findSubject(path, url)?.modules
    .find(module => url === module.path || url.startsWith(`${module.path}/`))
}

export interface StageGroup extends StageMeta {
  stage: Stage
  /** Anchor id, so the sidebar can jump to the section. */
  id: string
  subjects: Subject[]
  /** Position of this group's first subject along the whole path, zero-based. */
  offset: number
  lessons: number
  minutes: number
}

/**
 * Subjects grouped into the sections of the curriculum, in stage order, with
 * anything untagged collected at the end rather than silently dropped.
 *
 * `offset` is the piece worth noticing: numbering on `/start` and in the rail
 * runs across the whole path, not per section, because "subject 9 of 16" is the
 * fact a reader actually wants and "subject 2 of 5" is not.
 */
export function byStage(path: LearningPath): StageGroup[] {
  const position = new Map(path.subjects.map((subject, index) => [subject.path, index]))

  function group(stage: Stage, meta: StageMeta, subjects: Subject[]): StageGroup {
    return {
      ...meta,
      stage,
      id: `section-${stage}`,
      subjects,
      offset: position.get(subjects[0]?.path || '') ?? 0,
      lessons: subjects.reduce((total, subject) => total + subject.lessons.length, 0),
      minutes: subjects.reduce((total, subject) => total + subject.minutes, 0)
    }
  }

  const groups = stageOrder
    .map(stage => ({ stage, subjects: path.subjects.filter(subject => subject.stage === stage) }))
    .filter(entry => entry.subjects.length)
    .map(entry => group(entry.stage, stages[entry.stage], entry.subjects))

  const untagged = path.subjects.filter(subject => !subject.stage)
  if (untagged.length) {
    groups.push(group('story', {
      label: 'Also on the path',
      blurb: 'Subjects that have not been placed in a section yet.',
      icon: 'i-lucide-book-open'
    }, untagged))
  }

  return groups
}

/** "1h 20m" / "45m" — total time, said the way a person would say it. */
export function formatMinutes(minutes: number): string {
  if (!minutes) {
    return ''
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (!hours) {
    return `${rest}m`
  }
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}
