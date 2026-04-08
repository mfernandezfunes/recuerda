import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'

const PALETTE = [
  // Fila 1: colores vivos
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#FF922B', '#CC5DE8', '#F06595', '#20B2AA',
  // Fila 2: colores naturales y neutros
  '#8B4513', '#228B22', '#87CEEB', '#FFDAB9',
  '#B0B0B0', '#333333', '#FFFFFF', '#800000',
]

const CANVAS_SIZE = 400

// ── Drawing functions ──────────────────────────────────────────────────────────

function drawHouse(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'

  // Sky background region (top area)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, 155)

  // House body
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(100, 150, 200, 150)
  ctx.strokeRect(100, 150, 200, 150)

  // Roof
  ctx.beginPath()
  ctx.moveTo(80, 155)
  ctx.lineTo(200, 65)
  ctx.lineTo(320, 155)
  ctx.closePath()
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.stroke()

  // Door
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(175, 235, 50, 65)
  ctx.strokeRect(175, 235, 50, 65)

  // Left window
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(115, 170, 55, 50)
  ctx.strokeRect(115, 170, 55, 50)
  ctx.beginPath()
  ctx.moveTo(142, 170)
  ctx.lineTo(142, 220)
  ctx.moveTo(115, 195)
  ctx.lineTo(170, 195)
  ctx.stroke()

  // Right window
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(230, 170, 55, 50)
  ctx.strokeRect(230, 170, 55, 50)
  ctx.beginPath()
  ctx.moveTo(257, 170)
  ctx.lineTo(257, 220)
  ctx.moveTo(230, 195)
  ctx.lineTo(285, 195)
  ctx.stroke()

  // Sun
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(330, 75, 35, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Sun rays
  for (let angle = 0; angle < 360; angle += 45) {
    const rad = (angle * Math.PI) / 180
    ctx.beginPath()
    ctx.moveTo(330 + Math.cos(rad) * 38, 75 + Math.sin(rad) * 38)
    ctx.lineTo(330 + Math.cos(rad) * 52, 75 + Math.sin(rad) * 52)
    ctx.stroke()
  }

  // Cloud
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(70, 80, 25, 0, Math.PI * 2)
  ctx.arc(95, 65, 30, 0, Math.PI * 2)
  ctx.arc(125, 75, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(70, 80, 25, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(95, 65, 30, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(125, 75, 22, 0, Math.PI * 2)
  ctx.stroke()

  // Ground
  ctx.lineWidth = 3
  ctx.strokeStyle = '#333'
  ctx.beginPath()
  ctx.moveTo(0, 302)
  ctx.lineTo(CANVAS_SIZE, 302)
  ctx.stroke()

  // Tree trunk
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(48, 255, 18, 48)
  ctx.strokeRect(48, 255, 18, 48)

  // Tree crown
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(30, 258)
  ctx.lineTo(57, 205)
  ctx.lineTo(84, 258)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(35, 235)
  ctx.lineTo(57, 188)
  ctx.lineTo(79, 235)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

function drawFlower(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3

  const cx = 200
  const cy = 180
  const petalR = 45
  const petalDist = 55

  // Petals
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4
    const px = cx + Math.cos(angle) * petalDist
    const py = cy + Math.sin(angle) * petalDist
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(px, py, petalR, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // Center
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, cy, 42, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Stem
  ctx.fillStyle = '#FFFFFF'
  ctx.lineWidth = 10
  ctx.strokeStyle = '#333'
  ctx.beginPath()
  ctx.moveTo(cx, cy + 42)
  ctx.bezierCurveTo(cx - 20, cy + 100, cx + 20, cy + 160, cx, cy + 220)
  ctx.stroke()
  ctx.lineWidth = 3

  // Leaves
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(cx - 5, cy + 130)
  ctx.bezierCurveTo(cx - 60, cy + 100, cx - 70, cy + 145, cx - 10, cy + 155)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(cx + 5, cy + 160)
  ctx.bezierCurveTo(cx + 60, cy + 130, cx + 70, cy + 175, cx + 10, cy + 185)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Grass patches
  for (let x = 0; x < CANVAS_SIZE; x += 30) {
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x + 5, CANVAS_SIZE - 20)
    ctx.lineTo(x + 15, CANVAS_SIZE - 50)
    ctx.lineTo(x + 25, CANVAS_SIZE - 20)
    ctx.stroke()
  }
}

function drawButterfly(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3

  const cx = 200
  const cy = 185

  // Upper left wing
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.bezierCurveTo(cx - 30, cy - 80, cx - 140, cy - 100, cx - 120, cy - 10)
  ctx.bezierCurveTo(cx - 100, cy + 30, cx - 40, cy + 10, cx, cy)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Upper right wing
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.bezierCurveTo(cx + 30, cy - 80, cx + 140, cy - 100, cx + 120, cy - 10)
  ctx.bezierCurveTo(cx + 100, cy + 30, cx + 40, cy + 10, cx, cy)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Lower left wing
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.bezierCurveTo(cx - 40, cy + 20, cx - 120, cy + 40, cx - 90, cy + 110)
  ctx.bezierCurveTo(cx - 60, cy + 130, cx - 20, cy + 80, cx, cy)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Lower right wing
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.bezierCurveTo(cx + 40, cy + 20, cx + 120, cy + 40, cx + 90, cy + 110)
  ctx.bezierCurveTo(cx + 60, cy + 130, cx + 20, cy + 80, cx, cy)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Wing patterns — circles
  ctx.lineWidth = 2
  const wingCircles = [
    { x: cx - 70, y: cy - 35, r: 18 },
    { x: cx - 95, y: cy - 5, r: 12 },
    { x: cx + 70, y: cy - 35, r: 18 },
    { x: cx + 95, y: cy - 5, r: 12 },
    { x: cx - 55, y: cy + 68, r: 14 },
    { x: cx + 55, y: cy + 68, r: 14 },
  ]
  wingCircles.forEach(({ x, y, r }) => {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  // Body
  ctx.fillStyle = '#FFFFFF'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(cx, cy + 20, 8, 45, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Head
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, cy - 28, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Antennae
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - 4, cy - 36)
  ctx.bezierCurveTo(cx - 25, cy - 70, cx - 35, cy - 80, cx - 30, cy - 90)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + 4, cy - 36)
  ctx.bezierCurveTo(cx + 25, cy - 70, cx + 35, cy - 80, cx + 30, cy - 90)
  ctx.stroke()

  // Antennae tips
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(cx - 30, cy - 90, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 30, cy - 90, 4, 0, Math.PI * 2)
  ctx.fill()

  // Flowers in background
  const flowers = [
    { x: 55, y: 320 }, { x: 350, y: 310 }, { x: 155, y: 345 }, { x: 275, y: 355 },
  ]
  flowers.forEach(({ x, y }) => {
    ctx.lineWidth = 2
    for (let a = 0; a < 5; a++) {
      const ang = (a * 2 * Math.PI) / 5
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x + Math.cos(ang) * 14, y + Math.sin(ang) * 14, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(x, y, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })
}

function drawCat(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3

  const cx = 200, cy = 210

  // Body
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 80, 75, 90, 0, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()

  // Head
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, cy, 80, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()

  // Ears
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(cx + side * 30, cy - 65)
    ctx.lineTo(cx + side * 65, cy - 115)
    ctx.lineTo(cx + side * 75, cy - 60)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
    // Inner ear
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(cx + side * 35, cy - 67)
    ctx.lineTo(cx + side * 62, cy - 108)
    ctx.lineTo(cx + side * 70, cy - 65)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
  }

  // Eyes
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(cx + side * 28, cy - 10, 18, 22, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
    // Pupil
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(cx + side * 28, cy - 10, 8, 14, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }

  // Nose
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(cx, cy + 18)
  ctx.lineTo(cx - 10, cy + 28)
  ctx.lineTo(cx + 10, cy + 28)
  ctx.closePath()
  ctx.fill(); ctx.stroke()

  // Mouth
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(cx, cy + 28)
  ctx.bezierCurveTo(cx - 20, cy + 44, cx - 38, cy + 36, cx - 42, cy + 30)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy + 28)
  ctx.bezierCurveTo(cx + 20, cy + 44, cx + 38, cy + 36, cx + 42, cy + 30)
  ctx.stroke()

  // Whiskers
  ctx.lineWidth = 2
  for (const side of [-1, 1]) {
    for (const offset of [-10, 0, 10]) {
      ctx.beginPath()
      ctx.moveTo(cx + side * 12, cy + 22 + offset)
      ctx.lineTo(cx + side * 80, cy + 14 + offset)
      ctx.stroke()
    }
  }

  // Tail
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.moveTo(cx + 72, cy + 155)
  ctx.bezierCurveTo(cx + 130, cy + 170, cx + 150, cy + 120, cx + 120, cy + 90)
  ctx.stroke()
  ctx.lineWidth = 3

  // Paws
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(cx + side * 45, cy + 165, 22, 14, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }
}

function drawBoat(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3

  // Sky
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, 260)

  // Sun
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(340, 70, 38, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
  ctx.lineWidth = 2
  for (let a = 0; a < 360; a += 40) {
    const r = (a * Math.PI) / 180
    ctx.beginPath()
    ctx.moveTo(340 + Math.cos(r) * 42, 70 + Math.sin(r) * 42)
    ctx.lineTo(340 + Math.cos(r) * 56, 70 + Math.sin(r) * 56)
    ctx.stroke()
  }

  // Clouds
  ctx.lineWidth = 2
  for (const [x, y] of [[80, 60], [200, 40]]) {
    for (const [dx, dy, r] of [[-20, 10, 18], [0, 0, 24], [22, 8, 16]]) {
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()
    }
  }

  // Water
  ctx.lineWidth = 3
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    const y = 275 + i * 30
    ctx.moveTo(0, y)
    for (let x = 0; x <= CANVAS_SIZE; x += 40) {
      ctx.bezierCurveTo(x + 10, y - 12, x + 30, y + 12, x + 40, y)
    }
    ctx.stroke()
  }

  // Hull
  ctx.lineWidth = 3
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(90, 255)
  ctx.lineTo(60, 290)
  ctx.lineTo(340, 290)
  ctx.lineTo(310, 255)
  ctx.closePath()
  ctx.fill(); ctx.stroke()

  // Deck stripe
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(95, 265)
  ctx.lineTo(305, 265)
  ctx.stroke()

  // Mast
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(200, 255)
  ctx.lineTo(200, 110)
  ctx.stroke()

  // Main sail
  ctx.lineWidth = 3
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(200, 115)
  ctx.lineTo(295, 240)
  ctx.lineTo(200, 250)
  ctx.closePath()
  ctx.fill(); ctx.stroke()

  // Front sail
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(200, 130)
  ctx.lineTo(105, 245)
  ctx.lineTo(200, 250)
  ctx.closePath()
  ctx.fill(); ctx.stroke()

  // Flag
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(200, 110)
  ctx.lineTo(230, 122)
  ctx.lineTo(200, 134)
  ctx.closePath()
  ctx.fill(); ctx.stroke()

  // Porthole
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(160, 275, 10, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
}

function drawFish(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3

  // Water background zones
  for (let i = 0; i < 5; i++) {
    ctx.lineWidth = 2
    ctx.beginPath()
    const y = 50 + i * 70
    ctx.moveTo(0, y)
    for (let x = 0; x <= CANVAS_SIZE; x += 50) {
      ctx.bezierCurveTo(x + 12, y - 10, x + 38, y + 10, x + 50, y)
    }
    ctx.stroke()
  }

  // Big fish
  const fx = 200, fy = 175
  ctx.lineWidth = 3
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.ellipse(fx, fy, 100, 55, 0, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()

  // Tail
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(fx + 95, fy)
  ctx.lineTo(fx + 150, fy - 50)
  ctx.lineTo(fx + 155, fy)
  ctx.lineTo(fx + 150, fy + 50)
  ctx.closePath()
  ctx.fill(); ctx.stroke()

  // Dorsal fin
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(fx - 10, fy - 52)
  ctx.bezierCurveTo(fx + 10, fy - 90, fx + 40, fy - 85, fx + 50, fy - 52)
  ctx.closePath()
  ctx.fill(); ctx.stroke()

  // Pectoral fin
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(fx + 10, fy + 20)
  ctx.bezierCurveTo(fx + 20, fy + 60, fx + 50, fy + 65, fx + 60, fy + 40)
  ctx.lineTo(fx + 30, fy + 28)
  ctx.closePath()
  ctx.fill(); ctx.stroke()

  // Scales (arcs)
  ctx.lineWidth = 1.5
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      ctx.beginPath()
      ctx.arc(fx - 60 + col * 30, fy - 20 + row * 22, 16, Math.PI, 0)
      ctx.stroke()
    }
  }

  // Eye
  ctx.lineWidth = 2.5
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(fx - 70, fy - 12, 14, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(fx - 68, fy - 12, 6, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()

  // Mouth
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(fx - 95, fy + 5, 10, -0.8, 0.8)
  ctx.stroke()

  // Bubbles
  for (const [bx, by, br] of [[fx - 105, fy - 30, 8], [fx - 110, fy - 50, 5], [fx - 115, fy - 65, 3]]) {
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Small fish in background
  const sf = [[320, 310], [70, 340], [350, 100]]
  for (const [sx, sy] of sf) {
    ctx.lineWidth = 2
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(sx, sy, 28, 15, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(sx + 26, sy)
    ctx.lineTo(sx + 42, sy - 14)
    ctx.lineTo(sx + 42, sy + 14)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
  }

  // Seaweeds
  ctx.lineWidth = 6
  for (const [sx, base] of [[40, 400], [360, 400], [190, 400]]) {
    ctx.beginPath()
    ctx.moveTo(sx, base)
    ctx.bezierCurveTo(sx - 20, base - 50, sx + 20, base - 90, sx, base - 120)
    ctx.stroke()
  }
}

function drawTree(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3

  // Ground
  ctx.beginPath()
  ctx.moveTo(0, 320)
  ctx.lineTo(CANVAS_SIZE, 320)
  ctx.stroke()

  // Trunk
  ctx.lineWidth = 3
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(175, 210, 50, 115)
  ctx.strokeRect(175, 210, 50, 115)

  // Trunk lines
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(190, 225); ctx.lineTo(185, 300)
  ctx.moveTo(210, 230); ctx.lineTo(215, 310)
  ctx.stroke()

  // Crown — 3 overlapping circles
  ctx.lineWidth = 3
  const crowns = [[200, 140, 90], [140, 185, 72], [260, 185, 72], [200, 215, 65]] as const
  for (const [x, y, r] of crowns) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }

  // Apples
  const apples = [[155, 130], [215, 118], [270, 165], [130, 180], [200, 195], [248, 195]]
  for (const [ax, ay] of apples) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(ax, ay, 14, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
    // Stem
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ax, ay - 14)
    ctx.lineTo(ax + 4, ay - 22)
    ctx.stroke()
    // Leaf
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(ax + 4, ay - 20)
    ctx.bezierCurveTo(ax + 16, ay - 28, ax + 20, ay - 14, ax + 8, ay - 16)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
    ctx.lineWidth = 3
  }

  // Roots
  ctx.lineWidth = 3
  for (const [rx] of [[-30, 60], [-15, 70], [15, 70], [30, 60]] as const) {
    ctx.beginPath()
    ctx.moveTo(200 + rx * 0.3, 320)
    ctx.bezierCurveTo(200 + rx * 0.5, 340, 200 + rx * 0.8, 355, 200 + rx, 360)
    ctx.stroke()
  }

  // Grass tufts
  ctx.lineWidth = 2
  for (let gx = 10; gx < CANVAS_SIZE; gx += 22) {
    ctx.beginPath()
    ctx.moveTo(gx, 320)
    ctx.lineTo(gx + 6, 305)
    ctx.lineTo(gx + 12, 320)
    ctx.stroke()
  }
}

function drawSun(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3

  // Horizon line
  ctx.beginPath()
  ctx.moveTo(0, 280); ctx.lineTo(CANVAS_SIZE, 280)
  ctx.stroke()

  // Mountains
  const peaks: [number, number, number][] = [[80, 280, 130], [200, 280, 160], [340, 280, 110]]
  for (const [px, py, h] of peaks) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(px - h * 0.8, py)
    ctx.lineTo(px, py - h)
    ctx.lineTo(px + h * 0.8, py)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
    // Snow cap
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(px - h * 0.2, py - h * 0.75)
    ctx.lineTo(px, py - h)
    ctx.lineTo(px + h * 0.2, py - h * 0.75)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
  }

  // Big sun
  ctx.lineWidth = 3
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(200, 120, 65, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()

  // Sun rays (long and short alternating)
  ctx.lineWidth = 3
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180
    const inner = 70, outer = i % 2 === 0 ? 105 : 90
    ctx.beginPath()
    ctx.moveTo(200 + Math.cos(a) * inner, 120 + Math.sin(a) * inner)
    ctx.lineTo(200 + Math.cos(a) * outer, 120 + Math.sin(a) * outer)
    ctx.stroke()
  }

  // Face
  ctx.lineWidth = 2.5
  // Eyes
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(200 + side * 22, 108, 10, 12, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }
  // Smile
  ctx.beginPath()
  ctx.arc(200, 120, 28, 0.3, Math.PI - 0.3)
  ctx.stroke()
  // Cheeks
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(200 + side * 38, 128, 12, 8, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }

  // Clouds
  ctx.lineWidth = 2
  for (const [x, y] of [[60, 55], [330, 75]]) {
    for (const [dx, dy, r] of [[-18, 10, 16], [0, 0, 22], [20, 8, 14]] as [number,number,number][]) {
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()
    }
  }

  // Birds (simple V shapes)
  ctx.lineWidth = 2
  for (const [bx, by] of [[110, 160], [145, 148], [270, 165], [300, 155]]) {
    ctx.beginPath()
    ctx.moveTo(bx - 10, by)
    ctx.quadraticCurveTo(bx, by - 8, bx + 10, by)
    ctx.stroke()
  }

  // Flowers on ground
  ctx.lineWidth = 2
  for (const [fx, fy] of [[50, 310], [130, 330], [270, 315], [360, 325]]) {
    for (let p = 0; p < 5; p++) {
      const a = (p * 72 * Math.PI) / 180
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(fx + Math.cos(a) * 11, fy + Math.sin(a) * 11, 8, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()
    }
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(fx, fy, 7, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }
}

function drawNight(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2.5

  // Ground
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 310); ctx.lineTo(CANVAS_SIZE, 310)
  ctx.stroke()

  // Crescent moon
  ctx.lineWidth = 3
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(200, 110, 75, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
  // Cutout for crescent (drawn white over to simulate crescent)
  ctx.strokeStyle = '#333'
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(235, 100, 62, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()

  // Stars — 5-pointed
  function drawStar(cx: number, cy: number, r: number) {
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180
      const b = ((i + 0.5) * 72 - 90) * Math.PI / 180
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      ctx.lineTo(cx + Math.cos(b) * r * 0.4, cy + Math.sin(b) * r * 0.4)
    }
    ctx.closePath()
    ctx.fill(); ctx.stroke()
  }
  ctx.lineWidth = 1.5
  const stars = [[60,50,18],[330,45,22],[100,140,12],[355,160,15],[40,200,10],[310,110,10],[150,55,10],[280,175,8],[70,270,12],[360,250,10]]
  for (const [x, y, r] of stars) drawStar(x, y, r)

  // Big star center
  ctx.lineWidth = 2
  drawStar(80, 90, 26)

  // House silhouette
  ctx.lineWidth = 3
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(100, 235, 130, 80)
  ctx.strokeRect(100, 235, 130, 80)
  ctx.beginPath()
  ctx.moveTo(85, 240); ctx.lineTo(165, 185); ctx.lineTo(245, 240)
  ctx.closePath()
  ctx.fill(); ctx.stroke()
  // Door
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(150, 270, 30, 45)
  ctx.strokeRect(150, 270, 30, 45)
  // Window with light
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(112, 248, 32, 28)
  ctx.strokeRect(112, 248, 32, 28)
  ctx.fillRect(186, 248, 32, 28)
  ctx.strokeRect(186, 248, 32, 28)

  // Trees
  for (const [tx, ty] of [[320, 310], [360, 310]]) {
    ctx.lineWidth = 3
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(tx - 28, ty); ctx.lineTo(tx, ty - 65); ctx.lineTo(tx + 28, ty)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
    ctx.fillRect(tx - 7, ty, 14, 28)
    ctx.strokeRect(tx - 7, ty, 14, 28)
  }
}

const ALL_DRAWINGS = [
  { label: 'Casa', fn: drawHouse },
  { label: 'Flor', fn: drawFlower },
  { label: 'Mariposa', fn: drawButterfly },
  { label: 'Gato', fn: drawCat },
  { label: 'Barco', fn: drawBoat },
  { label: 'Pez', fn: drawFish },
  { label: 'Árbol', fn: drawTree },
  { label: 'Sol', fn: drawSun },
  { label: 'Noche', fn: drawNight },
]

function pickRandom3(): typeof ALL_DRAWINGS {
  const shuffled = [...ALL_DRAWINGS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

const DRAWINGS = pickRandom3()

// ── Flood fill ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function colorMatch(data: Uint8ClampedArray, i: number, color: [number, number, number]): boolean {
  return data[i] === color[0] && data[i + 1] === color[1] && data[i + 2] === color[2]
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: [number, number, number]
) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const idx = (px: number, py: number) => (py * width + px) * 4

  const startIdx = idx(Math.round(x), Math.round(y))
  const targetColor: [number, number, number] = [data[startIdx], data[startIdx + 1], data[startIdx + 2]]

  // Don't fill if clicking on a border (dark pixels)
  if (targetColor[0] < 80 && targetColor[1] < 80 && targetColor[2] < 80) return
  // Don't fill if same color
  if (colorMatch(data, startIdx, fillColor)) return

  const stack: [number, number][] = [[Math.round(x), Math.round(y)]]
  const visited = new Set<number>()

  while (stack.length > 0) {
    const point = stack.pop()!
    const [cx, cy] = point
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue
    const i = idx(cx, cy)
    if (visited.has(i)) continue
    visited.add(i)
    if (!colorMatch(data, i, targetColor)) continue

    data[i] = fillColor[0]
    data[i + 1] = fillColor[1]
    data[i + 2] = fillColor[2]
    data[i + 3] = 255

    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
  }

  ctx.putImageData(imageData, 0, 0)
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Coloring() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [difficulty] = useState<string>('EASY')
  const [selectedColor, setSelectedColor] = useState(PALETTE[0])
  const [drawingIndex, setDrawingIndex] = useState(0)

  const drawCurrentScene = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      DRAWINGS[drawingIndex].fn(ctx)
    },
    [drawingIndex]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCurrentScene(ctx)
  }, [drawCurrentScene])

  useEffect(() => {
    startTimer()
    speak('Tocá las partes del dibujo para colorearlas')
  }, [startTimer, speak])

  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_SIZE / rect.width
    const scaleY = CANVAS_SIZE / rect.height
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const coords = getCanvasCoords(e)
    if (!coords) return
    floodFill(ctx, coords.x, coords.y, hexToRgb(selectedColor))
  }

  function handleCanvasTouch(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const coords = getCanvasCoords(e)
    if (!coords) return
    floodFill(ctx, coords.x, coords.y, hexToRgb(selectedColor))
  }

  function handleReset() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCurrentScene(ctx)
  }

  function handleChangeDrawing(idx: number) {
    setDrawingIndex(idx)
  }

  function handleDone() {
    addStars(3)
    const durationSecs = stopTimer()
    if (sessionId) {
      sessionsApi
        .logActivity(sessionId, {
          activityType: 'COLORING',
          difficulty,
          starsEarned: 3,
          durationSecs,
        })
        .catch(() => {})
    }
    speak('¡Qué bonito quedó! ¡Muy bien!').then(() => {
      navigate('/patient/activity-result', {
        state: {
          starsEarned: 3,
          activityType: 'COLORING',
          patientName: patient?.name ?? '',
        },
      })
    })
  }

  return (
    <div
      className="flex flex-col items-center gap-4 px-4 py-6 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full" style={{ maxWidth: '480px' }}>
        <div className="flex items-center gap-3">
          <p
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#5C4033',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            🎨 Colorear
          </p>
          <button
            onClick={() => speak('Tocá las partes del dibujo para colorearlas')}
            style={{ fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Escuchar instrucción"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Drawing selector */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {DRAWINGS.map((d, i) => (
          <motion.button
            key={d.label}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleChangeDrawing(i)}
            style={{
              padding: '8px 18px',
              borderRadius: '16px',
              border: i === drawingIndex ? '3px solid #5C4033' : '2px solid transparent',
              backgroundColor: i === drawingIndex ? '#FFCBA4' : '#fff',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              color: '#5C4033',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {d.label}
          </motion.button>
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasTouch}
        style={{
          width: '100%',
          maxWidth: `${CANVAS_SIZE}px`,
          height: 'auto',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '3px solid #FFCBA4',
          cursor: 'crosshair',
          touchAction: 'none',
          backgroundColor: '#fff',
        }}
      />

      {/* Color Palette — 8 per row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', width: '100%', maxWidth: '480px' }}>
        {PALETTE.map((color) => (
          <motion.button
            key={color}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setSelectedColor(color)}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '50%',
              backgroundColor: color,
              border: selectedColor === color ? '4px solid #5C4033' : '2px solid #ccc',
              boxShadow: selectedColor === color
                ? '0 0 0 3px rgba(92,64,51,0.35)'
                : '0 2px 6px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              transition: 'border 0.15s, box-shadow 0.15s',
            }}
            aria-label={`Color ${color}`}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '480px' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          style={{
            flex: 1,
            padding: '16px',
            backgroundColor: '#FFF3A3',
            borderRadius: '16px',
            border: 'none',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          🔄 Borrar
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={handleDone}
          style={{
            flex: 2,
            padding: '16px',
            backgroundColor: '#8FBC8F',
            borderRadius: '16px',
            border: 'none',
            fontSize: '1.3rem',
            fontWeight: 900,
            color: '#fff',
            fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          ✅ Listo
        </motion.button>
      </div>
    </div>
  )
}
