'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Upload, Building, TrendingUp, Settings, LogOut,
  BarChart3, FileText, AlertCircle, Database, DollarSign,
  Activity, Home, Shield
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
            <a href="/admin-dashboard" className="text-white font-medium flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              管理者ホーム
            </a>
            <a href="/admin" className="text-gray-300 hover:text-white flex items-center">
              <Upload className="h-4 w-4 mr-1" />
              データ管理
            </a>
            <a href="/dashboard" className="text-gray-300 hover:text-white flex items-center">
              <Home className="h-4 w-4 mr-1" />
              通常ダッシュボード
            </a>
            <a href="/organization" className="text-gray-300 hover:text-white flex items-center">
              <Users className="h-4 w-4 mr-1" />
              組織管理
            </a>
            <a href="/rewards" className="text-gray-300 hover:text-white flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              報酬管理
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                href="/admin"
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
                href="/admin#auth"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">認証管理</p>
                    <p className="text-sm text-gray-600">ログイン権限・アクセス制御</p>
                  </div>
                </div>
              </a>

              <a
                href="/admin#database"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">データベース管理</p>
                    <p className="text-sm text-gray-600">データ整合性チェック</p>
                  </div>
                </div>
              </a>
            </div>
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