import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import ReviewManagementControls from '@/components/reviews/ReviewManagementControls'
import PermanentDeleteButton from '@/components/reviews/PermanentDeleteButton'
import RestoreReviewButton from '@/components/reviews/RestoreReviewButton'

export default async function ReviewsDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Haal alle reviews op via een join met properties om ook het adres te krijgen
    const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
            *,
            properties (
                id,
                address,
                city
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching reviews:', error);
    }

    const allReviews = reviewsData || []
    const reviews = allReviews.filter((r: any) => !r.is_deleted)
    const deletedReviews = allReviews.filter((r: any) => r.is_deleted)

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
        : '0.0'

    // Tel sterren voor de verdeling
    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
            ratingDist[r.rating as keyof typeof ratingDist]++
        }
    })

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
            <Sidebar userEmail={user?.email || ''} />

            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-400">Klantbeoordelingen</span>
            </div>

            <main className="flex-1 md:ml-72 pt-20 md:pt-0 pb-24 md:pb-8">
                {/* ── TOP HEADER BAR ── */}
                <div className="hidden md:flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#0df2a2] text-[20px]">star</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Klantbeoordelingen</h1>
                            <p className="text-xs text-gray-500 font-medium">Overzicht van alle AI stem ervaringen</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">

                    {/* STATS HEADER */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {/* Gemiddelde Rating */}
                        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Gemiddelde Waardering</h3>
                            <div className="text-5xl font-black text-[#0df2a2] mb-3">{averageRating}</div>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`material-symbols-outlined text-[20px] ${i < Math.round(Number(averageRating)) ? 'text-[#0df2a2]' : 'text-white/20'}`} style={{ fontVariationSettings: i < Math.round(Number(averageRating)) ? "'FILL' 1" : "'FILL' 0" }}>
                                        star
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm text-gray-400 mt-3 font-medium">Gebaseerd op {totalReviews} beoordelingen</p>
                        </div>

                        {/* Distributie */}
                        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:col-span-2 flex flex-col justify-center">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Verdeling</h3>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = ratingDist[star as keyof typeof ratingDist]
                                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                                    return (
                                        <div key={star} className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 w-12 shrink-0">
                                                <span className="text-xs font-bold text-gray-400">{star}</span>
                                                <span className="material-symbols-outlined text-[14px] text-gray-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            </div>
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0df2a2] rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-500 w-8 text-right">{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* REVIEWS LIJST */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Recente Beoordelingen</h2>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="bg-[#111] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                            <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-[32px] text-gray-500">rate_review</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Nog geen reviews</h3>
                            <p className="text-gray-400 text-sm max-w-md">
                                Je hebt nog geen klantbeoordelingen ontvangen. Zodra kopers of leads een review achterlaten na een AI bezichtiging, verschijnen ze hier.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {reviews.map((review: any) => {
                                const prop = review.properties
                                const addressDisplay = prop ? `${prop.address}${prop.city ? `, ${prop.city}` : ''}` : 'Onbekende woning'

                                return (
                                    <div key={review.id} className={`bg-[#111] hover:bg-white/[0.03] border ${review.is_hidden ? 'border-dashed border-gray-600 opacity-60' : 'border-white/5 hover:border-[#0df2a2]/30'} transition-all rounded-2xl p-6 flex flex-col gap-4 relative group`}>
                                        {review.is_hidden && (
                                            <div className="absolute -top-3 -left-3 bg-gray-800 text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-gray-600 uppercase tracking-wider">
                                                Verborgen
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex flex-col gap-1 w-full relative">
                                                {/* absolute positioned controls block that overlays the top right area carefully */}
                                                <div className="absolute top-0 right-0 z-10">
                                                    <ReviewManagementControls reviewId={review.id} isHidden={review.is_hidden} />
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`material-symbols-outlined text-[18px] ${i < review.rating ? 'text-[#0df2a2]' : 'text-white/20'}`} style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>
                                                            star
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-medium">
                                                    {new Date(review.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>

                                        {review.feedback_text ? (
                                            <p className="text-sm text-gray-300 italic line-clamp-4">"{review.feedback_text}"</p>
                                        ) : (
                                            <p className="text-sm text-gray-600 italic">Geen toelichting geschreven.</p>
                                        )}

                                        <div className="pt-4 border-t border-white/5 mt-auto flex flex-col gap-1.5">
                                            <span className="text-sm font-bold text-white">
                                                {review.reviewer_name || 'Anonieme reviewer'}
                                            </span>
                                            {prop && (
                                                <Link href={`/properties/${prop.id}`} className="flex items-center gap-1.5 text-xs text-[#0df2a2] hover:text-emerald-400 font-medium transition-colors w-fit group/link">
                                                    <span className="material-symbols-outlined text-[14px]">home</span>
                                                    <span className="truncate max-w-[200px]">{addressDisplay}</span>
                                                    <span className="material-symbols-outlined text-[14px] opacity-0 -ml-2 group-hover/link:opacity-100 group-hover/link:ml-0 transition-all">arrow_forward</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* TRASH BIN SECTION */}
                    {deletedReviews.length > 0 && (
                        <div className="mt-12">
                            <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer list-none select-none w-fit">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/5 transition-all text-gray-500 hover:text-gray-300">
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">Verwijderde reviews</span>
                                        <span className="bg-gray-700 text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{deletedReviews.length}</span>
                                        <span className="material-symbols-outlined text-[14px] transition-transform group-open:rotate-180">expand_more</span>
                                    </div>
                                </summary>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {deletedReviews.map((review: any) => {
                                        const prop = review.properties
                                        const addressDisplay = prop ? `${prop.address}${prop.city ? `, ${prop.city}` : ''}` : 'Onbekende woning'

                                        return (
                                            <div key={review.id} className="bg-white/5 backdrop-blur-sm border border-dashed border-white/10 rounded-2xl p-5 flex flex-col gap-4 opacity-70 group/trash transition-opacity hover:opacity-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={`material-symbols-outlined text-[16px] ${i < review.rating ? 'text-gray-400' : 'text-white/5'}`} style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>
                                                                star
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {new Date(review.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>

                                                {review.feedback_text ? (
                                                    <p className="text-sm text-gray-400 italic line-clamp-2">" {review.feedback_text} "</p>
                                                ) : (
                                                    <p className="text-sm text-gray-600 italic">Geen toelichting.</p>
                                                )}

                                                <div className="pt-4 border-t border-white/5 mt-auto">
                                                    <div className="flex flex-col gap-1 mb-4">
                                                        <span className="text-xs font-bold text-gray-300">
                                                            {review.reviewer_name || 'Anonieme reviewer'}
                                                        </span>
                                                        {prop && (
                                                            <span className="text-[10px] text-gray-500 truncate">{addressDisplay}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <RestoreReviewButton reviewId={review.id} />
                                                        </div>
                                                        <PermanentDeleteButton reviewId={review.id} />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
