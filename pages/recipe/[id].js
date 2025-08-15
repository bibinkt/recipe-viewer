import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { fetchRecipe, incrementViews, generateRecipeHTML } from '../../lib/supabase'
import Head from 'next/head'
import Link from 'next/link'

export default function RecipePage() {
  const router = useRouter()
  const { id } = router.query
  const [recipeData, setRecipeData] = useState(null)
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      loadRecipe(id)
    }
  }, [id])

  const loadRecipe = async (recipeId) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchRecipe(recipeId)
      setRecipeData(data)
      
      // Generate HTML from recipe JSON
      const html = generateRecipeHTML(data)
      setHtmlContent(html)
      
      // Increment view count
      await incrementViews(recipeId)
      
    } catch (err) {
      console.error('Error loading recipe:', err)
      setError(err.message || 'Failed to load recipe')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipeData?.recipe?.title || 'Recipe',
          text: 'Check out this delicious recipe!',
          url: url
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('Recipe link copied to clipboard! 📋')
      } catch (err) {
        console.error('Failed to copy:', err)
        alert('Failed to copy link')
      }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const downloadHTML = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${recipeData?.recipe?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'recipe'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading delicious recipe...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-page">
        <div className="error">
          <h1>😔 Oops!</h1>
          <p>{error}</p>
          <Link href="/" className="home-button">
            🏠 Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (!recipeData || !recipeData.recipe) {
    return (
      <div className="error-page">
        <div className="error">
          <h1>Recipe not found</h1>
          <Link href="/" className="home-button">
            🏠 Go Home
          </Link>
        </div>
      </div>
    )
  }

  const recipe = recipeData.recipe
  const views = recipeData.meta?.views || 0

  return (
    <>
      <Head>
        <title>{recipe.title} - Recipe</title>
        <meta name="description" content={`Learn how to make ${recipe.title}. A delicious ${recipe.cuisine} recipe with step-by-step instructions.`} />
        <meta property="og:title" content={`${recipe.title} - Recipe`} />
        <meta property="og:description" content={`Learn how to make ${recipe.title} - ${recipe.cuisine} cuisine`} />
        <meta property="og:type" content="article" />
        <meta name="keywords" content={`${recipe.title}, ${recipe.cuisine}, recipe, cooking, ${recipe.tags?.join(', ')}`} />
      </Head>
      
      <div className="recipe-page">
        {/* Navigation Bar */}
        <nav className="nav">
          <div className="nav-content">
            <Link href="/" className="logo">
              🍽️ Recipes
            </Link>
            <div className="nav-actions">
              <span className="views">👀 {views} views</span>
              <span className="recipe-meta">
                🍽️ {recipe.cuisine} • ⏱️ {recipe.total_time_minutes}min
              </span>
              <button onClick={handleShare} className="action-button share-button">
                📤 Share
              </button>
              <button onClick={downloadHTML} className="action-button download-button">
                💾 Download
              </button>
              <button onClick={handlePrint} className="action-button print-button">
                🖨️ Print
              </button>
            </div>
          </div>
        </nav>

        {/* Recipe Content */}
        <main className="recipe-main">
          <div 
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            className="recipe-content"
          />
        </main>

        {/* Footer */}
        <footer className="recipe-footer">
          <div className="footer-content">
            <p>Recipe viewed on {new Date().toLocaleDateString()}</p>
            <div className="recipe-stats-footer">
              <span>🏷️ {recipeData.status || 'draft'}</span>
              <span>📅 Created: {new Date(recipeData.created_at).toLocaleDateString()}</span>
              {recipeData.slug && <span>🔗 Slug: {recipeData.slug}</span>}
            </div>
            <div className="footer-actions">
              <button onClick={handleShare} className="footer-button">
                📤 Share Recipe
              </button>
              <button onClick={downloadHTML} className="footer-button">
                💾 Download HTML
              </button>
              <Link href="/" className="footer-button">
                🏠 More Recipes
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}