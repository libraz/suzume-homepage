import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
import { generateLlmsTxt, llmsDevPlugin, type LlmsLocale } from './llms'
import { WASM_GZIP_SIZE, SUZUME_VERSION } from '../src/wasm/metadata'

const siteUrl = 'https://suzume.libraz.net'
const githubUrl = 'https://github.com/libraz/suzume'

const sizeLabelText = WASM_GZIP_SIZE

/** Per-locale structured data and social-card copy. */
type Locale = 'en' | 'ja'

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
  description: lang === 'ja'
    ? `ブラウザで動く軽量な日本語トークナイザ。サーバーも外部辞書のセットアップも不要で、WASM バイナリは gzip 後 ${sizeLabelText} 未満。辞書にない語もパターンから候補を生成します。`
    : `Lightweight Japanese tokenizer that runs in the browser. Unlike MeCab, no server or external dictionary setup is required. Its WebAssembly binary is under ${sizeLabelText} gzipped, with pattern-based unknown-word candidates.`,
  url: lang === 'ja' ? `${siteUrl}/ja/` : siteUrl,
  downloadUrl: githubUrl,
  softwareVersion: SUZUME_VERSION,
  author: {
    '@type': 'Person',
    name: 'libraz'
  },
  license: 'https://opensource.org/licenses/Apache-2.0',
  keywords: lang === 'ja'
    ? '日本語トークナイザー, 形態素解析, WASM, WebAssembly, 自然言語処理, ブラウザ 形態素解析, クライアントサイド NLP'
    : 'Japanese tokenizer, morphological analyzer, WASM, WebAssembly, NLP, browser tokenizer, client-side NLP'
})

const SEO: Record<Locale, { title: string; description: string; keywords: string }> = {
  en: {
    title: 'Suzume - Japanese Tokenizer That Works in the Browser',
    description: `Suzume brings Japanese tokenization to browsers and server runtimes. Its WebAssembly binary is under ${sizeLabelText} gzipped and requires no analysis server.`,
    keywords: 'Japanese tokenizer, morphological analyzer, WASM, WebAssembly, NLP, natural language processing, browser NLP, client-side tokenizer, lightweight tokenizer'
  },
  ja: {
    title: 'Suzume - ブラウザで動く日本語トークナイザ',
    description: `Suzume はブラウザとサーバーランタイムに日本語の形態素解析を持ち込みます。WASM バイナリは gzip 後 ${sizeLabelText} 未満で、解析サーバーは要りません。`,
    keywords: '形態素解析, 日本語, トークナイザー, WASM, WebAssembly, 自然言語処理, 形態素解析 ブラウザ, 日本語 トークナイザー, 軽量 形態素解析, サーバーレス 形態素解析, フロントエンド 日本語処理'
  }
}

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
      { slug: 'performance', en: 'Speed and Accuracy', ja: '速度と精度' },
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
      { slug: 'pos-differences', en: 'POS Classification', ja: 'POS 分類の違い' },
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
    en: 'Advanced',
    ja: '発展',
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

  title: 'Suzume - Japanese Tokenizer for the Browser',
  description: `Lightweight Japanese tokenizer for browsers and server runtimes. The WebAssembly binary is under ${sizeLabelText} gzipped and includes compact dictionaries plus pattern-based unknown-word candidates.`,

  // Sitemap
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
  // (canonical, OGP, keywords, JSON-LD) is emitted from transformHead below.
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

  transformHead({ pageData, description }) {
    const lang = localeOf(pageData.relativePath)
    const seo = SEO[lang]
    const url = `${siteUrl}${routeOf(pageData.relativePath)}`
    const altLang: Locale = lang === 'ja' ? 'en' : 'ja'
    const altUrl = `${siteUrl}${alternateRoute(pageData.relativePath)}`
    const title = pageData.frontmatter.title || seo.title
    const desc = description || seo.description

    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { name: 'keywords', content: seo.keywords }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: desc }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:locale', content: lang }],
      ['meta', { property: 'og:locale:alternate', content: altLang }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: desc }],
      ['link', { rel: 'alternate', hreflang: lang, href: url }],
      ['link', { rel: 'alternate', hreflang: altLang, href: altUrl }],
      ['link', { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}${routeOf(pageData.relativePath.replace(/^ja\//, ''))}` }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(softwareApplicationJsonLd(lang))],
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
      title: 'Suzume - ブラウザで動く日本語トークナイザー',
      description: `ブラウザで動く軽量日本語トークナイザー。MeCabや外部辞書のセットアップ、サーバーは不要。WASM バイナリは gzip 後 ${sizeLabelText} 以下でフロントエンド完結。`,
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
