import { useState } from 'react'
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    Server,
    Cpu,
    RefreshCw,
    Activity,
    Box,
} from 'lucide-react'
import { Skeleton } from '../../ui/Skeleton'
import { useWasmCloudStatus } from './useWasmCloudStatus'
import type { WasmCloudHost, WasmCloudActor } from './demoData'

const HOST_STATUS_STYLE: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
    healthy: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/15' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    unreachable: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
}

const ACTOR_STATUS_STYLE: Record<string, { color: string; dot: string }> = {
    running: { color: 'text-green-400', dot: 'bg-green-400' },
    stopped: { color: 'text-yellow-400', dot: 'bg-yellow-400' },
    failed: { color: 'text-red-400', dot: 'bg-red-400' },
}

type Tab = 'hosts' | 'actors'


function MetricTile({ label, value, colorClass, icon }: {
    label: string; value: number | string; colorClass: string; icon: React.ReactNode
}) {
    return (
        <div className="flex-1 p-3 rounded-lg bg-secondary/30 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">{icon}</div>
            <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
    )
}

function HostRow({ host }: { host: WasmCloudHost }) {
    const style = HOST_STATUS_STYLE[host.status] ?? HOST_STATUS_STYLE.healthy
    const Icon = style.icon
    return (
        <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${style.color}`} />
                    <span className="text-sm font-medium text-foreground truncate">{host.id}</span>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.color}`}>
                    {host.status}
                </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span title="Cluster">{host.cluster}</span>
                <span title="Version">v{host.version}</span>
                <span title="Uptime">↑ {host.uptime}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> {host.actors} actors
                </span>
                <span className="flex items-center gap-1">
                    <Box className="w-3 h-3" /> {host.providers} providers
                </span>
            </div>
        </div>
    )
}

function ActorRow({ actor }: { actor: WasmCloudActor }) {
    const style = ACTOR_STATUS_STYLE[actor.status] ?? ACTOR_STATUS_STYLE.running
    return (
        <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                    <span className="text-sm font-medium text-foreground truncate">{actor.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">×{actor.instances}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span title="Cluster">{actor.cluster}</span>
                <span className="truncate" title={actor.capabilities.join(', ')}>
                    {actor.capabilities.join(', ')}
                </span>
            </div>
        </div>
    )
}


export function WasmCloudStatus() {
    const { data, error, showSkeleton, showEmptyState } = useWasmCloudStatus()
    const [tab, setTab] = useState<Tab>('hosts')

    if (showSkeleton) {
        return (
            <div className="h-full flex flex-col min-h-card gap-3">
                <Skeleton variant="rounded" height={36} />
                <div className="flex gap-2">
                    <Skeleton variant="rounded" height={80} className="flex-1" />
                    <Skeleton variant="rounded" height={80} className="flex-1" />
                    <Skeleton variant="rounded" height={80} className="flex-1" />
                </div>
                <Skeleton variant="rounded" height={60} />
                <Skeleton variant="rounded" height={60} />
            </div>
        )
    }

    if (error || showEmptyState) {
        return (
            <div className="h-full flex flex-col items-center justify-center min-h-card text-muted-foreground gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <p className="text-sm text-red-400">
                    {error ? 'Failed to fetch wasmCloud status' : 'No wasmCloud hosts found'}
                </p>
                <p className="text-xs">Ensure wasmCloud is running on a connected cluster.</p>
            </div>
        )
    }

    const overallHealthy = data.degradedHosts === 0 && data.failedActors === 0

    return (
        <div className="h-full flex flex-col min-h-0 content-loaded gap-3">
            {/* Health badge + last sync */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${overallHealthy
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-orange-500/15 text-orange-400'
                        }`}
                >
                    {overallHealthy ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <AlertTriangle className="w-4 h-4" />
                    )}
                    {overallHealthy ? 'Healthy' : 'Degraded'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3" />
                    <span>
                        {new Date(data.lastCheckTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Summary tiles */}
            <div className="flex gap-3 flex-shrink-0">
                <MetricTile
                    label="Hosts"
                    value={data.totalHosts}
                    colorClass="text-blue-400"
                    icon={<Server className="w-4 h-4 text-blue-400" />}
                />
                <MetricTile
                    label="Actors"
                    value={data.totalActors}
                    colorClass="text-purple-400"
                    icon={<Cpu className="w-4 h-4 text-purple-400" />}
                />
                <MetricTile
                    label="Running"
                    value={data.runningActors}
                    colorClass={data.failedActors > 0 ? 'text-yellow-400' : 'text-green-400'}
                    icon={<Activity className="w-4 h-4 text-green-400" />}
                />
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 flex-shrink-0">
                {(['hosts', 'actors'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 text-xs py-1.5 rounded-md border transition-colors capitalize ${tab === t
                                ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                                : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                            }`}
                    >
                        {t} ({t === 'hosts' ? data.totalHosts : data.totalActors})
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 space-y-2 overflow-y-auto min-h-card-content">
                {tab === 'hosts' ? (
                    data.hosts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No hosts found
                        </div>
                    ) : (
                        data.hosts.map((host) => <HostRow key={host.id} host={host} />)
                    )
                ) : data.actors.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No actors found
                    </div>
                ) : (
                    data.actors.map((actor) => <ActorRow key={actor.id} actor={actor} />)
                )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground flex-shrink-0">
                <a
                    href="https://wasmcloud.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-blue-400 transition-colors"
                >
                    wasmCloud Docs
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </div>
    )
}
