import { Compass } from 'lucide-react'
import type { RouteInfo } from '../../shared/types'

interface ToolbarProps {
  activeRoute: RouteInfo | null
}

export function Toolbar({ activeRoute }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__title">
        <Compass size={14} className="toolbar__title-icon" />
        <span className="toolbar__title-text">Navigation Inspector</span>
      </div>

      {activeRoute && (
        <span className="toolbar__route" title={activeRoute.path}>
          {activeRoute.path}
        </span>
      )}
    </div>
  )
}
