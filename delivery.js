const Rcon = require('rcon-client').Rcon;
const http = require('http');
require('dotenv').config();

async function deliver() {
  try {
const response = await fetch('https://cobblebode.mocha.app/api/delivery/pending');
const orders = await response.json();

for (let i = 0; i < orders.length; i++) {
  const order = orders[i];
  console.log('Entregando pedido #' + order.id);

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

  console.log('Entregue!');
}
  } catch (error) {
console.error('Erro:', error.message);
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
