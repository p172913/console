import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    Server,
    Cpu,
    RefreshCw,
    Activity,
    Box,
    ExternalLink,
} from 'lucide-react'
import { Skeleton } from '../../ui/Skeleton'
import { useWasmCloudStatus } from './useWasmCloudStatus'
import type { WasmCloudHost, WasmCloudActor } from './demoData'
import { MetricTile } from '../../../lib/cards/CardComponents'

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


function HostRow({ host }: { host: WasmCloudHost }) {
    const { t } = useTranslation('cards')
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
                    {t(`wasmcloud.${host.status}`)}
                </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span title={t('wasmcloud.cluster')}>{host.cluster}</span>
                <span title={t('wasmcloud.version')}>v{host.version}</span>
                <span title={t('wasmcloud.uptime')}>↑ {host.uptime}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> {t('wasmcloud.actors_count', { count: host.actors })}
                </span>
                <span className="flex items-center gap-1">
                    <Box className="w-3 h-3" /> {t('wasmcloud.providers_count', { count: host.providers })}
                </span>
            </div>
        </div>
    )
}

function ActorRow({ actor }: { actor: WasmCloudActor }) {
    const { t } = useTranslation('cards')
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
                <span title={t('wasmcloud.cluster')}>{actor.cluster}</span>
                <span className="truncate" title={actor.capabilities.join(', ')}>
                    {actor.capabilities.join(', ')}
                </span>
            </div>
        </div>
    )
}


export function WasmCloudStatus() {
    const { t } = useTranslation('cards')
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
                    {error ? t('wasmcloud.fetchError') : t('wasmcloud.noHosts')}
                </p>
                <p className="text-xs">{t('wasmcloud.ensureRunning')}</p>
            </div>
        )
    }

    const overallHealthy = data.degradedHosts === 0 && data.failedActors === 0

    return (
        <div className="h-full flex flex-col min-0 content-loaded gap-3">
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
                    {overallHealthy ? t('wasmcloud.healthy') : t('wasmcloud.degraded')}
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
                    label={t('wasmcloud.hosts')}
                    value={data.totalHosts}
                    colorClass="text-blue-400"
                    icon={<Server className="w-4 h-4 text-blue-400" />}
                />
                <MetricTile
                    label={t('wasmcloud.actors')}
                    value={data.totalActors}
                    colorClass="text-purple-400"
                    icon={<Cpu className="w-4 h-4 text-purple-400" />}
                />
                <MetricTile
                    label={t('wasmcloud.running')}
                    value={data.runningActors}
                    colorClass={data.failedActors > 0 ? 'text-yellow-400' : 'text-green-400'}
                    icon={<Activity className="w-4 h-4 text-green-400" />}
                />
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 flex-shrink-0" role="tablist">
                {(['hosts', 'actors'] as Tab[]).map((tValue) => (
                    <button
                        key={tValue}
                        role="tab"
                        aria-selected={tab === tValue}
                        onClick={() => setTab(tValue)}
                        className={`flex-1 text-xs py-1.5 rounded-md border transition-colors capitalize ${tab === tValue
                            ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                            : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                            }`}
                    >
                        {tValue === 'hosts' ? t('wasmcloud.hosts') : t('wasmcloud.actors')} ({tValue === 'hosts' ? data.totalHosts : data.totalActors})
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 space-y-2 overflow-y-auto min-h-card-content">
                {tab === 'hosts' ? (
                    data.hosts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            {t('wasmcloud.noHosts')}
                        </div>
                    ) : (
                        data.hosts.map((host) => <HostRow key={host.id} host={host} />)
                    )
                ) : data.actors.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        {t('wasmcloud.noActors')}
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
                    {t('wasmcloud.docs')}
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    )
}
