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
