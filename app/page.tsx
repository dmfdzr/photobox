import Link from "next/link"
import { Camera, Download, LayoutTemplate, Sparkles } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

const features = [
  { icon: Sparkles, title: "Start instantly", text: "Create your photo strip without a long setup." },
  { icon: Camera, title: "Take or upload", text: "Use your camera or pick images from your device." },
  { icon: LayoutTemplate, title: "Make it yours", text: "Choose strips, grids, frames, and simple filters." },
  { icon: Download, title: "Save the result", text: "Download your finished photobox when it looks right." },
]

function MockPhotobox() {
  return (
    <div className="relative mx-auto w-full max-w-sm rotate-2 rounded-lg border border-pink-100 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)] dark:border-pink-300/20">
      <div className="grid gap-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="aspect-[5/3] rounded-lg border-8 border-slate-50 bg-[linear-gradient(135deg,#60A5FA,#F9A8D4)]" />
        ))}
      </div>
      <div className="mt-5 text-center">
        <p className="text-2xl font-black text-slate-950">SnappBox</p>
        <p className="text-sm font-semibold text-slate-500">Today&apos;s tiny celebration</p>
      </div>
      <span className="absolute -right-5 top-10 rounded-full bg-pink-200 px-4 py-2 text-sm font-black text-pink-900 shadow">PNG</span>
    </div>
  )
}

export default function Page() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <section className="relative px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[linear-gradient(135deg,#DBEAFE,#FFFFFF_45%,#FCE7F3)] dark:bg-[linear-gradient(135deg,#0F172A,#111827_45%,#3B1230)]" />
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild>
              <Link href="/create">Start Creating</Link>
            </Button>
          </div>
        </nav>

        <div className="mx-auto grid max-w-6xl items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-20">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-sky-200 bg-card/80 px-4 py-2 text-sm font-bold text-sky-700 shadow-sm dark:border-sky-500/30 dark:text-sky-300">
              Instant photobox creator
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl">
              Create your photobox moment instantly.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Take or upload your photo, customize the layout, and save a polished result in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/create">Start Creating</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/upload">Upload Photo</Link>
              </Button>
            </div>
          </div>
          <MockPhotobox />
        </div>

        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-lg border bg-card p-5 shadow-sm">
              <feature.icon className="mb-4 size-6 text-sky-600" />
              <h2 className="font-black">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
