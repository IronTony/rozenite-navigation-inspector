import type { NavigationTree, RouteInfo } from '../../shared/types'

interface RouteDetailsProps {
  node: NavigationTree | null
  activeRoute: RouteInfo | null
}

export function RouteDetails({ node, activeRoute }: RouteDetailsProps) {
  if (!node) {
    return (
      <div className="route-details__empty">
        <p className="route-details__empty-text">Select a node in the tree to view details</p>
      </div>
    )
  }

  const isActive = activeRoute?.key === node.id

  return (
    <div className="route-details">
      <h3 className="route-details__title">Route Details</h3>

      <div className="route-details__fields">
        <DetailRow label="Name" value={node.name} />
        <DetailRow label="Type" value={node.type} />
        {node.routeName && <DetailRow label="Route" value={node.routeName} />}
        {node.path && <DetailRow label="Path" value={node.path} />}

        <div className="route-details__focused">
          <span className="route-details__focused-label">Focused:</span>
          <span className={`route-details__focused-value${node.focused ? ' route-details__focused-value--yes' : ' route-details__focused-value--no'}`}>
            {node.focused ? 'Yes' : 'No'}
          </span>
        </div>

        {isActive && (
          <div className="route-details__active-badge">
            Currently active route
          </div>
        )}

        {node.params && Object.keys(node.params).length > 0 && (
          <div className="route-details__params">
            <span className="route-details__params-label">Params:</span>
            <pre className="route-details__params-pre">
              {JSON.stringify(node.params, null, 2)}
            </pre>
          </div>
        )}

        {node.children.length > 0 && (
          <DetailRow label="Children" value={`${node.children.length} route(s)`} />
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}:</span>
      <span className="detail-row__value">{value}</span>
    </div>
  )
}
