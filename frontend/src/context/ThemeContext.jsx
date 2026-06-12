import { createContext, useState, useContext, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  // themeMode: "system" | "light" | "dark"
  const getInitialMode = () => {
    const saved = localStorage.getItem('reassure-theme-mode')
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    // Migrate from old key if present
    const legacy = localStorage.getItem('reassure-theme')
    if (legacy === 'light' || legacy === 'dark') return legacy
    return 'system'
  }

  const [themeMode, setThemeMode] = useState(getInitialMode)
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const mode = getInitialMode()
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    return mode
  })

  // Resolve the effective theme whenever themeMode changes or system pref changes
  useEffect(() => {
    const resolve = () => {
      if (themeMode === 'system') {
        const sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
        setResolvedTheme(sys)
      } else {
        setResolvedTheme(themeMode)
      }
    }

    resolve()

    // Listen for system theme changes when mode is "system"
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (themeMode === 'system') resolve() }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [themeMode])

  // Apply data-theme attribute and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    localStorage.setItem('reassure-theme-mode', themeMode)
    // Keep legacy key in sync so other parts of app that read it still work
    localStorage.setItem('reassure-theme', resolvedTheme)
  }, [resolvedTheme, themeMode])

  // Legacy toggle for the navbar Sun/Moon button (cycles dark <-> light)
  const toggleTheme = useCallback(() => {
    setThemeMode(prev => {
      if (prev === 'system') {
        // If system, toggle to the opposite of current resolved
        return resolvedTheme === 'dark' ? 'light' : 'dark'
      }
      return prev === 'dark' ? 'light' : 'dark'
    })
  }, [resolvedTheme])

  return (
    <ThemeContext.Provider value={{
      theme: resolvedTheme,
      themeMode,
      setThemeMode,
      toggleTheme,
      isDark: resolvedTheme === 'dark',
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
