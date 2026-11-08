<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const m = computed(() =>
  isJa()
    ? {
        head: '直すのは規則で、期待値ではない',
        title:
          'test_show で Suzume の出力と期待値を比べ、一致すれば test_add で登録する。Suzume が誤りならトークナイザーの規則を直してリビルドし、期待値が誤りなら正規化規則を直して test_needs_suzume_update で同期し、どちらも test_show に戻る。',
        showSub: 'Suzume と期待値を比べる',
        match: '期待値と一致',
        addSub: '回帰ケースとして登録',
        suzumeWrong: '出力が誤り',
        expectedWrong: '期待値が誤り',
        fixTokenizer: 'トークナイザーの規則を直す',
        rebuild: 'リビルド',
        fixNorm: '正規化規則を直す',
        recheck: 'test_show で再確認',
        caption:
          '期待値は正規化パイプラインだけが決めます。正規化規則の変更はリビルドなしで反映されますが、既存のフィクスチャは test_needs_suzume_update で同期するまで古いままです。',
      }
    : {
        head: 'Fix the rule, never the expectation',
        title:
          'test_show compares Suzume with the expected tokens; on a match, test_add registers the case. If Suzume is wrong, fix the tokenizer rule and rebuild; if the expectation is wrong, fix the normalization rule and sync with test_needs_suzume_update. Both paths return to test_show.',
        showSub: 'Suzume vs expected tokens',
        match: 'matches expected',
        addSub: 'register the regression case',
        suzumeWrong: 'Suzume wrong',
        expectedWrong: 'expected wrong',
        fixTokenizer: 'Fix the tokenizer rule',
        rebuild: 'Rebuild',
        fixNorm: 'Fix the normalization rule',
        recheck: 'check again with test_show',
        caption:
          'Only the normalization pipeline decides an expectation. A normalization change takes effect without a rebuild, but existing fixtures keep the old expectation until test_needs_suzume_update syncs them.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fixture-loop-title" viewBox="0 0 960 472" xmlns="http://www.w3.org/2000/svg">
      <title id="fixture-loop-title">{{ m.title }}</title>
      <!-- tokenizer fix loop -->
      <polyline class="fg-edge" points="216,208 216,116 358,116" marker-end="url(#fg-a)" />
      <text class="fg-s" x="288" y="106" text-anchor="middle">{{ m.suzumeWrong }}</text>
      <rect class="fg-box" x="360" y="80" width="248" height="72" rx="8" />
      <text class="fg-t2" x="376" y="108">{{ m.fixTokenizer }}</text>
      <text class="fg-mxs" x="376" y="132">src/</text>
      <line class="fg-edge" x1="608" y1="116" x2="646" y2="116" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="648" y="80" width="264" height="72" rx="8" />
      <text class="fg-t2" x="664" y="108">{{ m.rebuild }}</text>
      <text class="fg-mxs" x="664" y="132">cmake --build build</text>
      <polyline class="fg-edge fg-edge--muted" points="780,80 780,48 104,48 104,206" marker-end="url(#fg-am)" />
      <text class="fg-xs" x="442" y="38" text-anchor="middle">{{ m.recheck }}</text>
      <!-- main path -->
      <rect class="fg-box" x="56" y="208" width="232" height="72" rx="8" />
      <text class="fg-m fg-ink" x="72" y="236">test_show</text>
      <text class="fg-xs" x="72" y="260">{{ m.showSub }}</text>
      <line class="fg-edge fg-edge--accent" x1="288" y1="244" x2="646" y2="244" marker-end="url(#fg-ac)" />
      <text class="fg-s fg-accent" x="468" y="234" text-anchor="middle">{{ m.match }}</text>
      <rect class="fg-box fg-box--accent" x="648" y="208" width="264" height="72" rx="8" />
      <text class="fg-m fg-accent" x="664" y="236">test_add</text>
      <text class="fg-xs" x="664" y="260">{{ m.addSub }}</text>
      <!-- normalization fix loop -->
      <polyline class="fg-edge" points="216,280 216,372 358,372" marker-end="url(#fg-a)" />
      <text class="fg-s" x="288" y="362" text-anchor="middle">{{ m.expectedWrong }}</text>
      <rect class="fg-box" x="360" y="336" width="248" height="72" rx="8" />
      <text class="fg-t2" x="376" y="364">{{ m.fixNorm }}</text>
      <text class="fg-mxs" x="376" y="388">suzume_mcp/core/</text>
      <line class="fg-edge" x1="608" y1="372" x2="646" y2="372" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="648" y="336" width="264" height="72" rx="8" />
      <text class="fg-m fg-ink" x="664" y="364">test_needs_suzume_update</text>
      <text class="fg-mxs" x="664" y="388">apply=True</text>
      <polyline class="fg-edge fg-edge--muted" points="780,408 780,440 104,440 104,282" marker-end="url(#fg-am)" />
      <text class="fg-xs" x="442" y="430" text-anchor="middle">{{ m.recheck }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
