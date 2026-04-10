const fs = require('fs');
const path = require('path');
const os = require('os');

const fail = (message) => {
  throw new Error(`Invalid pm config: ${message}`);
};

const ensureString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
};

const ensureStringArray = (value, fieldName) => {
  if (!Array.isArray(value)) fail(`${fieldName} must be an array`);
  return value.map((item, index) =>
    ensureString(item, `${fieldName}[${index}]`),
  );
};

const normalizeTask = (value, defaultCommand, fieldName) => {
  if (Array.isArray(value)) {
    return { command: defaultCommand, args: ensureStringArray(value, `${fieldName}.args`), pm2: false };
  }
  if (!value || typeof value !== 'object') {
    fail(`${fieldName} must be an array or object`);
  }
  const command = value.command == null
    ? defaultCommand
    : ensureString(value.command, `${fieldName}.command`);
  const args = value.args == null ? [] : ensureStringArray(value.args, `${fieldName}.args`);
  return { command, args, pm2: Boolean(value.pm2) };
};

// ── Context 解析 ──────────────────────────────────────────────────────────────
// 优先级: PM_CONTEXT env > ~/.config/pm/active > 报错
const ACTIVE_FILE = path.join(os.homedir(), '.config', 'pm', 'active');

const resolveContext = () => {
  if (process.env.PM_CONTEXT) return process.env.PM_CONTEXT.trim();
  if (fs.existsSync(ACTIVE_FILE)) return fs.readFileSync(ACTIVE_FILE, 'utf8').trim();
  return null;
};

const loadConfig = () => {
  const context = resolveContext();
  if (!context) {
    throw new Error(
      'No pm context set. Run: pm context use <name>\n' +
      'Available contexts are in $DOTFILES_LOCAL/company/',
    );
  }

  const dotfilesLocal = process.env.DOTFILES_LOCAL;
  if (!dotfilesLocal) {
    throw new Error('DOTFILES_LOCAL environment variable is not set');
  }

  const configPath = path.join(dotfilesLocal, 'company', context, 'pm.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Context config not found: ${configPath}`);
  }

  const json = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const project = ensureString(json.project, 'project');
  const logDir = json.logDir
    ? path.isAbsolute(json.logDir) ? json.logDir : path.join(project, json.logDir)
    : path.join(project, 'logs', 'pm2');

  return { baseDir: project, logDir, apps: json.apps, context, configPath };
};

// ── 解析 apps ─────────────────────────────────────────────────────────────────
const { baseDir, logDir, apps: rawApps, context, configPath } = loadConfig();

const seenNames = new Set();
const taskNameSet = new Set();

const apps = rawApps.map((app, index) => {
  if (!app || typeof app !== 'object') fail(`apps[${index}] must be an object`);

  const name = ensureString(app.name, `apps[${index}].name`);
  const relativeDir = ensureString(app.relativeDir, `apps[${index}].relativeDir`);
  const command = ensureString(app.command, `apps[${index}].command`);

  if (path.isAbsolute(relativeDir)) fail(`apps[${index}].relativeDir must be relative to baseDir`);
  if (seenNames.has(name)) fail(`duplicate app name "${name}"`);
  seenNames.add(name);

  if (!app.tasks || typeof app.tasks !== 'object' || Array.isArray(app.tasks)) {
    fail(`apps[${index}].tasks must be an object`);
  }

  const taskEntries = Object.entries(app.tasks);
  if (taskEntries.length === 0) fail(`apps[${index}].tasks must not be empty`);

  let pm2TaskName = null;
  const tasks = {};

  for (const [taskName, taskValue] of taskEntries) {
    const normalizedTask = normalizeTask(taskValue, command, `apps[${index}].tasks.${taskName}`);
    if (normalizedTask.pm2) {
      if (pm2TaskName) fail(`app "${name}" can only have one PM2-managed task`);
      pm2TaskName = taskName;
    }
    tasks[taskName] = normalizedTask;
    taskNameSet.add(taskName);
  }

  return {
    name, relativeDir, cwd: path.join(baseDir, relativeDir),
    command, tasks, taskNames: Object.keys(tasks), pm2TaskName,
  };
});

const appMap = new Map(apps.map((app) => [app.name, app]));
const taskNames = Array.from(taskNameSet).sort();
const pm2Apps = apps.filter((app) => Boolean(app.pm2TaskName));

const getAppsByTask = (taskName) =>
  apps.filter((app) => Object.prototype.hasOwnProperty.call(app.tasks, taskName));
const getTask = (app, taskName) => app.tasks[taskName] || null;
const getPm2Task = (app) => app.pm2TaskName ? app.tasks[app.pm2TaskName] : null;
const logFile = (appName, type) => path.join(logDir, `${appName}.${type}.log`);

module.exports = {
  baseDir, logDir, context, configPath,
  apps, appMap, taskNames, pm2Apps,
  getAppsByTask, getTask, getPm2Task, logFile,
  ACTIVE_FILE,
};
