/**
 * Runtime configuration that is safe to edit without touching code.
 *
 * Nuxt Content ships the schema derived from this file to the editor, so every
 * field below appears as a labelled control in the visual editor — which is why
 * the ad switches and the player defaults live here and not in `nuxt.config.ts`.
 * Turning ads off should not require a deploy.
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'guide',
      secondary: 'spark',
      neutral: 'ink',
      success: 'emerald',
      warning: 'amber',
      error: 'red',
      info: 'spark'
    },
    button: {
      defaultVariants: {
        size: 'md'
      }
    },
    prose: {
      /**
       * The little icon on a code block that has a filename, keyed by extension
       * or by whole filename.
       *
       * Nuxt UI's own map points every entry at the `vscode-icons` collection,
       * which this site does not install — so an unmapped extension renders a
       * blank square. Only Lucide and Simple Icons are installed, and both are
       * bundled at build time, so these never cost a request. Add a line here
       * before writing a lesson that names a file type not listed.
       */
      codeIcon: {
        // Simple Icons has no `java`; OpenJDK is the mark this site uses. See
        // app/utils/tech.ts, which makes the same substitution.
        'java': 'i-simple-icons-openjdk',
        'sql': 'i-lucide-database',
        'html': 'i-simple-icons-html5',
        'htm': 'i-simple-icons-html5',
        'css': 'i-simple-icons-css',
        'js': 'i-simple-icons-javascript',
        'mjs': 'i-simple-icons-javascript',
        'cjs': 'i-simple-icons-javascript',
        'jsx': 'i-simple-icons-react',
        'ts': 'i-simple-icons-typescript',
        'tsx': 'i-simple-icons-react',
        'vue': 'i-simple-icons-vuedotjs',
        'py': 'i-simple-icons-python',
        'sh': 'i-lucide-terminal',
        'bash': 'i-lucide-terminal',
        'zsh': 'i-lucide-terminal',
        'json': 'i-lucide-braces',
        'yml': 'i-lucide-file-cog',
        'yaml': 'i-lucide-file-cog',
        'md': 'i-lucide-file-text',
        'txt': 'i-lucide-file-text',
        'csv': 'i-lucide-table',
        'package.json': 'i-simple-icons-npm',
        '.env': 'i-lucide-key-round',
        '.gitignore': 'i-simple-icons-git'
      }
    }
  },

  /** Site-wide identity. */
  brand: {
    /** Shown in the header, the footer and every social card. */
    name: 'Bangalore Job Seekers Guide',
    /** One sentence. Used as the fallback meta description. */
    tagline: 'From Mahroni to Bangalore to a first IT job: the whole route, written down.',
    /** Repository the content is authored in. Empty hides the link. */
    github: 'https://github.com/imswarnil/job-seekers-guide',
    /** Channel companion videos are published to. Empty hides the link. */
    youtube: '',
    /** Booking link on the Questions page. Empty hides the button. */
    topmate: 'https://topmate.io/swarnil'
  },

  /** The home page's opening screen. */
  hero: {
    /**
     * A YouTube video id (the eleven characters after `v=`), played muted and
     * looping behind the headline on wide screens. Empty keeps the gradient.
     * Paste a real id from your own channel; never a guessed one.
     *
     * `ecOkmTD7KhU` is mine. It always starts from the first frame and loops.
     */
    youtubeId: 'ecOkmTD7KhU'
  },

  /** Lesson player behaviour. */
  player: {
    /** Move to the next lesson on its own after one is marked finished. */
    autoAdvance: false,
    /** Seconds to wait before that happens. Any keypress cancels it. */
    autoAdvanceSeconds: 8,
    /** Show the sidebar by default on wide screens. */
    showRailByDefault: true
  },

  /**
   * The "a human wrote this" badge in the sidebar of every path page.
   *
   * A third-party widget, rendered by `AuthorBadge.vue`. The fields below are
   * the `data-` attributes it reads, one for one.
   */
  authorBadge: {
    /** Off removes it everywhere. */
    enabled: true,
    /**
     * Where the widget script comes from.
     *
     * Has to stay `https://`. The page is served over https, and a browser
     * blocks a plain-http script on an https page as mixed content — so the
     * `http://localhost:3000` address the widget is developed against renders
     * nothing once this site is deployed.
     */
    src: 'https://nac.imswarnil.com/widget.js',
    /** Whose words these are. */
    author: 'Swarnil Singhai',
    /** The claim the badge makes, in the author's own voice. */
    message: 'Written by a human. AI is used only to refine ideas — never to generate.',
    /**
     * Which of the widget's nine layouts to draw: stamp, wax, passport,
     * postmark, ribbon, certificate, typewriter, banner or compact.
     */
    style: 'ribbon',
    /** `light` or `dark`. Fixed, so it does not follow the site's theme. */
    theme: 'light',
    region: 'India',
    category: 'Education'
  },

  /**
   * Advertising. `enabled: false` removes every slot site-wide, including the
   * ones authors placed inline in markdown.
   */
  ads: {
    /** Master switch. No real ad renders while this is off. */
    enabled: true,
    /**
     * Draw the reserved boxes even when ads are off, labelled and dashed.
     * Makes the layout honest during development and proves the size
     * reservation works before a single real ad exists.
     *
     * Off now that ads are live: a reader should never see a dashed
     * development box. It only has any effect on a slot that is switched on but
     * has no unit id, which is the one case worth seeing while editing.
     */
    showPlaceholders: false,
    /** `house` shows the built-in promo; `adsense` loads a third-party script. */
    provider: 'adsense' as 'house' | 'adsense' | 'none',
    /**
     * Publisher id, for the adsense provider only. The `ca-pub-0000000000000000`
     * string from your AdSense account, including the `ca-pub-` prefix.
     *
     * Empty means the adsense provider cannot render, and it says so in the
     * console rather than drawing an empty box.
     *
     * The same number, minus the `ca-` prefix, is in `public/ads.txt`. Change
     * one and you have to change the other.
     */
    client: 'ca-pub-1291242080282540',
    /**
     * Per-placement switches. See app/utils/ads.ts for what each one is.
     *
     * `rail-bottom` and `path-parallax` stay off for the reasons written next
     * to them in that file, not because they are unconfigured. Both have a unit
     * id below and are one boolean away from running.
     *
     * Fewer ads, on purpose: one AdSense unit under each lesson and nothing
     * else. The in-prose, in-feed and sidebar units are off. The only other
     * paid thing on the site is the one `brand` sponsor spot.
     */
    slots: {
      'in-article': false,
      'in-feed': false,
      'lesson-footer': true,
      'sidebar': false,
      'rail-bottom': false,
      'path-parallax': false
    },
    /**
     * The AdSense ad-unit id for each placement — the `data-ad-slot` number,
     * which is not the same thing as the publisher id and is different for
     * every unit.
     *
     * Each is matched to the reserved box it has to fill, which is why the
     * fixed-size units are used where the box is a fixed size and the
     * responsive ones where it is not. Swapping in a unit of a different shape
     * means changing the reservation in app/utils/ads.ts to match, or the ad
     * will not fit the hole left for it.
     *
     * A placement left empty is not live even when ads are on, which is the
     * intended way to run AdSense on some slots and not others without having
     * to keep two switches in step.
     */
    slotIds: {
      // "The Leaderboard (728×90)" — exactly the reserved box.
      'in-article': '1864856299',
      // "Horizontal (Responsive)" — the repeating in-lesson ad. Responsive
      // because this one appears at every width the prose column takes, and a
      // separate unit from `in-article` so the automatic ads and the
      // hand-placed ones can be told apart in the AdSense report.
      'in-feed': '8939839370',
      // "Responsive_Leaderboard" — a second unit rather than reusing the one
      // above, so the two 728×90 slots on a lesson report separately.
      'lesson-footer': '4774277934',
      // "Medium Square (300x250)" — exactly the reserved box.
      'sidebar': '9619442326',
      // "Vertical (Responsive)" — the reserved box is 240×400, which no fixed
      // unit matches.
      'rail-bottom': '3487917390',
      // "Horizontal (Responsive)" — the parallax band is 1200×260, likewise.
      'path-parallax': '8939839370'
    },
    /**
     * Ads dropped into a lesson automatically, between the paragraphs the
     * author wrote. Implemented in `app/utils/autoAds.ts`.
     *
     * These are in the server-rendered HTML at the right position, rather than
     * inserted into the page afterwards, so the text a reader is looking at
     * never moves.
     */
    autoInsert: {
      /**
       * Insert after every Nth paragraph of a lesson. 0 turns this off, which
       * is where it is: the owner chose one ad per lesson, at the foot.
       */
      afterParagraphs: 0,
      /**
       * The ceiling per page. 0 removes it.
       *
       * "More ads than publisher content" is a policy violation Google acts on
       * at the account level, not the page level, and a long lesson at one ad
       * per three paragraphs reaches that on its own. Four is enough to earn
       * from a long page without it turning into a stack of adverts with prose
       * in the gaps. Raise it deliberately, not by accident.
       */
      max: 4,
      /**
       * Leave anything shorter than this alone. One ad per three paragraphs
       * reads as normal in a long lesson and as spam in a glossary entry.
       */
      minParagraphs: 6
    }
  }
})
