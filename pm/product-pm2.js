#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const CONFIG_PATH = path.join(__dirname, "ecosystem.config.js");

// ── Context 管理（不依赖 runtime，独立运行）────────────────────────────────────
const ACTIVE_FILE = path.join(os.homedir(), ".config", "pm", "active");

const contextCommands = (subAction, args) => {
  if (subAction === "use") {
    const name = args[0];
    if (!name) {
      console.error("用法: pm context use <name>");
      process.exit(1);
    }
    const dotfilesLocal = process.env.DOTFILES_LOCAL;
    if (dotfilesLocal) {
      const configPath = path.join(dotfilesLocal, "company", name, "pm.json");
      if (!fs.existsSync(configPath)) {
        console.error(`未找到配置: ${configPath}`);
        process.exit(1);
      }
    }
    fs.mkdirSync(path.dirname(ACTIVE_FILE), { recursive: true });
    fs.writeFileSync(ACTIVE_FILE, name);
    console.log(`已切换到 context: ${name}`);
    process.exit(0);
  }

  if (subAction === "show") {
    const current = fs.existsSync(ACTIVE_FILE)
      ? fs.readFileSync(ACTIVE_FILE, "utf8").trim()
      : "(未设置)";
    const override = process.env.PM_CONTEXT ? ` (被 PM_CONTEXT 覆盖为: ${process.env.PM_CONTEXT})` : "";
    console.log(`当前 context: ${current}${override}`);
    process.exit(0);
  }

  if (subAction === "list") {
    const dotfilesLocal = process.env.DOTFILES_LOCAL;
    if (!dotfilesLocal) {
      console.error("DOTFILES_LOCAL 未设置");
      process.exit(1);
    }
    const companyDir = path.join(dotfilesLocal, "company");
    if (!fs.existsSync(companyDir)) {
      console.log("暂无可用 context");
      process.exit(0);
    }
    const current = fs.existsSync(ACTIVE_FILE)
      ? fs.readFileSync(ACTIVE_FILE, "utf8").trim()
      : null;
    fs.readdirSync(companyDir).forEach((name) => {
      const marker = name === current ? " *" : "";
      console.log(`  ${name}${marker}`);
    });
    process.exit(0);
  }

  console.error(`未知 context 子命令: ${subAction}`);
  console.error("可用: use <name> | show | list");
  process.exit(1);
};

// context 子命令在加载 runtime 之前处理（不依赖配置）
const [, , action, ...rest] = process.argv;

if (action === "context") {
  contextCommands(rest[0], rest.slice(1));
}

// ── 加载 runtime（需要 context 已设置）────────────────────────────────────────
const {
  baseDir,
  logDir,
  context,
  apps,
  appMap,
  taskNames,
  pm2Apps,
  getAppsByTask,
  getTask,
} = require("./product-pm2.runtime");

const usage = () => {
  console.log(`pm — Product PM2 工具 [context: ${context}]

Context:
  pm context list            列出可用 context
  pm context use <name>      切换 context（写入 ~/.config/pm/active）
  pm context show            查看当前 context

Commands:
  pm apps                    列出所有已配置的应用
  pm list                    查看 PM2 进程列表
  pm logs <app>              查看应用日志
  pm describe <app>          查看应用详情
  pm run <task> [all|app…]   执行自定义任务
  pm build [all|app…]        构建应用
  pm deploy [all|app…]       构建并启动应用
  pm start [all|app…]        启动应用
  pm reload [all|app…]       热重载应用
  pm restart [all|app…]      重启应用
  pm stop [all|app…]         停止应用
  pm delete [all|app…]       从 PM2 删除应用

Loaded:
  context=${context}
  project=${baseDir}
  logDir=${logDir}
  tasks=${taskNames.join(", ")}`);
};

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env },
    ...options,
  });

  if (result.error) fail(result.error.message);
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
    console.log(`  tasks: ${app.taskNames.map((t) => describeTask(app, t)).join(" | ")}`);
  }
};

const ensureAppsHaveDirs = (selectedApps) => {
  const missing = selectedApps.filter((app) => !fs.existsSync(app.cwd));
  if (missing.length > 0) {
    fail(`Missing app directories:\n${missing.map((a) => `${a.name}: ${a.cwd}`).join("\n")}`);
  }
};

const ensureLogDir = () => fs.mkdirSync(logDir, { recursive: true });

const resolveAppsByTask = (taskName, targets) => {
  const supportedApps = getAppsByTask(taskName);
  if (supportedApps.length === 0) fail(`No apps are configured for task "${taskName}"`);
  if (targets.length === 0 || targets.includes("all")) return supportedApps;

  const invalid = targets.filter((name) => !appMap.has(name));
  if (invalid.length > 0) fail(`Unknown app name(s): ${invalid.join(", ")}`);

  const unsupported = targets.filter((name) => !getTask(appMap.get(name), taskName));
  if (unsupported.length > 0) {
    fail(`App name(s) do not support task "${taskName}": ${unsupported.join(", ")}`);
  }

  return targets.map((name) => appMap.get(name));
};

const resolvePm2Apps = (targets) => {
  if (pm2Apps.length === 0) fail("No apps are configured for PM2 management");
  if (targets.length === 0 || targets.includes("all")) return pm2Apps;

  const invalid = targets.filter((name) => !appMap.has(name));
  if (invalid.length > 0) fail(`Unknown app name(s): ${invalid.join(", ")}`);

  const unsupported = targets.filter((name) => !pm2Apps.find((a) => a.name === name));
  if (unsupported.length > 0) {
    fail(`App name(s) are not configured for PM2: ${unsupported.join(", ")}`);
  }

  return targets.map((name) => appMap.get(name));
};

const runTask = (taskName, selectedApps) => {
  ensureAppsHaveDirs(selectedApps);
  for (const app of selectedApps) {
    const task = getTask(app, taskName);
    console.log(`\n==> ${app.name}: ${task.command}${task.args.length ? ` ${task.args.join(" ")}` : ""}`);
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

const runPm2PerApp = (pmAction, selectedApps, extraArgs = []) => {
  for (const app of selectedApps) {
    run("pm2", [pmAction, app.name, ...extraArgs]);
  }
};

const deployApps = apps.filter((app) => app.tasks.build && app.pm2TaskName === "start");

const resolveDeployApps = (targets) => {
  if (deployApps.length === 0) fail("No apps configured for deploy (need both build and pm2 start)");
  if (targets.length === 0 || targets.includes("all")) return deployApps;

  const invalid = targets.filter((name) => !appMap.has(name));
  if (invalid.length > 0) fail(`Unknown app name(s): ${invalid.join(", ")}`);

  const unsupported = targets.filter((name) => !deployApps.find((a) => a.name === name));
  if (unsupported.length > 0) {
    fail(`App(s) do not support deploy: ${unsupported.join(", ")}`);
  }

  return targets.map((name) => appMap.get(name));
};

// ── Shell completion helpers ───────────────────────────────────────────────────
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

if (action === "_contexts") {
  const dotfilesLocal = process.env.DOTFILES_LOCAL;
  if (dotfilesLocal) {
    const companyDir = path.join(dotfilesLocal, "company");
    if (fs.existsSync(companyDir)) {
      fs.readdirSync(companyDir).forEach((name) => process.stdout.write(name + "\n"));
    }
  }
  process.exit(0);
}

// ── Main ──────────────────────────────────────────────────────────────────────
if (!action || action === "help" || action === "--help" || action === "-h") {
  usage();
  process.exit(0);
}

if (action === "apps") { listApps(); process.exit(0); }
if (action === "list") { run("pm2", ["list"]); process.exit(0); }

if (action === "logs" || action === "describe") {
  if (rest.length !== 1) fail(`${action} requires exactly one app name`);
  run("pm2", [action, resolvePm2Apps([rest[0]])[0].name]);
  process.exit(0);
}

if (action === "run") {
  const [taskName, ...targets] = rest;
  if (!taskName) fail("run requires a task name");
  runTask(taskName, resolveAppsByTask(taskName, targets));
  process.exit(0);
}

switch (action) {
  case "build":   runTask("build", resolveAppsByTask("build", rest)); break;
  case "deploy": {
    const selected = resolveDeployApps(rest);
    runTask("build", selected);
    startApps(selected);
    break;
  }
  case "start":   startApps(resolvePm2Apps(rest)); break;
  case "reload":  runPm2PerApp("reload", resolvePm2Apps(rest), ["--update-env"]); break;
  case "restart": runPm2PerApp("restart", resolvePm2Apps(rest), ["--update-env"]); break;
  case "stop":    runPm2PerApp("stop", resolvePm2Apps(rest)); break;
  case "delete":  runPm2PerApp("delete", resolvePm2Apps(rest)); break;
  case "yarn":    runTask("yarn", resolveAppsByTask("yarn", rest)); break;
  default:
    usage();
    fail(`Unsupported action: ${action}`);
}
