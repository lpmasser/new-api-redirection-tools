import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const loginAttempts = new Map();

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 10;
const LOGIN_BLOCK_MINUTES = 15;
const LOGIN_WINDOW_MS = LOGIN_WINDOW_MINUTES * 60 * 1000;
const LOGIN_BLOCK_MS = LOGIN_BLOCK_MINUTES * 60 * 1000;

function getClientIp(req) {
    return req.ip || req.socket?.remoteAddress || 'unknown';
}

function getActiveAttemptRecord(ip, now) {
    const record = loginAttempts.get(ip);
    if (!record) {
        return null;
    }

    if (record.blockedUntil && now >= record.blockedUntil) {
        loginAttempts.delete(ip);
        return null;
    }

    if (!record.blockedUntil && now - record.firstFailedAt > LOGIN_WINDOW_MS) {
        loginAttempts.delete(ip);
        return null;
    }

    return record;
}

function cleanupAttemptRecords() {
    const now = Date.now();
    for (const [ip, record] of loginAttempts.entries()) {
        if (record.blockedUntil && now >= record.blockedUntil) {
            loginAttempts.delete(ip);
            continue;
        }

        if (!record.blockedUntil && now - record.firstFailedAt > LOGIN_WINDOW_MS) {
            loginAttempts.delete(ip);
        }
    }
}

setInterval(cleanupAttemptRecords, 5 * 60 * 1000).unref();

function recordLoginFailure(ip) {
    const now = Date.now();
    let record = getActiveAttemptRecord(ip, now);

    if (!record) {
        record = {
            count: 0,
            firstFailedAt: now,
            blockedUntil: null
        };
    }

    if (now - record.firstFailedAt > LOGIN_WINDOW_MS) {
        record.count = 0;
        record.firstFailedAt = now;
        record.blockedUntil = null;
    }

    record.count += 1;

    if (record.count >= LOGIN_MAX_ATTEMPTS) {
        record.blockedUntil = now + LOGIN_BLOCK_MS;
    }

    loginAttempts.set(ip, record);
    return record;
}

function clearLoginFailures(ip) {
    loginAttempts.delete(ip);
}

function loginRateLimit(req, res, next) {
    const ip = getClientIp(req);
    const now = Date.now();
    const record = getActiveAttemptRecord(ip, now);

    req.loginIp = ip;

    if (!record || !record.blockedUntil) {
        return next();
    }

    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    res.set('Retry-After', String(retryAfterSeconds));

    return res.status(429).json({
        success: false,
        message: `登录失败次数过多，请 ${retryAfterMinutes} 分钟后重试`
    });
}

// 登录接口
router.post('/login', loginRateLimit, (req, res) => {
    const { password } = req.body;
    const ip = req.loginIp || getClientIp(req);

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
        const attemptRecord = recordLoginFailure(ip);

        if (attemptRecord.blockedUntil) {
            const retryAfterSeconds = Math.ceil((attemptRecord.blockedUntil - Date.now()) / 1000);
            const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
            res.set('Retry-After', String(retryAfterSeconds));

            return res.status(429).json({
                success: false,
                message: `登录失败次数过多，请 ${retryAfterMinutes} 分钟后重试`
            });
        }

        const remainingAttempts = Math.max(0, LOGIN_MAX_ATTEMPTS - attemptRecord.count);
        return res.status(401).json({
            success: false,
            message: `密码错误，还可尝试 ${remainingAttempts} 次`
        });
    }

    clearLoginFailures(ip);

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
