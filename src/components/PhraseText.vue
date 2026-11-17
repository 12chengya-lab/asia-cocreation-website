<script setup lang="ts">
/*
 * 依詞組換行的文字：只在詞與詞之間斷行（斷詞規則見 utils/phrases.ts）。
 * 用在可能換成兩行的中文標題，例如案例名稱。
 */
import { computed } from 'vue'
import { toPhrases } from '@/utils/phrases'

const props = defineProps<{ text: string }>()
const phrases = computed(() => toPhrases(props.text))
</script>

<template>
  <template v-for="(p, i) in phrases" :key="i"><span v-if="p.keep" class="phrase">{{ p.text }}</span><template v-else>{{ p.text }}</template></template>
</template>

<style scoped>
.phrase {
  display: inline-block;
}
</style>
