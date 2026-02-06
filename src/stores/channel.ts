import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Channel } from '../api/types'
import { getChannels, fetchUpstreamModels } from '../api/channel'

export const useChannelStore = defineStore('channel', () => {
    // 状态
    const channels = ref<Channel[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // 将 models（重定向后的名称）通过 model_mapping 转换回原始模型名称
    // model_mapping 格式: {"重定向的模型名":"原模型名"}
    function getOriginalModels(channel: Channel): string[] {
        if (!channel.models) return []

        const redirectedModels = channel.models.split(',').map(m => m.trim())

        // 解析 model_mapping
        let mapping: Record<string, string> = {}
        if (channel.model_mapping) {
            try {
                mapping = JSON.parse(channel.model_mapping)
            } catch (e) {
                console.warn(`解析渠道 ${channel.name} 的 model_mapping 失败`)
            }
        }

        // 将重定向后的模型名转换回原始名称
        return redirectedModels.map(model => {
            // 如果在 mapping 中找到，返回原始名称，否则返回原样（说明没有重定向）
            return mapping[model] || model
        })
    }

    // 获取所有渠道
    async function loadChannels() {
        loading.value = true
        error.value = null

        try {
            const data = await getChannels()
            // 按 id 降序排列（最新的渠道排在前面）
            channels.value = data.sort((a, b) => b.id - a.id)
        } catch (e) {
            error.value = e instanceof Error ? e.message : '获取渠道列表失败'
            throw e
        } finally {
            loading.value = false
        }
    }

    // 获取指定渠道的上游模型列表
    async function loadUpstreamModels(channelId: number) {
        const channel = channels.value.find(c => c.id === channelId)
        if (!channel) return

        try {
            const models = await fetchUpstreamModels(channelId)
            channel.upstreamModels = models
        } catch (e) {
            // 拉取失败时回退到当前启用的模型（通过 model_mapping 转换回原始模型名）
            console.warn(`获取渠道 ${channel.name} 上游模型失败，使用当前启用模型`)
            channel.upstreamModels = getOriginalModels(channel)
        }
    }

    // 获取所有渠道的上游模型列表
    async function loadAllUpstreamModels() {
        const promises = channels.value.map(channel => loadUpstreamModels(channel.id))
        await Promise.allSettled(promises)
    }

    // 获取渠道的模型列表（优先使用上游模型）
    function getChannelModels(channelId: number): string[] {
        const channel = channels.value.find(c => c.id === channelId)
        if (!channel) return []

        if (channel.upstreamModels && channel.upstreamModels.length > 0) {
            return channel.upstreamModels
        }

        // 通过 model_mapping 将 models 转换回原始模型名
        return getOriginalModels(channel)
    }

    // 检查是否有缓存的渠道数据
    function hasCachedData(): boolean {
        return channels.value.length > 0
    }

    return {
        channels,
        loading,
        error,
        loadChannels,
        loadUpstreamModels,
        loadAllUpstreamModels,
        getChannelModels,
        hasCachedData
    }
}, {
    persist: {
        // 只持久化 channels（包含 upstreamModels）
        pick: ['channels']
    }
})
