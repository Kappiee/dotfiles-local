const {
  baseDir,
  logDir,
  pm2Apps,
  getPm2Task,
  logFile,
} = require('./product-pm2.runtime');

const createApp = (app) => {
  const task = getPm2Task(app);

  return {
    name: app.name,
    cwd: app.cwd,
    script: task.command,
    args: task.args,
    interpreter: 'none',
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    merge_logs: true,
    out_file: logFile(app.name, 'out'),
    error_file: logFile(app.name, 'error'),
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env: {
      PRODUCT_BASE_DIR: baseDir,
      PM2_LOG_BASE_DIR: logDir,
    },
  };
};

module.exports = {
  apps: pm2Apps.map(createApp),
};
