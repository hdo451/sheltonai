const SHEET_NAME = "Responses";
const REPORT_RECIPIENT = "your-email@example.com";
const REPORT_FOLDER_ID = "16j0zmpUz280MJzooZGGxFVryzpzbeyXM";
const REPORT_LOGO_FILE_ID = "";
const MAKE_REPORT_PUBLIC = true;
const SEND_REPORT_TO_TEACHER = true;
const REPORT_HEADERS = ["Submitted At", "Name", "Email", "Teaching / Role", "Subjects / Roles", "Years in Education", "AI Frequency", "Current AI Uses", "AI Assistants", "Other AI Tools", "AI Perspective", "Useful AI Goals", "Other Tool", "Other Goal", "What They Wish To Learn", "Time-Saving Opportunity", "Report PDF"];

function doGet() {
  return ContentService.createTextOutput("AI profile endpoint is ready.");
}

function setup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFolderById(REPORT_FOLDER_ID);
  MailApp.getRemainingDailyQuota();
  getResponseSheet();
  Logger.log(`Ready: ${spreadsheet.getName()} / ${folder.getName()}`);
}

function doPost(event) {
  const data = JSON.parse(event.postData.contents);
  const report = createReport(data);
  const sheet = getResponseSheet();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    ensureHeaders(sheet);
    sheet.appendRow(REPORT_HEADERS.slice(0, -1).map((header) => valueForHeader(data, header)).concat([report.url]));
    sheet.getRange(sheet.getLastRow(), REPORT_HEADERS.length).setFormula(`=HYPERLINK("${report.url}","Download PDF")`);
  } finally {
    lock.releaseLock();
  }
  sendReport(data, report.url);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, reportUrl: report.url })).setMimeType(ContentService.MimeType.JSON);
}

function getResponseSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(REPORT_HEADERS);
}

function valueForHeader(data, header) {
  const keys = {
    "Submitted At": "submittedAt", "Name": "name", "Email": "email", "Teaching / Role": "role",
    "Subjects / Roles": "subjects", "Years in Education": "years", "AI Frequency": "frequency",
    "Current AI Uses": "uses", "AI Assistants": "assistants", "Other AI Tools": "tools",
    "AI Perspective": "mindset", "Useful AI Goals": "goals", "Other Tool": "otherTool",
    "Other Goal": "otherGoal", "What They Wish To Learn": "wish", "Time-Saving Opportunity": "painPoint"
  };
  return formatValue(data[keys[header]]);
}

function formatValue(value) {
  return Array.isArray(value) ? value.join(", ") : value || "";
}

function createReport(data) {
  const folder = DriveApp.getFolderById(REPORT_FOLDER_ID);
  const name = data.name || "Teacher";
  const safeName = name.replace(/[^a-z0-9 -]/gi, "").trim() || "Teacher";
  const html = reportHtml(data);
  const pdf = folder.createFile(Utilities.newBlob(html, MimeType.HTML, `${safeName} - AI Profile.html`).getAs(MimeType.PDF));
  pdf.setName(`${safeName} - AI Profile.pdf`);
  if (MAKE_REPORT_PUBLIC) pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: pdf.getUrl(), downloadUrl: `https://drive.google.com/uc?export=download&id=${pdf.getId()}` };
}

function reportHtml(data) {
  const logo = REPORT_LOGO_FILE_ID ? `data:image/png;base64,${Utilities.base64Encode(DriveApp.getFileById(REPORT_LOGO_FILE_ID).getBlob().getBytes())}` : "";
  const section = (title, value) => `<div class="item"><b>${escapeHtml(title)}</b><p>${escapeHtml(formatValue(value) || "Not provided")}</p></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:Letter;margin:0}*{box-sizing:border-box}body{margin:0;padding:34px 42px;color:#1d2420;font:10px Arial,sans-serif}header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #4f805b;padding-bottom:16px;margin-bottom:22px}header img{max-width:190px;max-height:60px}h1{margin:0;color:#1d2420;font-size:23px}h1 span{display:block;color:#4f805b;font-size:11px;font-weight:normal;letter-spacing:1px;text-transform:uppercase;margin-top:4px}.date{color:#68716b;font-size:9px}.identity{display:grid;grid-template-columns:1fr 1fr;gap:5px 28px;padding:13px 15px;background:#f4f5f2;border-left:4px solid #4f805b;margin-bottom:19px}.identity b{display:block;color:#68716b;font-size:8px;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}.identity p,.item p{margin:0;line-height:1.35;white-space:pre-wrap;word-wrap:break-word}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 27px}.item{border-bottom:1px solid #d5dbd5;padding-bottom:8px;min-height:38px}.item b{display:block;color:#4f805b;font-size:8px;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}.wide{grid-column:1/-1}footer{position:fixed;bottom:22px;left:42px;right:42px;border-top:1px solid #d5dbd5;padding-top:8px;color:#68716b;font-size:8px}</style></head><body><header>${logo ? `<img src="${logo}" alt="School logo">` : "<h1>Shelton<span>AI profile</span></h1>"}<div class="date">TEACHER AI PROFILE<br>${escapeHtml(formatValue(data.submittedAt))}</div></header><div class="identity">${section("Name", data.name)}${section("Email", data.email)}${section("Teaching / Role", data.role)}${section("Subjects / Roles", data.subjects)}${section("Years in Education", data.years)}${section("AI Frequency", data.frequency)}</div><div class="grid">${section("Current AI Uses", data.uses)}${section("AI Assistants", data.assistants)}${section("Other AI Tools", data.tools)}${section("AI Perspective", data.mindset)}${section("Useful AI Goals", data.goals)}${section("Other Tool", data.otherTool)}${section("Other Goal", data.otherGoal)}${section("What They Wish To Learn", data.wish)}${section("Time-Saving Opportunity", data.painPoint)}</div><footer>This profile is a deterministic summary of the teacher's responses. It is not an assessment or an AI score.</footer></body></html>`;
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sendReport(data, reportUrl) {
  const name = data.name || "Teacher";
  const body = `A new AI profile has been completed by ${name}.\n\nDownload the one-page report: ${reportUrl}\n\nThe response has also been saved in the Responses sheet.`;
  MailApp.sendEmail({ to: REPORT_RECIPIENT, subject: `AI profile: ${name}`, body: body });
  if (SEND_REPORT_TO_TEACHER && data.email && data.email !== REPORT_RECIPIENT) {
    MailApp.sendEmail({ to: data.email, subject: "Your teacher AI profile report", body: `Hello ${name},\n\nYour one-page AI profile report is ready:\n${reportUrl}\n\nThank you for completing the profile.` });
  }
}