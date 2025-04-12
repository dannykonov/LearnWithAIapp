import * as React from "react"

// Define breakpoints to match Tailwind's defaults
export const breakpoints = {
  sm: 640,    // Small devices
  md: 768,    // Medium devices
  lg: 1024,   // Large devices
  xl: 1280,   // Extra large devices
  '2xl': 1536 // 2X-Large devices
}

export type Breakpoint = keyof typeof breakpoints | "unknown"

export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<Breakpoint>("unknown")
  
  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < breakpoints.sm) {
        setCurrentBreakpoint("unknown") // Smaller than sm
      } else if (width < breakpoints.md) {
        setCurrentBreakpoint("sm")
      } else if (width < breakpoints.lg) {
        setCurrentBreakpoint("md")
      } else if (width < breakpoints.xl) {
        setCurrentBreakpoint("lg")
      } else if (width < breakpoints['2xl']) {
        setCurrentBreakpoint("xl")
      } else {
        setCurrentBreakpoint("2xl")
      }
    }
    
    // Initialize
    updateBreakpoint()
    
    // Add window resize listener
    window.addEventListener("resize", updateBreakpoint)
    
    // Cleanup
    return () => window.removeEventListener("resize", updateBreakpoint)
  }, [])
  
  // Utility boolean values for convenience
  const isMobile = currentBreakpoint === "unknown" || currentBreakpoint === "sm"
  const isTablet = currentBreakpoint === "md" 
  const isDesktop = currentBreakpoint === "lg" || currentBreakpoint === "xl" || currentBreakpoint === "2xl"
  const isLargeDesktop = currentBreakpoint === "xl" || currentBreakpoint === "2xl"
  
  return {
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Legacy support for old code using useIsMobile
    isLegacyMobile: isMobile || isTablet
  }
}

// Keep the old hook for backward compatibility
export function useIsMobile() {
  const { isLegacyMobile } = useBreakpoint()
  return isLegacyMobile
} 