module.exports = {
  apps: [{
    name: 'napijs',
    script: './dist/app/app.js',

    env: {
      NODE_ENV: 'development'
    },
    env_staging: {
      NODE_ENV: 'staging'
    },
    env_production: {
      NODE_ENV: 'production',
      APP_BUILD: 'SSR'
    }
  }]
};
