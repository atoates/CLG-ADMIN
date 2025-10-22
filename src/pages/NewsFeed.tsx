import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Search, Filter, Newspaper, ExternalLink, Plus, Calendar, TrendingUp, TrendingDown, Minus, X } from 'lucide-react'

interface NewsArticle {
  title: string
  text: string
  source_name: string
  date: string
  sentiment: string
  tickers?: string[]
  topics?: string[]
  news_url: string
  image_url?: string
}

interface Alert {
  id?: string
  token: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  deadline: string
  tags?: string[]
  further_info?: string
  source_type?: string
  source_url?: string
}

export function NewsFeed() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [selectedTickers] = useState<string[]>([]) // For future ticker filtering
  const [isCreateAlertModalOpen, setIsCreateAlertModalOpen] = useState(false)
  const [newAlert, setNewAlert] = useState<Alert | null>(null)
  const queryClient = useQueryClient()

  // Fetch news articles
  const { data: newsData, isLoading, error, refetch } = useQuery({
    queryKey: ['news', selectedTickers],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedTickers.length > 0) {
        params.append('tickers', selectedTickers.join(','))
      }
      const { data } = await api.get(`/api/news?${params.toString()}`)
      console.log('News response:', data)
      return data.news as NewsArticle[]
    },
  })

  const createAlertMutation = useMutation({
    mutationFn: async (alert: Alert) => {
      await api.post('/api/alerts', alert)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setIsCreateAlertModalOpen(false)
      setNewAlert(null)
    },
  })

  const handleCreateAlertFromNews = (article: NewsArticle) => {
    // Create alert object from news article
    const alert: Alert = {
      token: article.tickers?.[0] || '', // First ticker or empty
      title: article.title,
      description: article.text.slice(0, 500), // First 500 chars
      severity: 'info', // Default to info
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      further_info: article.text, // Full article text
      source_type: 'mainstream-media',
      source_url: article.news_url,
    }

    setNewAlert(alert)
    setIsCreateAlertModalOpen(true)
  }

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (newAlert && newAlert.token && newAlert.severity) {
      createAlertMutation.mutate(newAlert)
    }
  }

  const news = newsData || []
  const filteredNews = news.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.source_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSentiment =
      sentimentFilter === 'all' ||
      (article.sentiment && article.sentiment.toLowerCase() === sentimentFilter)

    return matchesSearch && matchesSentiment
  })

  const getSentimentIcon = (sentiment: string) => {
    const lowerSentiment = sentiment?.toLowerCase()
    switch (lowerSentiment) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      default:
        return <Minus className="w-5 h-5 text-gray-600" />
    }
  }

  const getSentimentBadge = (sentiment: string) => {
    const lowerSentiment = sentiment?.toLowerCase()
    const styles = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-800',
    }
    return styles[lowerSentiment as keyof typeof styles] || styles.neutral
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crypto News Feed</h1>
          <p className="text-gray-600 mt-2">
            Latest cryptocurrency news and market updates
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Newspaper className="w-5 h-5" />
          Refresh News
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search news by title, content, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Sentiment Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="all">All Sentiment</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <span>Total: {news.length}</span>
          <span>Showing: {filteredNews.length}</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Positive: {news.filter(a => a.sentiment?.toLowerCase() === 'positive').length}
          </span>
          <span className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            Negative: {news.filter(a => a.sentiment?.toLowerCase() === 'negative').length}
          </span>
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {error ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-red-600 font-medium">Error loading news</div>
            <div className="text-sm text-gray-500 mt-2">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </div>
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            Loading news feed...
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((article, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex gap-6">
                {/* Image */}
                {article.image_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-48 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getSentimentIcon(article.sentiment)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSentimentBadge(article.sentiment)}`}>
                        {article.sentiment || 'Neutral'}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3">{article.text}</p>

                  {/* Metadata */}
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Newspaper className="w-4 h-4" />
                      {article.source_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(article.date)}
                    </span>
                    {article.tickers && article.tickers.length > 0 && (
                      <div className="flex items-center gap-2">
                        {article.tickers.slice(0, 3).map((ticker) => (
                          <span
                            key={ticker}
                            className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded text-xs font-medium"
                          >
                            {ticker}
                          </span>
                        ))}
                        {article.tickers.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{article.tickers.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCreateAlertFromNews(article)}
                      className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      Create Alert
                    </button>
                    <a
                      href={article.news_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 px-4 py-2 rounded-lg text-sm transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Read Full Article
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            {searchTerm || sentimentFilter !== 'all'
              ? 'No news articles match your filters'
              : 'No news articles available'}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {isCreateAlertModalOpen && newAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Create Alert from News</h2>
              <button
                onClick={() => {
                  setIsCreateAlertModalOpen(false)
                  setNewAlert(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveAlert} className="p-6 space-y-4">
              {/* Token - Required */}
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                  Token Symbol <span className="text-red-600">*</span>
                </label>
                <input
                  id="token"
                  type="text"
                  value={newAlert.token}
                  onChange={(e) => setNewAlert({ ...newAlert, token: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g. BTC, ETH, SOL"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the primary token this news relates to</p>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  id="description"
                  value={newAlert.description}
                  onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  required
                />
              </div>

              {/* Severity - Required */}
              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                  Severity <span className="text-red-600">*</span>
                </label>
                <select
                  id="severity"
                  value={newAlert.severity}
                  onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as Alert['severity'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="info">Info - General information</option>
                  <option value="warning">Warning - Important update</option>
                  <option value="critical">Critical - Urgent action required</option>
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={newAlert.deadline ? new Date(newAlert.deadline).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setNewAlert({ ...newAlert, deadline: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Full Article Text */}
              <div>
                <label htmlFor="further_info" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Article Text
                </label>
                <textarea
                  id="further_info"
                  value={newAlert.further_info || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, further_info: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Source URL */}
              <div>
                <label htmlFor="source_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Article URL
                </label>
                <input
                  id="source_url"
                  type="url"
                  value={newAlert.source_url || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, source_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  readOnly
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAlertModalOpen(false)
                    setNewAlert(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAlertMutation.isPending || !newAlert.token || !newAlert.severity}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
