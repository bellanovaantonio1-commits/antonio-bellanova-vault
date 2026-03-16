/**
 * PM2-Konfiguration für Antonio Bellanova Vault.
 * Vorher auf dem Server: .env prüfen, npm run build, dann:
 *   pm2 delete vault 2>/dev/null; pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "vault",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: { NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      error_file: "logs/pm2-err.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
