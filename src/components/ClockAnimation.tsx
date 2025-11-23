"use client"

import { useEffect, useState } from "react"

interface ClockAnimationProps {
  size?: number
  className?: string
}

export function ClockAnimation({ size = 80, className = "" }: ClockAnimationProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  // Calcular ângulos dos ponteiros
  const hourAngle = (hours * 30 + minutes * 0.5) - 90 // -90 para começar no topo
  const minuteAngle = (minutes * 6 + seconds * 0.1) - 90
  const secondAngle = (seconds * 6) - 90

  const centerX = size / 2
  const centerY = size / 2
  const hourLength = size * 0.25
  const minuteLength = size * 0.35
  const secondLength = size * 0.4

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        {/* Círculo do relógio */}
        <circle
          cx={centerX}
          cy={centerY}
          r={size / 2 - 2}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />
        
        {/* Marcadores das horas */}
        {[12, 3, 6, 9].map((hour) => {
          const angle = ((hour * 30) - 90) * (Math.PI / 180)
          const x1 = centerX + (size / 2 - 8) * Math.cos(angle)
          const y1 = centerY + (size / 2 - 8) * Math.sin(angle)
          const x2 = centerX + (size / 2 - 2) * Math.cos(angle)
          const y2 = centerY + (size / 2 - 2) * Math.sin(angle)
          return (
            <line
              key={hour}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )
        })}

        {/* Ponteiro das horas */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + hourLength * Math.cos((hourAngle * Math.PI) / 180)}
          y2={centerY + hourLength * Math.sin((hourAngle * Math.PI) / 180)}
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Ponteiro dos minutos */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + minuteLength * Math.cos((minuteAngle * Math.PI) / 180)}
          y2={centerY + minuteLength * Math.sin((minuteAngle * Math.PI) / 180)}
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Ponteiro dos segundos */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + secondLength * Math.cos((secondAngle * Math.PI) / 180)}
          y2={centerY + secondLength * Math.sin((secondAngle * Math.PI) / 180)}
          stroke="rgba(34, 197, 94, 0.9)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Centro do relógio */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill="rgba(255, 255, 255, 0.9)"
        />
      </svg>
    </div>
  )
}



import { useEffect, useState } from "react"

interface ClockAnimationProps {
  size?: number
  className?: string
}

export function ClockAnimation({ size = 80, className = "" }: ClockAnimationProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  // Calcular ângulos dos ponteiros
  const hourAngle = (hours * 30 + minutes * 0.5) - 90 // -90 para começar no topo
  const minuteAngle = (minutes * 6 + seconds * 0.1) - 90
  const secondAngle = (seconds * 6) - 90

  const centerX = size / 2
  const centerY = size / 2
  const hourLength = size * 0.25
  const minuteLength = size * 0.35
  const secondLength = size * 0.4

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        {/* Círculo do relógio */}
        <circle
          cx={centerX}
          cy={centerY}
          r={size / 2 - 2}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />
        
        {/* Marcadores das horas */}
        {[12, 3, 6, 9].map((hour) => {
          const angle = ((hour * 30) - 90) * (Math.PI / 180)
          const x1 = centerX + (size / 2 - 8) * Math.cos(angle)
          const y1 = centerY + (size / 2 - 8) * Math.sin(angle)
          const x2 = centerX + (size / 2 - 2) * Math.cos(angle)
          const y2 = centerY + (size / 2 - 2) * Math.sin(angle)
          return (
            <line
              key={hour}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )
        })}

        {/* Ponteiro das horas */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + hourLength * Math.cos((hourAngle * Math.PI) / 180)}
          y2={centerY + hourLength * Math.sin((hourAngle * Math.PI) / 180)}
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Ponteiro dos minutos */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + minuteLength * Math.cos((minuteAngle * Math.PI) / 180)}
          y2={centerY + minuteLength * Math.sin((minuteAngle * Math.PI) / 180)}
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Ponteiro dos segundos */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + secondLength * Math.cos((secondAngle * Math.PI) / 180)}
          y2={centerY + secondLength * Math.sin((secondAngle * Math.PI) / 180)}
          stroke="rgba(34, 197, 94, 0.9)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Centro do relógio */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill="rgba(255, 255, 255, 0.9)"
        />
      </svg>
    </div>
  )
}

