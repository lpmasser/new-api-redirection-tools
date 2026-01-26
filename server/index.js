import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
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

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// 初始化数据库后启动服务器
async function start() {
    try {
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
