"use client"

import { useId } from "react"

interface CrackItIconProps {
  className?: string
  size?: number
}

export function CrackItIcon({ className = "", size = 24 }: CrackItIconProps) {
  const id = useId()

  // Generate unique IDs for SVG defs to prevent conflicts when multiple icons are rendered
  const bodyGradientId = `bodyGradient-${id}`
  const sparkGradientId = `sparkGradient-${id}`
  const screenGradientId = `screenGradient-${id}`
  const eyeGlowId = `eyeGlow-${id}`
  const dropShadowId = `dropShadow-${id}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Modern Gradient for the Body */}
        <linearGradient id={bodyGradientId} x1="100" y1="100" x2="400" y2="450" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        {/* Gradient for the Innovation Spark (Lightbulb) */}
        <linearGradient id={sparkGradientId} x1="256" y1="50" x2="256" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>

        {/* Screen Glow Gradient */}
        <linearGradient id={screenGradientId} x1="150" y1="200" x2="362" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Eye Glow */}
        <radialGradient id={eyeGlowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="80%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0284C7" />
        </radialGradient>

        {/* Drop Shadow for Depth */}
        <filter id={dropShadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
          <feOffset dx="0" dy="10" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grouping the mascot */}
      <g filter={`url(#${dropShadowId})`}>

        {/* Ears/Audio Bolts */}
        <rect x="80" y="220" width="40" height="80" rx="12" fill="#4338CA" />
        <rect x="392" y="220" width="40" height="80" rx="12" fill="#4338CA" />

        {/* Antenna */}
        <line x1="256" y1="160" x2="256" y2="110" stroke="#4338CA" strokeWidth="12" strokeLinecap="round" />

        {/* Innovation Spark (Lightbulb idea) */}
        <g transform="translate(256, 90)">
          <circle cx="0" cy="0" r="35" fill={`url(#${sparkGradientId})`} stroke="#FFF" strokeWidth="4" />
          {/* Spark reflection */}
          <path d="M-10 -10 L-20 -20 M10 -10 L20 -20 M0 -15 L0 -25" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Head Base */}
        <rect x="110" y="140" width="292" height="260" rx="80" fill={`url(#${bodyGradientId})`} />

        {/* Face Screen (Visor) */}
        <rect x="140" y="190" width="232" height="150" rx="60" fill={`url(#${screenGradientId})`} stroke="#334155" strokeWidth="4" />

        {/* Eyes */}
        <g transform="translate(0, 10)">
          {/* Left Eye */}
          <circle cx="190" cy="265" r="28" fill={`url(#${eyeGlowId})`} />
          <circle cx="198" cy="257" r="8" fill="#FFFFFF" opacity="0.8" />

          {/* Right Eye */}
          <circle cx="322" cy="265" r="28" fill={`url(#${eyeGlowId})`} />
          <circle cx="330" cy="257" r="8" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* Friendly Smile */}
        <path d="M 220 310 Q 256 340 292 310" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" fill="none" />

        {/* Cheek Highlights (Subtle blushing/metallic shine) */}
        <circle cx="160" cy="310" r="12" fill="#EC4899" opacity="0.2" />
        <circle cx="352" cy="310" r="12" fill="#EC4899" opacity="0.2" />

      </g>
    </svg>
  )
}
