import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

function parsePositiveInt(value, defaultValue) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function getUpstreamConfig() {
    const db = getDb();
    if (!db) {
        return { error: '数据库未初始化，请稍后重试' };
    }

    const stmt = db.prepare('SELECT value FROM config WHERE key = ?');
    stmt.bind(['upstreamConfig']);

    if (!stmt.step()) {
        stmt.free();
        return { error: '服务器未配置上游 API，请先在设置页面保存配置' };
    }

    const row = stmt.getAsObject();
    stmt.free();

    let rawConfig = {};
    try {
        rawConfig = JSON.parse(String(row.value || '{}'));
    } catch {
        return { error: '上游配置解析失败，请在设置页面重新保存配置' };
    }

    const baseUrlRaw = String(rawConfig.baseUrl || '').trim();
    const token = String(rawConfig.token || '').trim();
    const userId = String(rawConfig.userId || '').trim();

    if (!baseUrlRaw || !token || !userId) {
        return { error: '服务器上游配置不完整，请先在设置页面保存配置' };
    }

    let baseUrl = baseUrlRaw;
    try {
        const parsed = new URL(baseUrlRaw);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { error: '上游 Base URL 仅支持 http/https' };
        }
        baseUrl = parsed.toString().replace(/\/$/, '');
    } catch {
        return { error: '上游 Base URL 格式不正确' };
    }

    return {
        config: {
            baseUrl,
            token,
            userId
        }
    };
}

function buildUpstreamHeaders(config) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
        'New-Api-User': config.userId
    };
}

async function proxyToUpstream(res, url, options, fallbackMessage) {
    try {
        const upstreamRes = await fetch(url, options);
        const text = await upstreamRes.text();

        let payload = {};
        if (text) {
            try {
                payload = JSON.parse(text);
            } catch {
                payload = { success: false, message: text };
            }
        }

        if (!upstreamRes.ok) {
            const message = payload.message || `${fallbackMessage}: ${upstreamRes.status} ${upstreamRes.statusText}`;
            return res.status(upstreamRes.status).json({
                ...payload,
                success: false,
                message
            });
        }

        if (text && typeof payload === 'object') {
            return res.status(upstreamRes.status).json(payload);
        }

        return res.status(upstreamRes.status).json({
            success: true,
            message: ''
        });
    } catch (error) {
        return res.status(502).json({
            success: false,
            message: `${fallbackMessage}: ${error.message}`
        });
    }
}

router.get('/channels', async (req, res) => {
    const upstream = getUpstreamConfig();
    if (upstream.error) {
        return res.status(400).json({ success: false, message: upstream.error });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.page_size, 100);
    const url = `${upstream.config.baseUrl}/api/channel/?page=${page}&page_size=${pageSize}`;

    return proxyToUpstream(
        res,
        url,
        {
            method: 'GET',
            headers: buildUpstreamHeaders(upstream.config)
        },
        '获取渠道列表失败'
    );
});

router.get('/channels/:channelId/models', async (req, res) => {
    const upstream = getUpstreamConfig();
    if (upstream.error) {
        return res.status(400).json({ success: false, message: upstream.error });
    }

    const channelId = Number.parseInt(req.params.channelId, 10);
    if (!Number.isFinite(channelId) || channelId <= 0) {
        return res.status(400).json({ success: false, message: '渠道 ID 无效' });
    }

    const url = `${upstream.config.baseUrl}/api/channel/fetch_models/${channelId}`;

    return proxyToUpstream(
        res,
        url,
        {
            method: 'GET',
            headers: buildUpstreamHeaders(upstream.config)
        },
        '获取上游模型列表失败'
    );
});

router.put('/channels', async (req, res) => {
    const upstream = getUpstreamConfig();
    if (upstream.error) {
        return res.status(400).json({ success: false, message: upstream.error });
    }

    const channelId = Number.parseInt(req.body.id, 10);
    const models = typeof req.body.models === 'string' ? req.body.models : '';
    const modelMapping = typeof req.body.modelMapping === 'string'
        ? req.body.modelMapping
        : (typeof req.body.model_mapping === 'string' ? req.body.model_mapping : '');

    if (!Number.isFinite(channelId) || channelId <= 0) {
        return res.status(400).json({ success: false, message: '渠道 ID 无效' });
    }

    const body = JSON.stringify({
        id: channelId,
        models,
        model_mapping: modelMapping
    });

    const url = `${upstream.config.baseUrl}/api/channel/`;

    return proxyToUpstream(
        res,
        url,
        {
            method: 'PUT',
            headers: buildUpstreamHeaders(upstream.config),
            body
        },
        '更新渠道失败'
    );
});

export default router;
