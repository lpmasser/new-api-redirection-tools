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
// 开发环境使用代理，生产环境使用配置的地址
function getBaseUrl(): string {
    if (import.meta.env.DEV) {
        return '/proxy'
    }
    const configStore = useConfigStore()
    return configStore.baseUrl.replace(/\/$/, '')
}

// 获取所有渠道（处理分页）
export async function getChannels(): Promise<ChannelListResponse['data']['items']> {
    const baseUrl = getBaseUrl()
    const allChannels: ChannelListResponse['data']['items'] = []
    let page = 1
    const pageSize = 100

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
