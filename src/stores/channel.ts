import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Channel } from '../api/types'
import { getChannels, fetchUpstreamModels } from '../api/channel'

export const useChannelStore = defineStore('channel', () => {
    // 状态
    const channels = ref<Channel[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // 获取所有渠道
    async function loadChannels() {
        loading.value = true
        error.value = null

        try {
            channels.value = await getChannels()
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
            // 拉取失败时回退到当前启用的模型
            console.warn(`获取渠道 ${channel.name} 上游模型失败，使用当前启用模型`)
            channel.upstreamModels = channel.models ? channel.models.split(',').map(m => m.trim()) : []
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

        return channel.models ? channel.models.split(',').map(m => m.trim()) : []
    }

    return {
        channels,
        loading,
        error,
        loadChannels,
        loadUpstreamModels,
        loadAllUpstreamModels,
        getChannelModels
    }
})
