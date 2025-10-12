module.exports = {
    apps: [{
        name: "lafia-backend",
        script: "dist/server.js",
        env_file: ".env", // PM2 loads this file automatically
        env: {
            NODE_ENV: "production"
        }
    }]
};