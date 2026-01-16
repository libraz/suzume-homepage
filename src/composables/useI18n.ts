import { computed } from 'vue'
import { useData } from 'vitepress'
import en from '@/locales/en.json'
import ja from '@/locales/ja.json'

type LocaleMessages = typeof en

const messages: Record<string, LocaleMessages> = {
  en,
  ja
}

export function useI18n() {
  const { lang } = useData()

  const locale = computed(() => lang.value || 'en')

  const currentMessages = computed(() => messages[locale.value] || messages.en)

  /**
   * Get a translated message by key path
   * @param key - Dot-separated key path (e.g., 'comparison.title')
   * @param params - Optional parameters for interpolation
   * @returns Translated string
   */
  function t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.')
    let result: any = currentMessages.value

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k]
      } else {
        // Fallback to English if key not found
        result = messages.en
        for (const fallbackKey of keys) {
          if (result && typeof result === 'object' && fallbackKey in result) {
            result = result[fallbackKey]
          } else {
            return key // Return key if not found
          }
        }
        break
      }
    }

    if (typeof result !== 'string') {
      return key
    }

    // Handle parameter interpolation like {style}
    if (params) {
      return result.replace(/\{(\w+)\}/g, (_, paramKey) => params[paramKey] || `{${paramKey}}`)
    }

    return result
  }

  /**
   * Check if current locale is Japanese
   */
  function isJa(): boolean {
    return locale.value === 'ja'
  }

  return {
    locale,
    t,
    isJa,
    messages: currentMessages
  }
}
