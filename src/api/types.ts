// API 响应类型定义

// 渠道信息
export interface Channel {
    id: number
    type: number
    key: string
    name: string
    status: number              // 1=启用
    weight: number
    created_time: number
    test_time: number
    response_time: number
    base_url: string
    models: string              // 当前启用的模型（逗号分隔）
    model_mapping: string       // 当前的映射配置（JSON 字符串）
    group: string
    used_quota: number
    priority: number
    auto_ban: number
    tag: string
    // 本地扩展字段
    upstreamModels?: string[]   // 上游模型列表（通过 fetch_models 获取）
}

// 获取渠道列表响应
export interface ChannelListResponse {
    data: {
        items: Channel[]
        page: number
        page_size: number
        total: number
    }
    message: string
    success: boolean
}

// 获取上游模型列表响应
export interface FetchModelsResponse {
    data: string[]
    message: string
    success: boolean
}

// 通用 API 响应
export interface ApiResponse {
    message: string
    success: boolean
}

// 映射规则
export interface MappingRule {
    sourceModel: string    // 原模型名
    targetModel: string    // 统一命名
}

// 渠道排除配置
export interface ChannelExclusion {
    channelId: number
    excludedModels: string[]  // 排除的源模型名列表
}
