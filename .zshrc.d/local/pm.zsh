# pm — Product PM2 工具
export PM_BIN="$DOTFILES_LOCAL/pm/product-pm2.js"

pm() {
  node "$PM_BIN" "$@"
}

_pm() {
  local cmd=${words[2]}
  local sub=${words[3]}

  if [[ $CURRENT -eq 2 ]]; then
    local -a commands=(
      'context:管理 context（use/show/list）'
      'apps:列出所有已配置的应用'
      'list:查看 PM2 进程列表'
      'logs:查看指定应用的日志'
      'describe:查看指定应用的详情'
      'build:构建应用'
      'deploy:构建并启动应用'
      'start:启动应用'
      'reload:热重载应用'
      'restart:重启应用'
      'stop:停止应用'
      'delete:从 PM2 删除应用'
      'run:执行自定义任务'
    )
    _describe 'command' commands
    return
  fi

  case $cmd in
    context)
      if [[ $CURRENT -eq 3 ]]; then
        local -a subs=('use:切换 context' 'show:查看当前 context' 'list:列出可用 context')
        _describe 'subcommand' subs
      elif [[ $CURRENT -eq 4 && $sub == 'use' ]]; then
        local -a contexts=($(node "$PM_BIN" _contexts 2>/dev/null))
        _values 'context' $contexts
      fi
      ;;
    logs|describe)
      local -a apps=($(node "$PM_BIN" _apps pm2 2>/dev/null))
      _values 'app' $apps
      ;;
    build)
      local -a apps=(all $(node "$PM_BIN" _apps build 2>/dev/null))
      _values 'app' $apps
      ;;
    deploy)
      local -a apps=(all $(node "$PM_BIN" _apps deploy 2>/dev/null))
      _values 'app' $apps
      ;;
    start|reload|restart|stop|delete)
      local -a apps=(all $(node "$PM_BIN" _apps pm2 2>/dev/null))
      _values 'app' $apps
      ;;
    run)
      if [[ $CURRENT -eq 3 ]]; then
        local -a tasks=($(node "$PM_BIN" _tasks 2>/dev/null))
        _values 'task' $tasks
      else
        local -a apps=(all $(node "$PM_BIN" _apps 2>/dev/null))
        _values 'app' $apps
      fi
      ;;
  esac
}

compdef _pm pm
