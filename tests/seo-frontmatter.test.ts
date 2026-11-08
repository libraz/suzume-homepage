import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Every docs page carries its own title and description so none falls back to the
// site-wide head. Bounds keep `<title> | Suzume` within ~60 chars and descriptions
// inside the search-snippet window.
const LOCALES = {
  en: { dir: 'src/docs', title: [10, 51], description: [100, 160] },
  ja: { dir: 'src/ja/docs', title: [5, 32], description: [50, 120] },
} as const

function frontmatterField(markdown: string, key: string): string | undefined {
  const block = markdown.match(/^---\n([\s\S]*?)\n---\n/)
  const line = block?.[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return line?.[1].trim().replace(/^"|"$/g, '')
}

function pages(dir: string): string[] {
  return readdirSync(dir).filter((name) => name.endsWith('.md')).sort()
}

describe('docs page SEO frontmatter', () => {
  it('has the same page set in every locale', () => {
    expect(pages(LOCALES.ja.dir)).toEqual(pages(LOCALES.en.dir))
  })

  for (const [locale, rule] of Object.entries(LOCALES)) {
    const entries = pages(rule.dir).map((name) => {
      const markdown = readFileSync(join(rule.dir, name), 'utf-8')
      return {
        name,
        title: frontmatterField(markdown, 'title'),
        description: frontmatterField(markdown, 'description'),
      }
    })

    for (const { name, title, description } of entries) {
      it(`${locale}/${name} has a title and description within bounds`, () => {
        expect(title, 'title').toBeDefined()
        expect(description, 'description').toBeDefined()
        const titleLength = [...(title ?? '')].length
        const descriptionLength = [...(description ?? '')].length
        expect(titleLength).toBeGreaterThanOrEqual(rule.title[0])
        expect(titleLength).toBeLessThanOrEqual(rule.title[1])
        expect(descriptionLength).toBeGreaterThanOrEqual(rule.description[0])
        expect(descriptionLength).toBeLessThanOrEqual(rule.description[1])
        expect(`${title} ${description}`).not.toMatch(/morphological analy[sz]er|形態素解析器/i)
      })
    }

    it(`${locale} titles and descriptions are unique`, () => {
      const titles = entries.map((entry) => entry.title)
      const descriptions = entries.map((entry) => entry.description)
      expect(new Set(titles).size).toBe(titles.length)
      expect(new Set(descriptions).size).toBe(descriptions.length)
    })
  }
})
