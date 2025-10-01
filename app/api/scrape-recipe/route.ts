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

    // Check if it's a YouTube URL
    const isYouTube = parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')

    if (isYouTube) {
      // Extract video ID
      let videoId = null
      if (parsedUrl.hostname.includes('youtube.com')) {
        videoId = parsedUrl.searchParams.get('v')
      } else if (parsedUrl.hostname.includes('youtu.be')) {
        videoId = parsedUrl.pathname.slice(1).split('?')[0]
      }

      if (videoId) {
        try {
          // Use YouTube oEmbed API from server-side
          const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
          const response = await fetch(oembedUrl, {
            signal: AbortSignal.timeout(5000),
          })

          if (response.ok) {
            const data = await response.json()
            const metadata = {
              title: data.title || 'YouTube Video',
              description: data.author_name ? `Video by ${data.author_name}` : '',
              thumbnail_url: data.thumbnail_url || '',
              source_domain: 'youtube.com',
              prep_time: null,
              cuisine_type: null,
            }
            console.log('YouTube oEmbed metadata:', metadata)
            return NextResponse.json(metadata)
          }
        } catch (err) {
          console.error('YouTube oEmbed error:', err)
          // Fall through to regular scraping
        }
      }
    }

    // Fetch the page with better headers to avoid being blocked
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      console.error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 500 }
      )
    }

    const html = await response.text()

    if (!html || html.length === 0) {
      console.error('Empty HTML response')
      return NextResponse.json(
        { error: 'Received empty response from URL' },
        { status: 500 }
      )
    }
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
    }

    console.log('Scraped metadata:', metadata)
    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error scraping recipe:', error)

    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to scrape recipe metadata',
        details: errorMessage,
        url: request.url
      },
      { status: 500 }
    )
  }
}
