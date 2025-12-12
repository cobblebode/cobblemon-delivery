const Rcon = require('rcon-client').Rcon;
const http = require('http');
require('dotenv').config();

async function deliver() {
  try {
const response = await fetch('https://cobblebode.mocha.app/api/delivery/pending');

if (!response.ok) {
  console.log('API retornou erro:', response.status);
  return;
}

const text = await response.text();
let orders;

try {
  orders = JSON.parse(text);
} catch (e) {
  console.log('Resposta nao é JSON valido:', text.substring(0, 100));
  return;
}

if (!orders || orders.length === 0) {
  console.log('Nenhum pedido pendente');
  return;
}

for (let i = 0; i < orders.length; i++) {
  const order = orders[i];
  console.log('Entregando pedido #' + order.id + ' para ' + order.player_name);

  const rcon = new Rcon({
    host: process.env.RCON_HOST,
    port: Number(process.env.RCON_PORT),
    password: process.env.RCON_PASSWORD
  });

  await rcon.connect();
  await rcon.send(order.command);
  await rcon.end();

  await fetch('https://cobblebode.mocha.app/api/delivery/complete/' + order.id, {
    method: 'POST'
  });

  console.log('Pedido #' + order.id + ' entregue!');
}
  } catch (error) {
console.error('Erro geral:', error.message);
  }
}

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Sistema de entrega automatica rodando');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Sistema iniciado na porta ' + PORT);
  deliver();
  setInterval(deliver, 30000);
});
