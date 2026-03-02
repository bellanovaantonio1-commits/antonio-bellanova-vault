// PM2-Konfiguration für Antonio Bellanova Vault
// Start: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [{
    name: 'vault',
    script: 'npm',
    args: 'start',
    cwd: __dirname,
    env: { NODE_ENV: 'production', PORT: 3000 },
    interpreter: 'none',
  }],
};
