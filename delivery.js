import Rcon from 'rcon-client';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const API_URL = 'https://cobblebode.mocha.app';
const RCON_CONFIG = {
  host: process.env.RCON_HOST,
  port: parseInt(process.env.RCON_PORT),
  password: process.env.RCON_PASSWORD,
};

// Build item command with proper JSON.stringify for custom_name
function buildItemCommand(playerName, itemMinecraftId, displayName) {
  const customName = JSON.stringify({ 
    text: displayName, 
    color: "gold", 
    bold: true 
  });
  return `give ${playerName} ${itemMinecraftId}[minecraft:custom_name='${customName}']`;
}

async function executeRconCommand(command) {
  const rcon = new Rcon.Rcon(RCON_CONFIG);
  
  try {
    await rcon.connect();
    const response = await rcon.send(command);
    await rcon.end();
    return { success: true, response };
  } catch (error) {
    console.error('RCON error:', error.message);
    try { await rcon.end(); } catch {}
    return { success: false, error: error.message };
  }
}

async function processPendingOrders() {
  try {
    const response = await fetch(`${API_URL}/api/delivery/pending`);
    
    if (!response.ok) {
      console.error('Failed to fetch pending orders:', response.status);
      return;
    }
    
    const orders = await response.json();
    
    if (!orders || orders.length === 0) {
      console.log('[' + new Date().toISOString() + '] No pending orders');
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Found ${orders.length} pending order(s)`);
    
    for (const order of orders) {
      console.log(`\nProcessing order #${order.id} for ${order.player_name}...`);
      
      let command;
      
      // Build command based on order type
      if (order.order_type === 'vip') {
        command = order.command; // VIP commands don't need special formatting
      } else if (order.order_type === 'item') {
        // Build item command with JSON.stringify
        command = buildItemCommand(
          order.player_name,
          order.item_minecraft_id,
          order.item_name
        );
      } else {
        console.error(`Unknown order type: ${order.order_type}`);
        continue;
      }
      
      console.log(`Command: ${command}`);
      
      const result = await executeRconCommand(command);
      
      if (result.success) {
        console.log(`✓ Delivered: ${result.response}`);
        
        // Mark as completed
        const completeResponse = await fetch(
          `${API_URL}/api/delivery/complete/${order.id}`,
          { method: 'POST' }
        );
        
        if (completeResponse.ok) {
          console.log(`✓ Order #${order.id} marked as completed`);
        } else {
          console.error(`✗ Failed to mark order #${order.id} as completed`);
        }
      } else {
        console.error(`✗ Delivery failed: ${result.error}`);
      }
    }
  } catch (error) {
    console.error('Error processing orders:', error.message);
  }
}

// Create HTTP server to prevent Render from spinning down
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CobbleBode Delivery Service Running\n');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
  console.log('Starting delivery service...');
  console.log(`API URL: ${API_URL}`);
  console.log(`RCON: ${RCON_CONFIG.host}:${RCON_CONFIG.port}\n`);
  
  // Start processing loop
  setInterval(processPendingOrders, 30000);
  processPendingOrders(); // Run immediately on start
});
