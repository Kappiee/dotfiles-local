# ZF 公司专属配置
export ZF_PROJECT="/Volumes/ssd770/zf/product"

# pm-use：切换 pm 使用的公司配置
# 用法：pm-use <company>
# 示例：pm-use zf
pm-use() {
  local company="${1:-}"
  if [[ -z "$company" ]]; then
    echo "用法: pm-use <company>"
    echo "可用配置: $(ls "$DOTFILES_LOCAL/company" 2>/dev/null | tr '\n' ' ')"
    return 1
  fi

  local config="$DOTFILES_LOCAL/company/$company/pm.json"
  if [[ ! -f "$config" ]]; then
    echo "pm-use: 未找到配置 $config" >&2
    return 1
  fi

  # 每个公司对应一个 {COMPANY}_PROJECT 变量，例如 ZF_PROJECT
  local project_var="${company:u}_PROJECT"
  local project="${(P)project_var:-}"
  if [[ -z "$project" ]]; then
    echo "pm-use: 未找到项目路径变量 \$$project_var" >&2
    return 1
  fi

  export PM_CONFIG="$config"
  export PM_PROJECT="$project"
  echo "pm-use: 已切换到 $company"
  echo "  PM_CONFIG=$PM_CONFIG"
  echo "  PM_PROJECT=$PM_PROJECT"
}

# 默认使用 ZF 配置
pm-use zf
