#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  baseDir,
  logDir,
  apps,
  appMap,
  taskNames,
  pm2Apps,
  getAppsByTask,
  getTask,
} = require("./product-pm2.runtime");

const CONFIG_PATH = path.join(__dirname, "ecosystem.config.js");

const usage = () => {
  console.log(`Black-box PM2 helper

Commands:
  node product-pm2.js apps
  node product-pm2.js run <task> [all|app...]
  node product-pm2.js build [all|app...]
  node product-pm2.js deploy [all|app...]
  node product-pm2.js start [all|app...]
  node product-pm2.js reload [all|app...]
  node product-pm2.js restart [all|app...]
  node product-pm2.js stop [all|app...]
  node product-pm2.js delete [all|app...]
  node product-pm2.js list
  node product-pm2.js logs <app>
  node product-pm2.js describe <app>

Examples:
  node product-pm2.js apps
  node product-pm2.js build all
  node product-pm2.js deploy all
  node product-pm2.js deploy shoteyes-server
  node product-pm2.js run build config
  node product-pm2.js run yarn product
  node product-pm2.js start all
  node product-pm2.js reload all
  node product-pm2.js restart training-web
  PRODUCT_BASE_DIR=/new/product node product-pm2.js build all
  PRODUCT_BASE_DIR=/new/product PM2_LOG_BASE_DIR=/new/logs node product-pm2.js start all

Loaded config:
  baseDir=${baseDir}
  logDir=${logDir}
  taskNames=${taskNames.join(", ")}`);
};

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      PRODUCT_BASE_DIR: baseDir,
      PM2_LOG_BASE_DIR: logDir,
    },
    ...options,
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
};

const describeTask = (app, taskName) => {
  const task = getTask(app, taskName);
  const suffix = task.args.length > 0 ? ` ${task.args.join(" ")}` : "";
  const pm2Label = task.pm2 ? " [pm2]" : "";
  return `${taskName}: ${task.command}${suffix}${pm2Label}`;
};

const listApps = () => {
  console.log("Configured apps:\n");

  for (const app of apps) {
    console.log(`${app.name}`);
    console.log(`  dir: ${app.cwd}`);
    console.log(
      `  tasks: ${app.taskNames.map((taskName) => describeTask(app, taskName)).join(" | ")}`,
    );
  }
};

const ensureAppsHaveDirs = (selectedApps) => {
  const missing = selectedApps.filter((app) => !fs.existsSync(app.cwd));

  if (missing.length > 0) {
    const details = missing.map((app) => `${app.name}: ${app.cwd}`).join("\n");
    fail(`Missing app directories:\n${details}`);
  }
};

const ensureLogDir = () => {
  fs.mkdirSync(logDir, { recursive: true });
};

const resolveAppsByTask = (taskName, targets) => {
  const supportedApps = getAppsByTask(taskName);

  if (supportedApps.length === 0) {
    fail(`No apps are configured for task "${taskName}"`);
  }

  if (targets.length === 0 || targets.includes("all")) {
    return supportedApps;
  }

  const invalid = targets.filter((name) => !appMap.has(name));
  if (invalid.length > 0) {
    fail(`Unknown app name(s): ${invalid.join(", ")}`);
  }

  const unsupported = targets.filter(
    (name) => !getTask(appMap.get(name), taskName),
  );
  if (unsupported.length > 0) {
    fail(
      `App name(s) do not support task "${taskName}": ${unsupported.join(", ")}`,
    );
  }

  return targets.map((name) => appMap.get(name));
};

const resolvePm2Apps = (targets) => {
  if (pm2Apps.length === 0) {
    fail("No apps are configured for PM2 management");
  }

  if (targets.length === 0 || targets.includes("all")) {
    return pm2Apps;
  }

  const invalid = targets.filter((name) => !appMap.has(name));
  if (invalid.length > 0) {
    fail(`Unknown app name(s): ${invalid.join(", ")}`);
  }

  const unsupported = targets.filter(
    (name) => !pm2Apps.find((app) => app.name === name),
  );
  if (unsupported.length > 0) {
    fail(
      `App name(s) are not configured for PM2 start management: ${unsupported.join(", ")}`,
    );
  }

  return targets.map((name) => appMap.get(name));
};

const runTask = (taskName, selectedApps) => {
  ensureAppsHaveDirs(selectedApps);

  for (const app of selectedApps) {
    const task = getTask(app, taskName);
    console.log(
      `\n==> Running ${app.name}: ${task.command}${task.args.length ? ` ${task.args.join(" ")}` : ""}`,
    );
    run(task.command, task.args, { cwd: app.cwd });
  }
};

const startApps = (selectedApps) => {
  ensureAppsHaveDirs(selectedApps);
  ensureLogDir();

  if (selectedApps.length === pm2Apps.length) {
    run("pm2", ["start", CONFIG_PATH, "--update-env"]);
    return;
  }

  for (const app of selectedApps) {
    run("pm2", ["start", CONFIG_PATH, "--only", app.name, "--update-env"]);
  }
};

const runPm2PerApp = (action, selectedApps, extraArgs = []) => {
  for (const app of selectedApps) {
    run("pm2", [action, app.name, ...extraArgs]);
  }
};

const resolveSinglePm2App = (name) => {
  const selectedApps = resolvePm2Apps([name]);
  return selectedApps[0];
};

// Apps that support both build and pm2 start
const deployApps = apps.filter(
  (app) => app.tasks.build && app.pm2TaskName === "start",
);

const resolveDeployApps = (targets) => {
  if (deployApps.length === 0) {
    fail("No apps are configured for deploy (need both build and pm2 start tasks)");
  }

  if (targets.length === 0 || targets.includes("all")) {
    return deployApps;
  }

  const invalid = targets.filter((name) => !appMap.has(name));
  if (invalid.length > 0) {
    fail(`Unknown app name(s): ${invalid.join(", ")}`);
  }

  const unsupported = targets.filter(
    (name) => !deployApps.find((app) => app.name === name),
  );
  if (unsupported.length > 0) {
    fail(
      `App(s) do not support deploy (missing build or pm2 start): ${unsupported.join(", ")}`,
    );
  }

  return targets.map((name) => appMap.get(name));
};

const [, , action, ...rest] = process.argv;

// Shell completion helpers — not shown in usage
if (action === "_apps") {
  const filter = rest[0];
  let selected = apps;
  if (filter === "pm2") selected = pm2Apps;
  if (filter === "build") selected = getAppsByTask("build");
  if (filter === "deploy") selected = deployApps;
  selected.forEach((app) => process.stdout.write(app.name + "\n"));
  process.exit(0);
}

if (action === "_tasks") {
  taskNames.forEach((name) => process.stdout.write(name + "\n"));
  process.exit(0);
}

if (!action || action === "help" || action === "--help" || action === "-h") {
  usage();
  process.exit(0);
}

if (action === "apps") {
  listApps();
  process.exit(0);
}

if (action === "list") {
  run("pm2", ["list"]);
  process.exit(0);
}

if (action === "logs" || action === "describe") {
  if (rest.length !== 1) {
    fail(`${action} requires exactly one app name`);
  }

  const app = resolveSinglePm2App(rest[0]);
  run("pm2", [action, app.name]);
  process.exit(0);
}

if (action === "run") {
  const [taskName, ...targets] = rest;

  if (!taskName) {
    fail("run requires a task name");
  }

  runTask(taskName, resolveAppsByTask(taskName, targets));
  process.exit(0);
}

switch (action) {
  case "build":
    runTask("build", resolveAppsByTask("build", rest));
    break;
  case "deploy": {
    const selectedApps = resolveDeployApps(rest);
    runTask("build", selectedApps);
    startApps(selectedApps);
    break;
  }
  case "start":
    startApps(resolvePm2Apps(rest));
    break;
  case "reload":
    runPm2PerApp("reload", resolvePm2Apps(rest), ["--update-env"]);
    break;
  case "restart":
    runPm2PerApp("restart", resolvePm2Apps(rest), ["--update-env"]);
    break;
  case "stop":
    runPm2PerApp("stop", resolvePm2Apps(rest));
    break;
  case "delete":
    runPm2PerApp("delete", resolvePm2Apps(rest));
    break;
  case "yarn":
    runTask("yarn", resolveAppsByTask("yarn", rest));
    break;
  default:
    usage();
    fail(`Unsupported action: ${action}`);
}
