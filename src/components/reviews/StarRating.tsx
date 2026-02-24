"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    maxStars?: number;
    initialRating?: number;
    onRatingChange?: (rating: number) => void;
    readOnly?: boolean;
}

export default function StarRating({
    maxStars = 5,
    initialRating = 0,
    onRatingChange,
    readOnly = false,
}: StarRatingProps) {
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);

    const handleMouseEnter = (index: number) => {
        if (!readOnly) setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (!readOnly) setHoverRating(0);
    };

    const handleClick = (index: number) => {
        if (!readOnly) {
            setRating(index);
            if (onRatingChange) {
                onRatingChange(index);
            }
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array.from({ length: maxStars }).map((_, i) => {
                const starValue = i + 1;
                const isActive = starValue <= (hoverRating || rating);

                return (
                    <button
                        key={i}
                        type="button"
                        className={cn(
                            "transition-all active:scale-90",
                            !readOnly && "cursor-pointer focus:outline-none"
                        )}
                        style={{
                            filter: isActive ? "drop-shadow(0 0 12px rgba(13, 242, 162, 0.4))" : "none",
                        }}
                        onMouseEnter={() => handleMouseEnter(starValue)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick(starValue)}
                        disabled={readOnly}
                    >
                        <Star
                            className={cn(
                                "w-10 h-10 transition-colors",
                                isActive ? "fill-[#0df2a2] text-[#0df2a2]" : "fill-transparent text-[#0df2a2]/30"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}
