"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StarRating from "./StarRating";
import { ArrowRight, Loader2 } from "lucide-react";
import { submitReview } from "@/app/review/actions";

interface ReviewFormProps {
    propertyId: string;
}

export default function ReviewForm({ propertyId }: ReviewFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [name, setName] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return; // Optional: show an error message

        setIsSubmitting(true);
        setErrorMsg("");

        const result = await submitReview(propertyId, rating, feedback, name);

        if (result.success) {
            // Redirect to thank you page
            router.push("/review/thank-you");
        } else {
            setErrorMsg(result.error || "Er is een fout opgetreden.");
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
            {/* Star Rating Section */}
            <div className="flex flex-col items-center">
                <StarRating
                    maxStars={5}
                    initialRating={rating}
                    onRatingChange={setRating}
                />
                {rating === 0 && (
                    <p className="mt-4 text-white/50 text-sm italic">
                        Klik op een ster om uw waardering te geven.
                    </p>
                )}
            </div>

            {/* Name Input */}
            <div className="w-full space-y-3">
                <label htmlFor="name" className="block text-white font-semibold text-sm px-1">
                    Uw naam (optioneel)
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="bijv. Jan de Vries"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-sm text-white/80 placeholder:text-white/20 focus:ring-[#0df2a2] focus:border-[#0df2a2] transition-all"
                />
            </div>

            {/* Feedback Textarea */}
            <div className="w-full space-y-3">
                <label htmlFor="feedback" className="block text-white font-semibold text-sm px-1">
                    Laat een reactie achter (optioneel)
                </label>
                <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Wat vond u goed gaan en wat kan er beter? We horen het graag..."
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-sm text-white/80 placeholder:text-white/20 focus:ring-[#0df2a2] focus:border-[#0df2a2] transition-all min-h-[120px]"
                />
            </div>

            {errorMsg && (
                <div className="text-red-500 text-sm italic bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    {errorMsg}
                </div>
            )}

            {/* CTA Button */}
            <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full bg-[#0df2a2] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0df2a2]/90 text-[#0A0A0A] font-bold py-4 rounded-xl shadow-lg shadow-[#0df2a2]/20 transition-all flex items-center justify-center gap-2 group mt-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Even geduld...
                    </>
                ) : (
                    <>
                        Verstuur review
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
    );
}
