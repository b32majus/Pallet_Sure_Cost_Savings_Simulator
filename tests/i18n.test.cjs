const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../i18n.js'), 'utf8');
function makeI18n() {
  const root = {};
  const document = {
    documentElement: {lang: 'es'},
    createTreeWalker: () => ({nextNode: () => null}),
    querySelectorAll: () => [],
    querySelector: () => null
  };
  vm.runInNewContext(src, {
    window: root, document, NodeFilter: {SHOW_TEXT: 4, FILTER_REJECT: 2, FILTER_ACCEPT: 1},
    localStorage: {getItem: () => null, setItem: () => {}}
  });
  return {i18n: root.PalletI18n, document};
}
test('language switch updates document language and preserves Spanish default', () => {
  const {i18n, document} = makeI18n();
  assert.equal(i18n.language, 'es');
  assert.equal(i18n.translate('Mano de obra'), 'Mano de obra');
  i18n.setLanguage('en');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(i18n.translate('Mano de obra'), 'Labour');
  assert.equal(i18n.translate('El impuesto se añade por separado: verifica que sea exigible y no esté incluido en el precio del film.'),
    'Tax is added separately: check that it applies and is not already included in the film price.');
  i18n.setLanguage('es');
  assert.equal(document.documentElement.lang, 'es');
  assert.equal(i18n.translate('Mano de obra'), 'Mano de obra');
});
test('dynamic results and shared summaries are translated without altering euro amounts', () => {
  const {i18n} = makeI18n();
  const example = {pallets: '500', film: '1050,00 €', fix: '23,33 €', savings: '1026,67 €', investment: '5,00 €', url: ''};
  i18n.setLanguage('en');
  assert.match(i18n.phrase('savings', {percent: '97,8'}), /reduce annual costs by 97,8%/);
  assert.match(i18n.phrase('days', {number: '1,8'}), /1,8 days/);
  const text = i18n.phrase('shareBody', example);
  assert.match(text, /Pallets\/year: 500/);
  assert.match(text, /Annual stretch-film cost: 1050,00 €/);
  assert.match(text, /Annual FIXBOX cost: 23,33 €/);
  i18n.setLanguage('es');
  assert.match(i18n.phrase('shareBody', example), /Palés\/año: 500/);
});