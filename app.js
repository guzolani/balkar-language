const vocabulary = window.COURSE_WORDS || [
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
let activeModule = 0;

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
  if (target === 'grammar') renderGrammar();
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
  document.getElementById('typedAnswer').value = '';
  document.getElementById('typedFeedback').classList.add('hidden');
  document.getElementById('typingPractice').classList.remove('hidden');
}

document.getElementById('revealButton').addEventListener('click', () => {
  document.getElementById('cardAnswer').classList.remove('hidden');
  document.getElementById('ratingButtons').classList.remove('hidden');
  document.getElementById('revealButton').classList.add('hidden');
  document.getElementById('typingPractice').classList.add('hidden');
});

function normalizeAnswer(value) { return value.toLowerCase().replace(/[!?.,—–-]/g, '').replace(/\s+/g, ' ').trim(); }
document.getElementById('checkTyped').addEventListener('click', () => {
  const input = document.getElementById('typedAnswer').value;
  const expected = vocabulary[cardIndex].balkar;
  const feedback = document.getElementById('typedFeedback');
  feedback.classList.remove('hidden', 'correct', 'wrong');
  if (!input.trim()) { feedback.classList.add('wrong'); feedback.textContent = 'Сначала напишите свой вариант.'; return; }
  if (normalizeAnswer(input) === normalizeAnswer(expected)) { feedback.classList.add('correct'); feedback.textContent = 'Верно! Написание совпадает.'; }
  else { feedback.classList.add('wrong'); feedback.innerHTML = `Пока не совпало. Правильный вариант: <b>${expected}</b>`; }
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
  const results = vocabulary.filter(item => (activeFilter === 'all' || item.category === activeFilter || item.topic === activeFilter) && `${item.balkar} ${item.russian}`.toLowerCase().includes(query));
  document.getElementById('dictionaryList').innerHTML = results.length ? results.map(item => `
    <article class="dictionary-item"><div><h3>${item.balkar}</h3><p>${item.russian}</p><small>${item.topic || (item.category === 'greeting' ? 'Приветствия' : 'Прощание')}</small></div></article>
  `).join('') : '<div class="empty">Ничего не найдено</div>';
}

const guidance = {
  alphabet:['Прочитайте слово целиком и найдите особое сочетание.','Не разделяйте къ, гъ и нг на самостоятельные звуки при анализе.','Для балкарского варианта в начале слова пишем ж: жол, жаз.'],
  harmony:['Определите последнюю гласную основы.','Отнесите её к твёрдому или мягкому ряду.','Выберите вариант окончания с гласной того же ряда.'],
  plural:['Твёрдая основа получает -ла: адамла, арбазла.','Мягкая основа получает -ле: терекле, эгечле.','После числа: юч адам, а не юч адамла.'],
  'who-what':['В карачаево-балкарском языке грамматического рода нет: ол может означать «он» и «она».','Личное окончание присоединяется к имени и показывает, о ком идёт речь.','Сначала найдите подлежащее, затем поставьте именную часть сказуемого в конец.'],
  'at-home':['Местное значение передаётся окончанием -да/-де.','Форма окончания зависит от последней гласной основы.','Личное окончание ставится после показателя места.'],
  'speak':['Нейтральный порядок: подлежащее + дополнение + глагол.','Отсутствующий субъект часто понятен из личного окончания.','При перестановке слов меняется акцент, поэтому начинаем с нейтральной схемы.'],
  questions:['Ким — кто, не — что, къайда — где, къайры — куда, къайдан — откуда.','Вопросительное слово занимает позицию неизвестной части ответа.','Для вопроса без вопросительного слова используются -мы/-ми/-му/-мю.'],
  negative:['Бар означает наличие, жокъ — отсутствие.','Огъай выражает несогласие «нет».','В глаголе отрицание -ма/-ме стоит перед показателем времени.'],
  family:['Сначала образуется основа, затем множественное число, потом принадлежность.','-ла/-ле выбирается по гармонии гласных.','Принадлежность можно уточнить формой мени, сени и личным окончанием.'],
  direction:['Къайры? требует формы направления -гъа/-ге/-къа/-ке.','Къайда? требует местной формы -да/-де.','Къайдан? требует исходной формы -дан/-ден.'],
  tenses:['Прошедшее завершённое действие использует формы типа -ды/-ди.','Будущее намерение выражается формами -рыкъ/-рик и вариантами по гармонии.','Слова времени помогают выбрать форму и обычно стоят ближе к началу.']
};
function shuffled(items) { return items.map(value => ({value, sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(x=>x.value); }
function explainBuild(actual, expected) {
  if (!actual.length) return 'Вы ещё не добавили ни одного слова.';
  if (actual.length < expected.length) return `Не хватает слов: выбрано ${actual.length} из ${expected.length}.`;
  if (actual.length > expected.length) return 'В ответе есть лишние слова.';
  const wrong = actual.findIndex((word,i)=>normalizeAnswer(word)!==normalizeAnswer(expected[i]));
  if (wrong >= 0) return `Проверьте позицию ${wrong+1}: здесь ожидается «${expected[wrong]}». В нейтральном предложении сказуемое обычно находится в конце.`;
  return '';
}
function renderGrammar() {
  const modules = window.GRAMMAR_MODULES || [];
  document.getElementById('moduleTabs').innerHTML = modules.map((module, i) => `<button class="module-tab ${i === activeModule ? 'active' : ''}" data-module="${i}"><span>${i + 1}</span>${module.title}</button>`).join('');
  document.querySelectorAll('[data-module]').forEach(button => button.addEventListener('click', () => { activeModule = Number(button.dataset.module); renderGrammar(); }));
  const m = modules[activeModule]; if (!m) return;
  const tips = guidance[m.id] || [m.rule];
  const tasks = m.examples.map((example,i)=>({id:i,target:example[0],prompt:example[1],words:example[0].split(' ')}));
  document.getElementById('grammarLesson').innerHTML = `<div class="grammar-head"><span>МОДУЛЬ ${activeModule + 1} · ПО МЕТОДИКЕ «АНА ТИЛ»</span><h2>${m.title}</h2><p>${m.subtitle}</p></div><section class="rule-box"><strong>Основной принцип</strong><p>${m.rule}</p><ol>${tips.map(t=>`<li>${t}</li>`).join('')}</ol></section><section><h3>Разберите примеры</h3><div class="example-list">${m.examples.map((e,i) => `<div><i>${i+1}</i><b>${e[0]}</b><span>${e[1]}</span></div>`).join('')}</div></section><section><h3>Практика: соберите предложения</h3><p class="section-help">Нажимайте слова в нужном порядке. Слово в области ответа можно нажать, чтобы вернуть назад.</p>${tasks.map(task=>`<div class="builder" data-builder="${task.id}"><p>Переведите: <b>${task.prompt}</b></p><div class="answer-zone" data-answer="${task.id}"><span>Ваш ответ</span></div><div class="word-bank" data-bank="${task.id}">${shuffled(task.words).map((w,j)=>`<button draggable="true" data-word="${w}" data-token="${task.id}-${j}">${w}</button>`).join('')}</div><button class="primary-button check-builder" data-check="${task.id}">Проверить</button><button class="reset-builder" data-reset="${task.id}">Сбросить</button><p class="feedback hidden" data-feedback="${task.id}"></p></div>`).join('')}</section><section><h3>Перевод в обратную сторону</h3>${m.examples.map((e,i)=>`<label class="translation-task"><span>${e[0]}</span><input data-translation="${i}" placeholder="Переведите на русский"><button data-check-translation="${i}">Проверить</button><small class="hidden"></small></label>`).join('')}</section><section><h3>Короткий диалог</h3><div class="dialogue">${m.dialogue.map((d,i)=>`<div class="${i%2?'reply':''}"><b>${d[0]}</b><span>${d[1]}</span></div>`).join('')}</div></section>`;
  document.querySelectorAll('.word-bank button').forEach(button=>{button.addEventListener('click',()=>document.querySelector(`[data-answer="${button.dataset.token.split('-')[0]}"]`).append(button));button.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',button.dataset.token));});
  document.querySelectorAll('.answer-zone').forEach(zone=>{zone.addEventListener('dragover',e=>e.preventDefault());zone.addEventListener('drop',e=>{e.preventDefault();const b=document.querySelector(`[data-token="${e.dataTransfer.getData('text/plain')}"]`);if(b)zone.append(b);});zone.addEventListener('click',e=>{if(e.target.tagName==='BUTTON')document.querySelector(`[data-bank="${zone.dataset.answer}"]`).append(e.target);});});
  document.querySelectorAll('[data-reset]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.reset,bank=document.querySelector(`[data-bank="${id}"]`),zone=document.querySelector(`[data-answer="${id}"]`);zone.querySelectorAll('button').forEach(b=>bank.append(b));document.querySelector(`[data-feedback="${id}"]`).classList.add('hidden');}));
  document.querySelectorAll('[data-check]').forEach(button=>button.addEventListener('click',()=>{const task=tasks[Number(button.dataset.check)],actual=[...document.querySelector(`[data-answer="${task.id}"]`).querySelectorAll('button')].map(b=>b.dataset.word),expected=task.words,feedback=document.querySelector(`[data-feedback="${task.id}"]`),error=explainBuild(actual,expected);feedback.classList.remove('hidden','correct','wrong');feedback.classList.add(error?'wrong':'correct');feedback.innerHTML=error?`${error}<br>Эталон: <b>${task.target}</b>`:'Верно! Порядок слов правильный.';}));
  document.querySelectorAll('[data-check-translation]').forEach(button=>button.addEventListener('click',()=>{const i=Number(button.dataset.checkTranslation),label=button.closest('label'),input=label.querySelector('input'),note=label.querySelector('small'),expected=m.examples[i][1];note.classList.remove('hidden','correct','wrong');const ok=normalizeAnswer(input.value)===normalizeAnswer(expected);note.classList.add(ok?'correct':'wrong');note.innerHTML=ok?'Верно.':`Ожидаемый перевод: <b>${expected}</b>`;}));
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

renderWeek(); renderCard(); renderDictionary(); renderGrammar(); updateStats();
