import { useConfigStore } from '../stores/config'
import type { ChannelListResponse, FetchModelsResponse, ApiResponse } from './types'

// 获取请求头
function getHeaders(): HeadersInit {
    const configStore = useConfigStore()
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configStore.token}`,
        'New-Api-User': configStore.userId
    }
}

// 获取基础 URL
// 开发环境下使用代理，生产环境直接请求
function getBaseUrl(): string {
    const configStore = useConfigStore()
    const baseUrl = configStore.baseUrl.replace(/\/$/, '') // 移除末尾斜杠

    // 开发环境下使用代理
    if (import.meta.env.DEV && configStore.useProxy) {
        return '/proxy'
    }

    return baseUrl
}

// 获取所有渠道（处理分页）
export async function getChannels(): Promise<ChannelListResponse['data']['items']> {
    const baseUrl = getBaseUrl()
    const allChannels: ChannelListResponse['data']['items'] = []
    let page = 1
    const pageSize = 100 // 每页获取更多以减少请求次数

    while (true) {
        const response = await fetch(`${baseUrl}/api/channel/?page=${page}&page_size=${pageSize}`, {
            method: 'GET',
            headers: getHeaders()
        })

        if (!response.ok) {
            throw new Error(`获取渠道列表失败: ${response.status} ${response.statusText}`)
        }

        const data: ChannelListResponse = await response.json()

        if (!data.success) {
            throw new Error(`获取渠道列表失败: ${data.message}`)
        }

        allChannels.push(...data.data.items)

        // 检查是否还有更多页
        if (page * pageSize >= data.data.total) {
            break
        }
        page++
    }

    return allChannels
}

// 获取上游模型列表
export async function fetchUpstreamModels(channelId: number): Promise<string[]> {
    const baseUrl = getBaseUrl()

    const response = await fetch(`${baseUrl}/api/channel/fetch_models/${channelId}`, {
        method: 'GET',
        headers: getHeaders()
    })

    if (!response.ok) {
        throw new Error(`获取上游模型列表失败: ${response.status} ${response.statusText}`)
    }

    const data: FetchModelsResponse = await response.json()

    if (!data.success) {
        throw new Error(`获取上游模型列表失败: ${data.message}`)
    }

    return data.data
}

// 更新渠道
export async function updateChannel(
    channelId: number,
    models: string,
    modelMapping: string
): Promise<void> {
    const baseUrl = getBaseUrl()

    const response = await fetch(`${baseUrl}/api/channel/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
            id: channelId,
            models: models,
            model_mapping: modelMapping
        })
    })

    if (!response.ok) {
        throw new Error(`更新渠道失败: ${response.status} ${response.statusText}`)
    }

    const data: ApiResponse = await response.json()

    if (!data.success) {
        throw new Error(`更新渠道失败: ${data.message}`)
    }
}
