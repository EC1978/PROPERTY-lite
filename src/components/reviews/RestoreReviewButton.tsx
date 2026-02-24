'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { restoreReview } from '@/app/review/actions'
import { RotateCcw, Loader2 } from 'lucide-react'

interface RestoreReviewButtonProps {
    reviewId: string
}

export default function RestoreReviewButton({ reviewId }: RestoreReviewButtonProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleRestore = () => {
        startTransition(async () => {
            const result = await restoreReview(reviewId)
            if (result.success) {
                router.refresh()
            } else {
                alert(result.error)
            }
        })
    }

    return (
        <button
            onClick={handleRestore}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0df2a2]/5 hover:bg-[#0df2a2]/10 text-[#0df2a2] text-[11px] font-bold uppercase tracking-tight transition-all disabled:opacity-50 border border-[#0df2a2]/10"
            title="Herstellen"
        >
            {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
                <RotateCcw className="w-3.5 h-3.5" />
            )}
            Herstellen
        </button>
    )
}
