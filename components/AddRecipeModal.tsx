'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type Recipe = Database['public']['Tables']['recipes']['Insert']
type Category = Database['public']['Tables']['categories']['Row']

interface AddRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onRecipeAdded: () => void
}

export default function AddRecipeModal({ isOpen, onClose, onRecipeAdded }: AddRecipeModalProps) {
  const [url, setUrl] = useState('')
  const [formData, setFormData] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    thumbnail_url: '',
    prep_time: '',
    difficulty: '',
    cuisine_type: '',
    category_id: null,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (!error && data) {
      setCategories(data)
    }
  }

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl)

    if (!newUrl.trim()) {
      setFormData({
        title: '',
        description: '',
        thumbnail_url: '',
        prep_time: '',
        difficulty: '',
        cuisine_type: '',
        category_id: formData.category_id,
      })
      return
    }

    // Auto-scrape when URL is pasted
    if (newUrl.startsWith('http')) {
      await scrapeRecipe(newUrl)
    }
  }

  const scrapeRecipe = async (urlToScrape: string) => {
    setScraping(true)
    setError(null)

    try {
      // Check if it's a YouTube URL - use client-side oEmbed instead
      const isYouTube = urlToScrape.includes('youtube.com') || urlToScrape.includes('youtu.be')

      if (isYouTube) {
        // Use YouTube's oEmbed API directly from the client
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(urlToScrape)}&format=json`
        const response = await fetch(oembedUrl)

        if (response.ok) {
          const data = await response.json()
          const parsedUrl = new URL(urlToScrape)

          setFormData(prev => ({
            ...prev,
            title: data.title || '',
            description: data.author_name ? `Video by ${data.author_name}` : '',
            thumbnail_url: data.thumbnail_url || '',
            source_domain: 'youtube.com',
          }))
          setScraping(false)
          return
        }
      }

      // For non-YouTube URLs, use the server-side scraper
      const response = await fetch('/api/scrape-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScrape }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Scraper API error:', data)
        // Don't show error to user, just allow manual entry
        return
      }

      console.log('Scraped data:', data)

      setFormData(prev => ({
        ...prev,
        title: data.title || '',
        description: data.description || '',
        thumbnail_url: data.thumbnail_url || '',
        prep_time: data.prep_time || '',
        cuisine_type: data.cuisine_type || '',
        source_domain: data.source_domain || '',
      }))
    } catch (err) {
      console.error('Scraping error:', err)
      // Don't show error to user, just allow manual entry
    } finally {
      setScraping(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          url: url,
          title: formData.title || 'Untitled Recipe',
          description: formData.description,
          thumbnail_url: formData.thumbnail_url,
          category_id: formData.category_id,
          prep_time: formData.prep_time,
          difficulty: formData.difficulty,
          cuisine_type: formData.cuisine_type,
          source_domain: formData.source_domain,
        })

      if (insertError) throw insertError

      // Reset form
      setUrl('')
      setFormData({
        title: '',
        description: '',
        thumbnail_url: '',
        prep_time: '',
        difficulty: '',
        cuisine_type: '',
        category_id: null,
      })

      onRecipeAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Recipe</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipe URL *
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/recipe"
                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
              {scraping && (
                <p className="text-sm text-gray-500 mt-1">Fetching recipe details...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Recipe name"
                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the recipe"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={formData.thumbnail_url || ''}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
              {formData.thumbnail_url && (
                <img
                  src={formData.thumbnail_url}
                  alt="Preview"
                  className="mt-2 w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Time
                </label>
                <input
                  type="text"
                  value={formData.prep_time || ''}
                  onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                  placeholder="e.g., 30 mins"
                  className="w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty || ''}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Select difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuisine Type
                </label>
                <input
                  type="text"
                  value={formData.cuisine_type || ''}
                  onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                  placeholder="e.g., Italian"
                  className="w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Recipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
