import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={window:{}};
vm.runInNewContext(fs.readFileSync('chapter-data.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('lesson-rules.js','utf8'),context);
const course=context.window.CHAPTER_COURSE;
assert.equal(course.chapters.length,2,'Должно быть две главы');
assert.equal(course.chapters[0].lessons.length,18,'ГЛАВА 1: 18 уроков');
assert.equal(course.chapters[1].lessons.length,16,'ГЛАВА 2: 16 уроков');
assert.equal(new Set(course.chapters.flatMap(c=>c.lessons.map(l=>l.id))).size,34,'ID уроков уникальны');
assert.equal(Object.keys(context.window.LESSON_RULES).length,34,'У каждого урока есть проверенное правило');
assert.equal(Object.keys(context.window.SENTENCE_BUILDS).length,34,'У каждого урока есть сборка предложения');
assert.equal(context.window.KB_ALPHABET.length,35,'В алфавите 35 букв');
assert.ok(!context.window.KB_ALPHABET.some(([letter])=>letter.startsWith('Ъ')||letter.startsWith('Ь')),'Ъ и Ь не считаются отдельными буквами в таблице курса');
for(const chapter of course.chapters)for(const [index,lesson] of chapter.lessons.entries()){
  assert.equal(lesson.number,index+1,`Числовой порядок: ${lesson.id}`);
  assert.ok(lesson.title,'Есть название');
  assert.ok(lesson.raw.length>30,`Есть материал: ${lesson.id}`);
  assert.match(lesson.source,/ГЛАВА [12]\.pdf/);
  const rule=context.window.LESSON_RULES[lesson.id];
  assert.equal(rule?.intro.length,2,`Есть раскрытие темы: ${lesson.id}`);
  assert.equal(rule?.steps.length,3,`Есть три логических шага: ${lesson.id}`);
  assert.ok(rule?.steps.every(step=>step.length===3&&step.every(Boolean)),`У каждого шага свой пример и перевод: ${lesson.id}`);
  assert.ok(rule?.examples.length>=6,`Есть расширенный набор примеров: ${lesson.id}`);
  const sentence=context.window.SENTENCE_BUILDS[lesson.id];
  assert.ok(sentence?.[0].split(' ').length>=2,`Предложение состоит минимум из двух слов: ${lesson.id}`);
  assert.ok(sentence?.[1].length>4,`Есть перевод предложения: ${lesson.id}`);
  if(lesson.exercise){
    assert.ok(lesson.raw.toLocaleLowerCase('ru').includes(lesson.exercise.answer.toLocaleLowerCase('ru')),`Ответ взят из источника: ${lesson.id}`);
    assert.ok(!lesson.exercise.answer.includes('❌'),`Ошибочный пример не стал ответом: ${lesson.id}`);
  }
}
assert.equal(course.chapters[0].lessons[15].title,'Местный падеж');
assert.equal(course.chapters[0].lessons[16].title,'Исходный падеж');
const html=fs.readFileSync('index.html','utf8');
for(const asset of ['course.css','review.css','explanations.css','lesson-game.css','lesson-rules.css','duolingo.css','chapter-data.js','lesson-rules.js','app.js'])assert.ok(html.includes(asset),`Подключён ${asset}`);
const sw=fs.readFileSync('sw.js','utf8');
for(const asset of ['course.css','review.css','explanations.css','lesson-game.css','lesson-rules.css','duolingo.css','chapter-data.js','lesson-rules.js'])assert.ok(sw.includes(asset),`SW кэширует ${asset}`);
const app=fs.readFileSync('app.js','utf8');
assert.ok(app.includes("r[2]==='review'"),'Есть прямой маршрут повторения главы');
assert.ok(!app.includes('Материал учебника без упрощения'),'Нечитаемый OCR-раздел удалён из интерфейса');
assert.ok(app.includes('Семь заданий'),'В каждом уроке есть расширенная игровая практика');
assert.ok(app.includes('Балкарский пример:</b>'),'В каждом шаге правила есть связанный балкарский пример');
assert.ok(app.includes('class="academic-note"'),'Есть академическое пояснение');
assert.ok(app.includes("type:'arrange'"),'Есть сборка предложения из слов');
assert.ok(app.includes('id="sentenceLab"'),'Сборка предложения видна отдельным блоком в каждом уроке');
assert.ok(app.includes('Перемешать заново'),'Пользователь может заново перемешать слова');
assert.ok(app.includes('bindSentenceLab(l)'),'Отдельный тренажёр подключён к каждому уроку');
for(const hiddenText of ['Источники:','исходное написание примеров сохранено','сверены со сборником','ОБЪЯСНЕНИЕ ПО АНА ТИЛ'])assert.ok(!app.includes(hiddenText),`Служебная подпись удалена: ${hiddenText}`);
assert.ok(!html.includes('Содержание основано на сборнике'),'Источник удалён из подвала сайта');
console.log('OK: 34 академических пояснения, 34 видимых сборки предложений, 7 игровых заданий и PWA проверены');
