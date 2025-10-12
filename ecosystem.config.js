module.exports = {
    apps: [
        {
            name: "lafia-backend",
            script: "dist/server.js",
            env_file: "/var/www/html/lafia-backend/.env", // use ABSOLUTE path
            env: { NODE_ENV: "development" },
            env_production: { NODE_ENV: "production" }
        }
    ]
};