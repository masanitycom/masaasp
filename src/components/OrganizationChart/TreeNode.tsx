'use client'

import { useState } from 'react'
import { CamelLevel } from '@/types/database.types'
import { ChevronDown, ChevronRight, User } from 'lucide-react'

interface TreeNodeProps {
  node: CamelLevel & {
    children?: (CamelLevel & { children?: any[] })[]
    isLoading?: boolean
  }
  onExpand: (userId: string) => Promise<void>
  depth: number
}

export default function TreeNode({ node, onExpand, depth }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!isExpanded && node.direct_children_count > 0 && !node.children) {
      setLoading(true)
      await onExpand(node.user_id || '')
      setLoading(false)
    }
    setIsExpanded(!isExpanded)
  }

  const hasChildren = node.direct_children_count > 0

  return (
    <div className="select-none">
      <div
        className={`flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors duration-200`}
        style={{ paddingLeft: `${depth * 24}px` }}
        onClick={handleToggle}
      >
        <div className="w-6 h-6 mr-2">
          {hasChildren ? (
            loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
            ) : isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        <div className="flex items-center flex-1 min-w-0">
          <div className="p-1 bg-indigo-100 rounded mr-2">
            <User className="h-4 w-4 text-indigo-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 truncate">
                {node.name || 'Unknown'}
              </span>
              <span className="text-sm text-gray-500">
                ({node.user_id})
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Level: {node.level}</span>
              <span>Pos: {node.pos}</span>
              {hasChildren && (
                <span className="text-indigo-600">
                  直下: {node.direct_children_count} / 全体: {node.total_children_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && node.children && (
        <div className="ml-6">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onExpand={onExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}