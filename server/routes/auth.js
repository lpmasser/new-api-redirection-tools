import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 登录接口
router.post('/login', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: '请输入密码'
        });
    }

    const accessPassword = process.env.ACCESS_PASSWORD;

    if (!accessPassword) {
        return res.status(500).json({
            success: false,
            message: '服务器未配置访问密码'
        });
    }

    if (password !== accessPassword) {
        return res.status(401).json({
            success: false,
            message: '密码错误'
        });
    }

    // 生成 JWT Token
    const token = jwt.sign(
        { authenticated: true },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({
        success: true,
        message: '登录成功',
        data: { token }
    });
});

// 验证 Token 接口
router.get('/verify', (req, res) => {
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
        res.json({
            success: true,
            message: 'Token 有效'
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token 无效或已过期'
        });
    }
});

export default router;
