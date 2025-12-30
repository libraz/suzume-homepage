import DefaultTheme from 'vitepress/theme'
import WasmStats from './WasmStats.vue'
import ComparisonTable from './ComparisonTable.vue'
import UseCaseDemo from './UseCaseDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('WasmStats', WasmStats)
    app.component('ComparisonTable', ComparisonTable)
    app.component('UseCaseDemo', UseCaseDemo)
  }
}
