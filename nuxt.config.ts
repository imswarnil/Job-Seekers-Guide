// https://nuxt.com/docs/api/configuration/nuxt-config
//
// The Bangalore Job Seekers Guide is one static app: `pnpm generate` writes
// every page to `.output/public`, and GitHub Pages serves it. There is no
// server, no database and no Worker behind it.
//
// A note on `@nuxtjs/mdc` in package.json: nothing here imports it. It is a
// dependency of `@nuxt/content`, and depending on it directly is what lets Vite
// resolve the ten packages it asks to pre-bundle (otherwise `NUXT_B7002` on
// every boot). Keep the version in step with whatever `@nuxt/content` pulls in.
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
        rehypePlugins: {
          'svg-attributes': { instance: rehypeSvgAttributes }
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

  compatibilityDate: '2026-06-30',

  nitro: {
    prerender: {
      // Everything else is reached by crawling the sidebar, which renders
      // server-side on every page.
      routes: ['/', '/privacy', '/terms', '/contact'],
      crawlLinks: true
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
   * Icons are baked into the bundle rather than fetched at runtime: there is no
   * `/api/_nuxt_icon` endpoint on GitHub Pages. `.navigation.yml` is listed on
   * its own because the scanner's globs skip dotfiles.
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
      sameAs: ['https://github.com/imswarnil', 'https://imswarnil.com']
    }
  },

  seo: {
    redirectToCanonicalSiteUrl: true
  }
})
