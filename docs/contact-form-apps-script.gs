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
 * 時間：「送出時間」寫入的是台北時間（Asia/Taipei）的牆上時鐘數字，不受試算表時區設定影響。
 * 注意：改試算表時區「不會」修正已存的舊時間。舊資料要用 previewFixOldTimes() 預覽、fixOldTimes() 修正（只需一次）。
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

/** 收到表單時是否寄 Email 通知 */
const NOTIFY_BY_EMAIL = true

/** 通知信的收件信箱（只寄給這幾個，不會再寄給其他人，包含部署這個程式的帳號）。要增減就改這裡 */
const NOTIFY_TO = ['asia.alliance2020@gmail.com', '12chengya@gmail.com']

/**
 * 預期「部署並執行」這支程式的 Google 帳號。
 * 通知信是從執行帳號的信箱寄出的，而且該帳號必須能編輯紀錄試算表，所以請用這個帳號部署。
 * 不是這個帳號時，執行記錄會出現警告（不影響運作）。
 */
const EXPECTED_OWNER = '12chengya@gmail.com'

/** 「送出時間」一律用台北時間顯示（試算表預設可能是美國時區，會差十幾個小時） */
const TIME_ZONE = 'Asia/Taipei'
const TIME_FORMAT = 'yyyy/MM/dd HH:mm:ss'

/** 程式版本：用瀏覽器打開網頁應用程式網址，會看到這個值，可確認部署的是不是新版 */
const SCRIPT_VERSION = 'notify-2-recipients-2026-11-16-d'

/** 目前是哪個 Google 帳號在執行這支程式（網頁應用程式＝部署時選的「執行身分」） */
function executingAccount() {
  try {
    return Session.getEffectiveUser().getEmail() || '（讀不到）'
  } catch (err) {
    return '（讀不到）'
  }
}

/**
 * 試算表存的日期時間，其實只是「牆上時鐘的數字」，沒有時區；改試算表時區不會改變已存的數字。
 * 所以新資料不交給 Date 轉換，而是直接寫入「台北牆上時鐘」的數字，不受任何時區設定影響。
 */
function taipeiSerial(date) {
  const p = Utilities.formatDate(date, TIME_ZONE, 'yyyy,MM,dd,HH,mm,ss').split(',').map(Number)
  return (Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4], p[5]) - Date.UTC(1899, 11, 30)) / 86400000
}

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
    // 不用 appendRow：它會放在「任何欄位有內容的最後一列」之後，
    // 例如刪掉舊資料時漏了「處理狀態」那欄，新資料就會被推到很下面
    const last = nextRow(sheet)
    sheet
      .getRange(last, 1, 1, HEADERS.length)
      .setValues([[taipeiSerial(new Date()), row.name, row.org, row.email, row.need, row.message, row.page, '未處理']])
    sheet.getRange(last, 1).setNumberFormat(TIME_FORMAT)
    log('已寫入第 ' + last + ' 列，試算表上顯示的送出時間：' + sheet.getRange(last, 1).getDisplayValue())

    if (NOTIFY_BY_EMAIL) {
      notify(row)
      log('已寄出通知信：由 ' + executingAccount() + ' 寄出，共 ' + NOTIFY_TO.length + ' 位收件人')
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
  // notifyCount 只回報「通知信有幾位收件人」，不公開信箱
  return json({
    ok: true,
    service: '亞洲共創學院網站聯絡表單',
    version: SCRIPT_VERSION,
    timeZone: TIME_ZONE,
    notifyCount: NOTIFY_TO.length,
  })
}

/** 開頭是 = + - @ 的內容在試算表中會被當成公式，前面加 ' 讓它保持純文字 */
function safeCell(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value
}

/**
 * 下一筆資料要寫的列：只看 A 欄（送出時間）最後一個有內容的列，往下一列。
 * 第 1 列是標題；A 欄都是空的就從第 2 列開始。
 */
function nextRow(sheet) {
  const max = sheet.getMaxRows()
  const values = sheet.getRange(1, 1, max, 1).getValues()
  let lastUsed = 1
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][0] !== '') {
      lastUsed = i + 1
      break
    }
  }
  if (lastUsed + 1 > max) sheet.insertRowsAfter(max, 1)
  return lastUsed + 1
}

function getSheet() {
  // 用 ID 開啟：不論程式是附加在試算表上、或是獨立的 Apps Script 專案都能運作
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  // 試算表時區：影響 NOW() 等公式與日後的轉換。注意這「不會」改動已存的時間數字（見 taipeiSerial 的說明）
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

/** 印出「誰在執行」與「通知信寄給誰」，並在帳號不是預期的那個時給警告 */
function checkOwner() {
  const me = executingAccount()
  log('執行身分：' + me)
  log('通知信收件人：' + NOTIFY_TO.join('、') + '（共 ' + NOTIFY_TO.length + ' 位，只寄給這幾位）')
  if (me !== EXPECTED_OWNER) {
    log('⚠ 目前是用 ' + me + ' 執行，預期是 ' + EXPECTED_OWNER + '。通知信會從 ' + me + ' 的信箱寄出，且此帳號需要能編輯紀錄試算表；建議改用 ' + EXPECTED_OWNER + ' 部署。')
  } else {
    log('執行身分符合預期')
  }
}

/**
 * 手動執行一次即可：把試算表時區改成台北，並統一「送出時間」格式。
 * 會印出最新一列在試算表上「實際顯示」的時間，方便跟現在的台北時間對照。
 */
function setupTaipeiTime() {
  log('程式版本 ' + SCRIPT_VERSION + '，開始套用台北時間')
  checkOwner()
  const sheet = getSheet()
  const ss = sheet.getParent()
  log('試算表：' + ss.getName() + '　分頁：' + sheet.getName() + '　目前共 ' + sheet.getLastRow() + ' 列')
  log('試算表時區：' + ss.getSpreadsheetTimeZone() + '　（應為 ' + TIME_ZONE + '）')
  if (sheet.getLastRow() >= 2) {
    log('最新一列在試算表上顯示的送出時間：' + sheet.getRange(sheet.getLastRow(), 1).getDisplayValue())
  }
  log('完成')
}

/**
 * 【一次性】修正舊資料：在試算表時區還是美國時間時寫入的紀錄，時間數字比台北慢 16 小時。
 * 規則：「送出時間」落在下面這段範圍內的列，一律加 16 小時。
 *   範圍＝2026/11/15 20:00 ～ 2026/11/16 06:00（就是那批寫錯的測試與洽詢；範圍之外的列不動）
 * 修正後的時間會落到 11/16 中午之後，不在範圍內，所以重複執行也不會再加。
 * 先執行 previewFixOldTimes() 看會改哪幾列，確認沒問題再執行 fixOldTimes()。
 */
const FIX_FROM = Date.UTC(2026, 10, 15, 20, 0, 0)
const FIX_TO = Date.UTC(2026, 10, 16, 6, 0, 0)
const FIX_SHIFT_MS = 16 * 3600 * 1000

function previewFixOldTimes() {
  fixOldTimes_(false)
}

function fixOldTimes() {
  fixOldTimes_(true)
}

function fixOldTimes_(apply) {
  const sheet = getSheet()
  const last = sheet.getLastRow()
  if (last < 2) return log('沒有資料')
  // 用「畫面上顯示的文字」判斷，不經過任何時區換算
  const shown = sheet.getRange(2, 1, last - 1, 1).getDisplayValues()
  let count = 0
  shown.forEach(function (cell, i) {
    const m = String(cell[0]).match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
    if (!m) return
    const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
    if (wall < FIX_FROM || wall >= FIX_TO) return
    const fixed = wall + FIX_SHIFT_MS
    const text = Utilities.formatDate(new Date(fixed), 'UTC', TIME_FORMAT)
    log('第 ' + (i + 2) + ' 列：' + cell[0] + ' → ' + text)
    if (apply) {
      const cellRange = sheet.getRange(i + 2, 1)
      cellRange.setValue((fixed - Date.UTC(1899, 11, 30)) / 86400000)
      cellRange.setNumberFormat(TIME_FORMAT)
    }
    count++
  })
  log((apply ? '已修正 ' : '預覽：會修正 ') + count + ' 列')
}

function notify(row) {
  const to = NOTIFY_TO.join(',')
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

/**
 * 手動執行：寄一封「測試通知信」給 NOTIFY_TO 的每個信箱，不會寫入試算表。
 * 用來確認「收件人是不是只有那幾個」，不用真的送出表單。
 * 執行後到各信箱（含垃圾郵件匣）找主旨「【網站洽詢】測試信（可刪除）」。
 */
function testNotify() {
  checkOwner()
  if (!NOTIFY_TO.length) return log('NOTIFY_TO 是空的，沒有寄出')
  MailApp.sendEmail({
    to: NOTIFY_TO.join(','),
    subject: '【網站洽詢】測試信（可刪除）',
    body: [
      '這是 Apps Script 的測試通知信，可直接刪除。',
      '',
      '寄出時間：' + taipeiNow() + '（台北時間）',
      '執行身分（寄件帳號）：' + executingAccount(),
      '程式版本：' + SCRIPT_VERSION,
      '收件人：' + NOTIFY_TO.join('、'),
    ].join('\n'),
  })
  log('已寄出測試信給：' + NOTIFY_TO.join('、') + '　今日剩餘寄信額度：' + MailApp.getRemainingDailyQuota())
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
