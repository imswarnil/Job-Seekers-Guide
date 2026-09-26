import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const variantEnum = z.enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link'])
const colorEnum = z.enum(['primary', 'secondary', 'neutral', 'error', 'warning', 'success', 'info'])
const sizeEnum = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])
const orientationEnum = z.enum(['vertical', 'horizontal'])

/** Display grouping on `/path`. Never ordering — order is the folder numbering. */
const stageEnum = z.enum(['introduction', 'foundation', 'language', 'web', 'tooling', 'applied', 'ai', 'interview'])
const kindEnum = z.enum(['lesson', 'practice', 'project', 'quiz', 'reading'])
const changeEnum = z.enum(['feature', 'fix', 'content', 'other'])

const createBaseSchema = () => z.object({
  title: z.string().nonempty(),
  description: z.string().nonempty()
})

const createFeatureItemSchema = () => createBaseSchema().extend({
  icon: z.string().nonempty().editor({ input: 'icon' })
})

const createLinkSchema = () => z.object({
  label: z.string().nonempty(),
  to: z.string().nonempty(),
  icon: z.string().optional().editor({ input: 'icon' }),
  size: sizeEnum.optional(),
  trailing: z.boolean().optional(),
  target: z.string().optional(),
  color: colorEnum.optional(),
  variant: variantEnum.optional()
})

const createImageSchema = () => z.object({
  src: z.string().nonempty().editor({ input: 'media' }),
  alt: z.string().optional(),
  loading: z.enum(['lazy', 'eager']).optional(),
  srcset: z.string().optional()
})

/** Optional per-page overrides for the title and description search engines see. */
const createSeoSchema = () => z.object({
  title: z.string().optional().editor({ label: 'SEO title' }),
  description: z.string().optional().editor({ input: 'textarea', label: 'SEO description' })
}).optional().editor({ label: 'SEO overrides', description: 'Leave empty to use the page title and description.' })

export default defineContentConfig({
  collections: {
    index: defineCollection({
      source: '0.index.yml',
      type: 'page',
      schema: z.object({
        hero: z.object({
          headline: z.string().optional(),
          links: z.array(createLinkSchema())
        }),
        sections: z.array(
          createBaseSchema().extend({
            id: z.string().nonempty(),
            orientation: orientationEnum.optional(),
            reverse: z.boolean().optional(),
            features: z.array(createFeatureItemSchema())
          })
        ),
        features: createBaseSchema().extend({
          items: z.array(createFeatureItemSchema())
        }),
        testimonials: createBaseSchema().extend({
          headline: z.string().optional(),
          items: z.array(
            z.object({
              quote: z.string().nonempty(),
              user: z.object({
                name: z.string().nonempty(),
                description: z.string().nonempty(),
                to: z.string().optional(),
                target: z.string().optional(),
                avatar: createImageSchema().optional()
              })
            })
          )
        }),
        cta: createBaseSchema().extend({
          links: z.array(createLinkSchema())
        })
      })
    }),

    // Standalone root-level pages: /my-story, /faq. Each one needs a matching
    // app/pages/<slug>.vue — that file is what reserves the slug from the path.
    // `about.md` is the exception: it has no page of its own any more and is
    // read by HomeAbout.vue, which renders it as a band of the front page.
    pages: defineCollection({
      source: '*.md',
      type: 'page',
      schema: z.object({
        icon: z.string().optional().editor({ input: 'icon' }),
        // When a page last changed in a way a reader should know about. The
        // legal pages print it, because "last updated" is the first thing
        // somebody checks on a privacy policy and an undated one is worthless.
        updated: z.date().optional()
          .editor({ label: 'Last updated', description: 'Shown on the privacy and terms pages.' }),
        // The story's spine. Each id must match a `{#id}` on a heading in the
        // body; the sidebar tracks which one the reader is inside.
        chapters: z.array(z.object({
          id: z.string().nonempty(),
          label: z.string().nonempty(),
          year: z.union([z.string(), z.number()]).optional(),
          // Which act this chapter belongs to. Several chapters share one, and
          // the rail groups on it — fifteen flat entries is a list, five groups
          // of three is a shape. It must match the `phase` on the matching
          // `::story-chapter` in the body, because the reader sees both.
          phase: z.string().optional()
        })).optional().editor({ label: 'Chapters', description: 'Ids must match the id on each ::story-chapter in the body.' }),
        stats: z.array(z.object({
          value: z.string().nonempty(),
          label: z.string().nonempty()
        })).optional().editor({ label: 'Headline numbers' }),
        // The five towns the story moves through, drawn as a route across the
        // top of the page. Data rather than prose because the page renders them
        // as a horizontal rail, and you cannot lay out a rail over paragraphs.
        places: z.array(z.object({
          place: z.string().nonempty(),
          years: z.string().optional(),
          note: z.string().nonempty()
        })).optional().editor({ label: 'The route' }),
        // Questions, grouped. Kept as data rather than as accordion blocks in
        // the body so the page can filter them, group them and emit FAQ
        // structured data — none of which is possible over rendered prose.
        groups: z.array(z.object({
          label: z.string().nonempty(),
          icon: z.string().optional().editor({ input: 'icon' }),
          description: z.string().optional(),
          questions: z.array(z.object({
            q: z.string().nonempty(),
            a: z.string().nonempty().editor({ input: 'textarea' })
          }))
        })).optional().editor({ label: 'Question groups' }),
        // The About page is laid out in columns rather than run as one column
        // of prose, so its structure is data. Every field is optional — the
        // other root pages in this collection use none of them.
        hero: z.object({
          kicker: z.string().optional(),
          headline: z.string().nonempty(),
          lede: z.string().optional()
        }).optional(),
        pillars: z.array(z.object({
          title: z.string().nonempty(),
          body: z.string().nonempty(),
          illustration: z.string().optional()
        })).optional(),
        audience: z.object({
          title: z.string().nonempty(),
          body: z.string().nonempty()
        }).optional(),
        principles: z.array(z.object({
          title: z.string().nonempty(),
          body: z.string().nonempty()
        })).optional(),
        excluded: z.array(z.object({
          what: z.string().nonempty(),
          why: z.string().nonempty()
        })).optional(),
        nonGoals: z.array(z.string()).optional(),
        built: z.object({
          title: z.string().nonempty(),
          body: z.string().nonempty()
        }).optional(),
        cards: z.array(z.object({
          title: z.string().nonempty(),
          body: z.string().nonempty(),
          icon: z.string().optional().editor({ input: 'icon' }),
          to: z.string().nonempty()
        })).optional(),
        seo: createSeoSchema()
      })
    }),

    // The whole learning path, as one ordered tree: subject folder → module
    // folder → lesson file. The folder numbering *is* the sequence — there is no
    // manifest and no `order:` front matter to drift out of sync, so reordering
    // the curriculum is renaming a directory.
    //
    // `prefix: '/'` overrides the prefix Content would derive from the source
    // glob, so `1.path/3.java/1.collections/1.generics.md` lands on
    // `/java/collections/generics` rather than under a `/path` segment.
    path: defineCollection({
      source: { include: '1.path/**', prefix: '/' },
      type: 'page',
      schema: z.object({
        // A subject — the index.md one level down from `1.path/`.
        code: z.string().optional()
          .editor({ label: 'Subject code', description: 'Shown as a badge, e.g. CS-OS-101' }),
        stage: stageEnum.optional()
          .editor({ label: 'Stage', description: 'Groups subjects on /path. The order of the path comes from folder numbering, never from this.' }),
        duration: z.string().optional()
          .editor({ label: 'Duration', description: 'Human estimate, e.g. "4 weeks"' }),
        outcomes: z.array(z.string()).optional()
          .editor({ label: 'By the end you can…' }),
        prerequisites: z.array(z.string()).optional()
          .editor({ label: 'Prerequisite subject slugs' }),

        // A lesson — any markdown file three levels down.
        minutes: z.number().optional()
          .editor({ label: 'Reading time (minutes)' }),
        kind: kindEnum.optional()
          .editor({ label: 'Lesson kind' }),
        draft: z.boolean().optional()
          .editor({ label: 'Draft', description: 'Hidden from the path until unticked.' }),

        // Any level.
        icon: z.string().optional().editor({ input: 'icon' }),
        seo: createSeoSchema()
      })
    }),

    changelog: defineCollection({
      source: '4.changelog.yml',
      type: 'page'
    }),

    versions: defineCollection({
      source: '4.changelog/**',
      type: 'page',
      schema: z.object({
        title: z.string().nonempty(),
        description: z.string(),
        date: z.date(),
        /**
         * The release number. Shown on the generated cover and used as the
         * anchor, so a single release can be linked to — "we shipped that in
         * 1.2" is only useful if 1.2 has an address.
         */
        version: z.string().optional().editor({ label: 'Version', description: 'e.g. 1.0.0' }),
        /** A short label for the release, printed on the cover under the number. */
        codename: z.string().optional().editor({ label: 'Codename' }),
        // Entries are a list of short, categorised lines rather than prose. A
        // changelog nobody scans is a changelog nobody reads, and the previous
        // ones were essays.
        changes: z.array(z.object({
          type: changeEnum,
          text: z.string().nonempty()
        })).optional().editor({ label: 'Changes' })
      })
    })
  }
})
