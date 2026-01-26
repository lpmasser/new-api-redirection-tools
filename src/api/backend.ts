// 后端 API 调用封装

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

// 获取存储的 Token
function getToken(): string | null {
    return localStorage.getItem('auth_token')
}

// 通用请求方法
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || '请求失败')
    }

    return data
}

// ============ 认证 API ============

export interface LoginResponse {
    success: boolean
    message: string
    data?: { token: string }
}

export async function login(password: string): Promise<LoginResponse> {
    return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password })
    })
}

export async function verifyToken(): Promise<{ success: boolean }> {
    return request('/api/auth/verify')
}

// ============ 映射规则 API ============

export interface MappingRule {
    sourceModel: string
    targetModel: string
}

export async function fetchMappingRules(): Promise<MappingRule[]> {
    const res = await request<{ success: boolean; data: MappingRule[] }>(
        '/api/data/mapping-rules'
    )
    return res.data
}

export async function saveMappingRules(rules: MappingRule[]): Promise<void> {
    await request('/api/data/mapping-rules', {
        method: 'PUT',
        body: JSON.stringify({ rules })
    })
}

// ============ 自定义规则 API ============

export interface CustomReplaceRule {
    id: string
    priority: number
    search: string
    replace: string
    enabled: boolean
}

export async function fetchCustomRules(): Promise<CustomReplaceRule[]> {
    const res = await request<{ success: boolean; data: CustomReplaceRule[] }>(
        '/api/data/custom-rules'
    )
    return res.data
}

export async function saveCustomRules(rules: CustomReplaceRule[]): Promise<void> {
    await request('/api/data/custom-rules', {
        method: 'PUT',
        body: JSON.stringify({ rules })
    })
}

// ============ 配置 API ============

export interface AppConfig {
    syncMode?: 'append' | 'overwrite'
    processConfig?: {
        formatModelName: boolean
        enableCustomRules: boolean
        toLowerCase: boolean
    }
}

export async function fetchConfig(): Promise<AppConfig> {
    const res = await request<{ success: boolean; data: AppConfig }>(
        '/api/data/config'
    )
    return res.data
}

export async function saveConfig(config: AppConfig): Promise<void> {
    await request('/api/data/config', {
        method: 'PUT',
        body: JSON.stringify({ config })
    })
}
