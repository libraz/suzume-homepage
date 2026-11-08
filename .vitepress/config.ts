import { defineConfig, type HeadConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
import { generateLlmsTxt, llmsDevPlugin, type LlmsLocale } from './llms'
import { WASM_GZIP_SIZE, SUZUME_VERSION } from '../src/wasm/metadata'

const siteUrl = 'https://suzume.libraz.net'
const githubUrl = 'https://github.com/libraz/suzume'

const sizeLabelText = WASM_GZIP_SIZE

/** Per-locale structured data and social-card copy. */
type Locale = 'en' | 'ja'

/** Landing-page title and site-default description; docs pages set their own in frontmatter. */
const SEO: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Suzume: Japanese Tokenizer in WebAssembly for the Browser',
    description: `Split Japanese text into words with part-of-speech tags and lemmas in the browser. The WebAssembly tokenizer is under ${sizeLabelText} gzipped and needs no server.`
  },
  ja: {
    title: 'Suzume - ブラウザで動く日本語トークナイザー',
    description: `ブラウザで日本語を単語に分割し、品詞と原形を付けるトークナイザーです。形態素解析サーバーも大きな辞書のダウンロードも要らず、WASM バイナリは gzip 後 ${sizeLabelText} 以下。Python・Go・C++ にも対応します。`
  }
}

const softwareApplicationJsonLd = (lang: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Suzume',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Browser, Node.js, Deno, Bun, Linux, macOS',
  inLanguage: lang,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  description: SEO[lang].description,
  url: lang === 'ja' ? `${siteUrl}/ja/` : `${siteUrl}/`,
  downloadUrl: githubUrl,
  softwareVersion: SUZUME_VERSION,
  author: {
    '@type': 'Person',
    name: 'libraz'
  },
  license: 'https://opensource.org/licenses/Apache-2.0'
})

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', ja: 'ja_JP' }

/** `ja/docs/foo.md` -> `/ja/docs/foo`, `index.md` -> `/` */
function routeOf(relativePath: string): string {
  const clean = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
  return `/${clean}`.replace(/\/{2,}/g, '/')
}

const localeOf = (relativePath: string): Locale =>
  relativePath.startsWith('ja/') ? 'ja' : 'en'

/** The same page in the other language. */
function alternateRoute(relativePath: string): string {
  return relativePath.startsWith('ja/')
    ? routeOf(relativePath.slice(3))
    : routeOf(`ja/${relativePath}`)
}

// Single source of truth for the docs sidebar, shared across locales so the
// English and Japanese trees stay in parity mechanically (add a page once here).
const docsNav = [
  {
    en: 'Guide',
    ja: 'ガイド',
    items: [
      { slug: 'getting-started', en: 'Getting Started', ja: 'はじめに' },
      { slug: 'installation', en: 'Installation', ja: 'インストール' },
      { slug: 'user-dictionary', en: 'User Dictionary', ja: 'ユーザー辞書' },
    ],
  },
  {
    en: 'Concepts',
    ja: 'コンセプト',
    items: [
      { slug: 'how-it-works', en: 'How It Works', ja: '仕組み' },
      { slug: 'analysis-modes', en: 'Modes, Offsets, and Normalization', ja: '解析モード・オフセット・正規化' },
      { slug: 'glossary', en: 'Glossary', ja: '用語集' },
      { slug: 'performance', en: 'Speed and Accuracy', ja: '速度と精度' },
    ],
  },
  {
    en: 'API Reference',
    ja: 'API リファレンス',
    items: [
      { slug: 'api', en: 'JavaScript / WASM', ja: 'JavaScript / WASM' },
      { slug: 'python', en: 'Python', ja: 'Python' },
      { slug: 'python-cli', en: 'Python CLI', ja: 'Python CLI' },
      { slug: 'go', en: 'Go', ja: 'Go' },
      { slug: 'cpp', en: 'C / C++', ja: 'C / C++' },
      { slug: 'cli', en: 'Native Developer CLI', ja: 'ネイティブ開発 CLI' },
    ],
  },
  {
    en: 'MeCab Comparison',
    ja: 'MeCab との比較',
    items: [
      { slug: 'mecab-comparison', en: 'Differences from MeCab', ja: 'MeCab との違い' },
      { slug: 'mecab-compounds', en: 'Compounds, Quantities, and Names', ja: '複合語・数量・名前' },
      { slug: 'mecab-grammar', en: 'Verbs and Grammar', ja: '動詞・文法表現' },
      { slug: 'mecab-text', en: 'Text and Notation', ja: '表記・技術テキスト' },
      { slug: 'pos-differences', en: 'POS Classification', ja: '品詞分類の違い' },
    ],
  },
  {
    en: 'Build & Contribute',
    ja: 'ビルドと開発',
    items: [
      { slug: 'native-build', en: 'Native Build', ja: 'ネイティブビルド' },
      { slug: 'testing', en: 'Testing Guide', ja: 'テストガイド' },
    ],
  },
] as const

function sidebarFor(lang: 'en' | 'ja') {
  const prefix = lang === 'ja' ? '/ja/docs/' : '/docs/'
  return docsNav.map((group) => ({
    text: group[lang],
    items: group.items.map((item) => ({ text: item[lang], link: prefix + item.slug })),
  }))
}

/** Prose for the per-locale llms.txt indexes; the page lists come from the nav/sidebar. */
const LLMS_LOCALES: LlmsLocale[] = [
  {
    key: 'root',
    prefix: '',
    title: 'Suzume',
    summary: `Japanese tokenizer that runs in the browser. Its WebAssembly binary is under ${sizeLabelText} gzipped, with its dictionaries bundled in — no server, no external dictionary download, no install step for the reader.`,
    intro:
      'Suzume segments Japanese text into words with part-of-speech tags and base forms. The\nsame core ships as WebAssembly for browsers and JavaScript runtimes, and natively for\nPython, Go, C/C++, and a CLI. Unknown words are handled with pattern-based candidate\ngeneration rather than a large dictionary. The links below point to the canonical HTML\ndocumentation.',
    overviewHeading: 'Key pages',
    homeText: 'Suzume home',
    alternate: {
      heading: 'Japanese (日本語)',
      items: [
        {
          text: '日本語版インデックス',
          link: '/ja/llms.txt',
          description: 'The same index in Japanese, covering the /ja/ documentation.'
        }
      ]
    }
  },
  {
    key: 'ja',
    prefix: '/ja',
    title: 'Suzume',
    summary: `ブラウザで動く日本語トークナイザー。WASM バイナリは内蔵辞書を含めて gzip 後 ${sizeLabelText} 以下で、サーバーも外部辞書のダウンロードも不要。`,
    intro:
      'Suzume は日本語テキストを単語に分割し、品詞と原形を付ける。同じコアを WebAssembly として\nブラウザおよび JavaScript ランタイムへ、ネイティブ版を Python・Go・C/C++・CLI へ提供する。\n未知語は大規模辞書ではなくパターンベースの候補生成で扱う。以下は日本語ドキュメントへの\nリンク一覧。',
    overviewHeading: '主要ページ',
    homeText: 'Suzume トップ',
    alternate: {
      heading: 'English',
      items: [
        {
          text: 'English index',
          link: '/llms.txt',
          description: '英語ドキュメントを対象とした同じ構成のインデックス。'
        }
      ]
    }
  }
]

export default defineConfig({
  srcDir: 'src',

  title: SEO.en.title,
  description: SEO.en.description,
  // Docs pages read `<page title> | Suzume`; the landing page opts out in transformPageData.
  titleTemplate: 'Suzume',

  // Extension-less URLs, so sitemap entries match the canonical links (Cloudflare
  // Pages redirects `.html` to the bare path).
  cleanUrls: true,

  sitemap: {
    hostname: siteUrl
  },

  buildEnd(siteConfig) {
    generateLlmsTxt({
      siteUrl,
      srcDir: siteConfig.srcDir,
      outDir: siteConfig.outDir,
      cleanUrls: siteConfig.cleanUrls,
      site: siteConfig.site,
      locales: LLMS_LOCALES
    })
  },

  // Locale-independent only. Everything that differs per page or per language
  // (canonical, OGP, hreflang, JSON-LD) is emitted from transformHead below.
  head: [
    ['meta', { name: 'theme-color', content: '#3B82F6' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Architects+Daughter&family=IBM+Plex+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap', rel: 'stylesheet' }],

    // OGP — shared across pages and languages
    ['meta', { property: 'og:site_name', content: 'Suzume' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: `${siteUrl}/og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/og-image.png` }],
  ],

  transformHead({ pageData, title, description }) {
    // The 404 page has no canonical URL or language alternate.
    if (pageData.isNotFound || pageData.relativePath === '404.md') return []

    const lang = localeOf(pageData.relativePath)
    const url = `${siteUrl}${routeOf(pageData.relativePath)}`
    const altLang: Locale = lang === 'ja' ? 'en' : 'ja'
    const altUrl = `${siteUrl}${alternateRoute(pageData.relativePath)}`
    const isHome = pageData.frontmatter.layout === 'home'

    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:locale', content: OG_LOCALE[lang] }],
      ['meta', { property: 'og:locale:alternate', content: OG_LOCALE[altLang] }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['link', { rel: 'alternate', hreflang: lang, href: url }],
      ['link', { rel: 'alternate', hreflang: altLang, href: altUrl }],
      ['link', { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}${routeOf(pageData.relativePath.replace(/^ja\//, ''))}` }],
      ...(isHome
        ? [['script', { type: 'application/ld+json' }, JSON.stringify(softwareApplicationJsonLd(lang))] as HeadConfig]
        : []),
    ]
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      title: SEO.ja.title,
      description: SEO.ja.description,
      themeConfig: {
        siteTitle: 'Suzume',
        nav: [
          { text: 'ドキュメント', link: '/ja/docs/getting-started' },
          { text: 'GitHub', link: githubUrl }
        ],
        sidebar: {
          '/ja/docs/': sidebarFor('ja')
        }
      }
    }
  },

  themeConfig: {
    siteTitle: 'Suzume',
    nav: [
      { text: 'Docs', link: '/docs/getting-started' },
      { text: 'GitHub', link: githubUrl }
    ],

    sidebar: {
      '/docs/': sidebarFor('en')
    },

    socialLinks: [
      { icon: 'github', link: githubUrl }
    ],

    // Local search; per-locale strings live under options.locales. The default
    // tokenizer splits on whitespace, which leaves Japanese text unsearchable,
    // so CJK runs are indexed and queried as overlapping character bigrams.
    // Both functions must stay self-contained: VitePress serializes them into
    // the client bundle for query-time use.
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: (text: string) => {
              const tokens: string[] = []
              const pattern = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆]+|[\p{Script=Latin}\p{N}_]+/gu
              for (const match of text.toLowerCase().matchAll(pattern)) {
                const chars = Array.from(match[0])
                if (/^[\p{Script=Latin}\p{N}_]/u.test(match[0]) || chars.length < 2) {
                  tokens.push(match[0])
                  continue
                }
                for (let index = 0; index < chars.length - 1; index++) {
                  tokens.push(chars[index] + chars[index + 1])
                }
              }
              return tokens
            }
          },
          searchOptions: {
            combineWith: 'AND',
            fuzzy: (term: string) => (/^[\x20-\x7e]+$/.test(term) ? 0.2 : false),
            // A one-character CJK query can only match bigrams by prefix.
            prefix: (term: string) => /^[\x20-\x7e]+$/.test(term) || Array.from(term).length === 1
          }
        },
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Search', buttonAriaLabel: 'Search docs' },
              modal: {
                noResultsText: 'No results for',
                resetButtonTitle: 'Reset search',
                footer: { selectText: 'to select', navigateText: 'to navigate', closeText: 'to close' }
              }
            }
          },
          ja: {
            translations: {
              button: { buttonText: '検索', buttonAriaLabel: 'ドキュメント内検索' },
              modal: {
                noResultsText: '一致する結果がありません',
                resetButtonTitle: '検索をリセット',
                footer: { selectText: '選択', navigateText: '移動', closeText: '閉じる' }
              }
            }
          }
        }
      }
    },

    footer: {
      message: 'a personal project by <a href="https://libraz.net" target="_blank" rel="noopener">libraz</a>'
    }
  },

  transformPageData(pageData) {
    // Inject generated WASM metadata into every home frontmatter string.
    function injectWasmSize(value: unknown): void {
      if (!value || typeof value !== 'object') return

      for (const [key, child] of Object.entries(value)) {
        if (typeof child === 'string') {
          const values = value as Record<string, unknown>
          values[key] = child.replaceAll(
            '__WASM_GZIP_SIZE__',
            sizeLabelText
          )
        } else {
          injectWasmSize(child)
        }
      }
    }

    injectWasmSize(pageData.frontmatter)

    // The landing page's title is the locale's full site title, without the docs suffix.
    if (pageData.frontmatter.layout === 'home') pageData.titleTemplate = false
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  vite: {
    plugins: [llmsDevPlugin({ siteUrl, locales: LLMS_LOCALES })],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../src', import.meta.url)),
        '@theme': fileURLToPath(new URL('./theme', import.meta.url))
      }
    },
    optimizeDeps: {
      exclude: ['@libraz/suzume']
    },
    build: {
      target: 'esnext'
    },
    ssr: {
      noExternal: ['@libraz/suzume']
    }
  }
})
