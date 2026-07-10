const vocabulary = [
  { balkar: 'Салам алейкум!', russian: 'Здравствуйте!', note: 'Приветствие мужчины по отношению к мужчине', category: 'greeting' },
  { balkar: 'Кюн ашхы болсун!', russian: 'Добрый день!', note: 'Также используется как приветствие', category: 'greeting' },
  { balkar: 'Эртден ашхы болсун!', russian: 'Доброе утро!', note: '', category: 'greeting' },
  { balkar: 'Ингир ашхы болсун!', russian: 'Добрый вечер!', note: '', category: 'greeting' },
  { balkar: 'Халыгъыз къалайды?', russian: 'Как вы себя чувствуете?', note: 'Вежливое обращение', category: 'greeting' },
  { balkar: 'Сау къалыгъыз!', russian: 'До свидания!', note: 'Буквально: оставайтесь здоровы', category: 'farewell' },
  { balkar: 'Эсен тюбешейик!', russian: 'До встречи!', note: '', category: 'farewell' },
];

const state = JSON.parse(localStorage.getItem('balkar-progress') || '{"answers":0,"easy":0,"learned":[]}');
let cardIndex = 0;
let activeFilter = 'all';

function saveState() { localStorage.setItem('balkar-progress', JSON.stringify(state)); updateStats(); }

function setBackupStatus(message) {
  const label = document.getElementById('backupStatus');
  if (label) label.textContent = message;
}

function navigate(target) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`${target}View`).classList.add('active');
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.go === target));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (target === 'dictionary') renderDictionary();
  if (target === 'progress') updateStats();
}

document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));

function renderWeek() {
  const labels = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
  const today = (new Date().getDay() + 6) % 7;
  document.getElementById('weekProgress').innerHTML = labels.map((label, i) => `<div class="day ${i < today ? 'done' : ''} ${i === today ? 'done today' : ''}"><i>${i <= today ? '✓' : i + 1}</i>${label}</div>`).join('');
}

function renderCard() {
  const item = vocabulary[cardIndex];
  document.getElementById('cardRussian').textContent = item.russian;
  document.getElementById('cardBalkar').textContent = item.balkar;
  document.getElementById('cardNote').textContent = item.note || 'Фраза из тематического разговорника';
  document.getElementById('lessonStepLabel').textContent = `${cardIndex + 1} из ${vocabulary.length}`;
  document.getElementById('lessonProgressBar').style.width = `${((cardIndex + 1) / vocabulary.length) * 100}%`;
  document.getElementById('cardAnswer').classList.add('hidden');
  document.getElementById('ratingButtons').classList.add('hidden');
  document.getElementById('revealButton').classList.remove('hidden');
}

document.getElementById('revealButton').addEventListener('click', () => {
  document.getElementById('cardAnswer').classList.remove('hidden');
  document.getElementById('ratingButtons').classList.remove('hidden');
  document.getElementById('revealButton').classList.add('hidden');
});

document.querySelectorAll('[data-rating]').forEach(button => button.addEventListener('click', () => {
  state.answers += 1;
  if (button.dataset.rating === 'easy') {
    state.easy += 1;
    if (!state.learned.includes(cardIndex)) state.learned.push(cardIndex);
  }
  saveState();
  cardIndex = (cardIndex + 1) % vocabulary.length;
  renderCard();
}));

function renderDictionary() {
  const query = document.getElementById('dictionarySearch').value.trim().toLowerCase();
  const results = vocabulary.filter(item => (activeFilter === 'all' || item.category === activeFilter) && `${item.balkar} ${item.russian}`.toLowerCase().includes(query));
  document.getElementById('dictionaryList').innerHTML = results.length ? results.map(item => `
    <article class="dictionary-item"><div><h3>${item.balkar}</h3><p>${item.russian}</p><small>Из источника · ожидает проверки</small></div></article>
  `).join('') : '<div class="empty">Ничего не найдено</div>';
}

document.getElementById('dictionarySearch').addEventListener('input', renderDictionary);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === button));
  renderDictionary();
}));

document.getElementById('themeButton').addEventListener('click', () => document.body.classList.toggle('dark'));

document.getElementById('exportProgress').addEventListener('click', () => {
  const backup = { app: 'balkar', version: 1, exportedAt: new Date().toISOString(), progress: state };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `balkar-progress-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  setBackupStatus('Резервная копия создана');
});

document.getElementById('importProgress').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (backup.app !== 'balkar' || !backup.progress) throw new Error('Неверный формат');
    Object.assign(state, backup.progress);
    saveState();
    setBackupStatus('Прогресс успешно восстановлен');
  } catch {
    setBackupStatus('Не удалось прочитать резервную копию');
  }
  event.target.value = '';
});

let deferredInstallPrompt;
const installBanner = document.getElementById('installBanner');
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const dismissedInstall = localStorage.getItem('balkar-install-dismissed');
if (!isStandalone && !dismissedInstall) installBanner.classList.remove('hidden');

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.getElementById('installButton').classList.remove('hidden');
  document.getElementById('installHint').textContent = 'Установите сайт как приложение — он сможет работать даже без интернета.';
});

document.getElementById('installButton').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = undefined;
  installBanner.classList.add('hidden');
});

document.getElementById('installClose').addEventListener('click', () => {
  installBanner.classList.add('hidden');
  localStorage.setItem('balkar-install-dismissed', '1');
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

function updateStats() {
  document.getElementById('learnedStat').textContent = state.learned.length;
  document.getElementById('reviewStat').textContent = state.answers;
  document.getElementById('accuracyStat').textContent = state.answers ? `${Math.round(state.easy / state.answers * 100)}%` : '—';
  const progress = state.learned.length / vocabulary.length * 100;
  document.getElementById('roadmapFill').style.width = `${progress}%`;
  document.getElementById('roadmapText').textContent = state.learned.length ? `Вы уверенно знаете ${state.learned.length} из ${vocabulary.length} слов первого урока.` : 'Начните первый урок, чтобы увидеть прогресс.';
}

renderWeek(); renderCard(); renderDictionary(); updateStats();
