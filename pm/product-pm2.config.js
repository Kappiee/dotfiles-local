const path = require("path");

/**
 * Product PM2 black-box config
 *
 * Only edit this file.
 *
 * Config rules:
 * - `baseDir`: shared root directory
 * - `logDir`: PM2 log output directory
 * - `command`: default executable for this app
 * - `tasks`: runnable tasks for this app
 * - task value `["build"]` means: run `command build`
 * - task value `[]` means: run `command`
 * - task value `{ args: ["run", "start"], pm2: true }` means:
 *   run `command run start` and manage it with PM2
 *
 * Usage examples:
 * - `node product-pm2.js apps`
 * - `node product-pm2.js build all`
 * - `node product-pm2.js build training-web config`
 * - `node product-pm2.js run yarn product`
 * - `node product-pm2.js run build config`
 * - `node product-pm2.js start all`
 * - `node product-pm2.js restart training-web`
 *
 * Temporary override examples:
 * - `PRODUCT_BASE_DIR=/new/product node product-pm2.js build all`
 * - `PRODUCT_BASE_DIR=/new/product PM2_LOG_BASE_DIR=/new/logs node product-pm2.js start all`
 */

const baseDir = process.env.PRODUCT_BASE_DIR || "/Volumes/ssd770/zf/product";

const logDir =
  process.env.PM2_LOG_BASE_DIR || path.join(baseDir, "logs", "pm2");

const apps = [
  {
    name: "product",
    relativeDir: ".",
    command: "yarn",
    tasks: {
      build: ["build"],
      yarn: [],
    },
  },
  {
    name: "config",
    relativeDir: "apps/config",
    command: "yarn",
    tasks: {
      build: ["build"],
    },
  },
  {
    name: "main-server",
    relativeDir: "apps/main-server",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "main",
    relativeDir: "apps/main",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "training-server",
    relativeDir: "apps/training-server",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "training-web",
    relativeDir: "apps/training-web",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "shoteyes-server",
    relativeDir: "apps/shoteyes-server",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "shoteyes-web",
    relativeDir: "apps/shoteyes-web",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "shift-plan-server",
    relativeDir: "apps/shift-plan-server",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "shift-plan-web",
    relativeDir: "apps/shift-plan-web",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "analyze-server",
    relativeDir: "apps/analyze-server",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "analyze-web",
    relativeDir: "apps/analyze-web",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "detective-server",
    relativeDir: "apps/detective-server",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "detective-web",
    relativeDir: "apps/detective-web",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "toolkit-server",
    relativeDir: "apps/toolkit-server",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "toolkit-web",
    relativeDir: "apps/toolkit-web",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "admin-web",
    relativeDir: "apps/admin-web",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "apidoc",
    relativeDir: "apps/apidoc",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "homepage",
    relativeDir: "apps/homepage",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "cron-cleanup",
    relativeDir: "apps/cron-cleanup",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "service-oss-archive",
    relativeDir: "apps/service-oss-archive",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "service-sync",
    relativeDir: "apps/service-sync",
    command: "yarn",
    tasks: {
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "service-sync-analyze",
    relativeDir: "apps/service-sync-analyze",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
  {
    name: "service-transcode",
    relativeDir: "apps/service-transcode",
    command: "yarn",
    tasks: {
      build: ["build"],
      start: {
        args: ["run", "start"],
        pm2: true,
      },
    },
  },
];

module.exports = {
  baseDir,
  logDir,
  apps,
};
