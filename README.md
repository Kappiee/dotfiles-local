# dotfiles-local

机器专属私有配置，依赖 [dotfiles](https://github.com/Kappiee/dotfiles) 先行安装。

| 目录 | 说明 |
|---|---|
| `.zshrc.d/local/` | 机器专属 zsh 模块，stow 到 `~/.zshrc.d/local/` |
| `.hammerspoon/` | 机器专属 Hammerspoon 脚本，stow 到 `~/.hammerspoon/` |
| `company/` | 公司项目配置（不 stow，由 pm 工具读取）|
| `pm/` | pm 工具本体（不 stow，由 `PM_BIN` 引用）|

## 依赖

必须先完成 dotfiles 安装，dotfiles-local 依赖其提供的：
- zsh 模块加载机制（`~/.zshrc.d/`）
- Hammerspoon 基础配置（`windows.lua`）

## 新机器安装

**推荐：通过 dotfiles 的 install.sh 一并完成**

```bash
DOTFILES_LOCAL_REPO=git@github.com:Kappiee/dotfiles-local.git bash ~/dotfiles/install.sh
```

**手动安装（dotfiles 已安装的情况下）：**

```bash
# 1. 克隆到本机路径
git clone git@github.com:Kappiee/dotfiles-local.git /path/to/dotfiles-local

# 2. 修改 DOTFILES_LOCAL 为实际路径
vim .zshrc.d/local/path.zsh   # 修改 export DOTFILES_LOCAL=...

# 3. stow（忽略非 home 目录的文件夹）
stow --target="$HOME" --ignore='pm' --ignore='company' --ignore='README.*' .

# 4. 设置 pm context
pm context use zf
```

## pm 工具

pm 是封装 pm2 的公司专属 CLI，配置按 context 切换：

```bash
pm context list          # 列出可用 context
pm context use zf        # 切换到 zf（首次安装必须执行）
pm context show          # 查看当前

pm apps                  # 列出所有应用
pm build shoteyes-web    # 构建
pm deploy shoteyes-web   # 构建 + 启动
pm start all             # 启动所有 pm2 应用
```

### 新增公司配置

在 `company/<name>/pm.json` 中添加配置：

```json
{
  "project": "/path/to/project",
  "logDir": "logs/pm2",
  "apps": [
    {
      "name": "app-name",
      "relativeDir": "apps/app-name",
      "command": "yarn",
      "tasks": {
        "build": ["build"],
        "start": { "args": ["run", "start"], "pm2": true }
      }
    }
  ]
}
```

然后切换：`pm context use <name>`

## 日常同步

```bash
git add . && git commit -m "..." && git push
# 另一台机器
git pull && stow --target="$HOME" --ignore='pm' --ignore='company' --ignore='README.*' .
```
