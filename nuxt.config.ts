// https://nuxt.com/docs/api/configuration/nuxt-config
//
// The Bangalore Job Seekers Guide runs on Cloudflare Workers (nitro preset
// `cloudflare_module`). Every guide page is still prerendered at build time and
// served as a static asset; only /api/*, /stories/:id, /account and /admin are
// rendered by the Worker. Data lives in Neon Postgres, sign-in is Neon Auth,
// money is Dodo Payments. Nuxt Content's own runtime queries use the D1
// database bound as `DB`. See docs/backend.md for the whole picture.
//
// A note on `@nuxtjs/mdc` in package.json: nothing here imports it. It is a
// dependency of `@nuxt/content`, and depending on it directly is what lets Vite
// resolve the ten packages it asks to pre-bundle (otherwise `NUXT_B7002` on
// every boot). Keep the version in step with whatever `@nuxt/content` pulls in.
import { fileURLToPath } from 'node:url'
import rehypeSvgAttributes from './modules/rehype-svg-attributes'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'nuxt-schema-org',
    'nuxt-seo-utils',
    'nuxt-og-image',
    '~~/modules/reserved-slugs'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    name: 'Bangalore Job Seekers Guide',
    // `NUXT_PUBLIC_SITE_URL` overrides it; the deploy workflow sets it.
    url: 'https://jobseekers.imswarnil.com'
  },

  content: {
    build: {
      markdown: {
        toc: {
          depth: 3,
          searchDepth: 3
        },
        // Hand-drawn diagrams keep `text-anchor`, `font-size` and the rest.
        // See modules/rehype-svg-attributes.ts.
        // `src` as well as `instance`: the Worker's server bundle imports the
        // plugin by `src` for runtime markdown, and without it tries to import
        // a package literally called `svg-attributes`.
        rehypePlugins: {
          'svg-attributes': {
            instance: rehypeSvgAttributes,
            src: fileURLToPath(new URL('./modules/rehype-svg-attributes.ts', import.meta.url))
          }
        },
        // Every language a lesson shows. Shiki only bundles what is listed, and
        // an unlisted fence renders as plain text with no highlighting.
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark'
          },
          langs: ['java', 'sql', 'bash', 'shellscript', 'html', 'css', 'javascript', 'json', 'yaml', 'markdown', 'python', 'xml', 'diff']
        }
      }
    },
    experimental: {
      sqliteConnector: 'native'
    }
  },

  routeRules: {
    // Rendered per request by the Worker: a story is shared by link and should
    // arrive with its title and text in the HTML.
    '/stories/**': { prerender: false },
    '/stories/new': { prerender: true },
    '/account': { prerender: false },
    '/admin/**': { prerender: false, robots: false }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      // Merge wrangler.jsonc into .output/server/wrangler.json and point
      // `wrangler deploy` at it (via .wrangler/deploy/config.json).
      deployConfig: true,
      nodeCompat: true
    },
    prerender: {
      // Everything else is reached by crawling the sidebar, which renders
      // server-side on every page. The server-backed pages are prerendered as
      // shells and fetch their data in the browser.
      routes: [
        '/', '/privacy', '/terms', '/contact',
        '/stats', '/stories', '/stories/new', '/guestbook', '/leaderboard',
        '/sponsor', '/support', '/support/thanks', '/login'
      ],
      crawlLinks: true,
      ignore: ['/api', '/admin', '/account']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  /**
   * Icons are baked into the bundle rather than fetched at runtime, so a
   * prerendered page never waits on `/api/_nuxt_icon`. `.navigation.yml` is
   * listed on its own because the scanner's globs skip dotfiles.
   */
  icon: {
    clientBundle: {
      scan: {
        globInclude: [
          'app/**/*.{vue,ts,js}',
          'content/**/*.{md,yml}',
          'content/**/.navigation.yml'
        ]
      }
    }
  },

  ogImage: {
    zeroRuntime: true
  },

  schemaOrg: {
    identity: {
      type: 'Person',
      name: 'Swarnil Singhai',
      description: 'Went from Mahroni to Bangalore with no skills, cleared the 34th walk-in, and wrote down the whole route for the next job seeker.',
      jobTitle: 'Salesforce engineer',
      sameAs: ['https://github.com/imswarnil', 'https://imswarnil.com', 'https://imswarnil.com/about']
    }
  },

  seo: {
    redirectToCanonicalSiteUrl: true
  }
})
