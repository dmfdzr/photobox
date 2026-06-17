"use client"

import Image from "next/image"
import Link from "next/link"

type BrandMarkProps = {
  href?: string
  size?: "sm" | "md"
}

export function BrandMark({ href = "/", size = "md" }: BrandMarkProps) {
  const imageSize = size === "sm" ? 30 : 38
  const textSize = size === "sm" ? "text-sm" : "text-xl"

  return (
    <Link href={href} className="inline-flex items-center gap-2 font-black tracking-normal text-foreground">
      <Image
        src="/assets/snapp.png"
        alt="SnappBox logo"
        width={imageSize}
        height={imageSize}
        className="rounded-md"
        priority={size === "md"}
      />
      <span className={textSize}>SnappBox</span>
    </Link>
  )
}
