'use client'

import { useEffect, useRef } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  animate?: boolean
}

export function getScoreColor(score: number): string {
  if (score >= 60) return '#15803D'
  if (score >= 40) return '#B45309'
  return '#B91C1C'
}

export function getScoreTrack(score: number): string {
  if (score >= 60) return '#DCFCE7'
  if (score >= 40) return '#FEF3C7'
  return '#FEE2E2'
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Fremragende'
  if (score >= 60) return 'God match'
  if (score >= 40) return 'Acceptabel'
  if (score >= 20) return 'Svag'
  return 'Uegnet'
}

export function ScoreRing({ score, size = 80, strokeWidth, showLabel = false, animate = true }: ScoreRingProps) {
  const sw = strokeWidth ?? Math.round(size * 0.085)
  const radius = (size - sw) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(score, 0), 100) / 100 * circumference
  const gap = circumference - progress

  const color = getScoreColor(score)
  const trackColor = getScoreTrack(score)

  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!animate || !circleRef.current) return
    const el = circleRef.current
    el.style.strokeDasharray = `0 ${circumference}`
    const frame = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1)'
      el.style.strokeDasharray = `${progress} ${gap}`
    })
    return () => cancelAnimationFrame(frame)
  }, [score, progress, gap, circumference, animate])

  const cx = size / 2
  const cy = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-label={`Match score: ${score}%`}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={sw}
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={animate ? `0 ${circumference}` : `${progress} ${gap}`}
        />
      </svg>
      {/* Score label in center */}
      {showLabel && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ color }}
        >
          <span className="font-bold leading-none" style={{ fontSize: size * 0.22 }}>
            {Math.round(score)}
          </span>
          <span className="text-[#6B7569]" style={{ fontSize: size * 0.1, marginTop: 2 }}>
            / 100
          </span>
        </div>
      )}
    </div>
  )
}
