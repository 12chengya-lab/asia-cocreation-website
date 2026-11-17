/*
 * 中文標題斷句：把標題切成「詞組」，換行時只在詞組之間斷開，
 * 避免「培訓計畫」變成「培」留在上一行、「訓計畫」掉到下一行。
 *
 * 用瀏覽器內建的 Intl.Segmenter 斷詞，再把它切得太碎的單字併回相鄰的詞：
 * - 詞尾字（力、班、者…）與連接詞（與、和、及…）併到前一個詞，所以「與」會留在行尾
 * - 其他單字（中、異、短、內…）併到後一個詞，例如「中｜高齡」→「中高齡」
 * - 英數字與緊接的中文併成一組（115年度、AI生成）；括號、標點跟著相鄰的詞走
 * 瀏覽器不支援 Intl.Segmenter 時，整段原樣輸出（維持瀏覽器預設換行）。
 */

export interface Phrase {
  text: string
  /** true＝這一組不可在中間換行；false＝空白等可換行處 */
  keep: boolean
}

/** Intl.Segmenter 的最小型別（專案的 TS lib 版本還沒收錄它） */
interface WordSegmenter {
  segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }>
}
type SegmenterCtor = new (locale: string, options: { granularity: 'word' }) => WordSegmenter

const Segmenter = (typeof Intl !== 'undefined' ? (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter : undefined)
const segmenter = Segmenter ? new Segmenter('zh-Hant', { granularity: 'word' }) : null

/** 通常接在詞後面的單字 */
const TAIL = new Set([...'力班者化性式型率感'])
/** 連接詞、助詞：留在前一個詞的行尾 */
const PARTICLE = new Set([...'與和及的並暨或'])
/** 常接在前一個詞後面、自己不單獨斷行的名詞：培訓｜計畫 → 培訓計畫 */
const TAIL_WORDS = new Set(['計畫', '計劃', '專案', '方案', '課程', '活動', '講座'])
const OPEN = new Set([...'（(「『《〈【“‘['])

const isCjk = (s: string) => /[㐀-鿿]/.test(s)
const endsAlnum = (s: string) => /[0-9A-Za-z]$/.test(s)

export function toPhrases(text: string): Phrase[] {
  if (!segmenter || !text) return [{ text, keep: false }]

  const out: Phrase[] = []
  /** 等著黏到「下一個詞」前面的單字或開括號 */
  let carry = ''
  /** 前一個片段是不是空白（空白之後不併回前一組） */
  let afterSpace = true

  const flushCarry = () => {
    if (carry) out.push({ text: carry, keep: true })
    carry = ''
  }
  const last = () => out[out.length - 1]

  for (const { segment, isWordLike } of segmenter.segment(text)) {
    if (/^\s+$/.test(segment)) {
      flushCarry()
      out.push({ text: segment, keep: false })
      afterSpace = true
      continue
    }

    if (!isWordLike) {
      // 標點或符號
      if (OPEN.has(segment)) {
        carry += segment
      } else if (!afterSpace && !carry && last()?.keep) {
        last()!.text += segment
      } else {
        flushCarry()
        out.push({ text: segment, keep: true })
      }
      afterSpace = false
      continue
    }

    const single = [...segment].length === 1 && isCjk(segment)

    if (single && (TAIL.has(segment) || PARTICLE.has(segment))) {
      // 詞尾字、連接詞：併到前一組（沒有可併的才自成一組）
      if (carry) {
        out.push({ text: carry + segment, keep: true })
        carry = ''
      } else if (!afterSpace && last()?.keep) {
        last()!.text += segment
      } else {
        out.push({ text: segment, keep: true })
      }
    } else if (single) {
      // 其他單字：等著黏到下一個詞前面
      carry += segment
    } else {
      const word = carry + segment
      carry = ''
      const prev = last()
      if (!afterSpace && prev?.keep && endsAlnum(prev.text) && !/^[0-9A-Za-z]/.test(word)) {
        prev.text += word // 115｜年度 → 115年度
      } else if (!afterSpace && !carry && prev?.keep && TAIL_WORDS.has(word) && [...prev.text].length >= 2) {
        prev.text += word // 培訓｜計畫 → 培訓計畫
      } else {
        out.push({ text: word, keep: true })
      }
    }
    afterSpace = false
  }
  flushCarry()
  return out
}
