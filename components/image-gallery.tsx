"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Images, LoaderCircle, X } from "lucide-react"
import { trackConversionEvent } from "@/lib/analytics"
import { propertyGalleryImageAlt } from "@/lib/property-image-seo"

const galleryCaptions = [
  { eyebrow: "The Setting", title: "Arrive in the landscape" },
  { eyebrow: "The Outlook", title: "Follow the light outside" },
  { eyebrow: "The Residence", title: "Settle into the room" },
] as const

export function ImageGallery({ images, listingId, name, location, tags = [], previewStart = 0 }: { images: string[]; listingId: number; name: string; location?: string; tags?: string[]; previewStart?: number }) {
  const [open, setOpen] = useState(false)
  const [fullGallery, setFullGallery] = useState(images)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const requestedListingRef = useRef<number | null>(null)
  const gallery = fullGallery.slice(previewStart, previewStart + 3)
  const galleryLocation = location || "the Pacific Northwest"
  const imageAlt = (index: number) => propertyGalleryImageAlt({ name, location: galleryLocation, index, tags })

  const displayedIndex = Math.min(activeIndex, Math.max(fullGallery.length - 1, 0))
  const activeImage = fullGallery[displayedIndex] || images[0]

  const showPrevious = useCallback(() => {
    setActiveIndex((index) => (index - 1 + fullGallery.length) % fullGallery.length)
  }, [fullGallery.length])

  const showNext = useCallback(() => {
    setActiveIndex((index) => (index + 1) % fullGallery.length)
  }, [fullGallery.length])

  function openGallery(trigger: HTMLElement, index = 0) {
    returnFocusRef.current = trigger
    setActiveIndex(Math.min(index, Math.max(fullGallery.length - 1, 0)))
    setOpen(true)
    trackConversionEvent("Gallery Opened", { listingId, property: name })
  }

  function closeGallery() {
    setOpen(false)
    window.requestAnimationFrame(() => returnFocusRef.current?.focus())
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    if (!open) return () => { document.body.style.overflow = "" }
    closeButtonRef.current?.focus()
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGallery()
      if (event.key === "ArrowLeft" && fullGallery.length > 1) {
        event.preventDefault()
        showPrevious()
      }
      if (event.key === "ArrowRight" && fullGallery.length > 1) {
        event.preventDefault()
        showNext()
      }
      if (event.key !== "Tab" || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')].filter((item) => !item.hasAttribute("disabled"))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1) || first
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleKeydown)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", handleKeydown)
    }
  }, [open, fullGallery.length, showNext, showPrevious])

  useEffect(() => {
    if (requestedListingRef.current === listingId) return
    requestedListingRef.current = listingId
    setFullGallery(images)
    const controller = new AbortController()
    async function loadFullGallery() {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/gallery/${listingId}`, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok || !Array.isArray(data.images)) throw new Error(data.error || "Unable to load the complete gallery.")
        if (data.images.length) setFullGallery([...images, ...data.images].filter((image, index, all) => all.indexOf(image) === index))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          requestedListingRef.current = null
          return
        }
        setError(requestError instanceof Error ? requestError.message : "Unable to load the complete gallery.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadFullGallery()
    return () => controller.abort()
  }, [images, listingId])

  return (
    <>
      <div className="group relative flex w-full flex-col justify-between gap-5 rounded-sm p-1 text-left transition has-[:active]:bg-white/45 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#805a27]">Visual Tour</p>
          <h2 className="mt-3 font-display text-4xl leading-none text-[#173c33] sm:text-5xl">A first walk through the haven.</h2>
        </div>
        <span className="button-outline pointer-events-none justify-center text-[#173c33] transition group-active:scale-[0.98] sm:justify-start">
          <Images className="size-4" /> View full gallery
        </span>
        <button
          type="button"
          onClick={(event) => openGallery(event.currentTarget)}
          className="absolute inset-0 z-10 cursor-zoom-in touch-manipulation rounded-sm"
          aria-label={`View the complete ${name} gallery`}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-12 md:grid-rows-2">
        {gallery.map((image, index) => {
          const caption = galleryCaptions[index] || galleryCaptions[galleryCaptions.length - 1]
          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={(event) => openGallery(event.currentTarget, previewStart + index)}
              data-testid={`gallery-preview-${index + 1}`}
              className={`image-lift group relative min-h-[22rem] cursor-zoom-in touch-manipulation overflow-hidden bg-[#dbe2dd] text-left transition active:scale-[0.995] active:ring-4 active:ring-inset active:ring-[#d4b47d] ${index === 0 ? "md:col-span-7 md:row-span-2 md:min-h-[44rem]" : "md:col-span-5 md:min-h-0"}`}
              aria-label={`Open ${name} image gallery in ${galleryLocation}`}
            >
              <Image src={image} alt={imageAlt(index + previewStart)} fill loading={index === 0 && previewStart === 0 ? "eager" : "lazy"} sizes={index === 0 ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 42vw"} className="pointer-events-none object-cover transition duration-700 group-hover:scale-[1.025] group-active:scale-[1.015]" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071e19]/72 via-transparent to-transparent" aria-hidden="true" />
              <span className="pointer-events-none absolute right-4 top-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#faf7f0]/92 px-4 text-[0.61rem] font-bold uppercase tracking-[0.12em] text-[#173c33] shadow-[0_4px_18px_rgba(7,30,25,.18)] backdrop-blur-md"><Images className="size-3.5" /> Open gallery</span>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <span className="eyebrow text-[#e7c892]">{caption.eyebrow}</span>
                <span className="mt-2 block font-display text-3xl leading-none">{caption.title}</span>
              </span>
            </button>
          )
        })}
      </div>

      {open && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${name} gallery`} aria-busy={loading} className="fixed inset-0 z-[80] overflow-y-auto bg-[#071e19] p-3 text-white sm:p-8">
          <div className="sticky top-0 z-10 mx-auto mb-5 flex max-w-7xl items-center justify-between bg-[#071e19]/92 py-3 backdrop-blur-xl">
            <div><p className="eyebrow text-[#d4b47d]">Private Gallery</p><p className="mt-1 font-display text-3xl">{name}</p><p data-testid="gallery-photo-count" aria-live="polite" className="mt-1 text-xs text-white/54">{loading ? "Preparing the complete residence gallery..." : `Photograph ${displayedIndex + 1} of ${fullGallery.length}`}</p></div>
            <button ref={closeButtonRef} type="button" onClick={closeGallery} className="grid size-12 place-items-center border border-white/25 bg-white text-[#173c33]" aria-label="Close gallery"><X /></button>
          </div>
          {loading ? <div className="mx-auto mb-5 flex max-w-7xl items-center gap-3 border border-white/14 px-5 py-4 text-sm text-white/66"><LoaderCircle className="size-5 animate-spin text-[#d4b47d]" /> Loading every photograph from the current property gallery.</div> : null}
          {error ? <div role="alert" className="mx-auto mb-5 max-w-7xl border border-[#d4b47d]/30 px-5 py-4 text-sm text-white/72">{error} The curated preview remains available below.</div> : null}
          <div className="relative mx-auto max-w-7xl overflow-hidden bg-black/20">
            <button data-testid="gallery-active-image" type="button" onClick={showNext} disabled={fullGallery.length < 2} className="group relative block aspect-[4/3] w-full touch-manipulation overflow-hidden disabled:cursor-default sm:aspect-[16/10]" aria-label={fullGallery.length > 1 ? "View next photograph" : "Current photograph"}>
              <Image key={activeImage} src={activeImage} alt={imageAlt(displayedIndex)} fill loading="eager" sizes="(max-width: 768px) 100vw, 90vw" className="object-contain" />
              {fullGallery.length > 1 ? <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#071e19]/78 px-4 py-2 text-[0.6rem] font-bold uppercase tracking-[0.13em] text-white/78 opacity-0 transition group-focus-visible:opacity-100 group-hover:opacity-100">Tap photo for next</span> : null}
            </button>
            {fullGallery.length > 1 ? (
              <>
                <button type="button" onClick={showPrevious} aria-label="View previous photograph" className="absolute left-3 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-[#071e19]/78 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#071e19] sm:left-5"><ChevronLeft className="size-6" /></button>
                <button type="button" onClick={showNext} aria-label="View next photograph" className="absolute right-3 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-[#071e19]/78 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#071e19] sm:right-5"><ChevronRight className="size-6" /></button>
              </>
            ) : null}
          </div>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 border-t border-white/12 py-4 text-xs text-white/54">
            <p>Use the controls or arrow keys to move through the residence.</p>
            <p className="shrink-0">{displayedIndex + 1} / {fullGallery.length}</p>
          </div>
        </div>
      )}
    </>
  )
}
