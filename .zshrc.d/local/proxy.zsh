# 代理配置
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
export no_proxy=localhost,127.0.0.1,*.local

alias pon="source ~/proxy_control.sh on"
alias poff="source ~/proxy_control.sh off"
alias pst="~/proxy_control.sh status"
alias ptest="~/proxy_control.sh test"
