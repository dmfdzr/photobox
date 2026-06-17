"use client"

import * as React from "react"

type Theme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
}

const STORAGE_KEY = "photobox-theme"
const ThemeContext = React.createContext<{
  theme: Theme
  mounted: boolean
  toggleTheme: () => void
} | null>(null)

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>("light")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null
      const initialTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : getSystemTheme()

      setTheme(initialTheme)
      setMounted(true)
      applyTheme(initialTheme)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const setAndStoreTheme = React.useCallback((nextTheme: Theme) => {
    setTheme(nextTheme)
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
    applyTheme(nextTheme)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setAndStoreTheme(theme === "dark" ? "light" : "dark")
  }, [setAndStoreTheme, theme])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d" || isTypingTarget(event.target)) {
        return
      }

      toggleTheme()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [toggleTheme])

  return <ThemeContext.Provider value={{ theme, mounted, toggleTheme }}>{children}</ThemeContext.Provider>
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.")
  }
  return context
}

export { ThemeProvider, useTheme }
