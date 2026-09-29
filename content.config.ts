import { defineCollection, defineContentConfig, z } from '@nuxt/content'

/** The part of the guide a track belongs to. Display grouping only: the folder numbers are the order. */
const stageEnum = z.enum(['move', 'code', 'cs', 'web', 'written', 'interview', 'story'])
const kindEnum = z.enum(['lesson', 'guide', 'practice', 'quiz', 'reading', 'story'])

/** Optional per-page overrides for the title and description search engines see. */
const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional()
}).optional()

export default defineContentConfig({
  collections: {
    // The three pages outside the guide: /privacy, /terms, /contact. Each has a
    // matching app/pages/<slug>.vue, which is what reserves the slug.
    pages: defineCollection({
      source: '*.md',
      type: 'page',
      schema: z.object({
        icon: z.string().optional(),
        updated: z.date().optional(),
        seo: seoSchema
      })
    }),

    // The whole guide, as one ordered tree: track folder → chapter folder →
    // lesson file. The folder numbering is the order. `prefix: '/'` keeps
    // `1.path` out of the URL, so `1.path/01.java/…` lands on `/java/…`.
    path: defineCollection({
      source: { include: '1.path/**', prefix: '/' },
      type: 'page',
      schema: z.object({
        // A track: the index.md one level down from `1.path/`.
        stage: stageEnum.optional(),
        duration: z.string().optional(),
        outcomes: z.array(z.string()).optional(),

        // A lesson.
        minutes: z.number().optional(),
        kind: kindEnum.optional(),

        // Any level.
        icon: z.string().optional(),
        /**
         * A real photo, for a track's cards and header: a path under
         * `public/images/tracks/` or a full URL. Leave it out and the track
         * gets a generated thumbnail in its own colour, which is the default.
         */
        image: z.string().optional(),
        seo: seoSchema
      })
    }),

    // "Products I use": the things on my desk while I studied, shown on /gear
    // and in a small shelf under lessons. One file, `content/products.yml`,
    // holding a list. Links are affiliate links and are pasted in by hand; an
    // empty `url` renders as "Link coming soon".
    products: defineCollection({
      source: 'products.yml',
      type: 'data',
      schema: z.object({
        items: z.array(z.object({
          name: z.string(),
          category: z.enum(['Stationery', 'Books', 'Laptop & desk', 'Software']),
          description: z.string(),
          /** A path under `public/images/products/`. Optional: a tile in the category's colour stands in. */
          image: z.string().optional(),
          /** The affiliate link. Empty until one is pasted in. */
          url: z.string().default(''),
          price: z.string().optional(),
          badge: z.string().optional(),
          /** Track slugs this belongs beside, so the shelf under a Java lesson shows the Java book first. */
          tracks: z.array(z.string()).optional()
        }))
      })
    })
  }
})
