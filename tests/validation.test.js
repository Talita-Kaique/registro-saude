const assert = require('assert');
const { validarLancamento } = require('../validation.js');

function test(nome, fn) {
  try {
    fn();
    console.log('PASS: ' + nome);
  } catch (e) {
    console.error('FAIL: ' + nome);
    console.error(e);
    process.exitCode = 1;
  }
}

test('aceita lançamento com PA preenchida e resto vazio', () => {
  const resultado = validarLancamento({
    dataHora: '2026-09-02T10:00',
    paSistolica: '120',
    paDiastolica: '80',
    fc: '', spo2: '', glicemia: '', peso: '', agua: '', diurese: ''
  });
  assert.strictEqual(resultado.valido, true);
  assert.deepStrictEqual(resultado.erros, []);
});

test('rejeita lançamento totalmente vazio', () => {
  const resultado = validarLancamento({
    dataHora: '2026-09-02T10:00',
    paSistolica: '', paDiastolica: '', fc: '', spo2: '',
    glicemia: '', peso: '', agua: '', diurese: ''
  });
  assert.strictEqual(resultado.valido, false);
  assert.ok(resultado.erros.includes('Preencha ao menos um sinal vital'));
});

test('rejeita valor negativo', () => {
  const resultado = validarLancamento({
    dataHora: '2026-09-02T10:00',
    peso: '-5', paSistolica: '', paDiastolica: '', fc: '', spo2: '',
    glicemia: '', agua: '', diurese: ''
  });
  assert.strictEqual(resultado.valido, false);
  assert.ok(resultado.erros.some((e) => e.indexOf('peso') !== -1));
});

test('rejeita lançamento sem data/hora', () => {
  const resultado = validarLancamento({
    dataHora: '', peso: '70', paSistolica: '', paDiastolica: '', fc: '',
    spo2: '', glicemia: '', agua: '', diurese: ''
  });
  assert.strictEqual(resultado.valido, false);
  assert.ok(resultado.erros.includes('Data/hora é obrigatória'));
});

test('rejeita valor não numérico', () => {
  const resultado = validarLancamento({
    dataHora: '2026-09-02T10:00',
    peso: 'abc', paSistolica: '', paDiastolica: '', fc: '', spo2: '',
    glicemia: '', agua: '', diurese: ''
  });
  assert.strictEqual(resultado.valido, false);
});
