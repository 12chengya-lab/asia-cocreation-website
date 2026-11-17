# 亞洲共創學院 官方網站

Vue 3 + Vite + TypeScript 製作的響應式官方網站。

## 啟動方式

需先安裝 Node.js（建議 LTS 版本）。

```bash
npm install      # 安裝套件（首次）
npm run dev      # 開發模式，瀏覽 http://localhost:5173
npm run build    # 產出正式檔案至 dist/
npm run preview  # 預覽 dist/ 正式版本
npm run typecheck
```

## 部署

網站使用 History 模式路由，部署時必須把所有路徑導回 `index.html`。
專案已附 `vercel.json`（`/(.*)` 改寫到 `/index.html`），可直接部署到 Vercel；
其他主機請自行設定，例如 Netlify 的 `_redirects`、Nginx 的 `try_files $uri /index.html`。

## 頁面

| 路徑 | 頁面 |
| --- | --- |
| `/` | 首頁 |
| `/about` | 關於亞創 |
| `/lecturers` | 講師聯盟 |
| `/trends`、`/trends/:id` | 趨勢專欄、文章內頁 |
| `/learning-map` | 學習地圖 |
| `/cases`、`/cases/:id` | 實務總覽、案例詳情 |
| `/contact` | 聯絡我們 |

各頁的 SEO 標題與描述在 `src/data/site.ts` 的 `pageMeta`。

## 專案結構

```
src/
├─ data/              ← 文案與內建資料
│  ├─ site.ts         品牌名稱、Logo 路徑、導覽、聯絡資訊、各頁 SEO
│  ├─ sheets.ts       Google 試算表網址、聯絡表單送出網址
│  ├─ home.ts         首頁各區塊文案
│  ├─ about.ts        關於亞創頁文案（學習旅程、課程發展歷程、培訓案例等）
│  ├─ dashboard.ts    成果數據（累積開課、合作單位、合作講師、學員人數）
│  ├─ services.ts     三大服務項目
│  ├─ lecturers.ts    講師聯盟內建備用資料
│  ├─ cases.ts        案例內建備用資料與分類
│  ├─ news.ts         熱門課程輪播內建備用資料
│  ├─ trends.ts       趨勢專欄分類與型別
│  ├─ partners.ts     合作單位 Logo（首頁 Logo 牆）
│  ├─ courseMap.ts    學習地圖頁（七大主題）文案與圖示
│  └─ faq.ts          右下角 FAQ 小幫手「共創諮詢台」的問答
├─ styles/
│  ├─ tokens.css      品牌主題色、字體、圓角、間距（修改此檔即可統一調整視覺）
│  └─ base.css        全站基礎樣式、按鈕、捲動淡入動畫
├─ components/        版面元件（導覽列、首頁各區塊、輪播、FAQ 小幫手、頁尾…）
│  └─ about/          關於亞創頁的各區塊
├─ views/             各頁面
├─ composables/       共用邏輯（sheetData.ts 讀取試算表、faqSearch.ts、motion.ts…）
├─ router.ts          路由與頁面標題
└─ main.ts
public/               靜態檔案（brand/ 品牌圖、partners/ 合作單位 Logo、favicon、og-image）
docs/                 contact-form-apps-script.gs、content-sheet-template.xlsx
```

## 用 Google 試算表管理內容

講師、案例、熱門課程、趨勢專欄、培訓案例與關於頁照片輪播由 Google 試算表管理。
試算表改完後約 5 分鐘內，網站自動更新，不需要重新部署。

| 試算表分頁 | 用在哪裡 | 內建備用資料 |
| --- | --- | --- |
| 講師 | 講師聯盟（首頁與 `/lecturers`） | `src/data/lecturers.ts` |
| 案例 | 實務總覽與案例詳情 | `src/data/cases.ts` |
| 熱門課程 | 首頁主視覺與實務總覽頁頁首的輪播（最多 5 則） | `src/data/news.ts` |
| 趨勢專欄 | 趨勢專欄列表與文章內頁 | 無（沒有文章時顯示「建置中」） |
| 培訓案例 | 學習地圖頁的培訓案例卡片 | `src/data/about.ts` 的 `aboutCases` |
| 關於亞創輪播 | 關於亞創頁「從自媒體課堂開始的學習旅程」照片輪播 | `src/data/about.ts` 的 `aboutOrigin.photo` |
| 選項 | 講師篩選按鈕（專業領域、適合對象、授課形式）與案例分類頁籤的選項和順序；在這裡新增選項，網站就會出現，不用改程式 | `src/data/lecturers.ts`、`src/data/cases.ts` 的內建清單 |
| 設定 | 目前有 `newsSort`：熱門課程超過 5 則時，依「排序數字」或「日期最新」取捨 | — |

- 連接設定：`src/data/sheets.ts`。每個分頁都要在試算表「檔案 → 共用 → 發布到網路」以 CSV 格式發布，並把網址填進 `sheetSources`。新增分頁後，也要到「已發布的內容與設定」勾選該分頁。
- 網址留空，或讀取失敗（網路問題、取消發布）時，網站自動改用上表的內建備用資料。
- 只顯示 `show` 欄為「是」的列。講師與案例分頁的 `sample` 欄填「是」的示意資料不會顯示，補好內容後改成「否」即可出現。
- 讀取程式：`src/composables/sheetData.ts`。
- 試算表範本：`docs/content-sheet-template.xlsx`；欄位與填寫規則見試算表的「使用說明」分頁。
- 圖片：上傳到雲端硬碟的圖片資料夾，把分享連結貼到 `photo`、`cover`、`image` 等欄位。

## 聯絡表單

聯絡我們頁的表單，資料會透過 Google Apps Script 網頁應用程式寫入另一份私人試算表，與公開的網站內容分開存放。

- 送出網址：`src/data/sheets.ts` 的 `contactFormEndpoint`；留空時表單維持展示模式，只檢查欄位、不送出資料。
- Apps Script 程式碼與重新安裝步驟：`docs/contact-form-apps-script.gs`。
- 紀錄試算表含個資，請勿公開。

## 如何更新資料

| 項目 | 檔案 | 做法 |
| --- | --- | --- |
| Logo | `src/data/site.ts` | `markSrc` 是圖示，`navLogoSrc` 是導覽列 Logo，檔案放在 `public/brand/`。若取得圖文一體的完整 Logo，填入 `logoSrc`（例如 `/brand/logo.svg`），會取代圖示加文字的組合 |
| 聯絡資訊 | `src/data/site.ts` | 修改 `contact` 的 phone / email / address / hours；電話撥號連結 `phoneHref` 與信箱連結 `contactFields` 需一併更新；地圖依地址自動產生；空字串會顯示「待補」 |
| 成果數據 | `src/data/dashboard.ts` | 修改 `kpis` 的 `value`；其他頁面引用數字的文案會一起更新（`kpiText`）；要顯示「+」可把 `suffix` 改成 `'+'` |
| 合作單位 | `src/data/partners.ts` | Logo 放到 `public/partners/`，在清單加入編號與名稱；桌面每排 7 個、平板 5 個、手機 3 個 |
| 三大服務 | `src/data/services.ts` | 修改服務名稱與簡介 |
| 首頁文案 | `src/data/home.ts` | 修改各區塊文案 |
| 關於亞創 | `src/data/about.ts` | 修改學習旅程、課程發展歷程等文案 |
| 學習地圖 | `src/data/courseMap.ts` | 修改七大主題的文案與圖示 |
| FAQ 小幫手 | `src/data/faq.ts` | 新增問題、關鍵字與推薦頁面；答案只寫網站上已有的內容，其餘導向「聯絡我們」 |
| 品牌色 | `src/styles/tokens.css` | 調整 `--c-yellow`、`--c-gray` 等變數 |
| 分享圖與網站圖示 | `public/` | `og-image.jpg`（社群分享圖）、`favicon.png`、`apple-touch-icon.png` |

## 注意事項

- `src/data/` 中的講師、案例等「內建備用資料」只在讀不到試算表時使用，平常請改試算表。
- 聯絡資訊中的電話來自第三方公開電話簿，尚未取得公司直接確認；請勿自行增加未經提供的聯絡資料。
- 網站數據與文案以企業提供的資料為準，未取得的資料請留空（畫面顯示「待補」），不要自行編寫。
