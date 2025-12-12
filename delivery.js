const { Rcon } = require('rcon-client');
require('dotenv').config();

const SITE = 'https://cobblebode.mocha.app';
const RCON = {
  host: process.env.RCON_HOST,
  port: parseInt(process.env.RCON_PORT),
  password: process.env.RCON_PASSWORD
};

async function rcon(cmd) {
  const r = new Rcon(RCON);
  try {
await r.connect();
const res = await r.send(cmd);
await r.end();
return res;
  } catch (e) {
await r.end();
throw e;
  }
}

async function process() {
  try {
const res = await fetch(SITE + '/api/delivery/pending');
const orders = await res.json();

for (const o of orders) {
  console.log('[' + new Date().toISOString() + '] Entregando #' + o.id + ' para ' + o.player_name);
  await rcon(o.command);
  await fetch(SITE + '/api/delivery/complete/' + o.id, { method: 'POST' });
  console.log('Entregue!');
}
  } catch (e) {
console.error('Erro:', e.message);
  }
}

setInterval(process, 30000);
console.log('Sistema iniciado!');
process();
