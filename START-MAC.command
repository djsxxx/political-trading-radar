#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Financial AI OS v0.4"
echo "正在检查运行环境……"

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 Node.js。请先安装 Node.js 20 或更高版本。"
  read -r -p "按回车键关闭"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "首次启动，正在安装依赖……"
  npm install
fi

echo "正在启动 Mac 桌面版……"
npm run dev
