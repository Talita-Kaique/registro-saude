# Registro de Sinais Vitais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um site estático de registro de sinais vitais (PA, FC, SpO2, Glicemia, Peso, Água, Diurese) que grava cada lançamento como uma linha em uma planilha do Google Sheets via Google Apps Script, acessível de qualquer dispositivo via GitHub Pages.

**Architecture:** Frontend estático (HTML/CSS/JS puro, sem framework nem build step) com um módulo de validação isolado e testável via Node. O JS do formulário faz `fetch` POST/GET para um Web App do Google Apps Script (fornecido como código de referência, colado manualmente no editor do Google). Um servidor mock local (Node, sem dependências) simula o Apps Script durante o desenvolvimento, permitindo testar o fluxo completo no navegador antes de configurar a planilha real.

**Tech Stack:** HTML5, CSS3, JavaScript (ES5, sem transpilação), Node.js (apenas para rodar testes e o mock server, nenhuma dependência de npm), Google Apps Script.

---

## Task 1: Validação de dados (TDD)

**Files:**
- Create: `validation.js`
- Test: `tests/validation.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/validation.test.js`:

```js
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
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node tests/validation.test.js`
Expected: erro `Cannot find module '../validation.js'`

- [ ] **Step 3: Implementar `validation.js`**

Create `validation.js`:

```js
(function (root) {
  var CAMPOS_NUMERICOS = [
    'paSistolica', 'paDiastolica', 'fc', 'spo2',
    'glicemia', 'peso', 'agua', 'diurese'
  ];

  function preenchido(valor) {
    return valor !== '' && valor !== null && valor !== undefined;
  }

  function validarLancamento(dados) {
    var erros = [];

    CAMPOS_NUMERICOS.forEach(function (campo) {
      var valor = dados[campo];
      if (preenchido(valor)) {
        var numero = Number(valor);
        if (isNaN(numero)) {
          erros.push('Valor inválido em ' + campo);
        } else if (numero < 0) {
          erros.push('Valor não pode ser negativo em ' + campo);
        }
      }
    });

    var algumPreenchido = CAMPOS_NUMERICOS.some(function (campo) {
      return preenchido(dados[campo]);
    });

    if (!algumPreenchido) {
      erros.push('Preencha ao menos um sinal vital');
    }

    if (!dados.dataHora) {
      erros.push('Data/hora é obrigatória');
    }

    return { valido: erros.length === 0, erros: erros };
  }

  var api = { validarLancamento: validarLancamento, CAMPOS_NUMERICOS: CAMPOS_NUMERICOS };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Validation = api;
  }
})(typeof window !== 'undefined' ? window : this);
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node tests/validation.test.js`
Expected: 5 linhas `PASS: ...`, nenhuma `FAIL`, exit code 0

- [ ] **Step 5: Commit**

```bash
git add validation.js tests/validation.test.js
git commit -m "feat: validação de lançamentos com testes"
```

---

## Task 2: Estrutura HTML e CSS do formulário

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `config.js`

- [ ] **Step 1: Criar `config.js`**

```js
const CONFIG = {
  APPS_SCRIPT_URL: 'COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT'
};
```

- [ ] **Step 2: Criar `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Registro de Sinais Vitais</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<main>
  <h1>Registro de Sinais Vitais</h1>

  <form id="form-registro">
    <label>
      Data/Hora
      <input type="datetime-local" id="dataHora" name="dataHora" required>
    </label>

    <fieldset>
      <legend>Pressão Arterial</legend>
      <label>
        Sistólica (mmHg)
        <input type="number" id="paSistolica" name="paSistolica" min="0" step="1">
      </label>
      <label>
        Diastólica (mmHg)
        <input type="number" id="paDiastolica" name="paDiastolica" min="0" step="1">
      </label>
    </fieldset>

    <label>
      Frequência Cardíaca (bpm)
      <input type="number" id="fc" name="fc" min="0" step="1">
    </label>

    <label>
      SpO2 (%)
      <input type="number" id="spo2" name="spo2" min="0" max="100" step="1">
    </label>

    <label>
      Glicemia (mg/dL)
      <input type="number" id="glicemia" name="glicemia" min="0" step="1">
    </label>

    <label>
      Peso (kg)
      <input type="number" id="peso" name="peso" min="0" step="0.1">
    </label>

    <label>
      Ingesta de Água (L)
      <input type="number" id="agua" name="agua" min="0" step="0.1">
    </label>

    <label>
      Diurese (ml)
      <input type="number" id="diurese" name="diurese" min="0" step="1">
    </label>

    <button type="submit">Registrar</button>
  </form>

  <p id="mensagem" role="status"></p>

  <section>
    <h2>Últimos registros</h2>
    <ul id="lista-historico"></ul>
  </section>
</main>

<script src="config.js"></script>
<script src="validation.js"></script>
<script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 3: Criar `style.css`**

```css
:root {
  color-scheme: light dark;
  --cor-fundo: #f5f7fa;
  --cor-texto: #1a1a1a;
  --cor-borda: #cbd5e1;
  --cor-primaria: #2563eb;
  --cor-erro: #b91c1c;
  --cor-sucesso: #15803d;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 1rem;
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--cor-fundo);
  color: var(--cor-texto);
}

main {
  max-width: 480px;
  margin: 0 auto;
}

h1 { font-size: 1.4rem; }

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}

fieldset {
  border: 1px solid var(--cor-borda);
  border-radius: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

input {
  padding: 0.5rem;
  border: 1px solid var(--cor-borda);
  border-radius: 0.375rem;
  font-size: 1rem;
}

button {
  padding: 0.75rem;
  background: var(--cor-primaria);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
}

#mensagem.erro { color: var(--cor-erro); }
#mensagem.sucesso { color: var(--cor-sucesso); }

#lista-historico {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

#lista-historico li {
  background: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
}
```

- [ ] **Step 4: Commit**

```bash
git add index.html style.css config.js
git commit -m "feat: estrutura do formulário e estilos"
```

---

## Task 3: Lógica do formulário e histórico

**Files:**
- Create: `script.js`

- [ ] **Step 1: Criar `script.js`**

```js
(function () {
  var form = document.getElementById('form-registro');
  var mensagem = document.getElementById('mensagem');
  var listaHistorico = document.getElementById('lista-historico');
  var CAMPOS = Validation.CAMPOS_NUMERICOS;

  function preencherDataHoraAtual() {
    var agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    document.getElementById('dataHora').value = agora.toISOString().slice(0, 16);
  }

  function coletarDados() {
    var dados = { dataHora: document.getElementById('dataHora').value };
    CAMPOS.forEach(function (campo) {
      dados[campo] = document.getElementById(campo).value;
    });
    return dados;
  }

  function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = tipo;
  }

  function renderizarHistorico(registros) {
    listaHistorico.innerHTML = '';
    registros.forEach(function (registro) {
      var item = document.createElement('li');
      var partes = [registro.dataHora];
      CAMPOS.forEach(function (campo) {
        if (registro[campo] !== '' && registro[campo] !== undefined && registro[campo] !== null) {
          partes.push(campo + ': ' + registro[campo]);
        }
      });
      item.textContent = partes.join(' — ');
      listaHistorico.appendChild(item);
    });
  }

  function carregarHistorico() {
    fetch(CONFIG.APPS_SCRIPT_URL)
      .then(function (resposta) { return resposta.json(); })
      .then(renderizarHistorico)
      .catch(function () {
        listaHistorico.innerHTML = '<li class="erro">Não foi possível carregar o histórico.</li>';
      });
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    var dados = coletarDados();
    var resultado = Validation.validarLancamento(dados);

    if (!resultado.valido) {
      mostrarMensagem(resultado.erros.join('; '), 'erro');
      return;
    }

    // Sem header Content-Type explícito: o fetch envia como text/plain,
    // o que mantém a requisição como "simple request" e evita o preflight
    // CORS (OPTIONS) que o Web App do Apps Script não trata.
    fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(dados)
    })
      .then(function (resposta) {
        if (!resposta.ok) throw new Error('Falha no envio');
        return resposta.json();
      })
      .then(function () {
        mostrarMensagem('Registro salvo com sucesso.', 'sucesso');
        form.reset();
        preencherDataHoraAtual();
        carregarHistorico();
      })
      .catch(function () {
        mostrarMensagem('Não foi possível salvar. Verifique sua conexão e tente novamente.', 'erro');
      });
  });

  preencherDataHoraAtual();
  carregarHistorico();
})();
```

- [ ] **Step 2: Commit**

```bash
git add script.js
git commit -m "feat: envio do formulário e carregamento do histórico"
```

---

## Task 4: Servidor mock para testes locais

**Files:**
- Create: `mock-server.js`

- [ ] **Step 1: Criar `mock-server.js`**

```js
const http = require('http');

let registros = [];

function definirCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

const servidor = http.createServer(function (req, res) {
  definirCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(registros.slice(-10).reverse()));
    return;
  }

  if (req.method === 'POST') {
    let corpo = '';
    req.on('data', function (pedaco) { corpo += pedaco; });
    req.on('end', function () {
      const dados = JSON.parse(corpo);
      registros.push(dados);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  res.writeHead(405);
  res.end();
});

const PORTA = 8787;
servidor.listen(PORTA, function () {
  console.log('Mock server rodando em http://localhost:' + PORTA);
});
```

- [ ] **Step 2: Rodar e confirmar que sobe**

Run: `node mock-server.js` (em background/terminal separado)
Expected: `Mock server rodando em http://localhost:8787`

- [ ] **Step 3: Commit**

```bash
git add mock-server.js
git commit -m "chore: servidor mock para testar o formulário sem o Apps Script real"
```

---

## Task 5: Verificação manual no navegador

**Files:**
- Modify: `config.js` (temporariamente, revertido no último step)

- [ ] **Step 1: Apontar `config.js` para o mock server**

Edit `config.js`, trocar `APPS_SCRIPT_URL` para `'http://localhost:8787'`.

- [ ] **Step 2: Subir o mock server em background**

Run: `node mock-server.js` (background)

- [ ] **Step 3: Servir os arquivos estáticos e abrir no navegador**

Run: `npx --yes serve -l 5500 .` (background, na pasta `registro-saude`)

Abrir `http://localhost:5500` no Browser tool.

- [ ] **Step 4: Testar cenário de sucesso**

Preencher Peso = 70 e Frequência Cardíaca = 72, clicar em "Registrar".
Expected: mensagem "Registro salvo com sucesso." em verde, formulário limpo, item aparece em "Últimos registros".

- [ ] **Step 5: Testar validação de campo negativo**

Preencher Peso = -10, clicar em "Registrar".
Expected: mensagem de erro em vermelho citando "peso", nada é enviado (lista de histórico não ganha item novo).

- [ ] **Step 6: Testar envio vazio**

Limpar todos os campos exceto Data/Hora, clicar em "Registrar".
Expected: mensagem de erro "Preencha ao menos um sinal vital".

- [ ] **Step 7: Testar falha de conexão**

Parar o mock server (Ctrl+C no processo), preencher Peso = 70, clicar em "Registrar".
Expected: mensagem de erro "Não foi possível salvar. Verifique sua conexão e tente novamente.", valores permanecem no formulário.

- [ ] **Step 8: Reverter `config.js`**

Edit `config.js` de volta para `'COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT'`.

- [ ] **Step 9: Commit**

```bash
git add config.js
git commit -m "chore: reverte config.js para placeholder após verificação manual" --allow-empty
```

---

## Task 6: Código do Google Apps Script

**Files:**
- Create: `apps-script/Code.gs`

- [ ] **Step 1: Criar `apps-script/Code.gs`**

```javascript
var SHEET_NAME = 'Registros';
var CAMPOS = ['paSistolica', 'paDiastolica', 'fc', 'spo2', 'glicemia', 'peso', 'agua', 'diurese'];

function doPost(e) {
  var dados = JSON.parse(e.postData.contents);
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  var linha = [dados.dataHora];
  CAMPOS.forEach(function (campo) {
    var valor = dados[campo];
    linha.push(valor === '' || valor === undefined || valor === null ? '' : Number(valor));
  });

  planilha.appendRow(linha);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var valores = planilha.getDataRange().getValues();

  var linhas = valores.slice(1);
  var ultimas = linhas.slice(-10).reverse();

  var registros = ultimas.map(function (linha) {
    var registro = { dataHora: linha[0] };
    CAMPOS.forEach(function (campo, indice) {
      registro[campo] = linha[indice + 1];
    });
    return registro;
  });

  return ContentService
    .createTextOutput(JSON.stringify(registros))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps-script/Code.gs
git commit -m "feat: código do Google Apps Script (doPost/doGet)"
```

---

## Task 7: Documentação de configuração

**Files:**
- Create: `README.md`

- [ ] **Step 1: Criar `README.md`**

```markdown
# Registro de Sinais Vitais

Site para lançar Pressão Arterial, Frequência Cardíaca, SpO2, Glicemia, Peso,
Ingesta de água e Diurese, gravando cada lançamento em uma planilha do Google
Sheets.

## Configuração

### 1. Criar a planilha

1. Crie uma planilha nova no Google Sheets.
2. Renomeie a primeira aba para `Registros`.
3. Na linha 1, adicione o cabeçalho, uma coluna por célula:
   `Data/Hora | PA Sistólica | PA Diastólica | FC (bpm) | SpO2 (%) | Glicemia (mg/dL) | Peso (kg) | Água (L) | Diurese (ml)`

### 2. Publicar o Apps Script

1. Na planilha, vá em **Extensões > Apps Script**.
2. Apague o conteúdo padrão e cole o conteúdo de `apps-script/Code.gs` deste
   repositório.
3. Salve o projeto.
4. Clique em **Implantar > Nova implantação**.
5. Tipo: **App da Web**. Executar como: **Eu**. Quem tem acesso:
   **Qualquer pessoa**.
6. Clique em **Implantar** e autorize as permissões solicitadas (é a sua
   própria conta Google acessando a sua própria planilha).
7. Copie a **URL do app da Web** gerada.

### 3. Ligar o site à planilha

1. Abra `config.js` neste repositório.
2. Substitua `COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT` pela URL copiada no passo
   anterior.

### 4. Publicar no GitHub Pages

1. Crie um repositório novo no GitHub e suba os arquivos deste projeto.
2. Vá em **Settings > Pages**.
3. Em **Source**, selecione a branch principal e a pasta raiz (`/`).
4. Salve. Após alguns instantes, o GitHub mostra a URL pública do site
   (formato `https://<seu-usuario>.github.io/<repositorio>/`).
5. Acesse essa URL de qualquer dispositivo, incluindo o celular.

## Testes

Rodar os testes de validação:

```bash
node tests/validation.test.js
```

Testar o formulário localmente sem depender da planilha real (veja o passo a
passo completo no plano de implementação, Task 5):

```bash
node mock-server.js
```

E aponte temporariamente `config.js` para `http://localhost:8787`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: passo a passo de configuração"
```

---

## Self-Review Notes

- Cobertura do spec: estrutura da planilha (Task 6), formulário com todos os
  campos (Task 2/3), PA em dois campos (Task 1-3), diurese em ml (Task 1-3),
  histórico dos últimos registros (Task 3/6), validação de negativos e campo
  obrigatório (Task 1), tratamento de erro de envio sem perder dados
  digitados (Task 3, verificado na Task 5), hospedagem via GitHub Pages
  (Task 7). Nenhuma lacuna encontrada.
- Nomes de campos (`paSistolica`, `paDiastolica`, `fc`, `spo2`, `glicemia`,
  `peso`, `agua`, `diurese`, `dataHora`) são consistentes entre
  `validation.js`, `index.html`, `script.js`, `mock-server.js` e
  `apps-script/Code.gs`.
