# New API Redirection Tools

一个用于管理 API 模型重定向映射的可视化工具，支持从 new-api 面板同步渠道配置并设置模型名称的重定向规则。

## ✨ 功能特性

- 🔄 **模型重定向映射** - 设置源模型到目标模型的重定向规则
- 📡 **渠道同步** - 从 new-api 面板自动同步渠道和模型配置
- 📥 **导入/导出** - 支持重定向规则的导入和导出
- 🔐 **访问控制** - 基于密码和 JWT 的访问认证
- 💾 **数据持久化** - 使用 SQLite 存储配置数据

## 🛠️ 技术栈

- **前端**: Vue 3 + TypeScript + Vite + Pinia
- **后端**: Node.js + Express
- **数据库**: SQLite

## 🚀 快速开始

### Docker 部署（推荐）

1. 克隆项目并创建环境配置文件：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，设置必要的环境变量：

```env
# 访问密码 - 必须修改！
ACCESS_PASSWORD=your-strong-password-here

# JWT 密钥 - 必须修改！使用随机字符串
JWT_SECRET=your-random-jwt-secret-key-at-least-32-chars

# 服务端口
PORT=3001
```

3. 使用 Docker Compose 启动：

```bash
docker-compose up -d
```

4. 访问 `http://localhost:3001`

### 本地开发

1. 安装依赖：

```bash
pnpm install
```

2. 创建并配置 `.env` 文件（同上）

3. 启动开发服务器：

```bash
# 同时启动前端和后端
pnpm run dev:all

# 或分别启动
pnpm run dev        # 前端
pnpm run dev:server # 后端
```

## 📁 项目结构

```
new-api-redirection-tools/
├── src/                  # 前端源码
│   ├── api/              # API 请求封装
│   ├── components/       # Vue 组件
│   ├── stores/           # Pinia 状态管理
│   └── views/            # 页面视图
├── server/               # 后端服务
│   ├── routes/           # API 路由
│   └── db.js             # 数据库操作
├── docker-compose.yml    # Docker 编排配置
└── Dockerfile            # Docker 镜像构建
```

## 📦 数据持久化

使用 Docker 部署时，数据存储在 `./data` 目录中（SQLite 数据库）。请确保对该目录进行备份。

## 📄 许可证

[AGPL-3.0](LICENSE)
