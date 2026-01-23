"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { CrackItIcon } from "./crack-it-icon"

interface FloatingCrackButtonProps {
  onClick: () => void
  className?: string
}

export function FloatingCrackButton({ onClick, className }: FloatingCrackButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const dragStartTime = useRef(0)
  const dragStartPosition = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)

  // Initialize position after mount (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem("crack-it-position")
    if (saved) {
      try {
        const pos = JSON.parse(saved)
        setPosition(pos)
      } catch (e) {
        // Use default position
        setPosition({ x: window.innerWidth - 100, y: window.innerHeight - 300 })
      }
    } else {
      // Use default position
      setPosition({ x: window.innerWidth - 100, y: window.innerHeight - 300 })
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragStartTime.current = Date.now()
    dragStartPosition.current = { x: e.clientX, y: e.clientY }
    hasMoved.current = false
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }, [position])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.current.x
      const newY = e.clientY - dragOffset.current.y

      // Check if actually moved
      if (Math.abs(e.clientX - dragStartPosition.current.x) > 3 ||
          Math.abs(e.clientY - dragStartPosition.current.y) > 3) {
        hasMoved.current = true
      }

      // Keep within bounds
      const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 80))
      const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 120))

      setPosition({ x: boundedX, y: boundedY })
    }

    const handleMouseUp = () => {
      const dragDuration = Date.now() - dragStartTime.current
      const wasDragging = hasMoved.current || dragDuration > 200

      setIsDragging(false)
      // Save position
      localStorage.setItem("crack-it-position", JSON.stringify(position))

      // Only click if it wasn't a drag
      if (!wasDragging) {
        onClick()
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, position, onClick])

  return (
    <div
      className={cn(
        "fixed z-50 cursor-move select-none",
        "flex flex-col items-center gap-2",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: isDragging ? 0.8 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Big Icon */}
      <div
        className={cn(
          "crack-it-icon-animate",
          "transition-transform hover:scale-110 active:scale-95"
        )}
      >
        <CrackItIcon size={64} />
      </div>

      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-8deg); }
          25% { transform: rotate(8deg) scale(1.1); }
          50% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg) scale(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .crack-it-icon-animate {
          animation: wiggle 2s ease-in-out infinite, float 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
        }
      `}</style>
    </div>
  )
}
