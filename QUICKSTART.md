# 快速上手

面向「只想在浏览器里写博客」的使用者。全程三条命令。

## 你需要准备什么

| 依赖 | 版本 | 检查命令 | 没有怎么办 |
| --- | --- | --- | --- |
| Node.js | **22 或更高** | `node -v` | 去 https://nodejs.org 下载 LTS 版 |
| pnpm | 任意 | `pnpm -v` | `npm install -g pnpm`（装不上也行，会自动回退 npm） |

> **为什么必须 Node 22+**：本项目用 Node 内置的 SQLite 模块存数据，零原生依赖、不用装数据库软件，代价是要求较新的 Node。

## 三步跑起来

```bash
# 1. 下载代码
git clone https://github.com/chengerr0817-cloud/-.git moji-blog
cd moji-blog

# 2. 一键安装（自动装依赖、建数据库、构建前端、启动服务）
./scripts/install.sh

# 3. 打开浏览器
#    http://localhost:5173
```

首次安装约 2-4 分钟（主要在下载依赖），之后启动都是秒开。

登录后台：账号 `admin`，密码 `moji123456`。

> **建议第一件事就是改密码** —— 见下方「修改密码」。

---

## 日常怎么用

服务是**后台常驻**的，关掉终端也不影响。常用命令都在项目根目录执行：

```bash
./scripts/start-local.sh start     # 启动（默认前后端都起）
./scripts/start-local.sh stop      # 停止
./scripts/start-local.sh restart   # 重启
./scripts/start-local.sh status    # 看运行状态
./scripts/start-local.sh logs      # 实时看日志（Ctrl+C 退出）
```

也可以只操作单个服务：

```bash
./scripts/start-local.sh start backend    # 只起后端
./scripts/start-local.sh restart frontend # 只重启前端
```

**典型的一天**：

```
开机 → ./scripts/start-local.sh start
     → 浏览器打开 http://localhost:5173 写文章
     → 关机前不用管，下次开机重新 start 即可
```

## 写文章的路径

```
http://localhost:5173/login     登录
http://localhost:5173/write     写新文章 / 编辑
http://localhost:5173/me/posts  文章管理（已发布 + 草稿）
http://localhost:5173/uploads   图床（上传图片）
```

支持 Markdown 语法，编辑器有实时预览。

---

## 你的数据在哪

**全部存在你自己电脑上**，不依赖任何云端服务。

| 内容 | 位置 |
| --- | --- |
| 文章、标签、账号 | `backend/data/blog.db`（单个 SQLite 文件） |
| 上传的图片 | `backend/uploads/` |
| 运行日志 | `logs/` |

**备份就是复制这两个位置**：

```bash
# 手动备份
cp backend/data/blog.db ~/blog-备份-$(date +%Y%m%d).db
cp -r backend/uploads ~/uploads-备份
```

想迁移到另一台电脑：把 `blog.db` 和 `uploads/` 拷过去，放到相同位置即可。

---

## 常见操作

### 修改密码

目前没有改密界面，用这个脚本直接改（在项目根目录执行）：

```bash
cd backend
node -e "
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/blog.db');
const user = process.argv[1];
const pw = process.argv[2];
const hash = bcrypt.hashSync(pw, 10);
const r = db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, user);
console.log(r.changes ? '✓ 已更新 ' + user + ' 的密码' : '✗ 没找到用户 ' + user);
" admin 你的新密码
```

把最后的 `admin` 和 `你的新密码` 换成实际值即可。

### 端口被占用

如果 3000 或 5173 被别的程序占了：

```bash
lsof -ti:3000 | xargs kill    # 释放后端端口
lsof -ti:5173 | xargs kill    # 释放前端端口
```

或者换端口启动：

```bash
BACKEND_PORT=3100 FRONTEND_PORT=5273 ./scripts/start-local.sh start
```

### 完全重来（清空所有数据）

```bash
./scripts/start-local.sh stop
rm backend/data/blog.db
rm -rf backend/uploads/*
./scripts/install.sh
```

### 依赖装不上 / 构建报错

```bash
# 清干净重装
rm -rf backend/node_modules frontend/node_modules
./scripts/install.sh
```

---

## 想部署到服务器让外网访问？

本项目也带 Docker 配置（`backend/Dockerfile`、`frontend/Dockerfile`），
可以参考 `scripts/deploy.sh` 与仓库根目录的 README。

但**本地自足模式更简单也更安全** —— 数据在自己手里，没有云服务账单，也没有密钥泄露风险。

---

## 遇到问题

1. 先看日志：`./scripts/start-local.sh logs backend`
2. 再确认状态：`./scripts/start-local.sh status`
3. 检查 Node 版本：`node -v` 必须是 22+
