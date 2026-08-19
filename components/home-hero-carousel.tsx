"use client"

import Image from "next/image"
import { Pause, Play } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type HeroSlide = {
  name: string
  image: string
  position: string
}

export function HomeHeroCarousel({ slides, intervalSeconds = 5 }: { slides: HeroSlide[]; intervalSeconds?: number }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [userPaused, setUserPaused] = useState(false)
  const [hoverPaused, setHoverPaused] = useState(false)
  const paused = userPaused || hoverPaused
  const nextIndex = slides.length > 1 ? (currentIndex + 1) % slides.length : currentIndex
  const visibleIndexes = useMemo(
    () => [...new Set([previousIndex, currentIndex, nextIndex].filter((index): index is number => index !== null))],
    [currentIndex, nextIndex, previousIndex],
  )

  useEffect(() => {
    if (slides.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setInterval(() => {
      setCurrentIndex((index) => {
        setPreviousIndex(index)
        return (index + 1) % slides.length
      })
    }, intervalSeconds * 1000)
    return () => window.clearInterval(timer)
  }, [intervalSeconds, paused, slides.length])

  useEffect(() => {
    if (previousIndex === null) return
    const timer = window.setTimeout(() => setPreviousIndex(null), 1500)
    return () => window.clearTimeout(timer)
  }, [currentIndex, previousIndex])

  if (!slides.length) return null

  return (
    <div
      className="absolute inset-0 z-0"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      {visibleIndexes.map((index) => {
        const slide = slides[index]
        const isCurrent = index === currentIndex
        const isPrevious = index === previousIndex
        return (
          <Image
            key={slide.name}
            src={slide.image}
            alt=""
            fill
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : undefined}
            quality={75}
            sizes="100vw"
            className={`object-cover transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none ${isCurrent ? "z-10 opacity-100" : isPrevious ? "z-0 opacity-0" : "z-0 opacity-0"}`}
            style={{ objectPosition: slide.position }}
          />
        )
      })}
      {slides.length > 1 ? (
        <div className="absolute bottom-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-10">
          {slides.map((slide, index) => (
            <span aria-hidden="true" key={`${slide.name}-marker`} className={`h-px transition-all duration-500 ${index === currentIndex ? "w-9 bg-white" : "w-5 bg-white/35"}`} />
          ))}
          <button type="button" aria-label={userPaused ? "Play hero slideshow" : "Pause hero slideshow"} onClick={() => setUserPaused((value) => !value)} className="ml-2 grid size-11 place-items-center rounded-full border border-white/45 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40">
            {userPaused ? <Play className="size-4 fill-current" /> : <Pause className="size-4 fill-current" />}
          </button>
        </div>
      ) : null}
    </div>
  )
}
