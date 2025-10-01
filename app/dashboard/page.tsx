'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'
import RecipeCard from '@/components/RecipeCard'
import AddRecipeModal from '@/components/AddRecipeModal'
import CategoryManager from '@/components/CategoryManager'

type Recipe = Database['public']['Tables']['recipes']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export default function DashboardPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    filterRecipes()
  }, [recipes, selectedCategory, searchQuery, showFavoritesOnly])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    await loadData()
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadRecipes(), loadCategories()])
    setLoading(false)
  }

  const loadRecipes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRecipes(data)
    }
  }

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

  const filterRecipes = () => {
    let filtered = [...recipes]

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((r) => r.category_id === selectedCategory)
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter((r) => r.is_favorite)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.cuisine_type?.toLowerCase().includes(query) ||
          r.source_domain?.toLowerCase().includes(query)
      )
    }

    setFilteredRecipes(filtered)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your recipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Recipe Collection
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Manage Categories
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                + Add Recipe
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  showFavoritesOnly
                    ? 'bg-yellow-50 text-yellow-700 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                ⭐ Favorites Only
              </button>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === null
                      ? 'bg-orange-50 text-orange-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  All Recipes ({recipes.length})
                </button>
                {categories.map((category) => {
                  const count = recipes.filter((r) => r.category_id === category.id).length
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === category.id
                          ? 'bg-orange-50 text-orange-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || '#gray' }}
                        />
                        {category.name}
                      </span>
                      <span className="text-xs text-gray-500">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Category Manager */}
            {showCategoryManager && (
              <CategoryManager onCategoryChange={loadData} />
            )}
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {filteredRecipes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {recipes.length === 0 ? 'No recipes yet' : 'No recipes found'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {recipes.length === 0
                    ? 'Start building your collection by adding your first recipe!'
                    : 'Try adjusting your filters or search query'}
                </p>
                {recipes.length === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Add Your First Recipe
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onUpdate={loadRecipes}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add Recipe Modal */}
      <AddRecipeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onRecipeAdded={loadRecipes}
      />
    </div>
  )
}
