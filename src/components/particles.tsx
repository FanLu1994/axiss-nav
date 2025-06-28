"use client"

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

export function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 粒子配置 - 减少数量和速度
    const particleCount = 25
    const particles: Particle[] = []
    const connectionDistance = 200

    // 初始化粒子
    const initParticles = () => {
      particles.length = 0
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.2, // 降低速度
          vy: (Math.random() - 0.5) * 0.2, // 降低速度
          size: Math.random() * 1.5 + 0.5, // 减小粒子大小
          opacity: Math.random() * 0.3 + 0.1 // 降低透明度
        })
      }
    }

    // 更新粒子位置
    const updateParticles = () => {
      particles.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy

        // 边界检测
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx = -particle.vx
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy = -particle.vy
        }

        // 确保粒子在画布内
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))
      })
    }

    // 绘制粒子
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制粒子 - 改为深灰色
      particles.forEach(particle => {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(75, 85, 99, ${particle.opacity})` // 深灰色
        ctx.fill()
      })

      // 绘制连接线 - 改为深灰色，降低透明度
      particles.forEach((particle1, i) => {
        particles.slice(i + 1).forEach(particle2 => {
          const dx = particle1.x - particle2.x
          const dy = particle1.y - particle2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.15 // 降低连接线透明度
            ctx.beginPath()
            ctx.moveTo(particle1.x, particle1.y)
            ctx.lineTo(particle2.x, particle2.y)
            ctx.strokeStyle = `rgba(75, 85, 99, ${opacity})` // 深灰色
            ctx.lineWidth = 0.5 // 更细的线条
            ctx.stroke()
          }
        })
      })
    }

    // 动画循环
    const animate = () => {
      updateParticles()
      drawParticles()
      requestAnimationFrame(animate)
    }

    initParticles()
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
} 