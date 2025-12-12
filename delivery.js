const Rcon = require('rcon-client').Rcon;
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

console.log('Sistema iniciado!');
deliver();
setInterval(deliver, 30000);
