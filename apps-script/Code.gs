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
