'use client'

import { Database } from '@/lib/types/database.types'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Recipe = Database['public']['Tables']['recipes']['Row']

interface RecipeCardProps {
  recipe: Recipe
  onUpdate: () => void
}

export default function RecipeCard({ recipe, onUpdate }: RecipeCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id)

      if (error) throw error

      onUpdate()
    } catch (err) {
      console.error('Error deleting recipe:', err)
      alert('Failed to delete recipe')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ is_favorite: !recipe.is_favorite })
        .eq('id', recipe.id)

      if (error) throw error

      onUpdate()
    } catch (err) {
      console.error('Error updating favorite:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      {/* Thumbnail */}
      <a
        href={recipe.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video overflow-hidden rounded-t-xl bg-gradient-to-br from-orange-50 to-amber-50"
      >
        {recipe.thumbnail_url ? (
          <img
            src={recipe.thumbnail_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Favorite star overlay */}
        {recipe.is_favorite && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-white rounded-full p-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </a>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <a
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2"
          >
            {recipe.title}
          </a>
        </div>

        {recipe.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {recipe.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {recipe.source_domain && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {recipe.source_domain}
            </span>
          )}
          {recipe.prep_time && (
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
              ⏱️ {recipe.prep_time}
            </span>
          )}
          {recipe.difficulty && (
            <span className={`px-2 py-1 rounded-full ${
              recipe.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
              recipe.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600' :
              'bg-red-50 text-red-600'
            }`}>
              {recipe.difficulty}
            </span>
          )}
          {recipe.cuisine_type && (
            <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
              {recipe.cuisine_type}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`text-sm flex items-center gap-1 transition-colors ${
              recipe.is_favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <svg className="w-5 h-5" fill={recipe.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
