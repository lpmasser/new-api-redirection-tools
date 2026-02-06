import type { ChannelListResponse, FetchModelsResponse, ApiResponse } from './types'

function getProxyHeaders(includeJsonContentType: boolean = true): HeadersInit {
    const appToken = localStorage.getItem('auth_token')
    if (!appToken) {
        throw new Error('登录状态已失效，请重新登录')
    }

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${appToken}`
    }

    if (includeJsonContentType) {
        headers['Content-Type'] = 'application/json'
    }

    return headers
}

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    let data: any = null
    try {
        data = await response.json()
    } catch {
        // 忽略 JSON 解析失败，使用兜底错误消息
    }

    if (!response.ok) {
        const message = data?.message || `${fallbackMessage}: ${response.status} ${response.statusText}`
        throw new Error(message)
    }

    if (data?.success === false) {
        throw new Error(data?.message || fallbackMessage)
    }

    return data as T
}

// 获取所有渠道（处理分页）
export async function getChannels(): Promise<ChannelListResponse['data']['items']> {
    const allChannels: ChannelListResponse['data']['items'] = []
    let page = 1
    const pageSize = 100

    while (true) {
        const response = await fetch(`/api/proxy/channels?page=${page}&page_size=${pageSize}`, {
            method: 'GET',
            headers: getProxyHeaders(false)
        })

        const data = await parseResponse<ChannelListResponse>(response, '获取渠道列表失败')

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
    const response = await fetch(`/api/proxy/channels/${channelId}/models`, {
        method: 'GET',
        headers: getProxyHeaders(false)
    })

    const data = await parseResponse<FetchModelsResponse>(response, '获取上游模型列表失败')

    return data.data
}

// 更新渠道
export async function updateChannel(
    channelId: number,
    models: string,
    modelMapping: string
): Promise<void> {
    const response = await fetch('/api/proxy/channels', {
        method: 'PUT',
        headers: getProxyHeaders(),
        body: JSON.stringify({
            id: channelId,
            models,
            modelMapping
        })
    })

    await parseResponse<ApiResponse>(response, '更新渠道失败')
}
