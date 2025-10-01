import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      )
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL' },
        { status: 500 }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract Open Graph metadata
    const ogTitle = $('meta[property="og:title"]').attr('content')
    const ogDescription = $('meta[property="og:description"]').attr('content')
    const ogImage = $('meta[property="og:image"]').attr('content')

    // Fallback to Twitter Card metadata
    const twitterTitle = $('meta[name="twitter:title"]').attr('content')
    const twitterDescription = $('meta[name="twitter:description"]').attr('content')
    const twitterImage = $('meta[name="twitter:image"]').attr('content')

    // Fallback to standard meta tags
    const metaDescription = $('meta[name="description"]').attr('content')
    const pageTitle = $('title').text()

    // Extract recipe-specific metadata if available (schema.org)
    let prepTime = null
    let difficulty = null
    let cuisineType = null

    const recipeSchema = $('script[type="application/ld+json"]')
      .toArray()
      .map((el) => {
        try {
          return JSON.parse($(el).html() || '{}')
        } catch {
          return null
        }
      })
      .find((schema) => schema && (schema['@type'] === 'Recipe' || schema['@type']?.includes('Recipe')))

    if (recipeSchema) {
      prepTime = recipeSchema.prepTime || recipeSchema.totalTime
      cuisineType = recipeSchema.recipeCuisine
    }

    // Compile metadata
    const metadata = {
      title: ogTitle || twitterTitle || pageTitle || 'Untitled Recipe',
      description: ogDescription || twitterDescription || metaDescription || '',
      thumbnail_url: ogImage || twitterImage || '',
      source_domain: parsedUrl.hostname.replace('www.', ''),
      prep_time: prepTime,
      cuisine_type: cuisineType,
      difficulty: difficulty,
    }

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error scraping recipe:', error)
    return NextResponse.json(
      { error: 'Failed to scrape recipe metadata' },
      { status: 500 }
    )
  }
}
