const LETTERS = ['A', 'B', 'C', 'D'];
let state = {
  screen: 'setup',
  topic: null,
  difficulty: 'Medium',
  currentQ: null,
  answered: false,
  timerInterval: null,
  timeLeft: 0,
  scoreData: null,
};

function render() {
  const app = document.getElementById('app');
  if (state.screen === 'setup')   app.innerHTML = setupHTML();
  if (state.screen === 'loading') app.innerHTML = loadingHTML();
  if (state.screen === 'quiz')    app.innerHTML = quizHTML();
  if (state.screen === 'score')   app.innerHTML = scoreHTML();
  attachListeners();
}

function setupHTML() {
  return `
  <div class="card">
    <div style="font-size:13px;color:var(--muted);font-family:'DM Mono',monospace;margin-bottom:12px">01 — choose topic</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:4px">What's your subject?</div>
    <div class="topic-grid">
      ${TOPICS.map(t => `
        <button class="topic-btn${state.topic === t.id ? ' selected' : ''}" data-topic="${t.id}">
          <span class="topic-icon">${t.icon}</span>${t.label}
        </button>`).join('')}
    </div>
  </div>
  <div class="card">
    <div style="font-size:13px;color:var(--muted);font-family:'DM Mono',monospace;margin-bottom:12px">02 — difficulty</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:4px">How brave are you?</div>
    <div class="diff-row">
      ${['Easy','Medium','Hard'].map(d => `
        <button class="diff-btn${state.difficulty === d ? ' sel-' + d.toLowerCase() : ''}" data-diff="${d}">${d}</button>
      `).join('')}
    </div>
  </div>
  <div style="max-width:640px">
    <button class="btn-primary" id="start-btn" ${!state.topic ? 'disabled' : ''}>Start Quiz →</button>
  </div>`;
}

function loadingHTML() {
  return `<div class="card" style="text-align:center;padding:48px 28px">
    <div class="spinner"></div>
    <div class="loading-text">Loading questions about ${state.topic}…</div>
  </div>`;
}

function quizHTML() {
  const q = state.currentQ;
  if (!q) return '';
  const pct = (q.index / q.total) * 100;
  const timePct = (state.timeLeft / q.timeLimit) * 100;
  const timerColor = timePct > 50 ? 'var(--green)' : timePct > 25 ? 'var(--amber)' : 'var(--red)';
  return `
  <div class="card">
    <div class="meta-row">
      <span><span class="tag">${q.topic}</span><span class="tag">${q.difficulty}</span></span>
      <span>Q${q.index + 1} of ${q.total} · Score: ${q.score}</span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div class="question-text">${q.question}</div>
    <div class="options" id="options">
      ${q.options.map((opt, i) => `
        <button class="opt-btn" data-opt="${i}" ${state.answered ? 'disabled' : ''}>
          <span class="letter-badge">${LETTERS[i]}</span>${opt}
        </button>`).join('')}
    </div>
    ${!state.answered ? `
      <div class="timer-bar">
        <div class="timer-fill" id="timer-fill" style="width:${timePct}%;background:${timerColor}"></div>
      </div>` : ''}
    <div id="explanation"></div>
    ${state.answered ? `<button class="btn-primary" id="next-btn">
      ${q.index + 1 < q.total ? 'Next Question →' : 'See Results →'}
    </button>` : ''}
  </div>`;
}

function scoreHTML() {
  const d = state.scoreData;
  if (!d) return '';
  const r = 56, circ = 2 * Math.PI * r, dash = (d.percent / 100) * circ;
  const msg = d.percent >= 90 ? ['🏆 Legendary!', 'You dominated that quiz!'] :
              d.percent >= 70 ? ['🎯 Great Job!', 'Solid performance!'] :
              d.percent >= 50 ? ['👍 Decent!', 'Room to grow!'] :
                                ['💪 Keep Practicing!', 'Review and try again!'];
  const correct = d.history.filter(h => h.correct).length;
  const wrong   = d.history.filter(h => !h.correct).length;
  return `<div class="card">
    <div class="score-ring">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--border)" stroke-width="8"/>
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="#7c5cfc" stroke-width="8"
          stroke-dasharray="${dash} ${circ}" stroke-linecap="round"/>
      </svg>
      <div class="score-label">
        <div class="score-num">${d.percent}%</div>
        <div class="score-of">${d.score}/${d.total}</div>
      </div>
    </div>
    <div class="msg">${msg[0]}</div>
    <div class="msg-sub">${msg[1]}</div>
    <div class="stat-row">
      <div><div class="stat-val" style="color:var(--green)">${correct}</div><div class="stat-lbl">correct</div></div>
      <div><div class="stat-val" style="color:var(--red)">${wrong}</div><div class="stat-lbl">wrong</div></div>
      <div><div class="stat-val" style="color:var(--accent)">${d.total}</div><div class="stat-lbl">total</div></div>
    </div>
    <div style="margin-top:20px">
      <div style="font-size:13px;color:var(--muted);font-family:'DM Mono',monospace;margin-bottom:10px">review answers</div>
      ${d.history.map((h, i) => `
        <div class="review-item ${h.correct ? 'r-correct' : 'r-wrong'}">
          <div class="review-q">Q${i+1}: ${h.question.substring(0,80)}${h.question.length>80?'…':''}</div>
          <div class="review-ans">Your answer: <span style="color:${h.correct?'var(--green)':'var(--red)'}">${h.yourAnswer}</span>
          ${!h.correct ? ` · Correct: <span style="color:var(--green)">${h.correctAnswer}</span>` : ''}</div>
        </div>`).join('')}
    </div>
    <button class="btn-primary" id="restart-btn">Play Again →</button>
    <button class="btn-secondary" id="new-topic-btn">Change Topic</button>
  </div>`;
}

function attachListeners() {
  document.querySelectorAll('[data-topic]').forEach(btn => {
    btn.addEventListener('click', () => { state.topic = btn.dataset.topic; render(); });
  });
  document.querySelectorAll('[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => { state.difficulty = btn.dataset.diff; render(); });
  });
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', startQuiz);
  document.querySelectorAll('[data-opt]').forEach(btn => {
    btn.addEventListener('click', () => submitAnswer(parseInt(btn.dataset.opt)));
  });
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) nextBtn.addEventListener('click', loadNextQuestion);
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', startQuiz);
  const newTopicBtn = document.getElementById('new-topic-btn');
  if (newTopicBtn) newTopicBtn.addEventListener('click', () => {
    state.topic = null; state.screen = 'setup'; render();
  });
}

async function startQuiz() {
  state.screen = 'loading';
  state.answered = false;
  clearInterval(state.timerInterval);
  render();
  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: state.topic, difficulty: state.difficulty }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed');
    await loadNextQuestion();
  } catch (e) {
    state.screen = 'setup';
    render();
    alert('Error: ' + e.message);
  }
}

async function loadNextQuestion() {
  clearInterval(state.timerInterval);
  state.answered = false;
  const res = await fetch('/question');
  const q = await res.json();
  if (q.done) { await loadResults(); return; }
  state.currentQ = q;
  state.timeLeft = q.timeLimit;
  state.screen = 'quiz';
  render();
  startTimer();
}

async function submitAnswer(selected) {
  if (state.answered) return;
  clearInterval(state.timerInterval);
  state.answered = true;
  const res = await fetch('/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected }),
  });
  const result = await res.json();
  document.querySelectorAll('.opt-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === result.correctIndex) btn.classList.add('correct');
    else if (i === selected) btn.classList.add('wrong');
    else btn.classList.add('reveal');
  });
  const expDiv = document.getElementById('explanation');
  if (expDiv) expDiv.innerHTML = `<div class="explanation">💡 ${result.explanation}</div>`;
  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.id = 'next-btn';
  btn.textContent = result.next ? 'Next Question →' : 'See Results →';
  btn.addEventListener('click', loadNextQuestion);
  document.querySelector('.options').parentElement.appendChild(btn);
}

async function loadResults() {
  const res = await fetch('/results');
  state.scoreData = await res.json();
  state.screen = 'score';
  render();
}

function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.answered) { clearInterval(state.timerInterval); return; }
    state.timeLeft--;
    const fill = document.getElementById('timer-fill');
    if (fill) {
      const pct = (state.timeLeft / state.currentQ.timeLimit) * 100;
      fill.style.width = pct + '%';
      fill.style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--amber)' : 'var(--red)';
    }
    if (state.timeLeft <= 0) { clearInterval(state.timerInterval); submitAnswer(-1); }
  }, 1000);
}

render();
