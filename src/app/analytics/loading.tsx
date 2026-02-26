export default function AnalyticsLoading() {
    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans">
            {/* Sidebar placeholder */}
            <div className="hidden md:block w-72 shrink-0" />

            <main className="flex-1 md:ml-72 p-4 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 w-full min-w-0">
                <div className="max-w-7xl mx-auto space-y-8 animate-pulse">

                    {/* Header skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-gray-200 dark:bg-white/10 rounded-2xl" />
                        <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded-xl" />
                    </div>

                    {/* Scorecard skeletons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 space-y-4">
                                <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded-full" />
                                <div className="h-8 w-20 bg-gray-200 dark:bg-white/10 rounded-xl" />
                                <div className="h-3 w-28 bg-gray-100 dark:bg-white/5 rounded-full" />
                            </div>
                        ))}
                    </div>

                    {/* Chart skeletons */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="h-5 w-40 bg-gray-200 dark:bg-white/10 rounded-xl" />
                                    <div className="h-7 w-28 bg-gray-100 dark:bg-white/5 rounded-xl" />
                                </div>
                                {/* Bar chart skeleton */}
                                <div className="h-48 md:h-64 flex items-end justify-between gap-2">
                                    {[60, 80, 45, 90, 55, 70, 40].map((h, j) => (
                                        <div key={j} className="w-full rounded-t-xl bg-gray-100 dark:bg-white/5" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                                <div className="flex justify-between">
                                    {['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul'].map((m) => (
                                        <div key={m} className="h-2 w-5 bg-gray-100 dark:bg-white/5 rounded-full" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table skeleton */}
                    <div className="bg-white dark:bg-[#111] rounded-[2.5rem] border border-gray-200 dark:border-white/5 overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5">
                            <div className="h-5 w-52 bg-gray-200 dark:bg-white/10 rounded-xl" />
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="px-6 md:px-8 py-5 flex items-center justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
                                        <div className="h-3 w-24 bg-gray-100 dark:bg-white/5 rounded-lg" />
                                    </div>
                                    <div className="h-4 w-24 bg-gray-100 dark:bg-white/5 rounded-lg hidden md:block" />
                                    <div className="h-6 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
                                    <div className="h-4 w-12 bg-gray-100 dark:bg-white/5 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
