import type { NavigationTree } from '../../shared/types'
import { TreeNode } from './TreeNode'

interface TreeViewProps {
  tree: NavigationTree | null
  selectedNode: NavigationTree | null
  onSelectNode: (node: NavigationTree) => void
}

export function TreeView({ tree, selectedNode, onSelectNode }: TreeViewProps) {
  if (!tree) {
    return (
      <div className="tree-view__empty">
        <div>
          <p className="tree-view__empty-title">No navigation state</p>
          <p className="tree-view__empty-sub">Waiting for navigator to initialize...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tree-view">
      {tree.children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={0}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
        />
      ))}
    </div>
  )
}
