const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKIO1czBwln_PU74A4KvrtQPNo0S_8Iq3x8t26kWBOpN1S3vHC9X2MZ6qQEYm0-FIN/exec"; // Paste the deployed Apps Script web-app URL here.
const questions = [
  { stage: "About you", title: "What is your name?", type: "text", key: "name", required: true, placeholder: "Your name" },
  { stage: "About you", title: "What is your email address?", type: "email", key: "email", required: true, placeholder: "you@school.org" },
  { stage: "About you", title: "What do you teach?", type: "multi", key: "role", options: ["Elementary", "Middle School", "High School", "Administration", "Student Support", "Other"] },
  { stage: "About you", title: "What subjects or roles should I know about?", type: "textarea", key: "subjects", placeholder: "A subject, grade, department, or role" },
  { stage: "About you", title: "How many years have you worked in education?", type: "single", key: "years", options: ["0–3", "4–10", "11–20", "20+"] },
  { stage: "How you use AI", title: "How often do you currently use AI?", type: "single", key: "frequency", options: ["I haven't really used it yet", "I've experimented a few times", "A few times a month", "A few times a week", "Almost every day", "Several times every day"] },
  { stage: "How you use AI", title: "What do you currently use AI for?", help: "Select all that apply.", type: "multi", key: "uses", options: ["Brainstorming ideas", "Lesson planning", "Creating worksheets or activities", "Creating quizzes or assessments", "Creating rubrics", "Providing feedback to students", "Differentiating instruction", "Adapting materials", "Writing emails or parent communication", "Summarizing documents", "Research", "Creating presentations", "Creating images", "Creating video", "Creating audio/music", "Analyzing student data", "Administrative work", "Coding / building apps", "Personal use", "I don't currently use AI", "Other"] },
  { stage: "Your AI toolkit", title: "Which AI assistants have you used?", help: "Select the assistants you use. Check Paid for any subscription you pay for.", type: "multiPaid", key: "assistants", paidKey: "paidAssistants", options: ["ChatGPT", "Gemini", "Claude", "Microsoft Copilot", "Perplexity", "Grok", "Meta AI", "DeepSeek", "Other", "None yet"] },
  { stage: "Your AI toolkit", title: "Which other AI tools have you used?", help: "Teaching, research, creating, or productivity tools. Select all that apply.", type: "multi", key: "tools", customKey: "otherTool", customOption: "Another tool not listed", customPlaceholder: "Which tool?", options: ["MagicSchool", "Brisk Teaching", "Khanmigo", "SchoolAI", "NotebookLM", "Perplexity", "Canva AI", "Adobe Firefly", "Gamma", "Runway", "Suno", "Gemini in Google Workspace", "Microsoft Copilot", "Notion AI", "Zoom AI", "Another tool not listed"] },
  { stage: "AI perspective", title: "Which statements describe how you think about AI in education?", help: "Select all that apply.", type: "multi", key: "mindset", options: ["I'm mostly concerned about its risks", "I'm curious but still unsure how it fits into teaching", "I see useful applications but use them selectively", "I already integrate AI regularly into my work", "I'm actively redesigning some teaching because of AI", "I'm experimenting with students using AI", "I'm building AI workflows/tools for education"] },
  { stage: "What to explore", title: "What would make AI genuinely useful to you this year?", help: "Select up to five.", type: "multi", max: 5, key: "goals", customKey: "otherGoal", customOption: "Something else", customPlaceholder: "What else would be useful?", options: ["Save time planning lessons", "Create better learning activities", "Differentiate instruction", "Support students with different learning needs", "Create assessments", "Create better rubrics", "Give students better feedback", "Analyze assessment results", "Generate teaching materials", "Create presentations", "Create images", "Create videos", "Create games", "Create simulations", "Research topics", "Work with documents using NotebookLM", "Communicate with parents", "Reduce administrative work", "Organize my work", "Understand AI ethics", "Understand privacy and student data", "Understand appropriate student use of AI", "Detect misinformation / deepfakes", "Create my own GPT/Gem", "Build an app or website", "Learn AI coding", "Learn APIs / automations", "Something else"] },
  { stage: "What to explore", title: "What is one thing you wish you knew how to do with AI?", type: "textarea", key: "wish", placeholder: "Tell me what made you curious..." },
  { stage: "What to explore", title: "What repetitive or frustrating part of your job should take less time?", type: "textarea", key: "painPoint", placeholder: "A task, workflow, or recurring challenge" }
];

const form = document.querySelector("#survey-form");
const answers = {};
let current = 0;
const stages = [...new Set(questions.map((question) => question.stage))];

document.querySelector("#start-button").addEventListener("click", () => {
  document.querySelector("#intro-view").hidden = true;
  form.hidden = false;
  renderQuestion();
});

function renderQuestion() {
  const question = questions[current];
  const stageIndex = stages.indexOf(question.stage);
  document.querySelector("#stage-label").textContent = question.stage;
  document.querySelector("#progress-count").textContent = `${stageIndex + 1} / ${stages.length}`;
  document.querySelector("#progress-bar").style.width = `${((stageIndex + 1) / stages.length) * 100}%`;
  form.innerHTML = `<div class="question-number">${String(current + 1).padStart(2, "0")}</div><h1 class="question-title">${question.title}</h1>${question.help ? `<p class="question-help">${question.help}</p>` : ""}${controlFor(question)}<p id="error" class="error" role="alert"></p><div class="actions">${current ? '<button type="button" class="back-button" id="back">← Back</button>' : '<span></span>'}<button class="primary-button" type="submit">${current === questions.length - 1 ? "Finish profile" : "Continue"} <span>→</span></button></div>`;
  form.classList.remove("question-view");
  void form.offsetWidth;
  form.classList.add("question-view");
  document.querySelector("#back")?.addEventListener("click", () => { saveAnswer(); current -= 1; renderQuestion(); });
  form.querySelectorAll("input[name=answer]").forEach((input) => input.addEventListener("change", () => updateCustomField(question)));
  form.querySelectorAll("input[name=paid]").forEach((input) => input.addEventListener("change", () => updatePaidState(question)));
  updateCustomField(question);
  updatePaidState(question);
}

function controlFor(question) {
  if (question.type === "text" || question.type === "email") return `<input class="text-input" type="${question.type}" name="answer" placeholder="${question.placeholder}" value="${answers[question.key] || ""}" ${question.required ? "required" : ""} autofocus>`;
  if (question.type === "textarea") return `<textarea class="text-area" name="answer" placeholder="${question.placeholder || "Your answer"}">${answers[question.key] || ""}</textarea>`;
  const customField = question.customKey ? `<div id="custom-field" class="custom-field" hidden><input class="text-input" name="custom-answer" placeholder="${question.customPlaceholder}" value="${answers[question.customKey] || ""}" aria-label="${question.customPlaceholder}"></div>` : "";
  if (question.type === "multiPaid") return `<div class="option-list assistant-list">${question.options.map((option, index) => { const used = Array.isArray(answers[question.key]) && answers[question.key].includes(option); const paid = Array.isArray(answers[question.paidKey]) && answers[question.paidKey].includes(option); return `<div class="assistant-option"><div class="option"><input id="option-${index}" name="answer" type="checkbox" value="${option}" ${used ? "checked" : ""}><label for="option-${index}">${option}</label></div><label class="paid-option"><input name="paid" type="checkbox" value="${option}" ${paid ? "checked" : ""} ${used ? "" : "disabled"}> Paid</label></div>`; }).join("")}</div>`;
  return `<div class="option-list">${question.options.map((option, index) => { const checked = Array.isArray(answers[question.key]) ? answers[question.key].includes(option) : answers[question.key] === option; return `<div class="option"><input id="option-${index}" name="answer" type="${question.type === "multi" ? "checkbox" : "radio"}" value="${option}" ${checked ? "checked" : ""}><label for="option-${index}">${option}</label></div>`; }).join("")}</div>${customField}`;
}

function updatePaidState(question) {
  if (question.type !== "multiPaid") return;
  form.querySelectorAll("input[name=paid]").forEach((paidInput) => {
    const used = [...form.querySelectorAll("input[name=answer]:checked")].some((input) => input.value === paidInput.value);
    paidInput.disabled = !used;
    if (!used) paidInput.checked = false;
  });
}

function updateCustomField(question) {
  if (!question.customKey) return;
  const selected = [...form.querySelectorAll("input[name=answer]:checked")].some((input) => input.value === question.customOption);
  const field = form.querySelector("#custom-field");
  field.hidden = !selected;
  if (!selected) answers[question.customKey] = "";
}

function saveAnswer() {
  const question = questions[current];
  const inputs = [...form.querySelectorAll("[name=answer]")];
  answers[question.key] = question.type === "multi" ? inputs.filter((input) => input.checked).map((input) => input.value) : inputs[0]?.value?.trim() || "";
  if (question.type === "multiPaid") {
    answers[question.key] = inputs.filter((input) => input.checked).map((input) => input.value);
    answers[question.paidKey] = [...form.querySelectorAll("input[name=paid]:checked")].map((input) => input.value);
  }
  if (question.customKey) answers[question.customKey] = form.querySelector("[name=custom-answer]")?.value?.trim() || "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveAnswer();
  const question = questions[current];
  const answer = answers[question.key];
  if (question.required && !answer) return showError("Please add an answer to continue.");
  if (question.type === "multi" && question.max && answer.length > question.max) return showError(`Please choose up to ${question.max}.`);
  if (current < questions.length - 1) { current += 1; renderQuestion(); return; }
  await submitProfile();
});

function showError(message) { document.querySelector("#error").textContent = message; }

async function submitProfile() {
  form.hidden = true;
  document.querySelector("#success-view").hidden = false;
  if (!SCRIPT_URL) { document.querySelector("#submit-status").textContent = "The form is ready. Add your Apps Script web-app URL in app.js to send reports automatically."; return; }
  try { await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ submittedAt: new Date().toISOString(), ...answers }) }); document.querySelector("#submit-status").textContent = "Your profile has been sent."; }
  catch (error) { document.querySelector("#submit-status").textContent = "Your profile is complete, but it could not be sent. Please try again."; }
}