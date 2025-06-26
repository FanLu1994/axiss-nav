"use client"

import { useState, useEffect } from "react"

export function useContainerHeight(offset: number = 400) {
  const [height, setHeight] = useState(600)

  useEffect(() => {
    const updateHeight = () => {
      const availableHeight = window.innerHeight - offset
      console.log(availableHeight)
      setHeight(Math.min(800, Math.max(400, availableHeight)))
    }

    updateHeight()
    
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [offset])

  return height
} 