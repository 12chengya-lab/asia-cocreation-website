/* =========================================================
   Google 試算表資料來源（偽後端）
   - 各分頁在 Google 試算表「檔案 → 共用 → 發布到網路」，
     格式選「逗號分隔值 (.csv)」，把產生的網址貼在下面。
     新增分頁後，也要到「發布到網路 → 已發布的內容與設定」勾選該分頁。
   - 留空字串＝不讀試算表，直接使用 src/data/lecturers.ts、cases.ts、news.ts、trends.ts 的內建資料。
   - 讀取失敗（網路問題、取消發布）時，網站也會自動改用內建資料。
   - Google 發布有約 5 分鐘快取：試算表改完後，網站最晚約 5 分鐘更新。
   ========================================================= */

/** 試算表：Google 雲端硬碟「亞創網站｜講師 案例 熱門課程 趨勢專欄」（12chengya@gmail.com 帳號） */
const PUBLISHED =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLRXPluOYb6dkYujrL21_ThLPLixCIBYucxzkhUpjDCFI4BX49zqhexvo8IQp5hIRE0OJ_Mmaxau1u/pub'

export const sheetSources = {
  /** 「講師」分頁的 CSV 網址 */
  lecturers: `${PUBLISHED}?gid=257039300&single=true&output=csv`,
  /** 「案例」分頁的 CSV 網址 */
  cases: `${PUBLISHED}?gid=566498071&single=true&output=csv`,
  /**
   * 「熱門課程」分頁：首頁主視覺與實務總覽頁的輪播（最多 5 則）
   * 欄位：show, order, date, tag, title, summary, cover, coverAlt, link, linkLabel
   */
  news: `${PUBLISHED}?gid=214109049&single=true&output=csv`,
  /**
   * 「趨勢專欄」分頁：文章列表與內頁
   * 欄位：id, show, order, date, category, title, excerpt, cover, coverAlt, content, author, link
   */
  trends: `${PUBLISHED}?gid=2118029015&single=true&output=csv`,
  /**
   * 「培訓案例」分頁：學習地圖頁「讓學習走進真實的工作情境」的案例卡片
   * 欄位：show, order, year, school, course, desc, more, image, imageAlt（說明見 src/data/about.ts 的 aboutCases）
   */
  training: `${PUBLISHED}?gid=278622249&single=true&output=csv`,
  /**
   * 「關於亞創輪播」分頁：關於亞創「從自媒體課堂開始的學習旅程」右側的照片輪播（一列一張照片）
   * 欄位：show, order, photo, caption
   * ※ 留空字串＝使用 src/data/about.ts 的 aboutOrigin.photo；沒有任何照片時也會用它
   */
  originPhotos: `${PUBLISHED}?gid=2135969155&single=true&output=csv`,
  /** 「設定」分頁：欄位 key, value（目前有 newsSort：熱門課程超過 5 則時依「排序數字」或「日期最新」取捨） */
  settings: `${PUBLISHED}?gid=1355113418&single=true&output=csv`,
}

/**
 * 「聯絡我們」表單送出網址：試算表的 Apps Script 網頁應用程式（…/exec）
 * - 程式碼與安裝步驟：docs/contact-form-apps-script.gs
 * - 資料寫入另一份私人試算表「亞創網站｜聯絡表單紀錄（含個資，請勿公開）」，與網站內容分開
 * - 留空字串＝表單維持「展示版本」，只檢查欄位、不送出
 */
export const contactFormEndpoint =
  'https://script.google.com/macros/s/AKfycbzlm62hoA-3pT-mq3PO2qgB0S7vLVAG5GlL7StUbROWQ9GUqmEY6Py1R46XmwxQ6yaR/exec'
