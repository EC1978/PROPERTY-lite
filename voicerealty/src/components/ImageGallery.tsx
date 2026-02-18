'use client'

import { useState } from 'react'
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import Image from 'next/image'

interface ImageGalleryProps {
    images: string[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
    const [open, setOpen] = useState(false)
    const [index, setIndex] = useState(0)

    if (!images || images.length === 0) return null

    // Display first 5 images in a grid (1 main, 4 smaller)
    const mainImage = images[0]
    const smallImages = images.slice(1, 5)
    const remainingCount = images.length - 5

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px] mb-8 rounded-2xl overflow-hidden cursor-pointer">
                {/* Main Large Image */}
                <div
                    className="md:col-span-2 md:row-span-2 relative group"
                    onClick={() => { setIndex(0); setOpen(true) }}
                >
                    <Image
                        src={mainImage}
                        alt="Hoofdfoto"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Smaller Images */}
                <div className="hidden md:grid md:col-span-2 md:grid-cols-2 gap-4 h-full">
                    {smallImages.map((img, i) => (
                        <div
                            key={i}
                            className="relative group h-full"
                            onClick={() => { setIndex(i + 1); setOpen(true) }}
                        >
                            <Image
                                src={img}
                                alt={`Foto ${i + 2}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                            {/* Show "+X more" on the last image if there are more */}
                            {i === 3 && remainingCount > 0 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm">
                                    +{remainingCount} Foto's
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Lightbox
                open={open}
                close={() => setOpen(false)}
                index={index}
                slides={images.map(src => ({ src }))}
                on={{ view: ({ index }) => setIndex(index) }}
                controller={{ closeOnBackdropClick: true }}
                animation={{ fade: 0 }}
            />
        </>
    )
}
