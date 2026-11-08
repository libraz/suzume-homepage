<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// Loader entry points per binding; identifiers stay the same in both languages.
const loaders = [
  { who: 'JS · C++', api: 'loadBinaryDictionary()' },
  { who: 'Python', api: 'load_binary_dict()' },
  { who: 'Go', api: 'LoadBinaryDictionary()' },
  { who: 'CLI', api: '--dict user.dic' },
]

const m = computed(() =>
  isJa()
    ? {
        head: '一度コンパイルし、各バインディングでバイト列を読み込む',
        title:
          'user.tsv を suzume-cli dict compile で形式バージョン 4 の user.dic にし、各バインディングで読み込む。ヘッダー検査に通れば既存の辞書に追加され、通らなければ何も変わらない。',
        build: 'ビルド時',
        runtime: '実行時',
        tsv: 'ソースとして保管',
        cli: 'ネイティブ CLI のみ',
        dic: '形式バージョン 4',
        pass: 'バイト列を渡す',
        check: 'ヘッダー検査',
        checkSub: 'マジック値・バージョン 4',
        added: '追加',
        addedSub: '既存の辞書と併用',
        rejected: '拒否',
        rejectedSub: '既存の辞書はそのまま',
        caption:
          '検査に失敗した読み込みは、それまでに読み込んだ辞書に触れません。別の形式バージョンの .dic は拒否されるため、TSV を保管しておき、現在の CLI で再コンパイルします。',
      }
    : {
        head: 'Compile once, then load the bytes from any binding',
        title:
          'user.tsv is compiled by suzume-cli dict compile into a format-version-4 user.dic, which each binding loads. A load that passes the header check is added to the existing dictionaries; one that fails changes nothing.',
        build: 'Build time',
        runtime: 'Runtime',
        tsv: 'keep it as the source',
        cli: 'native CLI only',
        dic: 'format version 4',
        pass: 'pass the bytes',
        check: 'Header check',
        checkSub: 'magic · version 4',
        added: 'Added',
        addedSub: 'alongside existing ones',
        rejected: 'Rejected',
        rejectedSub: 'existing ones untouched',
        caption:
          'A load that fails the check leaves every dictionary loaded before it in place. A .dic of another format version is rejected, so keep the TSV and recompile it with the current CLI.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="binary-dict-flow-title" viewBox="0 0 960 448" xmlns="http://www.w3.org/2000/svg">
      <title id="binary-dict-flow-title">{{ m.title }}</title>
      <!-- build time -->
      <rect class="fg-group" x="32" y="24" width="896" height="144" rx="8" />
      <text class="fg-lbl" x="56" y="52">{{ m.build }}</text>
      <rect class="fg-box" x="56" y="72" width="208" height="72" rx="8" />
      <text class="fg-m fg-ink" x="72" y="100">user.tsv</text>
      <text class="fg-xs" x="72" y="124">{{ m.tsv }}</text>
      <line class="fg-edge" x1="264" y1="108" x2="302" y2="108" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="304" y="72" width="264" height="72" rx="8" />
      <text class="fg-m fg-ink" x="320" y="100">suzume-cli dict compile</text>
      <text class="fg-xs" x="320" y="124">{{ m.cli }}</text>
      <line class="fg-edge" x1="568" y1="108" x2="606" y2="108" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="608" y="72" width="296" height="72" rx="8" />
      <text class="fg-m fg-ink" x="624" y="100">user.dic</text>
      <text class="fg-xs" x="624" y="124">{{ m.dic }}</text>
      <!-- runtime -->
      <rect class="fg-group" x="32" y="192" width="896" height="232" rx="8" />
      <text class="fg-lbl" x="56" y="220">{{ m.runtime }}</text>
      <line class="fg-edge" x1="756" y1="144" x2="756" y2="238" marker-end="url(#fg-a)" />
      <text class="fg-s" x="768" y="184">{{ m.pass }}</text>
      <rect class="fg-box" x="608" y="240" width="296" height="144" rx="8" />
      <template v-for="(l, i) in loaders" :key="i">
        <line v-if="i > 0" class="fg-rule" x1="624" :y1="248 + i * 32" x2="888" :y2="248 + i * 32" />
        <text class="fg-xs" x="624" :y="268 + i * 32">{{ l.who }}</text>
        <text class="fg-mxs fg-dim" x="696" :y="268 + i * 32">{{ l.api }}</text>
      </template>
      <line class="fg-edge" x1="608" y1="308" x2="570" y2="308" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="328" y="272" width="240" height="72" rx="8" />
      <text class="fg-t2" x="344" y="300">{{ m.check }}</text>
      <text class="fg-mxs" x="344" y="324">{{ m.checkSub }}</text>
      <polyline class="fg-edge" points="328,308 296,308" />
      <polyline class="fg-edge fg-edge--accent" points="296,308 296,268 266,268" marker-end="url(#fg-ac)" />
      <polyline class="fg-edge fg-edge--muted" points="296,308 296,364 266,364" marker-end="url(#fg-am)" />
      <rect class="fg-box fg-box--accent" x="56" y="232" width="208" height="72" rx="8" />
      <text class="fg-t2 fg-accent" x="72" y="260">{{ m.added }}</text>
      <text class="fg-xs" x="72" y="284">{{ m.addedSub }}</text>
      <rect class="fg-box fg-box--muted" x="56" y="328" width="208" height="72" rx="8" />
      <text class="fg-t2" x="72" y="356">{{ m.rejected }}</text>
      <text class="fg-xs" x="72" y="380">{{ m.rejectedSub }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
