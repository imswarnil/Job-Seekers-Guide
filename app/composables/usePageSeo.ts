import type { LearningPath, Module, Subject } from '~/utils/path'

interface SchemaContext {
  kind: 'lesson' | 'module' | 'subject'
  page?: { title?: string, description?: string, code?: string, stage?: string, minutes?: number, kind?: string, image?: string, body?: unknown } | null
  path?: LearningPath
  subject?: Subject
  module?: Module
}

interface PageSeoOptions {
  title: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  /** Small line above the title on the social card. */
  headline?: MaybeRefOrGetter<string | undefined>
  schema?: MaybeRefOrGetter<SchemaContext | undefined>
  /** `website` for the home page; everything else is an article. */
  type?: 'website' | 'article'
}

/** A minimark node: `[tag, props, ...children]`, or a text string. */
type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

function textOf(node: MinimarkNode): string {
  if (typeof node === 'string') {
    return node
  }
  const [tag, , ...children] = node
  // Code is proof in the lesson and noise in a search snippet.
  if (tag === 'pre' || tag === 'code') {
    return ''
  }
  return children.map(textOf).join(' ')
}

/**
 * The questions on an interview page, for the FAQPage rich result.
 *
 * Every `kind: quiz` page is written as `::accordion-item{label="…"}` blocks,
 * so the question is the label and the answer is the text inside, with the
 * code taken out. Cheap: a walk over a tree that is already in memory.
 */
export function faqFromBody(body: unknown, limit = 30): { name: string, text: string }[] {
  const root = (body as { value?: MinimarkNode[] } | undefined)?.value
  if (!Array.isArray(root)) {
    return []
  }

  const found: { name: string, text: string }[] = []

  function walk(node: MinimarkNode) {
    if (typeof node === 'string' || found.length >= limit) {
      return
    }
    const [tag, props, ...children] = node
    if (tag === 'accordion-item' && typeof props?.label === 'string') {
      const text = children.map(textOf).join(' ').replace(/\s+/g, ' ').trim()
      if (text) {
        found.push({
          name: props.label.replace(/^\d+\.\s*/, ''),
          text: text.length > 600 ? `${text.slice(0, 597)}...` : text
        })
      }
      return
    }
    children.forEach(walk)
  }

  root.forEach(walk)
  return found
}

/** Reading time as an ISO 8601 duration: 685 minutes is "PT11H25M". */
function isoDuration(minutes: number): string | undefined {
  if (!minutes || minutes < 1) {
    return undefined
  }
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return `PT${hours ? `${hours}H` : ''}${rest || !hours ? `${rest}M` : ''}`
}

/**
 * The home page's structured data for the curriculum: an ItemList where every
 * item is one track as a Course. This is what makes the homepage eligible for
 * the course-list treatment in search, and it is derived from the same path
 * tree the page renders, so it can never disagree with what a visitor sees.
 *
 * Returns one node for `useSchemaOrg`. Empty path (SSR before the content
 * query lands) returns null and the caller passes nothing.
 */
export function courseListNode(path: LearningPath, siteUrl: string): Record<string, unknown> | null {
  if (!path.subjects.length) {
    return null
  }
  return {
    '@type': 'ItemList',
    'name': 'The learning path',
    'description': 'Every track of the Bangalore Job Seekers Guide, in the order it is read.',
    'numberOfItems': path.subjects.length,
    'itemListElement': path.subjects.map((subject, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Course',
        '@id': `${siteUrl}${subject.path}#course`,
        'name': subject.title,
        'description': subject.description,
        'url': `${siteUrl}${subject.path}`,
        'courseCode': subject.code,
        'inLanguage': 'en-IN',
        'isAccessibleForFree': true,
        'provider': {
          '@type': 'Organization',
          'name': 'Bangalore Job Seekers Guide',
          'url': siteUrl
        },
        'offers': { '@type': 'Offer', 'category': 'Free', 'price': 0, 'priceCurrency': 'INR' },
        'hasCourseInstance': {
          '@type': 'CourseInstance',
          'courseMode': 'online',
          'courseWorkload': isoDuration(subject.minutes)
        }
      }
    }))
  }
}

/**
 * Everything a page owes a search engine, in one call.
 *
 * This was five near-identical copy-pasted blocks across five pages, and they
 * had already drifted — one of them set a description and no OG description, one
 * set neither. Meta tags, the social image and the structured data are one
 * decision per page, so they are one function.
 */
export function usePageSeo(options: PageSeoOptions) {
  const route = useRoute()
  const site = useSiteConfig()

  const title = computed(() => toValue(options.title))
  const description = computed(() => toValue(options.description))

  useSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogType: options.type || 'article',
    ogSiteName: 'Bangalore Job Seekers Guide',
    ogLocale: 'en_IN',
    ogUrl: () => `${site.url}${route.path}`,
    twitterTitle: title,
    twitterDescription: description,
    twitterCard: 'summary_large_image'
  })

  defineOgImage('Guide', {
    title: () => toValue(options.title),
    description: () => toValue(options.description),
    headline: () => toValue(options.headline)
  })

  if (!options.schema) {
    return
  }

  // Breadcrumbs come free: the path tree already knows subject → module →
  // lesson, so nothing has to be threaded through the page for them.
  const nodes = computed(() => {
    const context = toValue(options.schema)
    if (!context) {
      return []
    }

    const { kind, page, subject, module } = context

    const crumbs = [{ name: 'Home', item: '/' }]
    if (subject) {
      crumbs.push({ name: subject.title, item: subject.path })
    }
    if (module && kind !== 'subject') {
      crumbs.push({ name: module.title, item: module.path })
    }
    if (kind === 'lesson' && page?.title) {
      crumbs.push({ name: page.title, item: route.path })
    }

    const nodes: Record<string, unknown>[] = [defineBreadcrumb({ itemListElement: crumbs })]

    if (kind === 'subject' && subject) {
      nodes.push(defineCourse({
        name: subject.title,
        description: subject.description,
        courseCode: subject.code,
        educationalLevel: subject.stage,
        url: subject.path,
        provider: { '@id': `${site.url}/#identity` },
        inLanguage: 'en-IN',
        isAccessibleForFree: true,
        image: page?.image,
        offers: { '@type': 'Offer', 'category': 'Free', 'price': 0, 'priceCurrency': 'INR' },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          'courseMode': 'online',
          'courseWorkload': subject.minutes ? `PT${subject.minutes}M` : undefined
        }
      }))
    }

    // A lesson is a LearningResource, which schema-org's helpers do not have a
    // definer for — a plain node is exactly as valid.
    if (kind === 'lesson' && page) {
      nodes.push({
        '@type': 'LearningResource',
        'name': page.title,
        'description': page.description,
        'learningResourceType': page.kind || 'lesson',
        'timeRequired': page.minutes ? `PT${page.minutes}M` : undefined,
        'inLanguage': 'en-IN',
        'isAccessibleForFree': true,
        'author': { '@id': `${site.url}/#identity` },
        'isPartOf': subject
          ? { '@type': 'Course', 'name': subject.title, 'url': `${site.url}${subject.path}` }
          : undefined
      })

      // The same page as an Article, which is what the search result for a
      // lesson is drawn from. Author and publisher come from the identity.
      nodes.push(defineArticle({
        headline: page.title,
        description: page.description,
        inLanguage: 'en-IN',
        isAccessibleForFree: true
      }))

      // An interview page is a list of questions and answers, and says so.
      const faq = page.kind === 'quiz' ? faqFromBody(page.body) : []
      if (faq.length) {
        nodes.push(defineWebPage({ '@type': 'FAQPage' }))
        nodes.push(...faq.map(item => defineQuestion({ name: item.name, acceptedAnswer: item.text })))
      }
    }

    return nodes
  })

  // The nodes are reactive because the catch-all page keeps one component
  // instance across lesson navigations. `useSchemaOrg` accepts a ref at runtime;
  // its published type only names the writable-ref branch of that union.
  useSchemaOrg(nodes as unknown as Parameters<typeof useSchemaOrg>[0])
}
