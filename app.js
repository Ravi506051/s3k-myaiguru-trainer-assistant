const views = [...document.querySelectorAll('.view')];
const crumb = document.getElementById('crumb-current');
const names = { dashboard: 'Overview', content: 'Content studio', learners: 'Learners', reviews: 'Review queue', insights: 'Reports' };
function showView(name) {
  views.forEach(v => v.classList.toggle('active-view', v.id === `view-${name}`));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  crumb.textContent = names[name] || 'Overview';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => showView(el.dataset.view)));

const batchSelect = document.getElementById('batch-select');
batchSelect.addEventListener('change', () => {
  const rows = [...document.querySelectorAll('.batch-row')];
  rows.forEach(row => row.classList.toggle('hidden', batchSelect.value !== 'all' && row.dataset.batch !== batchSelect.value));
  const stats = { all: ['78', '62', '4.0'], 'batch-a': ['84', '71', '3.2'], 'batch-b': ['76', '58', '4.3'], 'batch-c': ['81', '66', '3.8'], 'batch-d': ['71', '53', '4.7'] }[batchSelect.value];
  document.getElementById('attendance-value').innerHTML = `${stats[0]}<span>%</span>`;
  document.getElementById('submission-value').innerHTML = `${stats[1]}<span>%</span>`;
  document.getElementById('feedback-value').innerHTML = `${stats[2]}<span>d</span>`;
});

const cannedAnswers = [
  { match: /overfit|validation/, answer: 'Overfitting is when a model learns training examples too closely, including noise, so it performs poorly on new examples. A validation set is a separate set of examples used during development to check whether the model generalizes. Trainer note: this is a short explanation; review it against Module 3 before sharing.' },
  { match: /prompt|instruction/, answer: 'A useful prompt makes the context, task, constraints and desired output clear. For example, ask for “three beginner-friendly examples in a table” instead of “explain this.” This follows the approved Prompting Guide, Module 2.' },
  { match: /train|test|data/, answer: 'Training data is used to fit a model. Test data is held back until evaluation to estimate performance on unfamiliar examples. Keep the test set separate while you make design choices. Please check the Module 3 trainer notes before teaching.' },
  { match: /photo|plant|photosynthesis/, answer: 'Photosynthesis is how plants use light energy to turn water and carbon dioxide into sugars, releasing oxygen. A beginner analogy: a leaf works like a tiny solar-powered kitchen. Verify scientific wording and adapt the analogy to your class before sharing.' },
  { match: /default/, answer: 'I could not find a close match in the approved course material. Try asking about a specific module, or add this question to the trainer review queue. I will not invent an answer when the source is unclear.' }
];
function answerQuestion(question) {
  const item = cannedAnswers.find(a => a.match.test(question)) || cannedAnswers[cannedAnswers.length - 1];
  return `${item.answer}<br><br><span class="source-tag">Demo response · trainer review required</span>`;
}
const copilotForm = document.getElementById('copilot-form');
copilotForm.addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('copilot-input');
  if (!input.value.trim()) return;
  document.getElementById('copilot-answer').innerHTML = answerQuestion(input.value.trim());
  input.value = '';
});
document.getElementById('suggestion-btn').addEventListener('click', () => {
  document.getElementById('copilot-input').value = 'Explain overfitting with a simple example';
  copilotForm.requestSubmit();
});

const draftChecks = [...document.querySelectorAll('.trainer-review-box input')];
draftChecks.forEach(check => check.addEventListener('change', () => {
  document.getElementById('approve-draft').disabled = !draftChecks.every(c => c.checked);
}));
document.getElementById('generate-lesson').addEventListener('click', () => {
  const topic = document.getElementById('lesson-topic').value.trim() || 'Untitled lesson';
  document.getElementById('draft-title').textContent = topic;
  document.getElementById('draft-empty').classList.add('hidden');
  document.getElementById('draft-content').classList.remove('hidden');
  document.getElementById('draft-feedback').textContent = 'Draft created from a demo template. Check every source and example before sharing.';
});
document.getElementById('edit-draft').addEventListener('click', () => {
  document.getElementById('draft-feedback').textContent = 'Editing is enabled in this prototype: select the text you want to change.';
  const first = document.querySelector('.outline-block p');
  first.contentEditable = true; first.focus(); first.style.outline = '1px dashed #9d90e9';
});
document.getElementById('approve-draft').addEventListener('click', () => {
  document.getElementById('draft-feedback').textContent = 'Trainer approval recorded in this demo. The draft is marked ready to share.';
  document.querySelector('.status-pill').textContent = 'TRAINER APPROVED · READY TO SHARE';
  document.querySelector('.status-pill').style.color = '#32906d';
  document.querySelector('.status-pill').style.background = '#eaf8f1';
  showToast('Lesson approved by trainer.');
});

document.getElementById('rewrite-feedback').addEventListener('click', () => {
  const box = document.getElementById('feedback-text');
  box.value = 'Good explanation: you have captured that an overfit model performs well on examples it has seen but struggles with new data. Your analogy makes the idea easy to follow. Could you add one way we might check for overfitting during model development?';
});
document.getElementById('share-feedback').addEventListener('click', () => {
  document.getElementById('review-feedback').textContent = 'Trainer-approved feedback is ready to share (demo only).';
  showToast('Feedback approved by trainer.');
});
document.getElementById('save-feedback').addEventListener('click', () => {
  document.getElementById('review-feedback').textContent = 'Draft saved locally for this demo.';
});
document.querySelectorAll('.small-action').forEach(btn => btn.addEventListener('click', () => {
  const toast = document.getElementById('learner-toast');
  toast.textContent = 'Supportive note draft opened. Trainer review is required before sending.';
  toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 3000);
}));

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message; toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2800);
}
document.getElementById('export-btn').addEventListener('click', () => window.print());
const requestedView = new URLSearchParams(window.location.search).get('view');
if (requestedView && names[requestedView]) showView(requestedView);
