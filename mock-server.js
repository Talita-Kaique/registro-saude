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
