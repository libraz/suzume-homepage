import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
import { WASM_GZIP_SIZE, SUZUME_VERSION } from '../src/wasm/metadata'

const siteUrl = 'https://suzume.libraz.net'
const githubUrl = 'https://github.com/libraz/suzume'

const sizeLabelText = WASM_GZIP_SIZE

// JSON-LD: SoftwareApplication schema
const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Suzume',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Browser, Node.js, Deno, Bun, Linux, macOS',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  description: `Lightweight Japanese tokenizer that runs in the browser. Unlike MeCab, no server or external dictionary setup is required. Under ${sizeLabelText} gzipped, with pattern-based unknown-word candidates.`,
  url: siteUrl,
  downloadUrl: githubUrl,
  softwareVersion: SUZUME_VERSION,
  author: {
    '@type': 'Person',
    name: 'libraz'
  },
  license: 'https://opensource.org/licenses/Apache-2.0',
  keywords: 'Japanese tokenizer, morphological analyzer, WASM, WebAssembly, NLP, 形態素解析, 日本語, MeCab alternative, browser tokenizer, client-side NLP'
}

// JSON-LD: FAQ schema (for AI search)
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Suzume?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Suzume is a lightweight, feature-driven Japanese tokenizer available through WebAssembly, Python, Go, and native C/C++. It combines compact dictionaries with grammatical rules and can analyze words that are not in its dictionaries. The WebAssembly package runs in browsers, Node.js, Deno, and Bun.'
      }
    },
    {
      '@type': 'Question',
      name: 'How does Suzume handle unknown words?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Suzume generates candidates from character patterns (kanji sequences, katakana sequences, and alphanumeric compounds) and evaluates them alongside dictionary entries with Viterbi scoring. Words that are absent from its dictionaries can therefore still receive token and part-of-speech candidates.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I use Suzume in the browser?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Yes, Suzume runs entirely in the browser via WebAssembly. No server required. You can load it from npm or directly from a CDN like esm.sh. The entire package is under ${sizeLabelText} gzipped.`
      }
    },
    {
      '@type': 'Question',
      name: 'How do I add custom words to Suzume?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use loadUserDictionary() to add custom words at runtime. The current text format is tab-separated, for example "東京公園\\tNOUN". You can also load a dictionary compiled by the native command-line tool.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is the difference between Suzume and MeCab?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MeCab is an analysis engine used with an external dictionary, and its boundaries and labels depend on the selected dictionary. Suzume ships compact dictionaries and grammatical rules with its WebAssembly package, so it can run entirely in a browser. The documentation compares Suzume with MeCab 0.996 and mecab-ipadic 2.7.0-20070801.'
      }
    },
    {
      '@type': 'Question',
      name: 'How is Suzume different from kuromoji.js?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `kuromoji.js and Suzume use different dictionaries and output conventions. Suzume packages compact dictionaries and rules with its WebAssembly module, which is under ${sizeLabelText} gzipped; compare boundary, part-of-speech, and dictionary requirements before choosing either tokenizer.`
      }
    },
    {
      '@type': 'Question',
      name: 'Can I use Suzume for SEO keyword extraction?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Suzume can generate filtered keyword tags from analyzed Japanese text. Applications can select parts of speech, minimum length, lemma or surface output, duplicate handling, and result limits; the WebAssembly package can perform this locally without an analysis server.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is Suzume suitable for production use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Suzume provides a typed JavaScript API for browsers and server runtimes with WebAssembly support, plus Python, Go, and native C/C++ bindings. Validate its segmentation, supported platforms, memory behavior, and dictionary coverage against your production requirements.'
      }
    },
    {
      '@type': 'Question',
      name: 'Does Suzume work offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, once loaded, Suzume works completely offline. All processing happens locally in the browser or runtime. No API calls or internet connection required after initial load.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I install Suzume?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Install via npm: npm install @libraz/suzume. Then import and use: const { Suzume } = await import("@libraz/suzume"); const suzume = await Suzume.create(); const result = suzume.analyze("日本語テキスト");'
      }
    }
  ]
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
      { slug: 'mecab-comparison', en: 'Differences from MeCab', ja: 'MeCab との違い' },
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

export default defineConfig({
  srcDir: 'src',

  title: 'Suzume - Japanese Tokenizer for the Browser',
  description: `Lightweight Japanese tokenizer for browsers and server runtimes. The WebAssembly package is under ${sizeLabelText} gzipped and includes compact dictionaries plus pattern-based unknown-word candidates.`,

  // Sitemap
  sitemap: {
    hostname: siteUrl
  },

  head: [
    ['meta', { name: 'theme-color', content: '#3B82F6' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Architects+Daughter&family=IBM+Plex+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap', rel: 'stylesheet' }],

    // JSON-LD structured data
    ['script', { type: 'application/ld+json' }, JSON.stringify(softwareApplicationJsonLd)],
    ['script', { type: 'application/ld+json' }, JSON.stringify(faqJsonLd)],

    // SEO - Keywords
    ['meta', { name: 'keywords', content: 'Japanese tokenizer, morphological analyzer, WASM, WebAssembly, NLP, natural language processing, 形態素解析, 日本語, トークナイザー, MeCab alternative, MeCab ブラウザ, browser NLP, client-side tokenizer, 形態素解析 ブラウザ, 日本語 トークナイザー, 軽量 形態素解析, kuromoji alternative, サーバーレス 形態素解析, フロントエンド 日本語処理' }],
    ['link', { rel: 'canonical', href: siteUrl }],

    // OGP
    ['meta', { property: 'og:site_name', content: 'Suzume' }],
    ['meta', { property: 'og:title', content: 'Suzume - Japanese Tokenizer That Works in the Browser' }],
    ['meta', { property: 'og:description', content: `Suzume brings Japanese tokenization to browsers and server runtimes. Its WebAssembly package is under ${sizeLabelText} gzipped and requires no analysis server.` }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:image', content: `${siteUrl}/og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],

    // Twitter
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Suzume - Japanese Tokenizer That Works in the Browser' }],
    ['meta', { name: 'twitter:description', content: `Tired of MeCab setup? Suzume brings lightweight Japanese tokenization to the frontend. Under ${sizeLabelText}, no server required.` }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/og-image.png` }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      title: 'Suzume - ブラウザで動く日本語トークナイザー',
      description: `ブラウザで動く軽量日本語トークナイザー。MeCabや外部辞書のセットアップ、サーバーは不要。${sizeLabelText}以下でフロントエンド完結。`,
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
