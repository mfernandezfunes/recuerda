import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'

const PALETTE = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#FF922B', '#CC5DE8', '#F06595', '#74C0FC',
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

const DRAWINGS = [
  { label: 'Casa', fn: drawHouse },
  { label: 'Flor', fn: drawFlower },
  { label: 'Mariposa', fn: drawButterfly },
]

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
          difficulty: 'EASY',
          starsEarned: 3,
          durationSecs,
        })
        .catch(() => {})
    }
    speak('¡Qué bonito quedó! ¡Muy bien!')
    navigate('/patient/activity-result', {
      state: {
        starsEarned: 3,
        activityType: 'COLORING',
        patientName: patient?.name ?? '',
      },
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

      {/* Color Palette */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {PALETTE.map((color) => (
          <motion.button
            key={color}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setSelectedColor(color)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: color,
              border: selectedColor === color ? '4px solid #5C4033' : '3px solid transparent',
              boxShadow:
                selectedColor === color
                  ? '0 0 0 3px rgba(92,64,51,0.3)'
                  : '0 3px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'border 0.15s',
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
