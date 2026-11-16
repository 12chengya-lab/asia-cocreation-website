/**
 * 亞洲共創學院網站｜聯絡表單 → Google 試算表
 *
 * 資料寫入「私人」試算表「亞創網站｜聯絡表單紀錄（含個資，請勿公開）」（12chengya@gmail.com 雲端硬碟），
 * 與公開的網站內容試算表分開存放。
 *
 * 重新安裝方式（只在需要重建時）：
 * 1. 打開試算表「亞創網站｜聯絡表單紀錄」→ 上方選單「擴充功能 → Apps Script」
 *    （或到 script.google.com 新增專案）
 * 2. 刪除編輯器裡原本的內容，把這整個檔案貼上，按「儲存」
 * 3. 右上角「部署 → 新增部署作業」→ 類型選「網頁應用程式」
 *    - 執行身分：我（12chengya@gmail.com）
 *    - 誰可以存取：所有人
 * 4. 按「部署」，依畫面授權（會詢問存取試算表與寄信的權限）
 * 5. 複製「網頁應用程式」網址（https://script.google.com/macros/s/.../exec）給工程師
 *
 * 之後若修改這份程式，要到「部署 → 管理部署作業 → 編輯 → 版本：新版本」重新部署，
 * 網址不會改變。
 *
 * 時間：「送出時間」顯示台北時間（Asia/Taipei）。第一次執行時會把這份試算表的時區改成台北，
 * 舊紀錄也會一起變成台北時間；也可以在編輯器手動執行 setupTaipeiTime() 立刻套用。
 *
 * ⚠ 隱私：這份試算表含有訪客的個人資料，請勿「發布到網路」，也不要共用給「知道連結的任何人」。
 */

/**
 * 存放表單資料的私人試算表「亞創網站｜聯絡表單紀錄（含個資，請勿公開）」的 ID
 * （網址 /d/ 與 /edit 之間那一段）。此試算表只開放 12chengya@gmail.com 帳號，請勿共用給「任何人」。
 */
const SPREADSHEET_ID = '10hVcYi8v4QbhaHbW4P6eE_Lc9DCiMGetcpHjVQ2YL8M'

/** 存放表單資料的分頁名稱（第一次收到表單時會自動建立） */
const SHEET_NAME = '聯絡表單'

/** 收到表單時是否寄 Email 通知（寄到部署這個程式的帳號） */
const NOTIFY_BY_EMAIL = true

/** 「送出時間」一律用台北時間顯示（試算表預設可能是美國時區，會差十幾個小時） */
const TIME_ZONE = 'Asia/Taipei'
const TIME_FORMAT = 'yyyy/MM/dd HH:mm:ss'

/** 程式版本：用瀏覽器打開網頁應用程式網址，會看到這個值，可確認部署的是不是新版 */
const SCRIPT_VERSION = 'taipei-time-2026-11-16'

/** 現在的台北時間文字，例如 2026/11/16 14:30:05（寫 log 用，不受試算表或帳號時區影響） */
function taipeiNow() {
  return Utilities.formatDate(new Date(), TIME_ZONE, TIME_FORMAT)
}

/**
 * 寫一行 log 到「執行記錄」，開頭固定是台北時間。
 * 注意：log 只寫時間與處理結果，不要寫訪客的姓名、信箱、留言等個人資料。
 */
function log(message) {
  console.log('[' + taipeiNow() + ' 台北時間] ' + message)
}

const HEADERS = ['送出時間', '姓名', '單位名稱', '電子郵件', '合作需求', '留言', '來源頁面', '處理狀態']

/** 各欄位長度上限，避免被灌入過長內容 */
const LIMITS = { name: 60, org: 100, email: 120, need: 60, message: 3000, page: 200 }

/** 少於這個毫秒數就送出，幾乎只有機器人做得到，直接忽略 */
const MIN_FILL_MS = 2000

function doPost(e) {
  const lock = LockService.getScriptLock()
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}')

    // 防垃圾訊息：隱藏欄位被填寫、或填寫時間過短 → 假裝成功，不寫入
    if (data.website || Number(data.elapsed) < MIN_FILL_MS) {
      log('收到表單，疑似機器人（隱藏欄位被填或填寫太快），已忽略')
      return json({ ok: true })
    }

    const row = {}
    Object.keys(LIMITS).forEach(function (key) {
      row[key] = safeCell(String(data[key] || '').trim().slice(0, LIMITS[key]))
    })

    if (!row.name || !row.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      log('收到表單，但欄位不完整或 Email 格式不對，未寫入')
      return json({ ok: false, error: 'invalid' })
    }

    lock.waitLock(10000)
    const sheet = getSheet()
    sheet.appendRow([new Date(), row.name, row.org, row.email, row.need, row.message, row.page, '未處理'])
    log('已寫入第 ' + sheet.getLastRow() + ' 列，來源頁面 ' + (row.page || '（未提供）'))

    if (NOTIFY_BY_EMAIL) {
      notify(row)
      log('已寄出通知信')
    }
    return json({ ok: true })
  } catch (err) {
    log('處理表單時發生錯誤：' + err)
    console.error(err)
    return json({ ok: false, error: 'server' })
  } finally {
    try {
      lock.releaseLock()
    } catch (_) {
      /* 沒有取得鎖時不需處理 */
    }
  }
}

/** 用瀏覽器打開網址時顯示，方便確認部署成功 */
function doGet() {
  // version：用來確認「部署出去的是不是最新版程式」，改程式時順手換個值
  return json({ ok: true, service: '亞洲共創學院網站聯絡表單', version: SCRIPT_VERSION, timeZone: TIME_ZONE })
}

/** 開頭是 = + - @ 的內容在試算表中會被當成公式，前面加 ' 讓它保持純文字 */
function safeCell(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value
}

function getSheet() {
  // 用 ID 開啟：不論程式是附加在試算表上、或是獨立的 Apps Script 專案都能運作
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  // 時間存的是正確的時刻，只是顯示用試算表的時區；改成台北後，舊紀錄也會一起變成台北時間
  if (ss.getSpreadsheetTimeZone() !== TIME_ZONE) {
    log('試算表時區原本是 ' + ss.getSpreadsheetTimeZone() + '，改成 ' + TIME_ZONE)
    ss.setSpreadsheetTimeZone(TIME_ZONE)
  }
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(HEADERS)
    sheet.setFrozenRows(1)
    sheet
      .getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#222222')
      .setFontColor('#ffffff')
    sheet.setColumnWidth(6, 420)
    // 處理狀態下拉選單，方便追蹤
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['未處理', '處理中', '已回覆', '不需處理'], true)
      .build()
    sheet.getRange(2, HEADERS.length, 1000, 1).setDataValidation(rule)
  }
  // 「送出時間」整欄（含舊資料）統一格式：2026/11/16 14:30:05
  sheet.getRange('A2:A').setNumberFormat(TIME_FORMAT)
  return sheet
}

/**
 * 手動執行一次即可：把試算表時區改成台北，並統一「送出時間」格式。
 * 不想等下一筆表單送出時，在 Apps Script 編輯器選這個函式按「執行」。
 */
function setupTaipeiTime() {
  log('程式版本 ' + SCRIPT_VERSION + '，開始套用台北時間')
  const sheet = getSheet()
  const ss = sheet.getParent()
  log('試算表：' + ss.getName() + '　分頁：' + sheet.getName() + '　目前共 ' + sheet.getLastRow() + ' 列')
  log('試算表時區：' + ss.getSpreadsheetTimeZone() + '　（應為 ' + TIME_ZONE + '）')
  if (sheet.getLastRow() >= 2) {
    // 讀最新一列的「送出時間」，用台北時間格式印出，方便跟試算表上看到的對照
    const last = sheet.getRange(sheet.getLastRow(), 1).getValue()
    if (last instanceof Date) log('最新一列的送出時間：' + Utilities.formatDate(last, TIME_ZONE, TIME_FORMAT))
    else log('最新一列的送出時間不是日期格式，內容為：' + last)
  }
  log('完成')
}

function notify(row) {
  const to = Session.getEffectiveUser().getEmail()
  if (!to) return
  const body = [
    '網站「聯絡我們」收到一則新的洽詢：',
    '',
    '姓名：' + row.name,
    '單位名稱：' + (row.org || '（未填）'),
    '電子郵件：' + row.email,
    '合作需求：' + row.need,
    '',
    '留言：',
    row.message,
    '',
    '──',
    '直接回覆這封信即可回信給對方。所有洽詢都記錄在試算表的「' + SHEET_NAME + '」分頁。',
  ].join('\n')
  MailApp.sendEmail({
    to: to,
    replyTo: row.email.replace(/^'/, ''),
    subject: '【網站洽詢】' + row.need + '｜' + row.name,
    body: body,
  })
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
