'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, CalculatedRewards, InvestmentHistory } from '@/types/database.types'
import { TrendingUp, DollarSign, Users, Award, LogOut, Home, Calendar, Filter } from 'lucide-react'

interface RewardWithDetails extends CalculatedRewards {
  investment?: InvestmentHistory
  referral_user_name?: string
}

interface PropertyReward {
  fund_no: number
  fund_name: string
  fund_type: string
  total_rewards: number
  total_paid: number
  total_unpaid: number
  reward_count: number
  rewards: RewardWithDetails[]
}

export default function RewardsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [propertyRewards, setPropertyRewards] = useState<PropertyReward[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null)
  const [totalStats, setTotalStats] = useState({
    totalEarned: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    rewardCount: 0
  })

  useEffect(() => {
    fetchUserAndRewards()
  }, [])

  const fetchUserAndRewards = async () => {
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

        // Fetch user's rewards with investment details
        const { data: rewardsData } = await supabase
          .from('calculated_rewards')
          .select(`
            *,
            investment_history (
              id,
              payment_date,
              amount,
              fund_name,
              fund_type
            )
          `)
          .eq('user_id', userData.user_id)
          .order('calculation_date', { ascending: false })

        if (rewardsData) {
          // Get referral user names
          const rewardsWithNames = await Promise.all(
            rewardsData.map(async (reward) => {
              if (reward.referral_user_id) {
                const { data: referralUser } = await supabase
                  .from('users')
                  .select('kanji_last_name, kanji_first_name, user_id')
                  .eq('user_id', reward.referral_user_id)
                  .single()

                return {
                  ...reward,
                  referral_user_name: referralUser
                    ? `${referralUser.kanji_last_name} ${referralUser.kanji_first_name}`
                    : reward.referral_user_id
                }
              }
              return reward
            })
          )

          // Group rewards by property/fund
          const propertyGroups = rewardsWithNames.reduce((groups, reward) => {
            const fundNo = reward.fund_no || 0
            const fundName = reward.investment?.fund_name || 'Unknown Fund'
            const fundType = reward.investment?.fund_type || 'Unknown Type'

            if (!groups[fundNo]) {
              groups[fundNo] = {
                fund_no: fundNo,
                fund_name: fundName,
                fund_type: fundType,
                total_rewards: 0,
                total_paid: 0,
                total_unpaid: 0,
                reward_count: 0,
                rewards: []
              }
            }

            groups[fundNo].rewards.push(reward)
            groups[fundNo].total_rewards += reward.reward_amount
            groups[fundNo].reward_count += 1

            if (reward.is_paid) {
              groups[fundNo].total_paid += reward.reward_amount
            } else {
              groups[fundNo].total_unpaid += reward.reward_amount
            }

            return groups
          }, {} as Record<number, PropertyReward>)

          const propertyRewardsArray = Object.values(propertyGroups)
          setPropertyRewards(propertyRewardsArray)

          // Calculate totals
          const totalEarned = rewardsWithNames.reduce((sum, r) => sum + r.reward_amount, 0)
          const totalPaid = rewardsWithNames.filter(r => r.is_paid).reduce((sum, r) => sum + r.reward_amount, 0)
          const totalUnpaid = rewardsWithNames.filter(r => !r.is_paid).reduce((sum, r) => sum + r.reward_amount, 0)

          setTotalStats({
            totalEarned,
            totalPaid,
            totalUnpaid,
            rewardCount: rewardsWithNames.length
          })
        }
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const filteredPropertyRewards = propertyRewards.map(property => ({
    ...property,
    rewards: property.rewards.filter(reward => {
      if (filter === 'paid') return reward.is_paid
      if (filter === 'unpaid') return !reward.is_paid
      return true
    })
  })).filter(property => property.rewards.length > 0)

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
              <h1 className="text-xl font-bold text-gray-900">報酬管理</h1>
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
            <a href="/organization" className="text-indigo-100 hover:text-white">
              組織図
            </a>
            <a href="/rewards" className="text-white font-medium flex items-center">
              <Award className="h-4 w-4 mr-1" />
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総報酬</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(totalStats.totalEarned)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">支払済み</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(totalStats.totalPaid)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">未払い</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(totalStats.totalUnpaid)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">報酬件数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalStats.rewardCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">フィルター:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: '全て' },
                { key: 'paid', label: '支払済み' },
                { key: 'unpaid', label: '未払い' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setFilter(option.key as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === option.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Property-wise Rewards */}
        <div className="space-y-6">
          {filteredPropertyRewards.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">報酬データがありません</p>
            </div>
          ) : (
            filteredPropertyRewards.map((property) => (
              <div key={property.fund_no} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Property Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{property.fund_name}</h3>
                      <p className="text-sm text-gray-600">ファンドNo: {property.fund_no} | {property.fund_type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(property.total_rewards)}
                      </div>
                      <div className="text-sm text-gray-600">
                        支払済み: {formatCurrency(property.total_paid)} |
                        未払い: {formatCurrency(property.total_unpaid)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Rewards Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          日付
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          紹介先
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          段階
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          報酬額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {property.rewards.map((reward) => (
                        <tr key={reward.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {formatDate(reward.calculation_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reward.referral_user_name || reward.referral_user_id || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {reward.tier_level}段目
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(reward.reward_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              reward.is_paid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {reward.is_paid ? '支払済み' : '未払い'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}