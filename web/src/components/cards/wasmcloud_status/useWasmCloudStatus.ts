import { useCache } from '../../../lib/cache'
import { useCardLoadingState } from '../CardDataContext'
import {
    WASMCLOUD_DEMO_DATA,
    type WasmCloudHost,
    type WasmCloudActor,
    type WasmCloudDemoData,
} from './demoData'

export interface WasmCloudStatus {
    hosts: WasmCloudHost[]
    actors: WasmCloudActor[]
    totalHosts: number
    healthyHosts: number
    degradedHosts: number
    totalActors: number
    runningActors: number
    failedActors: number
    lastCheckTime: string
}

export interface UseWasmCloudStatusResult {
    data: WasmCloudStatus
    loading: boolean
    error: boolean
    consecutiveFailures: number
    showSkeleton: boolean
    showEmptyState: boolean
}


const INITIAL_DATA: WasmCloudStatus = {
    hosts: [],
    actors: [],
    totalHosts: 0,
    healthyHosts: 0,
    degradedHosts: 0,
    totalActors: 0,
    runningActors: 0,
    failedActors: 0,
    lastCheckTime: new Date().toISOString(),
}

const CACHE_KEY = 'wasmcloud-status'

function summarise(hosts: WasmCloudHost[], actors: WasmCloudActor[]): WasmCloudStatus {
    return {
        hosts,
        actors,
        totalHosts: hosts.length,
        healthyHosts: hosts.filter((h) => h.status === 'healthy').length,
        degradedHosts: hosts.filter((h) => h.status !== 'healthy').length,
        totalActors: actors.length,
        runningActors: actors.filter((a) => a.status === 'running').length,
        failedActors: actors.filter((a) => a.status === 'failed').length,
        lastCheckTime: new Date().toISOString(),
    }
}

function toDemoStatus(demo: WasmCloudDemoData): WasmCloudStatus {
    return summarise(demo.hosts, demo.actors)
}

async function fetchWasmCloudStatus(): Promise<WasmCloudStatus> {
    const [hostsResp, actorsResp] = await Promise.all([
        fetch('/api/mcp/wasmcloud/hosts', { headers: { Accept: 'application/json' } }),
        fetch('/api/mcp/wasmcloud/actors', { headers: { Accept: 'application/json' } }),
    ])

    if (!hostsResp.ok) throw new Error(`Hosts HTTP ${hostsResp.status}`)
    if (!actorsResp.ok) throw new Error(`Actors HTTP ${actorsResp.status}`)

    const hostsBody: { hosts?: WasmCloudHost[] } = await hostsResp.json()
    const actorsBody: { actors?: WasmCloudActor[] } = await actorsResp.json()

    const hosts = Array.isArray(hostsBody?.hosts) ? hostsBody.hosts : []
    const actors = Array.isArray(actorsBody?.actors) ? actorsBody.actors : []

    return summarise(hosts, actors)
}

export function useWasmCloudStatus(): UseWasmCloudStatusResult {
    const { data, isLoading, isFailed, consecutiveFailures, isDemoFallback } =
        useCache<WasmCloudStatus>({
            key: CACHE_KEY,
            category: 'default',
            initialData: INITIAL_DATA,
            demoData: toDemoStatus(WASMCLOUD_DEMO_DATA),
            persist: true,
            fetcher: fetchWasmCloudStatus,
        })

    const hasAnyData = data.totalHosts > 0

    const { showSkeleton, showEmptyState } = useCardLoadingState({
        isLoading,
        hasAnyData,
        isFailed,
        consecutiveFailures,
        isDemoData: isDemoFallback,
    })

    return {
        data,
        loading: isLoading,
        error: isFailed && !hasAnyData,
        consecutiveFailures,
        showSkeleton,
        showEmptyState,
    }
}
