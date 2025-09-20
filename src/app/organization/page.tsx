'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Users, LogOut, Home, CircleUser } from 'lucide-react'

export default function OrganizationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [orgData, setOrgData] = useState<any[]>([])
  const [fullOrgData, setFullOrgData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUserOrganization()
  }, [])

  const fetchUserOrganization = async () => {
    try {
      // まず緊急ログインセッションをチェック
      const emergencyUser = localStorage.getItem('masaasp_user')
      let userData = null

      if (emergencyUser) {
        userData = JSON.parse(emergencyUser)
        console.log('緊急ログインセッション使用:', userData.user_id)
      } else {
        // 通常のSupabase認証
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login')
          return
        }

        // ユーザー詳細を取得
        const { data: userRecord } = await supabase
          .from('users')
          .select('*')
          .eq('mail_address', authUser.email)
          .single()

        if (!userRecord) {
          console.error('User not found')
          router.push('/login')
          return
        }
        userData = userRecord
      }

      setCurrentUser(userData)

      // 自分と配下のcamel_levelsデータを取得
      console.log('Fetching organization for user:', userData.user_id)

      // まず自分のcamel_levelデータを取得
      const { data: myLevelData } = await supabase
        .from('camel_levels')
        .select('*')
        .eq('user_id', userData.user_id)
        .single()

      if (!myLevelData) {
        console.log('No organization data found')
        setLoading(false)
        return
      }

      // 配下の全データを取得（ページネーション）
      let allDownlineData: any[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: pageData, error: pageError } = await supabase
          .from('camel_levels')
          .select('user_id, level, pos, upline, depth_level')
          .like('upline', `%${userData.user_id}%`)
          .order('level', { ascending: true })
          .order('user_id', { ascending: true })
          .range(from, from + pageSize - 1)

        if (pageError) {
          console.error('Error fetching downline:', pageError)
          throw pageError
        }

        if (pageData && pageData.length > 0) {
          allDownlineData = allDownlineData.concat(pageData)
          console.log(`Fetched page: ${pageData.length} records (total: ${allDownlineData.length})`)
          from += pageSize
          hasMore = pageData.length === pageSize
        } else {
          hasMore = false
        }
      }

      // 自分自身を追加
      const allData = [myLevelData, ...allDownlineData]
      console.log('Total organization data:', allData.length)

      // ユニークなユーザーIDを抽出
      const userIds = [...new Set(allData.map(item => item.user_id))]
      console.log('Unique user IDs:', userIds.length)

      // ユーザー詳細をバッチで取得
      let allUsersData: any[] = []
      const chunkSize = 100

      for (let i = 0; i < userIds.length; i += chunkSize) {
        const chunk = userIds.slice(i, i + chunkSize)

        const { data: batchData } = await supabase
          .from('users')
          .select('user_id, kanji_last_name, kanji_first_name, furi_last_name, furi_first_name, mail_address')
          .in('user_id', chunk)

        if (batchData) {
          allUsersData = allUsersData.concat(batchData)
        }
      }

      // ユーザーマップを作成
      const userMap = new Map()
      allUsersData.forEach(user => {
        userMap.set(user.user_id, user)
      })

      // データを結合
      const combinedData = allData.map(item => ({
        ...item,
        user: userMap.get(item.user_id) || {
          user_id: item.user_id,
          kanji_last_name: 'Unknown',
          kanji_first_name: 'User'
        }
      }))

      // ツリー構造を構築（自分をルートとして）
      const tree = buildUserOrganizationTree(combinedData, userData.user_id)
      setOrgData(tree)
      setFullOrgData(tree)

    } catch (error) {
      console.error('Error fetching organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildUserOrganizationTree = (data: any[], rootUserId: string) => {
    const nodeMap = new Map()

    // ノードマップを作成
    data.forEach(item => {
      nodeMap.set(item.user_id, {
        ...item,
        children: [],
        direct_children_count: 0
      })
    })

    // 親子関係を構築
    const parentChildMap = new Map<string, string[]>()

    data.forEach(item => {
      if (item.user_id === rootUserId) {
        // ルートユーザーはスキップ
        return
      }

      if (item.upline && item.upline.includes(rootUserId)) {
        // uplineからユーザーの直接の親を特定
        const uplineParts = item.upline.split('-')
        const userIndex = uplineParts.indexOf(item.user_id)

        if (userIndex > 0) {
          // 直接の親は自分の1つ前
          const directParentId = uplineParts[userIndex - 1]

          if (!parentChildMap.has(directParentId)) {
            parentChildMap.set(directParentId, [])
          }
          parentChildMap.get(directParentId)!.push(item.user_id)
        } else if (uplineParts[0] === rootUserId) {
          // ルートの直下
          if (!parentChildMap.has(rootUserId)) {
            parentChildMap.set(rootUserId, [])
          }
          parentChildMap.get(rootUserId)!.push(item.user_id)
        }
      }
    })

    // 子ノードを追加
    parentChildMap.forEach((childIds, parentId) => {
      const parentNode = nodeMap.get(parentId)
      if (!parentNode) return

      childIds.forEach(childId => {
        const childNode = nodeMap.get(childId)
        if (childNode) {
          parentNode.children.push(childNode)
          parentNode.direct_children_count = parentNode.children.length
        }
      })

      // 子ノードをソート（子がいる人を優先）
      parentNode.children.sort((a: any, b: any) => {
        const aHasChildren = a.children && a.children.length > 0
        const bHasChildren = b.children && b.children.length > 0

        if (aHasChildren && !bHasChildren) return -1
        if (!aHasChildren && bHasChildren) return 1

        if (aHasChildren && bHasChildren) {
          return b.children.length - a.children.length
        }

        return (a.level || 0) - (b.level || 0)
      })
    })

    // ルートノードを返す
    const rootNode = nodeMap.get(rootUserId)
    return rootNode ? [rootNode] : []
  }

  const toggleNode = (userId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderNode = (node: any, level = 0, isLast = false, prefix = '') => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.user_id)
    const currentPrefix = level === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')

    return (
      <div key={node.user_id} className="font-mono">
        <div className={`flex items-center py-1 hover:bg-blue-50 group ${
          highlightedNode === node.user_id ? 'bg-yellow-100' : ''
        }`}>
          <div className="flex items-center">
            <span className="text-gray-400 text-sm mr-2 whitespace-pre">
              {currentPrefix}
            </span>

            {hasChildren && (
              <button
                onClick={() => toggleNode(node.user_id)}
                className="w-4 h-4 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-xs font-bold mr-1"
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 flex-1 font-sans">
            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
              <CircleUser className="h-4 w-4 text-indigo-600" />
            </div>

            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">
                {node.user?.kanji_last_name || 'Unknown'} {node.user?.kanji_first_name || ''}
              </span>
              {node.user?.furi_last_name && (
                <span className="ml-1 text-xs text-gray-400">
                  ({node.user?.furi_last_name} {node.user?.furi_first_name || ''})
                </span>
              )}
              <span className="ml-2 text-xs text-gray-500">
                [{node.user_id}]
              </span>
              {hasChildren && (
                <>
                  <span className="ml-2 text-xs text-green-600 font-medium">
                    直下{node.children.length}人
                  </span>
                  {node.children.length >= 10 && (
                    <span className="ml-1 text-xs text-orange-600">⭐</span>
                  )}
                  {node.children.length >= 50 && (
                    <span className="ml-1 text-xs text-red-600">🔥</span>
                  )}
                </>
              )}
              <span className="ml-2 text-xs text-blue-600">
                Lv.{node.level || node.depth_level || 0}
              </span>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child: any, index: number) => {
              const isChildLast = index === node.children.length - 1
              const childPrefix = level === 0 ? '' : prefix + (isLast ? '   ' : '│  ')
              return renderNode(child, level + 1, isChildLast, childPrefix)
            })}
          </div>
        )}
      </div>
    )
  }

  // 検索処理
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setHighlightedNode(null)
      return
    }

    const results: any[] = []
    const searchLower = searchTerm.toLowerCase()

    const searchInTree = (nodes: any[]) => {
      nodes.forEach(node => {
        const lastName = node.user?.kanji_last_name || ''
        const firstName = node.user?.kanji_first_name || ''
        const furiLastName = node.user?.furi_last_name || ''
        const furiFirstName = node.user?.furi_first_name || ''
        const userId = node.user_id || ''
        const email = node.user?.mail_address || ''

        if (
          lastName.includes(searchTerm) ||
          firstName.includes(searchTerm) ||
          furiLastName.toLowerCase().includes(searchLower) ||
          furiFirstName.toLowerCase().includes(searchLower) ||
          userId.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower)
        ) {
          results.push(node)
        }

        if (node.children && node.children.length > 0) {
          searchInTree(node.children)
        }
      })
    }

    searchInTree(fullOrgData.length > 0 ? fullOrgData : orgData)
    setSearchResults(results)

    if (results.length > 0) {
      setHighlightedNode(results[0].user_id)
      expandToNode(results[0].user_id)
    }
  }

  // 特定のユーザーにフォーカス
  const focusOnUser = (userId: string) => {
    const findNodeInTree = (nodes: any[], targetId: string): any => {
      for (const node of nodes) {
        if (node.user_id === targetId) {
          return node
        }
        if (node.children && node.children.length > 0) {
          const found = findNodeInTree(node.children, targetId)
          if (found) return found
        }
      }
      return null
    }

    const targetNode = findNodeInTree(fullOrgData, userId)
    if (targetNode) {
      setOrgData([targetNode])
      setFocusedUserId(userId)
      setExpandedNodes(new Set())
      setHighlightedNode(null)
      setSearchResults([])
      setSearchTerm('')
    }
  }

  // 全体表示に戻る
  const resetToFullView = () => {
    setOrgData(fullOrgData)
    setFocusedUserId(null)
    setExpandedNodes(new Set())
    setHighlightedNode(null)
  }

  // ノードまでのパスを展開
  const expandToNode = (targetId: string) => {
    const newExpanded = new Set(expandedNodes)

    const findPath = (nodes: any[], target: string, path: string[] = []): string[] | null => {
      for (const node of nodes) {
        if (node.user_id === target) {
          return path
        }
        if (node.children && node.children.length > 0) {
          const found = findPath(node.children, target, [...path, node.user_id])
          if (found) return found
        }
      }
      return null
    }

    const path = findPath(orgData, targetId)
    if (path) {
      path.forEach(id => newExpanded.add(id))
      setExpandedNodes(newExpanded)
    }
  }

  const handleLogout = async () => {
    // 緊急ログインセッションをクリア
    localStorage.removeItem('masaasp_user')
    // 通常のSupabaseセッションもクリア
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
                {currentUser?.kanji_last_name} {currentUser?.kanji_first_name} ({currentUser?.user_id})
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
            {currentUser?.admin_flg && (
              <a href="/admin-dashboard" className="text-indigo-100 hover:text-white">
                管理者
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="名前、カナ、ユーザーID、メールアドレスで検索..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              検索
            </button>
            {searchResults.length > 0 && (
              <button
                onClick={() => {
                  setSearchResults([])
                  setSearchTerm('')
                  setHighlightedNode(null)
                }}
                className="px-4 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                クリア
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 text-sm">
              <p className="text-gray-600">{searchResults.length}件の検索結果</p>
              <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                {searchResults.slice(0, 10).map((result) => (
                  <div
                    key={result.user_id}
                    className="flex items-center justify-between p-1 hover:bg-gray-50 cursor-pointer rounded"
                    onClick={() => focusOnUser(result.user_id)}
                  >
                    <div className="flex-1">
                      <span className="text-xs font-medium">
                        {result.user?.kanji_last_name} {result.user?.kanji_first_name}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({result.user_id})
                      </span>
                      <span className="text-xs text-blue-600 ml-1">
                        Lv.{result.level}
                      </span>
                      {result.user?.mail_address && (
                        <span className="text-xs text-gray-400 ml-2">
                          {result.user.mail_address}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-indigo-600 ml-2">
                      組織図を表示 →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Organization Tree */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {focusedUserId && (
                <button
                  onClick={resetToFullView}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ← 全体表示に戻る
                </button>
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                {focusedUserId ? (
                  <>
                    <span className="text-indigo-600">
                      {orgData[0]?.user?.kanji_last_name} {orgData[0]?.user?.kanji_first_name}
                    </span>
                    の組織
                  </>
                ) : (
                  'あなたの組織'
                )}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const getAllIds = (nodes: any[]): string[] => {
                    let ids: string[] = []
                    nodes.forEach(node => {
                      if (node.children && node.children.length > 0) {
                        ids.push(node.user_id)
                        ids = ids.concat(getAllIds(node.children))
                      }
                    })
                    return ids
                  }
                  setExpandedNodes(new Set(getAllIds(orgData)))
                }}
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
              >
                すべて展開
              </button>
              <button
                onClick={() => setExpandedNodes(new Set())}
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
              >
                すべて折りたたみ
              </button>
            </div>
          </div>

          {orgData.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {orgData.map((node, index) => renderNode(node, 0, index === orgData.length - 1, ''))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">組織データが見つかりません</p>
          )}

          <div className="mt-4 text-sm text-gray-500">
            <p>※ +ボタンをクリックして階層を展開できます</p>
            <p>※ あなたの配下の組織のみ表示されます</p>
          </div>
        </div>
      </main>
    </div>
  )
}