import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import WasmStats from '@/components/WasmStats.vue'
import ComparisonTable from '@/components/ComparisonTable.vue'
import UseCaseDemo from '@/components/UseCaseDemo.vue'
import TypewriterDemo from '@/components/TypewriterDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('WasmStats', WasmStats)
    app.component('ComparisonTable', ComparisonTable)
    app.component('UseCaseDemo', UseCaseDemo)
    app.component('TypewriterDemo', TypewriterDemo)
  }
} satisfies Theme
