import { computed, shallowRef, type ShallowRef } from 'vue'
import { sheetSources } from '@/data/sheets'
import { lecturers as localLecturers, type Lecturer } from '@/data/lecturers'
import { cases as localCases, categoryLabel, type CaseCategory, type CaseItem } from '@/data/cases'
import { localNews, NEWS_LIMIT, type NewsItem, type NewsSort } from '@/data/news'
import { localArticles, type Article } from '@/data/trends'
import { aboutCases, type AboutCase } from '@/data/about'

/**
 * 從 Google 試算表（發布為 CSV）讀取講師、案例、熱門課程、趨勢專欄、培訓案例與設定。
 * - 第 1 列是欄位代號（英文），程式靠它對應資料，欄位順序可以任意調換
 * - 第一格以「#」開頭的列會略過（範本第 2 列的中文說明就是這樣標的）
 * - 讀不到時改用內建資料，網站不會變空白
 */

type Row = Record<string, string>
type Status = 'loading' | 'sheet' | 'local'

/** 快取超過這個時間，就在背景向試算表要新資料（Google 發布本身也有約 5 分鐘快取） */
const CACHE_MS = 5 * 60 * 1000
/** 快取最多保留多久；更舊的資料不拿來先顯示，直接等新資料 */
const STALE_MAX_MS = 7 * 24 * 60 * 60 * 1000
const TIMEOUT_MS = 8000

/* ---------- CSV ---------- */

/** RFC 4180 CSV：支援引號、引號內的逗號與換行 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const s = text.replace(/^﻿/, '')

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function toRows(text: string): Row[] {
  const [header, ...body] = parseCsv(text)
  if (!header) return []
  const keys = header.map((h) => h.trim())
  return body
    .filter((cells) => cells.some((c) => c.trim()) && !cells[0]?.trim().startsWith('#'))
    .map((cells) => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? '').trim()])))
}

/* ---------- 欄位轉換 ---------- */

const YES = ['是', 'y', 'yes', 'true', '1', 'v', '✓', '✔', '顯示']
const NO = ['否', 'n', 'no', 'false', '0', '隱藏']

function bool(value: string | undefined, fallback: boolean) {
  const v = (value ?? '').trim().toLowerCase()
  if (YES.includes(v)) return true
  if (NO.includes(v)) return false
  return fallback
}

/** 一格多個值：用「、」「,」「，」「;」或換行分隔 */
const list = (value = '') => value.split(/[、,，;；\n]+/).map((s) => s.trim()).filter(Boolean)
/** 一格多行：每行一項（經歷等內容本身可能含逗號，只用換行分隔） */
const lines = (value = '') => value.split(/\n+/).map((s) => s.trim()).filter(Boolean)

/**
 * 圖片網址：Google 雲端硬碟的分享連結轉成可直接顯示的圖片網址；
 * 其他 https 網址或站內路徑（/ 開頭）原樣使用，其餘一律忽略。
 */
export function imageUrl(raw = '') {
  const url = raw.trim()
  if (!url) return ''
  if (/^https?:\/\/(drive|docs)\.google\.com\//.test(url)) {
    const id = url.match(/\/d\/([\w-]{20,})/)?.[1] ?? url.match(/[?&]id=([\w-]{20,})/)?.[1]
    // 直接用 Google 的圖片主機：不經轉址、不受訪客的 Google 登入狀態影響（需「知道連結的人可檢視」）
    return id ? `https://lh3.googleusercontent.com/d/${id}=w1600` : ''
  }
  return /^https:\/\//.test(url) || url.startsWith('/') ? url : ''
}

function byOrder<T>(items: { order: number; index: number; item: T }[]) {
  return items.sort((a, b) => a.order - b.order || a.index - b.index).map((x) => x.item)
}

const orderOf = (v: string | undefined, index: number) => {
  const n = Number(v)
  return Number.isFinite(n) && v !== '' ? n : 10_000 + index
}

function toLecturers(rows: Row[]): Lecturer[] {
  const out = rows
    .map((r, index) => {
      if (!bool(r.show, true) || !r.name) return null
      const fields = list(r.fields)
      const field = r.field || fields[0] || ''
      const item: Lecturer = {
        id: r.id || `row-${index + 1}`,
        name: r.name,
        title: r.title,
        field,
        fields: fields.length ? fields : field ? [field] : [],
        audiences: list(r.audiences),
        formats: list(r.formats),
        photo: imageUrl(r.photo),
        bio: r.bio,
        experience: lines(r.experience),
        topics: list(r.topics),
        featured: bool(r.featured, false),
        placeholder: bool(r.sample, false),
      }
      return { order: orderOf(r.order, index), index, item }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
  return byOrder(out)
}

const categoryByLabel: Record<string, CaseCategory> = Object.fromEntries(
  Object.entries(categoryLabel).flatMap(([key, label]) => [
    [label, key as CaseCategory],
    [key, key as CaseCategory],
  ]),
)

function toCases(rows: Row[]): CaseItem[] {
  const out = rows
    .map((r, index) => {
      if (!bool(r.show, true) || !r.title) return null
      // sample 欄為「是」的示意案例不對外顯示，補好內容並改成「否」後才會出現
      if (bool(r.sample, false)) return null
      const category = categoryByLabel[r.category?.trim()]
      if (!category) {
        console.warn(`[試算表] 案例「${r.title}」的分類「${r.category}」無法辨識，已略過`)
        return null
      }
      const item: CaseItem = {
        id: (r.id || `case-${index + 1}`).replace(/[^\w-]/g, '-'),
        category,
        title: r.title,
        excerpt: r.excerpt,
        image: imageUrl(r.cover),
        imageAlt: r.coverAlt || r.title,
        gallery: list(r.gallery).map(imageUrl).filter(Boolean),
        background: r.background,
        execution: r.execution,
        result: r.result,
        partner: r.partner,
        date: r.date,
        placeholder: bool(r.sample, false),
      }
      return { order: orderOf(r.order, index), index, item }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
  return byOrder(out)
}

/** 連結：站內路徑（/ 開頭）或 https 網址，其餘忽略 */
const linkUrl = (raw = '') => {
  const url = raw.trim()
  return url.startsWith('/') || /^https:\/\//.test(url) ? url : ''
}

/**
 * 日期：接受 2026/11/10、2026-11-10、2026.11.10、2026年11月10日（日可省略）。
 * 回傳顯示用文字（可辨識時統一成 2026.11.10）與排序用時間戳（無法辨識時為 NaN）。
 */
export function parseDate(raw = '') {
  const text = raw.trim()
  const m = text.match(/^(\d{4})\s*[/.\-年]\s*(\d{1,2})\s*(?:月\s*(?:(\d{1,2})\s*日?)?|[/.\-]\s*(\d{1,2}))?$/)
  if (!m) return { label: text, time: NaN }
  const day = m[3] ?? m[4]
  const [y, mo, d] = [Number(m[1]), Number(m[2]), day ? Number(day) : 1]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return { label: text, time: NaN }
  const pad = (n: number) => String(n).padStart(2, '0')
  return { label: day ? `${y}.${pad(mo)}.${pad(d)}` : `${y}.${pad(mo)}`, time: Date.UTC(y, mo - 1, d) }
}

/** 日期新的在前；沒有日期的排最後 */
const byNewest = (a: number, b: number) => (Number.isNaN(a) ? 1 : 0) - (Number.isNaN(b) ? 1 : 0) || (b || 0) - (a || 0)

function toNews(rows: Row[]) {
  return rows
    .map((r, index) => {
      if (!bool(r.show, true) || !r.title) return null
      const { label, time } = parseDate(r.date)
      const item: NewsItem = {
        tag: r.tag,
        title: r.title,
        summary: r.summary,
        cover: imageUrl(r.cover),
        coverAlt: r.coverAlt || r.title,
        date: label,
        time,
        link: linkUrl(r.link),
        linkLabel: r.linkLabel || '查看詳情',
      }
      return { order: orderOf(r.order, index), index, item }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
}

/** 依設定挑出最多 NEWS_LIMIT 則 */
function pickNews(list: { order: number; index: number; item: NewsItem }[], sort: NewsSort) {
  const sorted = [...list].sort((a, b) =>
    sort === 'date'
      ? byNewest(a.item.time, b.item.time) || a.order - b.order || a.index - b.index
      : a.order - b.order || a.index - b.index,
  )
  return sorted.slice(0, NEWS_LIMIT).map((x) => x.item)
}

/** 網址代號：只留英數字與 -，其餘換成 - */
const slug = (v: string) => v.trim().replace(/[^\w-]/g, '-')

function toArticles(rows: Row[]): Article[] {
  const out = rows
    .map((r, index) => {
      if (!bool(r.show, true) || !r.title) return null
      const { label, time } = parseDate(r.date)
      const item: Article = {
        id: slug(r.id || '') || `article-${index + 1}`,
        category: r.category,
        title: r.title,
        excerpt: r.excerpt,
        cover: imageUrl(r.cover),
        coverAlt: r.coverAlt || r.title,
        date: label,
        time,
        author: r.author,
        content: lines(r.content),
        link: /^https:\/\//.test(r.link ?? '') ? r.link : '',
      }
      // 有填排序數字的照數字；沒填的依日期（新的在前）排在後面
      return { order: orderOf(r.order, index), index, item }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
  return out
    .sort((a, b) => a.order - b.order || byNewest(a.item.time, b.item.time) || a.index - b.index)
    .map((x) => x.item)
}

/** 培訓案例（學習地圖）：依「排序」，沒填排序的依年份新的在前 */
function toTrainingCases(rows: Row[]): AboutCase[] {
  const out = rows
    .map((r, index) => {
      if (!bool(r.show, true) || !r.course) return null
      const item: AboutCase = {
        key: slug(r.id || '') || `training-${index + 1}`,
        year: r.year,
        school: r.school,
        course: r.course,
        desc: r.desc,
        more: lines(r.more),
        image: {
          src: imageUrl(r.image),
          alt: r.imageAlt || [r.year, r.school, r.course].filter(Boolean).join(' '),
          pendingLabel: '活動照片待補',
          width: 1200,
          height: 800,
        },
      }
      const n = Number(r.order)
      return { order: r.order !== '' && Number.isFinite(n) ? n : Infinity, index, item }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
  return out
    .sort(
      (a, b) =>
        (a.order === b.order ? 0 : a.order < b.order ? -1 : 1) ||
        (Number(b.item.year) || 0) - (Number(a.item.year) || 0) ||
        a.index - b.index,
    )
    .map((x) => x.item)
}

/** 關於亞創「課程的起點」輪播的照片（一列一張）：src＝圖片網址，caption＝圖說（選填） */
export interface OriginPhoto {
  src: string
  caption: string
}

function toOriginPhotos(rows: Row[]) {
  const out = rows
    .map((r, index) => {
      if (!bool(r.show, true)) return null
      const src = imageUrl(r.photo)
      if (!src) return null
      return { order: orderOf(r.order, index), index, item: { src, caption: r.caption ?? '' } satisfies OriginPhoto }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
  return out
}

/** 設定分頁：key → value */
function toSettings(rows: Row[]) {
  return rows.filter((r) => r.key).map((r) => ({ key: r.key, value: r.value ?? '' }))
}

/* ---------- 讀取與快取 ----------
   先用上次存下的試算表內容立刻顯示（照片網址馬上就有，照片也能直接用瀏覽器快取），
   資料超過 CACHE_MS 再在背景抓新的，內容有變才更新畫面。
   存在 localStorage：只存網站公開內容，不含訪客資料；重新進站也能沿用。 */

interface CacheEntry {
  at: number
  text: string
}

const cacheKey = (url: string) => `sheet:${url}`

function readCache(url: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(url))
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (typeof entry?.text !== 'string' || Date.now() - entry.at > STALE_MAX_MS) return null
    return entry
  } catch {
    return null
  }
}

function writeCache(url: string, text: string) {
  try {
    localStorage.setItem(cacheKey(url), JSON.stringify({ at: Date.now(), text } satisfies CacheEntry))
  } catch {
    /* 無痕模式、空間不足等無法儲存時略過 */
  }
}

async function fetchCsv(url: string) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function createSource<T>(
  url: string,
  local: T[],
  convert: (rows: Row[]) => T[],
  label: string,
  /** true＝試算表沒有任何可顯示的資料時，就顯示空的（不改用內建資料） */
  allowEmpty = false,
) {
  const items: ShallowRef<T[]> = shallowRef(url ? [] : local)
  const status = shallowRef<Status>(url ? 'loading' : 'local')
  let started = false

  /** 套用一份 CSV；內容不能用時丟出錯誤 */
  function apply(text: string) {
    const list = convert(toRows(text))
    if (!list.length && !allowEmpty) throw new Error('試算表沒有可顯示的資料')
    items.value = list
    status.value = 'sheet'
  }

  function load() {
    if (started || !url) return
    started = true

    const cached = readCache(url)
    let shown = false
    if (cached) {
      try {
        apply(cached.text)
        shown = true
      } catch {
        /* 快取內容不能用，等新資料 */
      }
      if (shown && Date.now() - cached.at < CACHE_MS) return
    }

    fetchCsv(url)
      .then((text) => {
        // 內容沒變就不重畫，只更新快取時間
        if (!(shown && cached?.text === text)) apply(text)
        writeCache(url, text)
      })
      .catch((err) => {
        // 已經用快取顯示了，就繼續用快取，不退回內建資料
        if (shown) return
        console.warn(`[試算表] ${label}讀取失敗，改用內建資料：`, err)
        items.value = local
        status.value = 'local'
      })
  }

  return { items, status, load }
}

const lecturerSource = createSource(sheetSources.lecturers, localLecturers, toLecturers, '講師')
const caseSource = createSource(sheetSources.cases, localCases, toCases, '案例')
type NewsRow = ReturnType<typeof toNews>[number]
const localNewsRows: NewsRow[] = localNews.map((item, index) => ({ order: index, index, item }))
const newsSource = createSource(sheetSources.news, localNewsRows, toNews, '熱門課程')
const articleSource = createSource(sheetSources.trends, localArticles, toArticles, '趨勢專欄', true)
const trainingSource = createSource(sheetSources.training, aboutCases.items, toTrainingCases, '培訓案例')
const originSource = createSource(sheetSources.originPhotos, [], toOriginPhotos, '關於亞創輪播', true)
const settingSource = createSource(sheetSources.settings, [], toSettings, '設定', true)

/** 講師資料（試算表優先，失敗用內建資料） */
export function useLecturers() {
  lecturerSource.load()
  const lecturers = computed(() => lecturerSource.items.value)
  return {
    lecturers,
    loading: computed(() => lecturerSource.status.value === 'loading'),
    /** 首頁精選：有勾選的優先，沒有勾選就取前 3 位 */
    featured: computed(() => {
      const picked = lecturers.value.filter((l) => l.featured)
      return (picked.length ? picked : lecturers.value).slice(0, 3)
    }),
    hasSample: computed(() => lecturers.value.some((l) => l.placeholder)),
  }
}

/** 案例資料（試算表優先，失敗用內建資料） */
export function useCases() {
  caseSource.load()
  const cases = computed(() => caseSource.items.value)
  return {
    cases,
    loading: computed(() => caseSource.status.value === 'loading'),
    hasSample: computed(() => cases.value.some((c) => c.placeholder)),
  }
}

/** 培訓案例（學習地圖頁；試算表優先，沒有資料或讀取失敗時用 about.ts 的內建資料） */
export function useTrainingCases() {
  trainingSource.load()
  return {
    items: computed(() => trainingSource.items.value),
    loading: computed(() => trainingSource.status.value === 'loading'),
  }
}

/** 試算表「設定」分頁的值（讀不到時回傳 fallback） */
function useSetting(key: string, fallback: string) {
  settingSource.load()
  return computed(() => settingSource.items.value.find((s) => s.key === key)?.value.trim() || fallback)
}

/**
 * 關於亞創「課程的起點」右側的照片輪播（試算表「關於亞創輪播」分頁，一列一張，依 order 排序）
 * 分頁網址未設定或沒有任何照片時為空陣列，頁面改用 about.ts 的 aboutOrigin.photo。
 */
export function useOriginPhotos() {
  originSource.load()
  return {
    photos: computed(() =>
      [...originSource.items.value].sort((a, b) => a.order - b.order || a.index - b.index).map((x) => x.item),
    ),
    loading: computed(() => originSource.status.value === 'loading'),
  }
}

/** 熱門課程（試算表優先，失敗用內建資料）：依「設定」分頁的 newsSort 取最多 5 則 */
export function useNews() {
  newsSource.load()
  const sortSetting = useSetting('newsSort', '排序數字')
  const sort = computed<NewsSort>(() => (/日期|date/i.test(sortSetting.value) ? 'date' : 'order'))
  return {
    news: computed(() => pickNews(newsSource.items.value, sort.value)),
    loading: computed(() => newsSource.status.value === 'loading' || settingSource.status.value === 'loading'),
  }
}

/** 趨勢專欄文章（試算表沒有文章時為空陣列） */
export function useArticles() {
  articleSource.load()
  return {
    articles: computed(() => articleSource.items.value),
    loading: computed(() => articleSource.status.value === 'loading'),
  }
}
