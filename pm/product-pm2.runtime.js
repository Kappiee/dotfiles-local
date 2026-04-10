const path = require('path');
const userConfig = require('./product-pm2.config');

const fail = (message) => {
  throw new Error(`Invalid product-pm2.config.js: ${message}`);
};

const ensureString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${fieldName} must be a non-empty string`);
  }

  return value.trim();
};

const ensureStringArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    fail(`${fieldName} must be an array`);
  }

  return value.map((item, index) =>
    ensureString(item, `${fieldName}[${index}]`),
  );
};

const normalizeTask = (value, defaultCommand, fieldName) => {
  if (Array.isArray(value)) {
    return {
      command: defaultCommand,
      args: ensureStringArray(value, `${fieldName}.args`),
      pm2: false,
    };
  }

  if (!value || typeof value !== 'object') {
    fail(`${fieldName} must be an array or object`);
  }

  const command =
    value.command == null
      ? defaultCommand
      : ensureString(value.command, `${fieldName}.command`);

  const args =
    value.args == null ? [] : ensureStringArray(value.args, `${fieldName}.args`);

  return {
    command,
    args,
    pm2: Boolean(value.pm2),
  };
};

const baseDir = ensureString(userConfig.baseDir, 'baseDir');
const logDir = ensureString(userConfig.logDir, 'logDir');

if (!Array.isArray(userConfig.apps) || userConfig.apps.length === 0) {
  fail('apps must be a non-empty array');
}

const seenNames = new Set();
const taskNameSet = new Set();

const apps = userConfig.apps.map((app, index) => {
  if (!app || typeof app !== 'object') {
    fail(`apps[${index}] must be an object`);
  }

  const name = ensureString(app.name, `apps[${index}].name`);
  const relativeDir = ensureString(
    app.relativeDir,
    `apps[${index}].relativeDir`,
  );
  const command = ensureString(app.command, `apps[${index}].command`);

  if (path.isAbsolute(relativeDir)) {
    fail(`apps[${index}].relativeDir must be relative to baseDir`);
  }

  if (seenNames.has(name)) {
    fail(`duplicate app name "${name}"`);
  }
  seenNames.add(name);

  if (!app.tasks || typeof app.tasks !== 'object' || Array.isArray(app.tasks)) {
    fail(`apps[${index}].tasks must be an object`);
  }

  const taskEntries = Object.entries(app.tasks);
  if (taskEntries.length === 0) {
    fail(`apps[${index}].tasks must not be empty`);
  }

  let pm2TaskName = null;
  const tasks = {};

  for (const [taskName, taskValue] of taskEntries) {
    const normalizedTask = normalizeTask(
      taskValue,
      command,
      `apps[${index}].tasks.${taskName}`,
    );

    if (normalizedTask.pm2) {
      if (pm2TaskName) {
        fail(`app "${name}" can only have one PM2-managed task`);
      }
      pm2TaskName = taskName;
    }

    tasks[taskName] = normalizedTask;
    taskNameSet.add(taskName);
  }

  return {
    name,
    relativeDir,
    cwd: path.join(baseDir, relativeDir),
    command,
    tasks,
    taskNames: Object.keys(tasks),
    pm2TaskName,
  };
});

const appMap = new Map(apps.map((app) => [app.name, app]));
const taskNames = Array.from(taskNameSet).sort();
const pm2Apps = apps.filter((app) => Boolean(app.pm2TaskName));

const getAppsByTask = (taskName) =>
  apps.filter((app) => Object.prototype.hasOwnProperty.call(app.tasks, taskName));

const getTask = (app, taskName) => app.tasks[taskName] || null;

const getPm2Task = (app) => {
  if (!app.pm2TaskName) {
    return null;
  }

  return app.tasks[app.pm2TaskName];
};

const logFile = (appName, type) => path.join(logDir, `${appName}.${type}.log`);

module.exports = {
  baseDir,
  logDir,
  apps,
  appMap,
  taskNames,
  pm2Apps,
  getAppsByTask,
  getTask,
  getPm2Task,
  logFile,
};
