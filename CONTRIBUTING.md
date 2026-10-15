# 贡献指南 · Contributing

感谢你对 **墨迹（MoJi）** 的关注！欢迎提交 Issue 与 Pull Request。

---

## 开始之前

- 请先阅读 [README.md](./README.md) 了解项目概况
- 搜索现有 [Issues](../../issues) 避免重复
- 大改动建议**先开 Issue 讨论**，确认方向后再动手

---

## 分支模型

| 分支 | 用途 |
|------|------|
| `main` | 主分支，保持随时可发布，**受保护** |
| `feat/xxx` | 新功能 |
| `fix/xxx` | 缺陷修复 |
| `docs/xxx` | 文档改动 |
| `chore/xxx` | 构建、依赖、工具链等杂项 |

**禁止直接推送到 `main`** —— 所有改动通过 Pull Request 合入。

---

## 开发流程

### 1. Fork 并克隆

```bash
git clone https://github.com/<你的用户名>/-.git
cd -
git remote add upstream https://github.com/chengerr0817-cloud/-.git
```

### 2. 创建分支

```bash
git checkout -b feat/your-feature
```

### 3. 本地开发

```bash
# 安装依赖
cd frontend && pnpm install && cd ..
cd backend  && pnpm install && cd ..

# 启动（两个终端）
cd backend  && pnpm dev     # http://localhost:3000
cd frontend && pnpm dev     # http://localhost:5173
```

环境变量配置见 [README.md](./README.md#-快速开始)。

### 4. 提交前自检（务必全部通过）

```bash
# 前端
cd frontend
npx tsc -b --noEmit     # 类型检查
pnpm lint               # 代码规范
pnpm build              # 构建验证

# 后端
cd ../backend
npx tsc --noEmit        # 类型检查
pnpm build              # 构建验证
```

> CI 会跑同样的检查，本地先跑一遍可以避免来回。

### 5. 提交

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<类型>(<范围>): <描述>
```

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `docs` | 文档 |
| `style` | 格式（不影响逻辑） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试 |
| `chore` | 构建/依赖/工具 |

示例：

```
feat(post): 支持文章草稿自动保存
fix(auth): 修复 OAuth 回调丢失 token 的问题
docs(readme): 补充部署章节
```

### 6. 推送并提 PR

```bash
git push origin feat/your-feature
```

然后在 GitHub 上发起 Pull Request 到 `main` 分支，按模板填写说明。

---

## 代码规范

### 通用

- **TypeScript 严格模式** —— 不要用 `any`，必要时用 `unknown` + 类型收窄
- **不提交 `.env`** —— 所有凭据通过环境变量注入
- **保持现有风格** —— 缩进、命名、导入顺序与周边代码一致

### 前端

- 组件放 `src/components/`，页面放 `src/pages/`
- 数据请求统一走 `src/hooks/` 下的 TanStack Query hooks
- 样式优先用 Tailwind 类 + CSS 变量，避免硬编码颜色
- 新增 UI 组件优先复用 `src/components/ui/` 下已有的 shadcn/ui 组件

### 后端

- 业务逻辑放 `src/modules/`，一个模块一个 Router
- 请求体校验用 Zod
- 相对导入必须带 `.js` 后缀（项目使用 ESM / NodeNext）
- 错误统一交给 `errorHandler` 中间件

---

## PR 检查清单

提交 PR 前请确认：

- [ ] 分支基于最新的 `main`
- [ ] 本地类型检查、lint、构建全部通过
- [ ] 没有提交 `.env` 或任何密钥
- [ ] 提交信息符合 Conventional Commits
- [ ] PR 描述清楚「做了什么」和「为什么」
- [ ] 涉及界面改动时附上截图

---

## 安全相关

如发现安全漏洞，**请不要公开提 Issue**，而是通过 GitHub 的
[Security Advisories](../../security/advisories/new) 私下报告。

---

## 行为准则

参与本项目即表示你同意保持友善、尊重、专业的交流氛围。
