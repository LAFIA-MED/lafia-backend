module.exports = {
    apps: [
        {
            name: "lafia-backend",
            script: "dist/server.js",

            // Automatically load environment variables from your .env file
            env_file: ".env",

            // Default environment (for dev/local runs)
            env: {
                NODE_ENV: "development"
            },

            // Production environment block (used when you run with --env production)
            env_production: {
                NODE_ENV: "production"
            }
        }
    ]
};