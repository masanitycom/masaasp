'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CamelLevel, User } from '@/types/database.types'
import TreeNode from '@/components/OrganizationChart/TreeNode'
import { Search, Users, LogOut, Home } from 'lucide-react'

interface TreeNodeData extends CamelLevel {
  children?: TreeNodeData[]
}

export default function OrganizationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [rootNode, setRootNode] = useState<TreeNodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CamelLevel[]>([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      // Fetch user details
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        setUser(userData)

        // Fetch user's camel level
        const { data: userCamel } = await supabase
          .from('camel_levels')
          .select('*')
          .eq('user_id', userData.user_id)
          .single()

        if (userCamel) {
          // Fetch initial 5 direct children
          const { data: children } = await supabase
            .from('camel_levels')
            .select('*')
            .eq('upline', userData.user_id)
            .limit(5)

          setRootNode({
            ...userCamel,
            children: children || []
          })
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadChildren = async (userId: string) => {
    try {
      const { data: children } = await supabase
        .from('camel_levels')
        .select('*')
        .eq('upline', userId)
        .limit(5)

      if (children && children.length > 0) {
        updateNodeChildren(rootNode, userId, children)
      }
    } catch (error) {
      console.error('Error loading children:', error)
    }
  }

  const updateNodeChildren = (node: TreeNodeData | null, targetUserId: string, children: CamelLevel[]) => {
    if (!node) return

    if (node.user_id === targetUserId) {
      setRootNode({
        ...node,
        children: children.map(child => ({
          ...child,
          children: undefined
        }))
      })
      return
    }

    if (node.children) {
      const updatedChildren = node.children.map(child => {
        if (child.user_id === targetUserId) {
          return {
            ...child,
            children: children.map(c => ({
              ...c,
              children: undefined
            }))
          }
        }
        if (child.children) {
          updateNodeChildren(child, targetUserId, children)
        }
        return child
      })

      setRootNode({
        ...node,
        children: updatedChildren
      })
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    try {
      const { data } = await supabase
        .from('camel_levels')
        .select('*')
        .or(`user_id.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .eq('path', user?.user_id) // Only search in user's downline
        .limit(10)

      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/MASAASPLOGO.svg"
                alt="MASAASP"
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-bold text-gray-900">組織図</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.kanji_last_name} {user?.kanji_first_name} ({user?.user_id})
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-12 items-center">
            <a href="/dashboard" className="text-indigo-100 hover:text-white flex items-center">
              <Home className="h-4 w-4 mr-1" />
              ダッシュボード
            </a>
            <a href="/organization" className="text-white font-medium flex items-center">
              <Users className="h-4 w-4 mr-1" />
              組織図
            </a>
            <a href="/rewards" className="text-indigo-100 hover:text-white">
              報酬
            </a>
            {user?.admin_flg && (
              <a href="/admin" className="text-indigo-100 hover:text-white">
                管理
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ユーザーIDまたは名前で検索..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              検索
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">検索結果</h3>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">{result.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({result.user_id})</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Level: {result.level} | Pos: {result.pos}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Organization Tree */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            あなたの組織
          </h2>

          {rootNode ? (
            <div className="overflow-x-auto">
              <TreeNode
                node={rootNode}
                onExpand={loadChildren}
                depth={0}
              />
            </div>
          ) : (
            <p className="text-gray-500">組織データが見つかりません</p>
          )}

          <div className="mt-6 text-sm text-gray-500">
            <p>※ クリックして階層を展開できます（一度に5名ずつ表示）</p>
            <p>※ あなたの配下の組織のみ表示されます</p>
          </div>
        </div>
      </main>
    </div>
  )
}