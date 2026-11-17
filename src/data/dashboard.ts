/* =========================================================
   成果 Dashboard（實務總覽頁副標下方橫排的四格數據）
   ※ 數字由亞洲共創提供，依陣列順序由左到右排列。
     數字更新時修改 value；要顯示「+」可把 suffix 改成 '+'（目前不顯示）。
   ========================================================= */

export interface Kpi {
  key: string
  label: string
  value: number
  suffix: string
  unit: string
}

export const kpis: Kpi[] = [
  { key: 'courses', label: '累積開課', value: 1026, suffix: '', unit: '堂' },
  { key: 'partners', label: '合作單位', value: 34, suffix: '', unit: '個' },
  { key: 'teachers', label: '合作講師', value: 48, suffix: '', unit: '位' },
  { key: 'learners', label: '學員人數', value: 51460, suffix: '', unit: '名' },
]

/**
 * 給其他頁面的文案引用的數字，例如 kpiText('teachers') → '48 位'。
 * 全站提到開課、合作單位、講師、學員數量時都用這裡，改上面的 value 就會一起更新。
 */
export function kpiText(key: Kpi['key']) {
  const k = kpis.find((item) => item.key === key)
  return k ? `${k.value.toLocaleString('en-US')}${k.suffix} ${k.unit}` : ''
}
