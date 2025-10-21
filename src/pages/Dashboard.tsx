import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Bell, AlertTriangle } from 'lucide-react'

export function Dashboard() {
  const { data: adminInfo } = useQuery({
    queryKey: ['admin-info'],
    queryFn: async () => {
      const { data } = await api.get('/admin/info')
      return data
    },
  })

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/api/alerts')
      return data
    },
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users')
      return data
    },
  })

  const stats = [
    {
      name: 'Total Alerts',
      value: adminInfo?.counts?.alerts || 0,
      icon: Bell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Active Users',
      value: adminInfo?.counts?.users || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Critical Alerts',
      value: alerts?.filter((a: any) => a.severity === 'critical').length || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Preferences Saved',
      value: adminInfo?.counts?.user_prefs || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  const severityData = [
    { name: 'Critical', value: alerts?.filter((a: any) => a.severity === 'critical').length || 0, color: '#ef4444' },
    { name: 'Warning', value: alerts?.filter((a: any) => a.severity === 'warning').length || 0, color: '#f59e0b' },
    { name: 'Info', value: alerts?.filter((a: any) => a.severity === 'info').length || 0, color: '#10b981' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Crypto Lifeguard Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Severity Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Database</span>
              <span className="font-medium">{adminInfo?.databaseUrl ? 'PostgreSQL' : 'Not configured'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Market Provider</span>
              <span className="font-medium">{adminInfo?.market?.provider?.toUpperCase() || 'None'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Currency</span>
              <span className="font-medium">{adminInfo?.market?.currency || 'USD'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Auto Restore</span>
              <span className="font-medium">{adminInfo?.restoreFromFile ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
