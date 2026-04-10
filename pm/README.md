# Product PM2 命令手册

`pm` 是对 `node /Volumes/ssd770/pm/product-pm2.js` 的 zsh 缩写，用法与 pm2 类似。

## 配置

在 `~/.zshrc` 中已添加：

```zsh
pm() {
  node /Volumes/ssd770/pm/product-pm2.js "$@"
}
```

生效：`source ~/.zshrc`

---

## 查看

```bash
pm apps               # 列出所有已配置的应用及其任务
pm list               # 查看 PM2 进程列表
pm logs <app>         # 查看指定应用的日志
pm describe <app>     # 查看指定应用的详情
```

## 构建

```bash
pm build all          # 构建所有支持 build 的应用
pm build <app> ...    # 构建指定应用
```

支持 `build` 的应用：

| 应用 | 目录 |
|------|------|
| `product` | `.` |
| `config` | `apps/config` |
| `main-server` | `apps/main-server` |
| `main` | `apps/main` |
| `training-server` | `apps/training-server` |
| `shoteyes-server` | `apps/shoteyes-server` |
| `shift-plan-server` | `apps/shift-plan-server` |
| `analyze-server` | `apps/analyze-server` |
| `detective-server` | `apps/detective-server` |
| `toolkit-server` | `apps/toolkit-server` |
| `homepage` | `apps/homepage` |
| `cron-cleanup` | `apps/cron-cleanup` |
| `service-oss-archive` | `apps/service-oss-archive` |
| `service-sync-analyze` | `apps/service-sync-analyze` |
| `service-transcode` | `apps/service-transcode` |

## 部署（build + start）

`deploy` 专为后端服务设计，自动执行 **先构建、再启动** 两个步骤。

```bash
pm deploy all         # 部署所有支持 deploy 的应用
pm deploy <app> ...   # 部署指定应用
```

支持 `deploy` 的应用（同时拥有 `build` 和 pm2 `start`）：

| 应用 | 类型 |
|------|------|
| `main-server` | server |
| `main` | server |
| `training-server` | server |
| `shoteyes-server` | server |
| `shift-plan-server` | server |
| `analyze-server` | server |
| `detective-server` | server |
| `toolkit-server` | server |
| `homepage` | web |
| `cron-cleanup` | service |
| `service-oss-archive` | service |
| `service-sync-analyze` | service |
| `service-transcode` | service |

## 启动 / 停止 / 重启

```bash
pm start all          # 启动所有 PM2 应用
pm start <app> ...    # 启动指定应用

pm reload all         # 热重载（不中断服务）
pm reload <app> ...

pm restart all        # 重启
pm restart <app> ...

pm stop all           # 停止
pm stop <app> ...

pm delete all         # 从 PM2 删除
pm delete <app> ...
```

支持 PM2 管理的应用：

| 应用 | 类型 |
|------|------|
| `main-server` | server |
| `main` | web |
| `training-server` | server |
| `training-web` | web |
| `shoteyes-server` | server |
| `shoteyes-web` | web |
| `shift-plan-server` | server |
| `shift-plan-web` | web |
| `analyze-server` | server |
| `analyze-web` | web |
| `detective-server` | server |
| `detective-web` | web |
| `toolkit-server` | server |
| `toolkit-web` | web |
| `admin-web` | web |
| `apidoc` | web |
| `homepage` | web |
| `cron-cleanup` | service |
| `service-oss-archive` | service |
| `service-sync` | service |
| `service-sync-analyze` | service |
| `service-transcode` | service |

## 执行任意任务

```bash
pm run <task> [all|app...]

pm run yarn product              # 安装依赖
pm run build config              # 构建指定应用
pm run build training-web config # 同时构建多个
```

## 环境变量覆盖

```bash
PRODUCT_BASE_DIR=/new/product pm build all
PRODUCT_BASE_DIR=/new/product PM2_LOG_BASE_DIR=/new/logs pm start all
```

| 变量 | 默认值 |
|------|--------|
| `PRODUCT_BASE_DIR` | `/Volumes/ssd770/zf/product` |
| `PM2_LOG_BASE_DIR` | `$PRODUCT_BASE_DIR/logs/pm2` |

## 典型工作流

```bash
# 部署单个后端服务（build + start 一步完成）
pm deploy shoteyes-server

# 更新已运行的服务（无需重新构建）
pm restart shoteyes-server

# 查看状态和日志
pm list
pm logs shoteyes-server
```
