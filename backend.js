// Database-backed actions for the local case-study application.
let currentLessonId = null;
async function api(path, data) {
  const response = await fetch(path, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The request failed');
  return result;
}
function statusLine(id, message, error = false) {
  const element = document.getElementById(id);
  element.textContent = message;
  element.style.color = error ? '#b74141' : '#26715b';
}
async function refreshState() {
  const state = await api('/api/state');
  const feedback = state.feedback;
  if (feedback?.status === 'approved') {
    document.getElementById('feedback-text').value = feedback.text;
    statusLine('review-feedback', 'Trainer approval saved in the database.');
  }
  const latest = state.lessons[0];
  if (latest) {
    currentLessonId = latest.id;
    document.getElementById('lesson-topic').value = latest.topic;
    document.getElementById('lesson-objective').value = latest.objective;
    document.getElementById('draft-title').textContent = latest.topic;
    document.getElementById('draft-empty').classList.add('hidden');
    document.getElementById('draft-content').classList.remove('hidden');
    if (latest.status === 'approved') {
      document.querySelector('#draft-content .status-pill').textContent = 'TRAINER APPROVED';
      statusLine('draft-feedback', 'This approval is saved in the database.');
    }
  }
  const summary = state.batches.reduce((all, batch) => ({
    attendance: all.attendance + batch.attendance,
    on_time: all.on_time + batch.on_time,
    feedback: all.feedback + batch.feedback_days,
  }), { attendance: 0, on_time: 0, feedback: 0 });
  if (state.batches.length) {
    document.getElementById('attendance-value').innerHTML = `${Math.round(summary.attendance / state.batches.length)}<span>%</span>`;
    document.getElementById('submission-value').innerHTML = `${Math.round(summary.on_time / state.batches.length)}<span>%</span>`;
    document.getElementById('feedback-value').innerHTML = `${(summary.feedback / state.batches.length).toFixed(1)}<span>d</span>`;
  }
}
refreshState().catch(() => showToast('Could not load saved data. Start the Python app server.'));

document.addEventListener('click', async event => {
  const button = event.target.closest('#generate-lesson, #approve-draft, #share-feedback');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  try {
    if (button.id === 'generate-lesson') {
      const topic = document.getElementById('lesson-topic').value.trim();
      const objective = document.getElementById('lesson-objective').value.trim();
      const audience = document.getElementById('lesson-audience').value;
      const saved = await api('/api/lessons', { topic, objective, audience });
      currentLessonId = saved.id;
      document.getElementById('draft-title').textContent = topic;
      document.getElementById('draft-empty').classList.add('hidden');
      document.getElementById('draft-content').classList.remove('hidden');
      document.querySelector('#draft-content .status-pill').textContent = 'DRAFT · NEEDS REVIEW';
      document.querySelector('#draft-content .status-pill').removeAttribute('style');
      draftChecks.forEach(check => check.checked = false);
      document.getElementById('approve-draft').disabled = true;
      statusLine('draft-feedback', 'Lesson draft saved. Trainer review is required.');
    } else if (button.id === 'approve-draft') {
      if (!currentLessonId || !draftChecks.every(check => check.checked)) throw new Error('Complete the review checklist first');
      await api(`/api/lessons/${currentLessonId}/approve`, { reviewed: true });
      document.querySelector('#draft-content .status-pill').textContent = 'TRAINER APPROVED';
      statusLine('draft-feedback', 'Trainer approval saved with an audit record.');
      showToast('Lesson approved and saved.');
    } else {
      const note = document.getElementById('feedback-text').value.trim();
      await api('/api/feedback/1/approve', { text: note, reviewed: true });
      statusLine('review-feedback', 'Feedback approval saved with an audit record.');
      showToast('Feedback approved and saved.');
    }
  } catch (error) {
    statusLine(button.id === 'share-feedback' ? 'review-feedback' : 'draft-feedback', error.message, true);
  }
}, true);

document.addEventListener('submit', async event => {
  if (event.target.id !== 'copilot-form') return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  const input = document.getElementById('copilot-input');
  const question = input.value.trim();
  if (!question) return;
  try {
    const result = await api('/api/questions', { question });
    const answer = document.getElementById('copilot-answer');
    answer.textContent = result.answer;
    const source = document.createElement('span');
    source.className = 'source-tag';
    source.textContent = result.source ? `Source: ${result.source} · Trainer review required` : 'No approved source found · Ask a trainer';
    answer.append(document.createElement('br'), document.createElement('br'), source);
    input.value = '';
  } catch (error) {
    document.getElementById('copilot-answer').textContent = error.message;
  }
}, true);
