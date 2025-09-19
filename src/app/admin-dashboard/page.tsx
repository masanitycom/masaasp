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
        </div>

        {/* CSV Upload Section */}
        <div id="csv-upload" className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">CSVデータアップロード</h2>
            <p className="text-sm text-gray-600 mt-1">システムデータの一括登録・更新</p>
          </div>
          <div className="p-6">
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  組織図機能は現在開発中です。CSVデータがアップロードされると自動的に組織構造が表示されます。
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

function CSVUploadGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      <CSVUploader
        title="報酬データ"
        description="計算済み報酬情報の登録"
        tableName="calculated_rewards"
        icon={<AlertCircle className="h-6 w-6 text-purple-600" />}
      />
    </div>
  )
}

function SystemManagementSection() {
  const [authSetupResult, setAuthSetupResult] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

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
・処理件数: ${data.processed}件
・エラー: ${data.errors}件`)
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