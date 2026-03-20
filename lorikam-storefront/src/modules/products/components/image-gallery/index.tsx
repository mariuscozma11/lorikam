"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)

  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  if (!images || images.length === 0) {
    return (
      <Container className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle">
        <div className="flex items-center justify-center h-full text-ui-fg-muted">
          No images available
        </div>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative">
        <Container className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                index === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  priority={index === 0}
                  className="rounded-rounded object-cover"
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
            </div>
          ))}
        </Container>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg grid place-items-center transition-all duration-200 hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft className="!w-5 !h-5 text-ui-fg-base" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg grid place-items-center transition-all duration-200 hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight className="!w-5 !h-5 text-ui-fg-base" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === activeIndex
                    ? "bg-ui-fg-base w-6"
                    : "bg-ui-fg-muted/50 hover:bg-ui-fg-muted"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto p-2 -m-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToSlide(index)}
              className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                index === activeIndex
                  ? "ring-2 ring-ui-fg-base ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  className="object-cover"
                  alt={`Product thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
