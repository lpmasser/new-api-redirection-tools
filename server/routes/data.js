import express from 'express';
import { getDb, saveDatabase } from '../db.js';

const router = express.Router();

// ============ 映射规则 ============

// 获取所有映射规则
router.get('/mapping-rules', (req, res) => {
    try {
        const db = getDb();
        const stmt = db.prepare('SELECT source_model, target_model FROM mapping_rules');
        const rules = [];

        while (stmt.step()) {
            const row = stmt.getAsObject();
            rules.push({
                sourceModel: row.source_model,
                targetModel: row.target_model
            });
        }
        stmt.free();

        res.json({
            success: true,
            data: rules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取映射规则失败: ' + error.message
        });
    }
});

// 批量更新映射规则（全量替换）
router.put('/mapping-rules', (req, res) => {
    const { rules } = req.body;

    if (!Array.isArray(rules)) {
        return res.status(400).json({
            success: false,
            message: 'rules 必须是数组'
        });
    }

    try {
        const db = getDb();

        // 清空现有规则
        db.run('DELETE FROM mapping_rules');

        // 插入新规则
        for (const rule of rules) {
            if (rule.sourceModel && rule.targetModel) {
                db.run(
                    'INSERT INTO mapping_rules (source_model, target_model) VALUES (?, ?)',
                    [rule.sourceModel, rule.targetModel]
                );
            }
        }

        saveDatabase();

        res.json({
            success: true,
            message: '映射规则更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新映射规则失败: ' + error.message
        });
    }
});

// ============ 自定义替换规则 ============

// 获取所有自定义替换规则
router.get('/custom-rules', (req, res) => {
    try {
        const db = getDb();
        const stmt = db.prepare(
            'SELECT id, priority, search, replace, enabled FROM custom_replace_rules ORDER BY priority'
        );
        const rules = [];

        while (stmt.step()) {
            const row = stmt.getAsObject();
            rules.push({
                id: row.id,
                priority: row.priority,
                search: row.search,
                replace: row.replace,
                enabled: Boolean(row.enabled)
            });
        }
        stmt.free();

        res.json({
            success: true,
            data: rules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取自定义规则失败: ' + error.message
        });
    }
});

// 批量更新自定义替换规则（全量替换）
router.put('/custom-rules', (req, res) => {
    const { rules } = req.body;

    if (!Array.isArray(rules)) {
        return res.status(400).json({
            success: false,
            message: 'rules 必须是数组'
        });
    }

    try {
        const db = getDb();

        // 清空现有规则
        db.run('DELETE FROM custom_replace_rules');

        // 插入新规则
        for (const rule of rules) {
            if (rule.id) {
                db.run(
                    'INSERT INTO custom_replace_rules (id, priority, search, replace, enabled) VALUES (?, ?, ?, ?, ?)',
                    [
                        rule.id,
                        rule.priority || 0,
                        rule.search || '',
                        rule.replace || '',
                        rule.enabled ? 1 : 0
                    ]
                );
            }
        }

        saveDatabase();

        res.json({
            success: true,
            message: '自定义规则更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新自定义规则失败: ' + error.message
        });
    }
});

// ============ 配置 ============

// 获取所有配置
router.get('/config', (req, res) => {
    try {
        const db = getDb();
        const stmt = db.prepare('SELECT key, value FROM config');
        const configObj = {};

        while (stmt.step()) {
            const row = stmt.getAsObject();
            try {
                configObj[row.key] = JSON.parse(row.value);
            } catch {
                configObj[row.key] = row.value;
            }
        }
        stmt.free();

        res.json({
            success: true,
            data: configObj
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取配置失败: ' + error.message
        });
    }
});

// 更新配置
router.put('/config', (req, res) => {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'config 必须是对象'
        });
    }

    try {
        const db = getDb();

        for (const [key, value] of Object.entries(config)) {
            db.run(
                'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
                [key, JSON.stringify(value)]
            );
        }

        saveDatabase();

        res.json({
            success: true,
            message: '配置更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新配置失败: ' + error.message
        });
    }
});

export default router;
