'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'

type Recipe = Database['public']['Tables']['recipes']['Row']
type MealPlan = Database['public']['Tables']['meal_plans']['Row']
type Category = Database['public']['Tables']['categories']['Row']

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const

export default function MealPlanPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; mealType: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadMealPlans()
    }
  }, [currentWeekStart])

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
    await cleanupOldMealPlans()
    await Promise.all([loadRecipes(), loadCategories(), loadMealPlans()])
    setLoading(false)
  }

  const loadRecipes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('title')

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

  const loadMealPlans = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weekStartStr = formatDate(currentWeekStart)

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartStr)

    if (!error && data) {
      setMealPlans(data)
    }
  }

  const cleanupOldMealPlans = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const currentMonday = getMonday(new Date())
    const currentMondayStr = formatDate(currentMonday)

    // Delete all meal plans before the current week
    await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', user.id)
      .lt('week_start_date', currentMondayStr)
  }

  const handleAddRecipe = async (recipeId: string) => {
    if (!selectedSlot) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        day_of_week: selectedSlot.day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
        meal_type: selectedSlot.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        week_start_date: formatDate(currentWeekStart),
      })

    if (!error) {
      await loadMealPlans()
      setSelectedSlot(null)
    }
  }

  const handleRemoveRecipe = async (mealPlanId: string) => {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId)

    if (!error) {
      await loadMealPlans()
    }
  }

  const getRecipeForSlot = (day: string, mealType: string) => {
    const mealPlan = mealPlans.find(mp => mp.day_of_week === day && mp.meal_type === mealType)
    if (!mealPlan) return null
    return recipes.find(r => r.id === mealPlan.recipe_id)
  }

  const getMealPlanId = (day: string, mealType: string) => {
    const mealPlan = mealPlans.find(mp => mp.day_of_week === day && mp.meal_type === mealType)
    return mealPlan?.id || null
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meal plan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Weekly Meal Plan</h1>
              <p className="text-sm text-gray-600 mt-1">
                Week of {formatDateRange(currentWeekStart)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentWeekStart(getPreviousWeek(currentWeekStart))}
                disabled={formatDate(currentWeekStart) === formatDate(getMonday(new Date()))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentWeekStart(getMonday(new Date()))}
                className="px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                This Week
              </button>
              <button
                onClick={() => setCurrentWeekStart(getNextWeek(currentWeekStart))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Next →
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back to Recipes
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Weekly Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-orange-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 capitalize">{day}</h3>
              </div>
              <div className="p-3 space-y-4">
                {MEAL_TYPES.map((mealType) => {
                  const recipe = getRecipeForSlot(day, mealType)
                  const mealPlanId = getMealPlanId(day, mealType)

                  return (
                    <div key={mealType} className="border border-gray-200 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-500 capitalize mb-2">
                        {mealType}
                      </div>
                      {recipe ? (
                        <div className="relative group">
                          <button
                            onClick={() => mealPlanId && handleRemoveRecipe(mealPlanId)}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>

                          <a
                            href={recipe.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:opacity-80 transition-opacity"
                          >
                            {recipe.thumbnail_url && (
                              <img
                                src={recipe.thumbnail_url}
                                alt={recipe.title}
                                className="w-full h-24 object-cover rounded-lg mb-2"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors">
                              {recipe.title}
                            </div>
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedSlot({ day, mealType })}
                          className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium text-center py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          + Add Recipe
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Picker Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Select Recipe for {selectedSlot.day.charAt(0).toUpperCase() + selectedSlot.day.slice(1)} - {selectedSlot.mealType.charAt(0).toUpperCase() + selectedSlot.mealType.slice(1)}
                </h2>
                <button
                  onClick={() => {
                    setSelectedSlot(null)
                    setSearchQuery('')
                    setSelectedCategory(null)
                    setShowFavoritesOnly(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Search and Filters */}
              <div className="space-y-3">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />

                {/* Filters Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Favorites Filter */}
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      showFavoritesOnly
                        ? 'bg-yellow-100 text-yellow-700 font-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ⭐ Favorites {showFavoritesOnly ? 'Only' : ''}
                  </button>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="px-3 py-1.5 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {/* Results count */}
                  <span className="text-sm text-gray-500 ml-auto">
                    {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3">
                {recipes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No recipes yet. Add recipes from your dashboard first!
                  </p>
                ) : filteredRecipes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No recipes match your filters. Try adjusting your search or filters.
                  </p>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        handleAddRecipe(recipe.id)
                        setSearchQuery('')
                        setSelectedCategory(null)
                        setShowFavoritesOnly(false)
                      }}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
                    >
                      {recipe.thumbnail_url && (
                        <img
                          src={recipe.thumbnail_url}
                          alt={recipe.title}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{recipe.title}</div>
                        {recipe.source_domain && (
                          <div className="text-sm text-gray-500">{recipe.source_domain}</div>
                        )}
                      </div>
                      {recipe.is_favorite && <span className="text-yellow-500">⭐</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function getPreviousWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - 7)
  return d
}

function getNextWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + 7)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateRange(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const start = monday.toLocaleDateString('en-US', options)
  const end = sunday.toLocaleDateString('en-US', options)

  return `${start} - ${end}`
}
