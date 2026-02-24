'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteReview, toggleHideReview } from '@/app/review/actions'
import { Eye, EyeOff, Trash2, Loader2 } from 'lucide-react'

interface ReviewManagementControlsProps {
    reviewId: string
    isHidden: boolean
}

export default function ReviewManagementControls({ reviewId, isHidden }: ReviewManagementControlsProps) {
    const router = useRouter()
    const [isDeleting, startDeleteTransition] = useTransition()
    const [isToggling, startToggleTransition] = useTransition()

    const handleDelete = () => {
        if (!confirm('Weet u zeker dat u deze review wilt verplaatsen naar de prullenbak?')) return

        startDeleteTransition(async () => {
            const result = await deleteReview(reviewId)
            if (result.success) {
                router.refresh()
            } else {
                alert(result.error)
            }
        })
    }

    const handleToggleHide = () => {
        startToggleTransition(async () => {
            const result = await toggleHideReview(reviewId, isHidden)
            if (result.success) {
                router.refresh()
            } else {
                alert(result.error)
            }
        })
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleToggleHide}
                disabled={isToggling || isDeleting}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all focus:outline-none disabled:opacity-50"
                title={isHidden ? "Toon aan publiek" : "Verberg voor publiek"}
            >
                {isToggling ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0df2a2]" />
                ) : isHidden ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                    <Eye className="w-4 h-4 text-[#0df2a2]" />
                )}
            </button>
            <button
                onClick={handleDelete}
                disabled={isDeleting || isToggling}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all focus:outline-none disabled:opacity-50"
                title="Verwijder review"
            >
                {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Trash2 className="w-4 h-4" />
                )}
            </button>
        </div>
    )
}
