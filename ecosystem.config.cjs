// PM2-Konfiguration für Antonio Bellanova Vault
// Start: pm2 start ecosystem.config.cjs

const path = require('path');

module.exports = {
  apps: [{
    name: 'vault',
    script: path.join(__dirname, 'node_modules/.bin/tsx'),
    args: 'server.ts',
    cwd: __dirname,
    env: { NODE_ENV: 'production', PORT: 3000 },
    interpreter: 'node',
    max_restarts: 10,
    min_uptime: '5s',
  }],
};
