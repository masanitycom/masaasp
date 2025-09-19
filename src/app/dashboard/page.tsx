'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, CamelLevel } from '@/types/database.types'
import { Users, TrendingUp, Award, BarChart3, LogOut, Upload, Building } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [camelLevel, setCamelLevel] = useState<CamelLevel | null>(null)
  const [stats, setStats] = useState({
    directChildren: 0,
    totalChildren: 0,
    totalRewards: 0,
    recentInvestments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
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

        // Fetch camel level info
        const { data: camelData } = await supabase
          .from('camel_levels')
          .select('*')
          .eq('user_id', userData.user_id)
          .single()

        if (camelData) {
          setCamelLevel(camelData)
          setStats(prev => ({
            ...prev,
            directChildren: camelData.direct_children_count,
            totalChildren: camelData.total_children_count
          }))
        }

        // Fetch rewards
        const { data: rewardsData } = await supabase
          .from('calculated_rewards')
          .select('reward_amount')
          .eq('user_id', userData.user_id)

        if (rewardsData) {
          const totalRewards = rewardsData.reduce((sum, reward) => sum + reward.reward_amount, 0)
          setStats(prev => ({ ...prev, totalRewards }))
        }

        // Fetch recent investments count
        const { data: investmentCount } = await supabase
          .from('investment_history')
          .select('id', { count: 'exact' })
          .eq('user_id', userData.user_id)
          .gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (investmentCount) {
          setStats(prev => ({ ...prev, recentInvestments: investmentCount.length }))
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
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
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
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
            <a href="/dashboard" className="text-white font-medium">
              ダッシュボード
            </a>
            <a href="/organization" className="text-indigo-100 hover:text-white">
              組織図
            </a>
            <a href="/rewards" className="text-indigo-100 hover:text-white">
              報酬
            </a>
            {user?.admin_flg && (
              <a href="/admin" className="text-yellow-300 hover:text-white font-semibold bg-indigo-700 px-3 py-1 rounded-md">
                ⚙️ 管理画面
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Quick Access Panel */}
        {user?.admin_flg && (
          <div className="mb-8 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ⚙️ 管理者クイックアクセス
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin"
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow border border-yellow-200"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Upload className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">CSVアップロード</p>
                    <p className="text-sm text-gray-600">ユーザー・物件データ管理</p>
                  </div>
                </div>
              </a>

              <a
                href="/admin#users"
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow border border-yellow-200"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">ユーザー管理</p>
                    <p className="text-sm text-gray-600">認証・権限設定</p>
                  </div>
                </div>
              </a>

              <a
                href="/admin#properties"
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow border border-yellow-200"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">物件管理</p>
                    <p className="text-sm text-gray-600">ファンド・報酬設定</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">直紹介</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.directChildren}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">組織人数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalChildren}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総報酬</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalRewards)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">今月の投資</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.recentInvestments}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ユーザー情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ユーザーID</p>
              <p className="font-medium">{user?.user_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">メールアドレス</p>
              <p className="font-medium">{user?.mail_address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">氏名</p>
              <p className="font-medium">
                {user?.kanji_last_name} {user?.kanji_first_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">レベル</p>
              <p className="font-medium">{camelLevel?.level || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ポジション</p>
              <p className="font-medium">{camelLevel?.pos || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">アップライン</p>
              <p className="font-medium">{camelLevel?.upline || 'なし'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}