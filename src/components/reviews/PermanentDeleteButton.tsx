'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { permanentlyDeleteReview } from '@/app/review/actions'
import { Trash2, Loader2 } from 'lucide-react'

interface PermanentDeleteButtonProps {
    reviewId: string
}

export default function PermanentDeleteButton({ reviewId }: PermanentDeleteButtonProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleDelete = () => {
        if (!confirm('Weet u zeker dat u deze review PERMANENT wilt verwijderen? Dit kan NIET ongedaan worden gemaakt.')) return

        startTransition(async () => {
            const result = await permanentlyDeleteReview(reviewId)
            if (result.success) {
                router.refresh()
            } else {
                alert(result.error)
            }
        })
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 text-[11px] font-bold uppercase tracking-tight transition-all disabled:opacity-50 border border-white/5 hover:border-red-500/20"
            title="Permanent verwijderen"
        >
            {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
            ) : (
                <Trash2 className="w-3.5 h-3.5" />
            )}
            Wissen
        </button>
    )
}
