import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import proxyRoutes from './routes/proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', true);

function validateRequiredEnv() {
    const requiredVars = ['ACCESS_PASSWORD', 'JWT_SECRET'];
    const missingVars = requiredVars.filter((name) => !process.env[name]);

    if (missingVars.length > 0) {
        throw new Error(`缺少必要环境变量: ${missingVars.join(', ')}`);
    }
}

// 中间件
app.use(express.json());

// Token 验证中间件
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: '未提供 Token'
        });
    }

    const token = authHeader.substring(7);

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token 无效或已过期'
        });
    }
}

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/data', authMiddleware, dataRoutes);
app.use('/api/proxy', authMiddleware, proxyRoutes);

// 始终提供前端静态文件
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback - 所有非 API 路由返回 index.html
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// 初始化数据库后启动服务器
async function start() {
    try {
        validateRequiredEnv();
        await initDatabase();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log('Press Ctrl+C to stop');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
