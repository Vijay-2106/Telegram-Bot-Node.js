module.exports = {
    apps: [
        {
            name: "TelegramBot",
            script: "./src/app.js",
            max_memory_restart: "300M",
            watch: true,
            ignore_watch: ["node_modules", "node_modules/*", "logs/*", "src/db/data.json"],
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            output: "logs/pm2/out.log",
            error: "logs/pm2/err.log",
            log: "logs/pm2/combined.outerr.log",
            env: { node_env: "development", port: 4500 },
            env_production: { node_env: "production", port: 4500 }
        }
    ]
};