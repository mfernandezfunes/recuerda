import type { ReactNode } from 'react'

interface FlipCardProps {
  frontContent: ReactNode
  backContent: ReactNode
  isFlipped: boolean
  isMatched: boolean
  onClick: () => void
}

export function FlipCard({ frontContent, backContent, isFlipped, isMatched, onClick }: FlipCardProps) {
  const canClick = !isFlipped && !isMatched

  return (
    <div
      onClick={canClick ? onClick : undefined}
      style={{
        width: '100%',
        aspectRatio: '1',
        perspective: '600px',
        cursor: canClick ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s ease',
          transform: isFlipped || isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '16px',
            backgroundColor: '#FFCBA4',
            border: '3px solid #F5A623',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          }}
        >
          {frontContent}
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '16px',
            backgroundColor: isMatched ? '#C8F0C8' : '#FFF8F0',
            border: isMatched ? '3px solid #8FBC8F' : '3px solid #87CEEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          }}
        >
          {backContent}
        </div>
      </div>
    </div>
  )
}
