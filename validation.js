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
