import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'data.sqlite');

let db = null;

// 初始化数据库
async function initDatabase() {
    const SQL = await initSqlJs();

    // 如果数据库文件存在，加载它
    if (existsSync(DB_PATH)) {
        const fileBuffer = readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // 创建表
    db.run(`
        CREATE TABLE IF NOT EXISTS mapping_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_model TEXT NOT NULL UNIQUE,
            target_model TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS custom_replace_rules (
            id TEXT PRIMARY KEY,
            priority INTEGER NOT NULL,
            search TEXT NOT NULL,
            replace TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS channel_exclusions (
            channel_id INTEGER PRIMARY KEY,
            excluded_models TEXT NOT NULL
        )
    `);

    // 保存初始化后的数据库
    saveDatabase();

    console.log('Database initialized successfully');
    return db;
}

// 保存数据库到文件
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        writeFileSync(DB_PATH, buffer);
    }
}

// 获取数据库实例
function getDb() {
    return db;
}

export { initDatabase, getDb, saveDatabase };
