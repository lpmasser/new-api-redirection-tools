# 构建阶段 - 前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# 复制前端源码并构建
COPY src ./src
COPY public ./public
COPY index.html vite.config.ts tsconfig*.json ./
RUN pnpm run build

# 运行阶段
FROM node:20-alpine

WORKDIR /app

# 复制后端依赖文件
COPY server/package.json server/pnpm-lock.yaml ./server/
RUN cd server && npm install -g pnpm && pnpm install --prod

# 复制后端源码
COPY server ./server

# 从构建阶段复制前端静态文件
COPY --from=frontend-builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 暴露端口
EXPOSE 3001

# 数据目录
VOLUME ["/app/server/data"]

# 启动命令
WORKDIR /app/server
CMD ["node", "index.js"]
