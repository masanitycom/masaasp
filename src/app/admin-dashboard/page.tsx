'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Upload, Building, TrendingUp, Settings, LogOut,
  BarChart3, FileText, AlertCircle, Database, DollarSign,
  Activity, Home, Shield, User, UserCheck, CircleUser
} from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalInvestments: 0,
    totalRewards: 0,
    pendingCsvUploads: 0,
    recentActivities: 0,
    systemHealth: 'Good',
    totalProperties: 0
  })

  useEffect(() => {
    checkAdminAccess()
    fetchAdminStats()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check admin privileges
    const { data: userRecords, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('mail_address', user.email)

    const userData = userRecords?.[0] // Take first match

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      router.push('/login')
      return
    }

    if (!userData?.admin_flg) {
      router.push('/dashboard') // Redirect to normal dashboard
      return
    }

    setAdminUser(userData)
  }

  const fetchAdminStats = async () => {
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Fetch active users (logged in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { count: activeCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_date', thirtyDaysAgo)

      // Fetch total investments
      const { data: investmentData } = await supabase
        .from('investment_history')
        .select('amount')

      const totalInvestments = investmentData?.reduce((sum, inv) => sum + inv.amount, 0) || 0

      // Fetch total rewards
      const { data: rewardData } = await supabase
        .from('calculated_rewards')
        .select('reward_amount')

      const totalRewards = rewardData?.reduce((sum, reward) => sum + reward.reward_amount, 0) || 0

      // Count unique properties
      const { data: propertyData } = await supabase
        .from('investment_history')
        .select('fund_name')
        .not('fund_name', 'is', null)

      const uniqueProperties = new Set(propertyData?.map(p => p.fund_name) || [])

      setStats({
        totalUsers: userCount || 0,
        activeUsers: activeCount || 0,
        totalInvestments: totalInvestments,
        totalRewards: totalRewards,
        pendingCsvUploads: 0,
        recentActivities: investmentData?.length || 0,
        systemHealth: 'Good',
        totalProperties: uniqueProperties.size
      })

    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/MASAASPLOGO.svg"
                alt="MasaASP"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">管理者ダッシュボード</h1>
                <p className="text-xs text-gray-500">Admin: {adminUser?.kanji_last_name} {adminUser?.kanji_first_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-12 items-center">
            <a href="#dashboard" className="text-white font-medium flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              ダッシュボード
            </a>
            <a href="#csv-upload" className="text-gray-300 hover:text-white flex items-center">
              <Upload className="h-4 w-4 mr-1" />
              CSVアップロード
            </a>
            <a href="#organization-tree" className="text-gray-300 hover:text-white flex items-center">
              <Users className="h-4 w-4 mr-1" />
              全体組織図
            </a>
            <a href="#system-management" className="text-gray-300 hover:text-white flex items-center">
              <Database className="h-4 w-4 mr-1" />
              システム管理
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Section */}
        <div id="dashboard">
        {/* System Status Alert */}
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                システムステータス: <span className="font-semibold">正常稼働中</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  アクティブ: {stats.activeUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">物件数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalProperties}
                </p>
                <p className="text-xs text-gray-500">
                  アクティブファンド
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総投資額</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalInvestments)}
                </p>
                <p className="text-xs text-gray-500">
                  全期間合計
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総報酬額</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalRewards)}
                </p>
                <p className="text-xs text-gray-500">
                  支払済み報酬
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">クイックアクション</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="#csv-upload"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Upload className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">CSVアップロード</p>
                    <p className="text-sm text-gray-600">ユーザー・投資データ一括登録</p>
                  </div>
                </div>
              </a>

              <a
                href="#system-management"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">システム管理</p>
                    <p className="text-sm text-gray-600">認証システム・権限管理</p>
                  </div>
                </div>
              </a>

              <a
                href="#organization-tree"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">組織管理</p>
                    <p className="text-sm text-gray-600">全体組織図・構造管理</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
        </div>

        {/* CSV Upload Section */}
        <div id="csv-upload" className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">CSVデータアップロード</h2>
            <p className="text-sm text-gray-600 mt-1">システムデータの一括登録・更新</p>
          </div>
          <div className="p-6">
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">📂 システム運用に必要なCSVファイル</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>tb_user作成_暗号化処理済み_1.csv</strong> - ユーザー基本情報（約20,000件）</p>
                <p>• <strong>tb_camel_level_2.csv</strong> - 組織階層データ（紹介関係）</p>
                <p>• <strong>CAMEL入金履歴編集_ID入力済み_1.csv</strong> - 投資履歴データ</p>
              </div>
              <div className="mt-3 space-x-4">
                <a
                  href="/csv/tb_user作成 - 暗号化処理済み (1).csv"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                  download
                >
                  📥 ユーザーサンプル
                </a>
                <a
                  href="/csv/tb_camel_level (2).csv"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                  download
                >
                  📥 組織サンプル
                </a>
                <a
                  href="/csv/CAMEL入金履歴編集 - ID入力済み (1).csv"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                  download
                >
                  📥 投資サンプル
                </a>
              </div>
              <div className="mt-3 text-xs text-blue-600">
                💡 推奨順序: ①ユーザーデータ → ②組織階層データ → ③投資履歴データ
              </div>
            </div>
            <CSVUploadGrid />
          </div>
        </div>

        {/* Organization Tree Section */}
        <div id="organization-tree" className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">全体組織図</h2>
            <p className="text-sm text-gray-600 mt-1">システム全体の組織構造を表示します</p>
          </div>
          <div className="p-6">
            <OrganizationChart />
          </div>
        </div>

        {/* System Management Section */}
        <div id="system-management" className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">システム管理</h2>
            <p className="text-sm text-gray-600 mt-1">認証システム・データベース管理</p>
          </div>
          <div className="p-6">
            <SystemManagementSection />
          </div>
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">最近のアクティビティ</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">新規ユーザー登録</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">今日: 0件</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">CSVアップロード</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">最終: -</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">報酬計算実行</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">最終: -</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">管理者メモ</h3>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-800">
                  📝 重要タスク：
                </p>
                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                  <li>月次報酬計算の実行（毎月1日）</li>
                  <li>新規ユーザーの承認確認</li>
                  <li>システムバックアップ（週次）</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function OrganizationChart() {
  const [orgData, setOrgData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizationData()
  }, [])

  const fetchOrganizationData = async () => {
    try {
      console.log('Fetching organization data...')
      console.log('開始: 組織データ取得処理')

      // Fetch ALL camel_levels data using pagination to bypass Supabase's 1000 record limit
      let allCamelData: any[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      console.log('Fetching all camel_levels data with pagination...')
      console.log('ステップ1: camel_levelsデータのページネーション取得開始')

      while (hasMore) {
        const { data: pageData, error: pageError } = await supabase
          .from('camel_levels')
          .select('user_id, level, pos, upline, depth_level')
          .order('level', { ascending: true })
          .order('user_id', { ascending: true })
          .range(from, from + pageSize - 1)

        if (pageError) {
          console.error('Pagination error at offset', from, ':', pageError)
          throw pageError
        }

        if (pageData && pageData.length > 0) {
          allCamelData = allCamelData.concat(pageData)
          console.log(`Fetched page ${Math.floor(from / pageSize) + 1}: ${pageData.length} records (total: ${allCamelData.length})`)
          from += pageSize
          hasMore = pageData.length === pageSize // Continue if we got a full page
        } else {
          hasMore = false
        }
      }

      console.log('Camel data count:', allCamelData.length, 'Expected ~20,000 records')
      const camelData = allCamelData

      if (!camelData || camelData.length === 0) {
        setError('組織階層データがありません。CSVファイルをアップロードしてください。')
        return
      }

      if (camelData.length < 10000) {
        console.warn('Warning: Only got', camelData.length, 'records. Expected ~20,000. Data may be limited.')
      } else {
        console.log('✅ Successfully fetched', camelData.length, 'records!')
      }

      // Get all unique user_ids from camel_levels
      const userIds = [...new Set(camelData.map(item => item.user_id))]
      console.log(`ユニークなユーザーID数: ${userIds.length} (元データ: ${camelData.length}件)`)

      // Fetch user details in batches to avoid URL length limits
      console.log('Fetching user details for', userIds.length, 'users in batches...')
      console.log('ステップ2: ユーザー詳細データのバッチ取得開始')
      let allUsersData: any[] = []
      const chunkSize = 100 // Process 100 user IDs at a time for maximum safety

      for (let i = 0; i < userIds.length; i += chunkSize) {
        const chunk = userIds.slice(i, i + chunkSize)
        const batchNumber = Math.floor(i / chunkSize) + 1
        const totalBatches = Math.ceil(userIds.length / chunkSize)

        console.log(`Fetching user batch ${batchNumber}/${totalBatches}: ${chunk.length} users (${i + 1}-${Math.min(i + chunkSize, userIds.length)} of ${userIds.length})`)

        // Retry logic for failed requests
        let retries = 3
        let batchData = null
        let lastError = null

        while (retries > 0) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('user_id, kanji_last_name, kanji_first_name, furi_last_name, furi_first_name, mail_address')
              .in('user_id', chunk)

            if (error) {
              throw error
            }

            batchData = data
            break // Success, exit retry loop
          } catch (error) {
            lastError = error
            retries--
            console.warn(`Batch ${batchNumber} failed, retrying... (${retries} retries left)`, error)

            if (retries > 0) {
              // Wait before retrying (exponential backoff)
              const waitTime = (4 - retries) * 1000 // 1s, 2s, 3s
              await new Promise(resolve => setTimeout(resolve, waitTime))
            }
          }
        }

        if (!batchData && lastError) {
          console.error(`Failed to fetch user batch ${batchNumber} after all retries:`, lastError)
          throw new Error(`Failed to fetch user batch ${batchNumber}: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`)
        }

        if (batchData) {
          allUsersData = allUsersData.concat(batchData)
          console.log(`✅ Batch ${batchNumber}/${totalBatches} completed: ${batchData.length} users found`)
        }

        // Small delay between batches to avoid rate limiting
        if (i + chunkSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      const usersData = allUsersData
      console.log('All user data fetched:', usersData.length, 'users total')
      console.log('ステップ2完了: 全ユーザーデータ取得完了')

      const usersError = null // No error if we made it this far

      // Create user lookup map
      console.log('ステップ3: ユーザーマップ作成開始')
      const userMap = new Map()
      usersData?.forEach(user => {
        userMap.set(user.user_id, user)
      })
      console.log('ステップ3完了: ユーザーマップ作成完了')

      // Combine camel_levels with user data
      console.log('ステップ4: データ結合処理開始')
      const combinedData = camelData.map(camel => ({
        ...camel,
        user: userMap.get(camel.user_id) || {
          user_id: camel.user_id,
          kanji_last_name: 'Unknown',
          kanji_first_name: 'User',
          mail_address: ''
        }
      }))
      console.log('ステップ4完了: データ結合処理完了')

      console.log('Combined data sample:', combinedData.slice(0, 3))
      console.log('Total combined data length:', combinedData.length)

      // Check level distribution
      const levelCounts = combinedData.reduce((acc, item) => {
        const level = item.level || 0
        acc[level] = (acc[level] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      console.log('Level distribution before deduplication:', levelCounts)

      // Check maximum level in data
      const maxLevel = Math.max(...combinedData.map(item => item.level || 0))
      console.log('Maximum level found in data:', maxLevel)

      // Show some examples of higher level users if they exist
      const higherLevelUsers = combinedData.filter(item => (item.level || 0) >= 2)
      if (higherLevelUsers.length > 0) {
        console.log('Level 2+ users sample:', higherLevelUsers.slice(0, 10).map(u => ({
          user_id: u.user_id,
          level: u.level,
          upline: u.upline
        })))
      } else {
        console.log('No Level 2+ users found in raw data')
      }

      // Remove duplicates by user_id BEFORE building tree
      const uniqueData = combinedData.filter((item, index, arr) =>
        arr.findIndex(t => t.user_id === item.user_id) === index
      )

      console.log('Removed duplicates:', combinedData.length, '->', uniqueData.length)

      // Check level distribution after deduplication
      const uniqueLevelCounts = uniqueData.reduce((acc, item) => {
        const level = item.level || 0
        acc[level] = (acc[level] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      console.log('Level distribution after deduplication:', uniqueLevelCounts)

      // Build tree structure
      console.log('ステップ5: ツリー構造構築開始')
      const tree = buildOrganizationTree(uniqueData)
      console.log('Built tree with root nodes:', tree.length)
      console.log('Total members in tree:', tree.reduce((total, node) => total + countTotalMembers(node), 0))
      console.log('ステップ5完了: ツリー構造構築完了')

      setOrgData(tree)
      console.log('✅ 全処理完了: 組織データの取得と表示準備が完了しました')
    } catch (err) {
      console.error('❌ Error fetching organization data:', err)
      console.error('エラー詳細:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      })

      let errorMessage = '組織データの読み込みに失敗しました: '
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          errorMessage += 'ネットワークエラーが発生しました。データ量が多すぎる可能性があります。'
        } else {
          errorMessage += err.message
        }
      } else {
        errorMessage += 'Unknown error'
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const buildOrganizationTree = (data: any[]) => {
    console.log('Building organization tree with data:', data.length, 'items')
    const nodeMap = new Map()
    const rootNodes: any[] = []

    // Create node map (data should already be deduplicated)
    data.forEach((item, index) => {
      if (index < 20) { // Log more items to see Level 1 users
        console.log(`Item ${index}:`, {
          user_id: item.user_id,
          level: item.level,
          upline: item.upline,
          name: item.user?.kanji_last_name + ' ' + item.user?.kanji_first_name
        })
      }
      nodeMap.set(item.user_id, {
        ...item,
        children: [],
        direct_children_count: 0
      })
    })

    console.log('Node map created with', nodeMap.size, 'entries')

    // 親子関係のマップを作成（より正確な解析）
    const parentChildMap = new Map<string, string[]>()

    data.forEach(item => {
      if (!item.upline || item.upline.trim() === '') {
        // ルートノード
        if (!parentChildMap.has('ROOT')) {
          parentChildMap.set('ROOT', [])
        }
        parentChildMap.get('ROOT')!.push(item.user_id)
        return
      }

      const uplineStr = item.upline.trim()

      // uplineの最後の要素から直接の親を特定
      let directParentId: string | null = null

      if (uplineStr.includes('-')) {
        // ハイフン区切りの場合、パスを逆順に解析
        const parts = uplineStr.split('-')

        // 最後が自分のIDの場合
        if (parts[parts.length - 1] === item.user_id && parts.length > 1) {
          // 最後から2番目が直接の親
          directParentId = parts[parts.length - 2]
        } else {
          // 通常は最初の要素が親（Level 1の場合）
          directParentId = parts[0]
        }
      } else {
        // ハイフンがない場合は、そのまま親のID
        directParentId = uplineStr
      }

      if (directParentId) {
        if (!parentChildMap.has(directParentId)) {
          parentChildMap.set(directParentId, [])
        }
        parentChildMap.get(directParentId)!.push(item.user_id)

        // デバッグログ
        if (item.level === 3 && item.user_id === 'c25216907') {
          console.log(`秋元哲也(c25216907)の親: ${directParentId}, upline: ${uplineStr}`)
        }
      }
    })

    console.log('Parent-child map created with', parentChildMap.size, 'parent nodes')

    // 親子関係マップをログ出力（サンプル）
    let sampleCount = 0
    parentChildMap.forEach((children, parent) => {
      if (sampleCount < 10 && children.length > 0) {
        console.log(`Parent ${parent} has ${children.length} children: ${children.slice(0, 5).join(', ')}`)
        sampleCount++
      }
    })

    // ツリーを構築
    // ルートノードから開始
    const rootIds = parentChildMap.get('ROOT') || []
    rootIds.forEach(rootId => {
      const node = nodeMap.get(rootId)
      if (node) {
        rootNodes.push(node)
        console.log(`Root node: ${rootId}`)
      }
    })

    // すべてのノードに子を追加
    parentChildMap.forEach((childIds, parentId) => {
      if (parentId === 'ROOT') return

      const parentNode = nodeMap.get(parentId)
      if (!parentNode) {
        console.warn(`Parent node not found: ${parentId}`)
        return
      }

      childIds.forEach(childId => {
        const childNode = nodeMap.get(childId)
        if (childNode) {
          // 重複チェック
          if (!parentNode.children.some((child: any) => child.user_id === childId)) {
            parentNode.children.push(childNode)
            parentNode.direct_children_count = parentNode.children.length
          }
        }
      })

      // ログ出力
      if (parentNode.children.length > 0 && (parentNode.level <= 2 || parentId === 'c25216907')) {
        console.log(`${parentId} (Lv.${parentNode.level}) has ${parentNode.children.length} direct children`)
      }
    })

    console.log('Tree built with', rootNodes.length, 'root nodes')

    // Log root node details
    rootNodes.forEach((root, index) => {
      console.log(`Root ${index}: ${root.user_id} with ${root.children.length} direct children`)
      console.log(`Root ${index} children preview:`, root.children.slice(0, 5).map((c: any) => `${c.user_id}(Lv${c.level})`))
    })

    return rootNodes
  }


  const toggleNode = (userId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
      console.log(`Collapsed node: ${userId}`)
    } else {
      newExpanded.add(userId)
      console.log(`Expanded node: ${userId}`)
    }
    setExpandedNodes(newExpanded)
  }

  const renderNode = (node: any, level = 0, isLast = false, prefix = '') => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.user_id)

    // Debug logging for root node
    if (level === 0 && hasChildren) {
      console.log(`Rendering root node ${node.user_id}: ${node.children.length} children, expanded: ${isExpanded}`)
    }

    // Create the tree line prefix for this level
    const currentPrefix = level === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ')

    return (
      <div key={node.user_id} className="font-mono">
        <div className={`flex items-center py-1 hover:bg-blue-50 group ${
          highlightedNode === node.user_id ? 'bg-yellow-100' : ''
        }`}>
          {/* Tree structure text */}
          <div className="flex items-center">
            <span className="text-gray-400 text-sm mr-2 whitespace-pre">
              {currentPrefix}
            </span>

            {/* Expand/collapse button */}
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.user_id)}
                className="w-4 h-4 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-xs font-bold mr-1"
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
          </div>

          {/* User info */}
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
                <span className="ml-2 text-xs text-green-600 font-medium">
                  直下{node.children.length}人
                </span>
              )}
              <span className="ml-2 text-xs text-blue-600">
                Lv.{node.level || node.depth_level || 0}
              </span>
            </div>

            {/* Quick info on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => alert(`【詳細情報】\n\n氏名: ${node.user?.kanji_last_name} ${node.user?.kanji_first_name}\nID: ${node.user_id}\nLevel: ${node.level || node.depth_level || 0}\n紹介者: ${node.upline || 'なし'}\n直接紹介: ${hasChildren ? node.children.length : 0}人`)}
                className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
              >
                詳細
              </button>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child: any, index: number) => {
              const isChildLast = index === node.children.length - 1
              const childPrefix = level === 0 ? '' : prefix + (isLast ? '   ' : '│  ')
              return renderNode(child, level + 1, isChildLast, childPrefix)
            })}
            {node.children.length > 50 && (
              <div className="ml-6 text-xs text-gray-500 italic">
                ※ {node.children.length}人全員を表示中
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">組織データを読み込み中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
        <div className="mt-4">
          <a
            href="#csv-upload"
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            組織データをアップロード
          </a>
        </div>
      </div>
    )
  }

  if (orgData.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">
            組織データがありません。CSVファイルをアップロードして組織構造を作成してください。
          </p>
        </div>
        <div className="mt-4">
          <a
            href="#csv-upload"
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            組織データをアップロード
          </a>
        </div>
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

        if (
          lastName.includes(searchTerm) ||
          firstName.includes(searchTerm) ||
          furiLastName.toLowerCase().includes(searchLower) ||
          furiFirstName.toLowerCase().includes(searchLower) ||
          userId.toLowerCase().includes(searchLower)
        ) {
          results.push(node)
        }

        if (node.children && node.children.length > 0) {
          searchInTree(node.children)
        }
      })
    }

    searchInTree(orgData)
    setSearchResults(results)

    if (results.length > 0) {
      // 最初の結果をハイライト
      setHighlightedNode(results[0].user_id)
      // 親ノードを展開
      expandToNode(results[0].user_id)
    }
  }

  // 特定のノードまでのパスを展開
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

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="名前、カナ、ユーザーIDで検索..."
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
                  className="flex items-center justify-between p-1 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setHighlightedNode(result.user_id)
                    expandToNode(result.user_id)
                  }}
                >
                  <span className="text-xs">
                    {result.user?.kanji_last_name} {result.user?.kanji_first_name}
                    ({result.user_id}) - Lv.{result.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-600">
            表示中: {orgData.reduce((total, node) => total + countTotalMembers(node), 0)}人 / 全80,000人
          </p>
          <button
            onClick={() => {
              const allIds = getAllUserIds(orgData)
              console.log('Expanding nodes:', allIds.length)
              setExpandedNodes(new Set(allIds))
            }}
            className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
          >
            すべて展開 ({getAllUserIds(orgData).length})
          </button>
          <button
            onClick={() => {
              console.log('Collapsing all nodes')
              setExpandedNodes(new Set())
            }}
            className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
          >
            すべて折りたたみ
          </button>
        </div>
        <button
          onClick={fetchOrganizationData}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          🔄 更新
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <div className="max-h-96 overflow-y-auto p-4">
          <div className="space-y-2">
            {orgData.map((node, index) => renderNode(node, 0, index === orgData.length - 1, ''))}
          </div>
        </div>
      </div>
    </div>
  )
}

const countTotalMembers = (node: any): number => {
  let count = 1
  if (node.children) {
    count += node.children.reduce((total: number, child: any) => total + countTotalMembers(child), 0)
  }
  return count
}

const getAllUserIds = (nodes: any[]): string[] => {
  let ids: string[] = []

  const collectIds = (nodeList: any[]) => {
    nodeList.forEach(node => {
      if (node.children && node.children.length > 0) {
        ids.push(node.user_id)
        collectIds(node.children)
      }
    })
  }

  collectIds(nodes)
  return ids
}

function CSVUploadGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CSVUploader
        title="ユーザーデータ"
        description="ユーザー基本情報の一括登録"
        tableName="users"
        icon={<Users className="h-6 w-6 text-blue-600" />}
      />
      <CSVUploader
        title="組織階層データ"
        description="紹介関係・組織構造の登録"
        tableName="camel_levels"
        icon={<FileText className="h-6 w-6 text-green-600" />}
      />
      <CSVUploader
        title="投資履歴データ"
        description="ファンド投資実績の登録"
        tableName="investment_history"
        icon={<Database className="h-6 w-6 text-yellow-600" />}
      />
    </div>
  )
}

function SystemManagementSection() {
  const [authSetupResult, setAuthSetupResult] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)
  const [debugResult, setDebugResult] = useState('')
  const [debugLoading, setDebugLoading] = useState(false)

  const handleDebugTables = async () => {
    setDebugLoading(true)
    setDebugResult('')

    try {
      const response = await fetch('/api/debug-tables')
      const result = await response.json()

      if (result.success) {
        setDebugResult(`📊 データベーステーブル状況:

👥 users テーブル:
・件数: ${result.tables.users.count || 0}件
・エラー: ${result.tables.users.error || 'なし'}
・サンプル: ${result.tables.users.sample?.length || 0}件

🏗️ camel_levels テーブル:
・件数: ${result.tables.camel_levels.count || 0}件
・エラー: ${result.tables.camel_levels.error || 'なし'}
・サンプル: ${result.tables.camel_levels.sample?.length || 0}件

💰 investment_history テーブル:
・件数: ${result.tables.investment_history.count || 0}件
・エラー: ${result.tables.investment_history.error || 'なし'}
・サンプル: ${result.tables.investment_history.sample?.length || 0}件`)
      } else {
        setDebugResult(`❌ デバッグエラー: ${result.error}`)
      }
    } catch (error) {
      setDebugResult(`❌ デバッグ失敗: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDebugLoading(false)
    }
  }

  const handleAuthSetup = async () => {
    setSetupLoading(true)
    setAuthSetupResult('')

    try {
      setAuthSetupResult('🔧 認証システム初期化中...')

      const response = await fetch('/api/manual-auth-setup', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setAuthSetupResult(`✅ 認証システム初期化完了

🔑 管理者アカウント:
・メール: admin@masaasp.com
・パスワード: admin123

🔑 テストアカウント:
・メール: test@masaasp.com
・パスワード: test123

これらのアカウントでログインできます。`)
      } else {
        setAuthSetupResult(`❌ エラー: ${result.error}`)
      }
    } catch (error) {
      setAuthSetupResult(`❌ システムエラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">認証システム初期化</h3>
        <p className="text-sm text-gray-600 mb-4">
          ログインに問題がある場合、認証システムを初期化してテストアカウントを作成します。
        </p>
        <button
          onClick={handleAuthSetup}
          disabled={setupLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {setupLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          認証システム初期化
        </button>

        {authSetupResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">{authSetupResult}</pre>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">データベース状況確認</h3>
        <p className="text-sm text-gray-600 mb-4">
          アップロードされたデータの状況を確認して、組織図表示の問題を診断します。
        </p>
        <button
          onClick={handleDebugTables}
          disabled={debugLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {debugLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          データベース状況確認
        </button>

        {debugResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">{debugResult}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

function CSVUploader({ title, description, tableName, icon }: {
  title: string
  description: string
  tableName: string
  icon: React.ReactNode
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState('')

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult('')

    try {
      setResult(`📤 アップロード中: ${file.name}`)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('tableName', tableName)

      const response = await fetch('/api/csv-stream', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setResult(`✅ アップロード完了
・処理件数: ${data.details?.totalProcessed || 0}件
・エラー件数: ${data.details?.totalErrors || 0}件
・総行数: ${data.details?.totalRows || 0}行

${data.message || ''}

💡 組織図を確認するには画面上部の「全体組織図」をクリックしてください。`)
      } else {
        setResult(`❌ エラー: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ アップロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-lg font-medium text-gray-900 ml-2">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className="space-y-3">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>

        {result && (
          <div className="p-3 bg-gray-50 rounded-md">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}