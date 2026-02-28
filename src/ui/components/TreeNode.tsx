import { useState } from 'react'
import { ChevronRight, ChevronDown, Layers, LayoutGrid, Menu, FileText, FolderOpen } from 'lucide-react'
import type { NavigationTree } from '../../shared/types'

const TYPE_ICONS: Record<string, typeof Layers> = {
  stack: Layers,
  tabs: LayoutGrid,
  drawer: Menu,
  screen: FileText,
  group: FolderOpen,
}

const TYPE_ICON_CLASSES: Record<string, string> = {
  stack: 'tree-node__icon--stack',
  tabs: 'tree-node__icon--tabs',
  drawer: 'tree-node__icon--drawer',
  screen: 'tree-node__icon--screen',
  group: 'tree-node__icon--group',
}

interface TreeNodeProps {
  node: NavigationTree
  depth: number
  selectedNode: NavigationTree | null
  onSelectNode: (node: NavigationTree) => void
}

export function TreeNode({ node, depth, selectedNode, onSelectNode }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(node.focused || depth < 2)
  const hasChildren = node.children.length > 0
  const isSelected = selectedNode?.id === node.id
  const Icon = TYPE_ICONS[node.type] || FileText

  return (
    <div>
      <div
        className={`tree-node__row${isSelected ? ' tree-node__row--selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectNode(node)}
      >
        {hasChildren ? (
          <button
            className="tree-node__toggle"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="tree-node__spacer" />
        )}

        <Icon size={14} className={`tree-node__icon ${TYPE_ICON_CLASSES[node.type] || 'tree-node__icon--screen'}`} />

        {node.focused && (
          <span className="tree-node__focus-dot" />
        )}

        <span className={`tree-node__name${node.focused ? ' tree-node__name--focused' : ''}`}>
          {node.name}
        </span>

        <span className="tree-node__type">{node.type}</span>
      </div>

      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedNode={selectedNode}
            onSelectNode={onSelectNode}
          />
        ))}
    </div>
  )
}
