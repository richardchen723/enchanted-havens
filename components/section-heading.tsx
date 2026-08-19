import { cn } from "@/lib/utils"

export function SectionHeading({ eyebrow, title, body, align = "left", light = false }: { eyebrow: string; title: string; body?: string; align?: "left" | "center"; light?: boolean }) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <p className={cn("eyebrow mb-4", light ? "text-[#c5a46d]" : "text-[#805a27]")}>{eyebrow}</p>
      <h2 className={cn("font-display text-5xl leading-[0.98] sm:text-6xl lg:text-7xl", light ? "text-[#f3eee3]" : "text-[#173c33]")}>{title}</h2>
      {body && <p className={cn("mt-6 text-base leading-8 sm:text-lg", light ? "text-white/65" : "text-[#17211e]/64")}>{body}</p>}
    </div>
  )
}
