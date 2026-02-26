'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AnalyticsStats } from './actions'

interface Props {
    stats: AnalyticsStats
}

function formatPrice(price: number | null): string {
    if (price === null || price === undefined) return '—'
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

function StatusBadge({ status }: { status: string }) {
    const normalized = status?.toLowerCase() ?? ''
    let colorClass = 'bg-gray-500/10 text-gray-400'
    if (normalized === 'actief' || normalized === 'active') colorClass = 'bg-emerald-500/10 text-emerald-500'
    else if (normalized === 'verkocht' || normalized === 'sold') colorClass = 'bg-blue-500/10 text-blue-500'
    else if (normalized === 'onder bod' || normalized === 'under offer') colorClass = 'bg-amber-500/10 text-amber-500'
    return (
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${colorClass}`}>
            {status}
        </span>
    )
}

export default function AnalyticsClient({ stats }: Props) {
    const [chartMode, setChartMode] = useState<'appointments' | 'properties'>('appointments')

    const chartData = chartMode === 'appointments' ? stats.monthlyAppointments : stats.monthlyProperties
    const chartMax = Math.max(...chartData.map((d) => d.count), 1)
    const chartBars = chartData.map((d) => ({
        ...d,
        percentage: Math.round((d.count / chartMax) * 100),
    }))

    // Scorecard definitions with real data
    const scorecards = [
        {
            label: 'Totaal Afspraken',
            value: String(stats.totalAppointments),
            sub: `${stats.upcomingAppointments} gepland`,
            trend: 'neutral' as const,
            icon: 'calendar_month',
            href: '/agenda',
        },
        {
            label: 'Actieve Woningen',
            value: String(stats.activeProperties),
            sub: `van ${stats.totalProperties} totaal`,
            trend: stats.activeProperties > 0 ? 'up' : 'neutral' as const,
            icon: 'home',
            href: '/properties',
        },
        {
            label: 'Teamleden',
            value: String(stats.teamMemberCount),
            sub: 'actief in uw kantoor',
            trend: 'neutral' as const,
            icon: 'group',
            href: '/settings/team',
        },
        {
            label: 'Beoordelingen',
            value: String(stats.reviewCount),
            sub: 'ontvangen reviews',
            trend: stats.reviewCount > 0 ? 'up' : 'neutral' as const,
            icon: 'star',
            href: '/dashboard/reviews',
        },
    ]

    return (
        <div className="space-y-8">
            {/* ── Scorecards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {scorecards.map((stat, i) => (
                    <Link
                        key={i}
                        href={stat.href}
                        className="group/card bg-white dark:bg-[#111] p-5 md:p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-[#0df2a2]/30 transition-all duration-300 hover:-translate-y-1 block cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] group-hover/card:text-[#0df2a2] transition-colors">
                                {stat.label}
                            </p>
                            <span className="material-symbols-outlined text-[18px] text-[#0df2a2]/60 group-hover/card:text-[#0df2a2] group-hover/card:scale-110 transition-all">
                                {stat.icon}
                            </span>
                        </div>
                        <div className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-2 group-hover/card:translate-x-1 transition-transform">
                            {stat.value}
                        </div>
                        <div className={`flex items-center text-[10px] md:text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                            {stat.trend === 'up' && (
                                <span className="material-symbols-outlined text-[14px] mr-1 animate-pulse">trending_up</span>
                            )}
                            {stat.sub}
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Charts ── */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Bar Chart – switchable */}
                <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm lg:col-span-2 xl:col-span-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h3 className="font-black text-lg text-gray-900 dark:text-white tracking-tight">
                            {chartMode === 'appointments' ? 'Afspraken per maand' : 'Woningen toegevoegd'}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartMode('appointments')}
                                className={`text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl transition-all ${chartMode === 'appointments'
                                    ? 'bg-[#0df2a2] text-black'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                Afspraken
                            </button>
                            <button
                                onClick={() => setChartMode('properties')}
                                className={`text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl transition-all ${chartMode === 'properties'
                                    ? 'bg-[#0df2a2] text-black'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                Woningen
                            </button>
                        </div>
                    </div>

                    {chartMax === 1 && chartData.every((d) => d.count === 0) ? (
                        <div className="h-48 md:h-64 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm font-bold">
                            <div className="text-center space-y-2">
                                <span className="material-symbols-outlined text-5xl block text-gray-200 dark:text-white/10">bar_chart</span>
                                Geen data beschikbaar voor deze periode
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 md:h-64 flex items-end justify-between gap-1.5 md:gap-2">
                            {chartBars.map((bar, i) => (
                                <div key={i} className="w-full bg-emerald-500/10 rounded-t-xl relative group h-full">
                                    <div
                                        className="absolute bottom-0 left-0 right-0 bg-[#0df2a2] rounded-t-xl transition-all duration-700 hover:brightness-110"
                                        style={{ height: `${bar.percentage}%` }}
                                    />
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {bar.count} {chartMode === 'appointments' ? 'afspraken' : 'woningen'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between mt-6 text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        {chartData.map((d) => <span key={d.month}>{d.month}</span>)}
                    </div>
                </div>

                {/* Completions Breakdown */}
                <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h3 className="font-black text-lg text-gray-900 dark:text-white tracking-tight">Afspraken Status</h3>
                    </div>

                    {stats.totalAppointments === 0 ? (
                        <div className="h-48 md:h-64 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm font-bold">
                            <div className="text-center space-y-2">
                                <span className="material-symbols-outlined text-5xl block text-gray-200 dark:text-white/10">event_busy</span>
                                Nog geen afspraken ingepland
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5 mt-4">
                            {[
                                {
                                    label: 'Gepland',
                                    count: stats.upcomingAppointments,
                                    color: 'bg-[#0df2a2]',
                                    textColor: 'text-emerald-400',
                                },
                                {
                                    label: 'Voltooid',
                                    count: stats.completedAppointments,
                                    color: 'bg-blue-500',
                                    textColor: 'text-blue-400',
                                },
                                {
                                    label: 'Overig',
                                    count: stats.totalAppointments - stats.upcomingAppointments - stats.completedAppointments,
                                    color: 'bg-amber-500',
                                    textColor: 'text-amber-400',
                                },
                            ].map((item) => {
                                const pct = stats.totalAppointments > 0
                                    ? Math.round((item.count / stats.totalAppointments) * 100)
                                    : 0
                                return (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${item.textColor}`}>
                                                {item.label}
                                            </span>
                                            <span className="text-xs font-black text-gray-900 dark:text-white">
                                                {item.count} <span className="text-gray-400 font-bold">({pct}%)</span>
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Totaal</span>
                                <span className="text-lg font-black text-gray-900 dark:text-white">{stats.totalAppointments}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Top Properties Table ── */}
            <div className="bg-white dark:bg-[#111] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white tracking-tight">
                        Uw Woningen Portfolio
                    </h3>
                </div>

                {stats.topProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 gap-3">
                        <span className="material-symbols-outlined text-5xl text-gray-200 dark:text-white/10">home_work</span>
                        <p className="text-sm font-bold">Nog geen woningen toegevoegd</p>
                        <a href="/properties/new" className="text-[#0df2a2] text-xs font-black uppercase tracking-wider hover:opacity-80 transition-opacity">
                            + Eerste woning toevoegen
                        </a>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 border-collapse">
                            <thead className="bg-gray-50 dark:bg-white/5 text-[9px] md:text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-[0.2em]">
                                <tr>
                                    <th className="px-6 md:px-8 py-5">Woning</th>
                                    <th className="px-6 py-5 hidden md:table-cell">Prijs</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 md:px-8 py-5 text-right">Actie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {stats.topProperties.map((prop) => (
                                    <tr key={prop.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 md:px-8 py-5">
                                            <div className="font-black text-gray-900 dark:text-white transition-colors group-hover:text-[#0df2a2] truncate max-w-[150px] md:max-w-none">
                                                {prop.address}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{prop.city}</div>
                                            <div className="md:hidden text-[10px] font-bold text-gray-400 mt-0.5">{formatPrice(prop.price)}</div>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                            {formatPrice(prop.price)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={prop.status} />
                                        </td>
                                        <td className="px-6 md:px-8 py-5 text-right">
                                            <a
                                                href={`/properties/${prop.id}`}
                                                className="text-[#0df2a2] text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity"
                                            >
                                                Bekijk →
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
