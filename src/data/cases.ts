/* =========================================================
   案例資料
   ※ 案例內容平常改 Google 試算表「亞創網站｜講師與案例」的「案例」分頁即可，
     網址設定在 src/data/sheets.ts。本檔是讀不到試算表時的「內建備用資料」。
   ※ 試算表 sample 欄填「是」的示意案例不會顯示在網站上；補好內容後改成「否」即可出現。
   ※ 目前尚未提供實際案例，以下全部為「示意內容／待補案例」。
     取得真實案例後，請替換 title / excerpt / image，並將 placeholder 改為 false。
     image 請放在 public/cases/，填入路徑例如 '/cases/case-01.jpg'。
   ========================================================= */

/**
 * 案例分類代號。內建三類用固定英文代號（網址、圖示、配色用）；
 * 在試算表「選項」分頁新增的分類，代號就是分類名稱本身（例如「社區活動」）。
 */
export type CaseCategory = string

/** 內建的三個分類：代號 → 名稱（試算表「選項」分頁讀不到時，分類頁籤用這三個） */
export const categoryLabel: Record<string, string> = {
  government: '政府計畫',
  academia: '產學合作',
  enterprise: '企業內訓',
}

/** 內建分類名稱（依顯示順序），作為「選項」分頁讀不到時的備用清單 */
export const defaultCaseCategories = Object.values(categoryLabel)

const keyByLabel: Record<string, string> = Object.fromEntries(
  Object.entries(categoryLabel).map(([key, label]) => [label, key]),
)

/** 分類名稱 → 代號：內建三類回傳英文代號，其他分類代號就是名稱本身；也接受直接填英文代號 */
export function categoryKey(labelOrKey: string) {
  const text = labelOrKey.trim()
  return keyByLabel[text] ?? text
}

/** 分類代號 → 顯示名稱 */
export function categoryName(key: CaseCategory) {
  return categoryLabel[key] ?? key
}

export interface CaseItem {
  id: string
  category: CaseCategory
  title: string
  excerpt: string
  /** 封面：列表卡片與首頁使用，也是詳情頁輪播的第一張 */
  image: string
  imageAlt: string
  /** 詳情頁輪播的其他照片（選填；試算表「案例」分頁的 gallery 欄位，一格多張） */
  gallery?: string[]
  /** 案例詳情頁三個區塊；未填時顯示「待補」 */
  background?: string
  execution?: string
  result?: string
  /** 合作單位、日期（選填） */
  partner?: string
  date?: string
  /** true＝示意資料，畫面會顯示「示意內容／待補案例」 */
  placeholder: boolean
}

const PLACEHOLDER_EXCERPT = '示意內容：此處將說明合作背景、執行內容與成果，待提供實際案例後替換。'

function placeholderCase(id: string, category: CaseCategory, index: number): CaseItem {
  return {
    id,
    category,
    title: `${categoryLabel[category]}案例標題（待補 ${index}）`,
    excerpt: PLACEHOLDER_EXCERPT,
    image: '',
    imageAlt: `${categoryLabel[category]}案例示意圖片`,
    placeholder: true,
  }
}

export const cases: CaseItem[] = [
  placeholderCase('gov-01', 'government', 1),
  placeholderCase('aca-01', 'academia', 1),
  placeholderCase('ent-01', 'enterprise', 1),
  placeholderCase('gov-02', 'government', 2),
  placeholderCase('aca-02', 'academia', 2),
  placeholderCase('ent-02', 'enterprise', 2),
  placeholderCase('gov-03', 'government', 3),
  placeholderCase('aca-03', 'academia', 3),
  placeholderCase('ent-03', 'enterprise', 3),
]
