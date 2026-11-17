/* =========================================================
   右下角 FAQ 小幫手「共創諮詢台」
   ※ 開場先請訪客選擇單位類型：政府／企業／學校，再優先列出相關問題。
   ※ 答案只寫網站上已經有的內容（服務項目、實務總覽的案例與數據、學習地圖、
     講師聯盟、聯絡資訊）。網站上沒有的資訊（費用、開班人數、時程等）
     一律請訪客前往「聯絡我們」，由專人回覆，不自行編寫。

   如何新增一題：
   - question：顯示在畫面上的問題
   - keywords：客戶可能會打的字（越多越容易被找到）
   - audience：只給哪一類單位看；留空代表三類都適用
   - pages：在這些頁面會優先推薦（填 route 名稱，例如 'cases'）
   - actions：答案下方的按鈕（站內路徑）
   - related：「你可能還想知道」要帶出的其他題目 id
   ========================================================= */

export type Audience = 'government' | 'enterprise' | 'academia'

export interface AudienceOption {
  key: Audience
  label: string
  /** 使用者點選後，對話中顯示的那句話 */
  says: string
  /** 洽詢表單預設帶入的需求（對應聯絡頁 ?topic=） */
  contactTopic: string
}

/** 開場的三個選項，依畫面順序：政府 → 企業 → 學校 */
export const audiences: AudienceOption[] = [
  { key: 'government', label: '政府單位', says: '我們是政府單位', contactTopic: 'training' },
  { key: 'enterprise', label: '企業', says: '我們是企業', contactTopic: 'training' },
  { key: 'academia', label: '學校', says: '我們是學校', contactTopic: 'academia' },
]

export interface FaqAction {
  label: string
  to: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  keywords: string[]
  audience?: Audience[]
  pages?: string[]
  actions?: FaqAction[]
  related?: string[]
  /** 內容尚待企業確認時設為 true，畫面會顯示「內容待確認」標記 */
  pending?: boolean
}

/** 網站上沒有答案時，統一導向聯絡我們的按鈕 */
const toContact: FaqAction = { label: '前往聯絡我們', to: '/contact' }

export const faqs: FaqItem[] = [
  /* ---------- 政府單位 ---------- */
  {
    id: 'government',
    question: '有承接政府計畫的經驗嗎？',
    answer:
      '有。例如協辦《大專女學生領導力培訓計畫》、執行新竹市「115 年度促進中高齡與婦女異業結盟行動計畫」，以及協助宜蘭在地農會與農民運用 AI 打造個人品牌與短影音行銷。',
    keywords: ['政府', '公部門', '標案', '委辦', '機關', '政府計畫', '經驗'],
    audience: ['government'],
    pages: ['cases'],
    actions: [{ label: '看政府計畫案例', to: '/cases' }],
    related: ['government-scope', 'process', 'lecturers'],
  },
  {
    id: 'government-scope',
    question: '政府計畫可以協助哪些工作？',
    answer:
      '可以從頭陪到尾：計畫規劃、課程設計、媒合合適的講師、執行授課，到最後的成果推廣。也可以只承接其中幾項。投標、委辦等行政細節，請透過「聯絡我們」洽詢。',
    keywords: ['協助', '規劃', '執行', '成果推廣', '工作內容', '負責', '投標', '委辦'],
    audience: ['government'],
    actions: [toContact],
    related: ['government', 'courses', 'process'],
  },
  {
    id: 'government-topics',
    question: '可以針對民眾或特定族群開課嗎？',
    answer:
      '可以。課程會依對象的背景與程度調整內容和節奏，例如青年、婦女、中高齡或在地產業工作者。請透過「聯絡我們」說明對象、人數與想達成的目標，我們再規劃合適的課程。',
    keywords: ['民眾', '族群', '婦女', '中高齡', '農民', '青年', '學員對象', '對象'],
    audience: ['government'],
    actions: [toContact],
    related: ['government', 'courses'],
  },

  /* ---------- 企業 ---------- */
  {
    id: 'custom-training',
    question: '可以依公司需求客製內訓課程嗎？',
    answer:
      '可以。我們提供客製化企業內訓，主題涵蓋設計思考、AI 工具應用與品牌行銷科技導入。例如為零售企業規劃以部門情境實作為主的 AI 轉型課程，內容包含 AI 治理、資安、內容行銷與數據分析。',
    keywords: ['客製', '內訓', '企業內訓', '員工', '需求', '規劃', '數位轉型'],
    audience: ['enterprise'],
    pages: ['home', 'about'],
    actions: [{ label: '提出內訓需求', to: '/contact?topic=training' }],
    related: ['enterprise-subsidy', 'courses', 'lecturers'],
  },
  {
    id: 'enterprise-subsidy',
    question: '企業內訓可以申請政府補助嗎？',
    answer:
      '我們曾協助零售企業申請經濟部商業發展署的企業專班補助，開設「AI 智慧零售與品牌行銷實戰班」。貴公司是否符合申請資格，請透過「聯絡我們」洽詢。',
    keywords: ['補助', '企業專班', '申請', '經濟部', '商業發展署', '政府補助'],
    audience: ['enterprise'],
    actions: [{ label: '洽詢補助申請', to: '/contact?topic=training' }],
    related: ['custom-training', 'pricing'],
  },
  {
    id: 'brand',
    question: '除了課程，還有品牌行銷相關服務嗎？',
    answer:
      '有。我們提供品牌行銷服務，協助梳理品牌定位與溝通策略，規劃公關專案與企業社會責任（CSR）活動；也提供品牌行銷顧問輔導，陪團隊釐清問題、規劃可執行的改善方向。',
    keywords: ['品牌', '行銷', '公關', 'csr', '社會責任', '顧問', '輔導'],
    audience: ['enterprise'],
    actions: [{ label: '洽詢品牌顧問', to: '/contact?topic=brand' }],
    related: ['services', 'custom-training'],
  },

  /* ---------- 學校 ---------- */
  {
    id: 'academia-how',
    question: '學校可以怎麼和亞洲共創合作？',
    answer:
      '我們會依校方的課程與計畫需求，結合學界與業界講師規劃培訓課程。例如銘傳大學「AI 生成 × MarTech 國際數位行銷人才實戰班」、玄奘大學「國際數位行銷暨社群經營人才培訓班」，以及結合 DISC 與 SEL 的「SEL 式個人品牌實踐之路」工作坊。',
    keywords: ['產學', '產學合作', '學校', '校方', '合作方式', '形式', '大學'],
    audience: ['academia'],
    pages: ['home', 'about', 'cases'],
    actions: [{ label: '看產學合作案例', to: '/cases' }],
    related: ['academia-funding', 'academia-cert', 'lecturers'],
  },
  {
    id: 'academia-funding',
    question: '可以搭配學校申請的政府補助計畫一起執行嗎？',
    answer:
      '可以。例如與銘傳大學傳播學院合作的政府補助計畫「青年 AI 實戰養成班」，以生活服務產業為場景，培養青年運用 AI 進行創意內容行銷。經費與核銷等細節，請透過「聯絡我們」提供計畫內容後討論。',
    keywords: ['計畫', '經費', '核銷', '補助', '申請', '教育部', '勞動部'],
    audience: ['academia'],
    actions: [{ label: '提供計畫內容', to: '/contact?topic=academia' }],
    related: ['academia-how', 'timeline'],
  },
  {
    id: 'academia-cert',
    question: '課程有搭配證照輔導嗎？',
    answer:
      '有些課程有。例如銘傳大學的「AI 生成 × MarTech 國際數位行銷人才實戰班」，結合生成式 AI 與 MarTech 六大領域，並輔導學員考取專業證照。其他課程能否搭配證照，請透過「聯絡我們」洽詢。',
    keywords: ['證照', '考照', '認證', '證書', '檢定'],
    audience: ['academia'],
    actions: [toContact],
    related: ['academia-how', 'courses'],
  },

  /* ---------- 三類都適用 ---------- */
  {
    id: 'services',
    question: '亞洲共創提供哪些服務？',
    answer:
      '我們有四大服務：教育培訓（企業內訓、政府計畫、產學合作）、講師經紀（講師媒合、課程與講座）、品牌行銷，以及品牌行銷顧問輔導。',
    keywords: ['服務', '業務', '做什麼', '項目', '提供', '介紹'],
    pages: ['home', 'about'],
    actions: [{ label: '認識我們', to: '/about' }],
    related: ['cases', 'process', 'lecturers'],
  },
  {
    id: 'cases',
    question: '有合作過哪些單位？',
    answer:
      '合作對象涵蓋政府計畫、產學合作與企業內訓。目前累積開課 1,026 堂、合作單位 34 個、合作講師 46 位、學員人數 51,460 名，案例都整理在「實務總覽」。',
    keywords: ['案例', '合作過', '做過', '案子', '實績', '經驗', '成果', '哪些單位', '客戶'],
    pages: ['cases'],
    actions: [{ label: '看實務總覽', to: '/cases' }],
    related: ['services', 'process'],
  },
  {
    id: 'courses',
    question: '有哪些課程主題？',
    answer:
      '課程把行銷工作拆成具體的練習，主題包含品牌行銷、內容發想與文案、社群經營、影音與視覺製作、數位廣告投放、行銷數據分析，以及用 AI 輔助行銷工作。',
    keywords: ['課程', '主題', '學習地圖', 'ai', '有什麼課', '行銷'],
    pages: ['learning-map'],
    actions: [{ label: '看學習地圖', to: '/learning-map' }],
    related: ['format', 'lecturers'],
  },
  {
    id: 'lecturers',
    question: '講師有哪些背景？可以指定講師嗎？',
    answer:
      '目前合作講師 46 位。可以在「講師聯盟」依專業領域（職涯探索、品牌行銷、自媒體經營、AI 應用、領導管理、溝通簡報、經營管理）、適合對象與授課形式搜尋。想指定講師或請我們推薦，請透過「聯絡我們」洽詢。',
    keywords: ['講師', '業師', '師資', '指定', '背景', '經歷', '推薦'],
    pages: ['home', 'lecturers'],
    actions: [{ label: '搜尋講師聯盟', to: '/lecturers' }, toContact],
    related: ['courses', 'format'],
  },
  {
    id: 'format',
    question: '有哪些上課形式？可以線上或到現場上課嗎？',
    answer:
      '授課形式包含演講、工作坊、系列課程與顧問輔導，教育培訓也會結合 OMO 學習平臺。實體、線上或到府上課的安排，請透過「聯絡我們」依需求討論。',
    keywords: ['到府', '到公司', '線上', '實體', '遠距', '上課地點', 'omo', '形式', '工作坊', '演講'],
    pages: ['learning-map', 'lecturers'],
    actions: [toContact],
    related: ['headcount', 'courses'],
  },
  {
    id: 'process',
    question: '合作流程是什麼？',
    answer: '合作分四個階段：需求了解 → 課程規劃 → 專案執行 → 成果回饋。第一步請先透過「聯絡我們」留下需求。',
    keywords: ['流程', '步驟', '怎麼合作', '如何合作', '階段', '怎麼開始'],
    actions: [toContact],
    related: ['timeline', 'report', 'contact'],
  },
  {
    id: 'pricing',
    question: '費用怎麼計算？',
    answer:
      '費用會依課程內容與需求而不同，網站上沒有公開價格。洽詢時若能提供上課對象、預計人數、時數或堂數，以及上課形式（實體／線上），專人就能更快提供報價。',
    keywords: ['費用', '報價', '價格', '預算', '收費'],
    pages: ['contact'],
    actions: [{ label: '索取報價', to: '/contact' }],
    related: ['headcount', 'timeline'],
  },
  {
    id: 'headcount',
    question: '最少要多少人才能開班？',
    answer:
      '人數門檻會依課程類型而不同，例如演講和工作坊、系列課程的適合人數就不一樣。請在「聯絡我們」填寫預計人數與上課對象，專人會建議合適的形式。',
    keywords: ['人數', '開班', '最少', '幾人', '幾個人', '多少人', '門檻'],
    actions: [toContact],
    related: ['pricing', 'format'],
  },
  {
    id: 'timeline',
    question: '從洽談到開課大概要多久？',
    answer:
      '時間主要取決於客製程度與講師檔期：直接採用既有課程較快，需要重新設計內容或配合計畫期程則需要多一些時間。建議一有開課想法就先告知預計的開課期間，方便預留講師。',
    keywords: ['多久', '時程', '期程', '檔期', '什麼時候', '開課'],
    actions: [toContact],
    related: ['process', 'pricing'],
  },
  {
    id: 'report',
    question: '課程結束後有成效回饋嗎？',
    answer: '有。課程結束後會進行成果回饋。如果貴單位有指定的成效指標或結案格式，請在洽談時提出，我們會納入規劃。',
    keywords: ['成效', '回饋', '報告', '滿意度', '評估', '結案'],
    actions: [toContact],
    related: ['process', 'cases'],
  },
  {
    id: 'contact',
    question: '要怎麼聯絡你們？',
    answer:
      '可以在「聯絡我們」填寫表單，或來電 02-2704-2040、來信 asia.alliance2020@gmail.com。服務時間為每週一至五 09:00–18:00（12:00–13:00 午休）。',
    keywords: ['聯絡', '洽談', '洽詢', '聯繫', '電話', '信箱', 'email', '窗口', '地址', '服務時間'],
    pages: ['contact'],
    actions: [toContact],
    related: ['process', 'pricing'],
  },
]

/**
 * 同義詞：同一組裡的字視為同一個意思。
 * 客戶打「多少錢」，會同時找含「費用」「報價」的題目。
 */
export const synonyms: string[][] = [
  ['費用', '價格', '價錢', '報價', '多少錢', '預算', '收費', '費率', '怎麼算'],
  ['內訓', '教育訓練', '員工培訓', '企業培訓', '員工訓練', '企業內訓'],
  ['產學', '產學合作', '學校', '大學', '大專', '校方', '學研', '系所', '校園'],
  ['講師', '業師', '老師', '師資', '講者'],
  ['多久', '多長', '時程', '期程', '檔期', '什麼時候', '幾週', '幾個月'],
  ['線上', '遠距', '視訊', '網路課程', '實體', '到府', '到公司', '混成', 'omo'],
  ['人數', '多少人', '幾人', '幾個人', '開班', '最少', '門檻'],
  ['聯絡', '洽談', '洽詢', '聯繫', '詢問', '電話', '信箱', 'email', 'mail', '窗口', '找誰'],
  ['案例', '實績', '經驗', '合作過', '做過', '案子', '成果', '客戶', '哪些單位'],
  ['政府', '公部門', '標案', '委辦', '機關', '公所', '縣市政府'],
  ['補助', '經費', '核銷', '企業專班'],
  ['品牌', '行銷', '公關', 'csr', '社會責任'],
  ['流程', '步驟', '怎麼合作', '如何合作', '怎麼開始', '如何開始'],
  ['客製', '量身', '訂製', '依需求', '專屬'],
  ['課程', '主題', '學習地圖', '有什麼課'],
  ['成效', '回饋', '報告', '滿意度', '評估', '結案'],
  ['證照', '考照', '認證', '證書', '檢定'],
  ['民眾', '族群', '婦女', '中高齡', '農民', '青年'],
]

/** 依所在頁面變換的開場白（key 為 route 名稱） */
export const pageGreetings: Record<string, string> = {
  home: '想了解亞洲共創能為貴單位做些什麼嗎？',
  about: '想更認識我們的服務嗎？',
  lecturers: '在找合適的講師嗎？也可以直接請我們推薦。',
  'learning-map': '正在找適合的課程主題嗎？',
  cases: '想看看和貴單位類似的合作經驗嗎？',
  'case-detail': '對這類合作有興趣嗎？',
  contact: '洽談前，可以先看看大家常問的問題。',
}

export const faqCopy = {
  /** 小幫手名稱：視窗標題、水滴按鈕的提示文字 */
  title: '共創諮詢台',
  subtitle: '亞洲共創學院',
  /** 水滴旁的提示泡泡（按 ✕ 或打開小幫手後，這次瀏覽就不再出現；不寫入瀏覽器，下次進站會再出現） */
  hintTitle: '有合作上的疑問嗎？',
  hintText: '政府計畫、企業內訓、產學合作都可以在這裡詢問。',
  hintClose: '關閉提示',
  askAudience: '請問您代表哪一類單位？我會優先列出相關的問題。',
  skipAudience: '先隨意看看',
  afterAudience: (label: string) => `了解！以下是${label}最常詢問的問題：`,
  afterSkip: '沒問題，以下是大家最常詢問的問題：',
  welcomeBack: (label: string) => `歡迎回來！我會優先列出${label}相關的問題。`,
  placeholder: '輸入關鍵字，例如：費用、講師、補助',
  related: '你可能還想知道',
  fallback: '這題網站上還沒有說明，建議直接聯絡我們，由專人回覆。你想問的也可能是：',
  fallbackEmpty: '這題網站上還沒有說明，建議直接聯絡我們，由專人回覆。',
  fallbackContact: '前往聯絡我們',
  switchAudience: '切換單位類型',
  pendingNote: '內容待確認',
}
