import { wsManager } from './websocket-manager';
import { startGraphQLServer } from './graphql-server';

// Start WebSocket streaming (existing functionality)
wsManager.subscribeToMarket('BTC/USDT', '1m');

// Start GraphQL server for historical data
startGraphQLServer().catch(error => {
  console.error('❌ Failed to start GraphQL server:', error);
  process.exit(1);
});

console.log('🚀 Charting Service started:');
console.log('   📊 Socket.io server on port 3000 (real-time streaming)');
console.log('   📈 GraphQL server on port 4002 (historical data)');

