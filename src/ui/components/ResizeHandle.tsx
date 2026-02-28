import { useCallback, useRef, useState } from 'react'

interface ResizeHandleProps {
  direction: 'vertical' | 'horizontal'
  onResize: (delta: number) => void
}

export function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false)
  const startPos = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startPos.current = direction === 'vertical' ? e.clientX : e.clientY
      setDragging(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const current = direction === 'vertical' ? moveEvent.clientX : moveEvent.clientY
        const delta = current - startPos.current
        startPos.current = current
        onResize(delta)
      }

      const handleMouseUp = () => {
        setDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [direction, onResize]
  )

  const isVertical = direction === 'vertical'

  return (
    <>
      {dragging && <div className="resize-overlay" />}
      <div
        className={`resize-handle resize-handle--${direction}${dragging ? ' resize-handle--dragging' : ''}`}
        onMouseDown={handleMouseDown}
        style={isVertical ? { cursor: 'col-resize' } : { cursor: 'row-resize' }}
      />
    </>
  )
}
