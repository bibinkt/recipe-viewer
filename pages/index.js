import { useEffect, useState } from 'react'
import { fetchRecentRecipes } from '../lib/supabase'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const [recentRecipes, setRecentRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentRecipes()
  }, [])

  const loadRecentRecipes = async () => {
    try {
      const recipes = await fetchRecentRecipes(12)
      setRecentRecipes(recipes)
    } catch (error) {
      console.error('Error loading recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSpiceColor = (level) => {
    if (level <= 2) return '#4ade80' // green
    if (level <= 5) return '#fbbf24' // yellow
    if (level <= 7) return '#fb923c' // orange
    return '#ef4444' // red
  }

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'beginner': return '#10b981'
      case 'intermediate': return '#f59e0b'
      case 'advanced': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <>
      <Head>
        <title>Recipe Collection - Delicious Recipes to Try</title>
        <meta name="description" content="Discover amazing recipes from our community. Browse through our collection of delicious, easy-to-follow recipes." />
        <meta property="og:title" content="Recipe Collection" />
        <meta property="og:description" content="Discover amazing recipes from our community" />
      </Head>

      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="nav-content">
            <h1 className="logo">🍽️ Recipe Collection</h1>
            <p className="tagline">Discover delicious recipes from our community</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="main">
          <section className="hero">
            <h2>Welcome to our Recipe Collection!</h2>
            <p>Browse through our curated collection of amazing recipes shared by food lovers from around the world.</p>
          </section>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading delicious recipes...</p>
            </div>
          ) : (
            <section className="recipes-section">
              <h3>Recent Recipes ({recentRecipes.length})</h3>
              {recentRecipes.length === 0 ? (
                <div className="no-recipes">
                  <p>No published recipes available yet. Check back soon!</p>
                </div>
              ) : (
                <div className="recipe-grid">
                  {recentRecipes.map((recipe) => (
                    <Link 
                      key={recipe.id} 
                      href={`/recipe/${recipe.id}`}
                      className="recipe-card"
                    >
                      <div className="recipe-card-content">
                        <div className="recipe-card-header">
                          <h4 className="recipe-title">{recipe.title}</h4>
                          <div className="recipe-cuisine">{recipe.cuisine}</div>
                        </div>
                        
                        <div className="recipe-stats-grid">
                          <div className="recipe-stat">
                            <span className="stat-icon">⏱️</span>
                            <span className="stat-value">{recipe.total_time || 0}min</span>
                          </div>
                          <div className="recipe-stat">
                            <span className="stat-icon">👥</span>
                            <span className="stat-value">{recipe.servings || 0}</span>
                          </div>
                          <div className="recipe-stat">
                            <span 
                              className="stat-icon" 
                              style={{ color: getSpiceColor(recipe.spice_level || 0) }}
                            >
                              🌶️
                            </span>
                            <span className="stat-value">{recipe.spice_level || 0}/5</span>
                          </div>
                          <div className="recipe-stat">
                            <span 
                              className="stat-icon"
                              style={{ color: getDifficultyColor(recipe.difficulty) }}
                            >
                              👨‍🍳
                            </span>
                            <span className="stat-value">{recipe.difficulty || 'unknown'}</span>
                          </div>
                        </div>
                        
                        <div className="recipe-meta">
                          <span className="views">👀 {recipe.views || 0} views</span>
                          <span className="date">
                            📅 {new Date(recipe.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="view-button">
                          View Recipe →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>© 2024 Recipe Collection. Made with ❤️ for food lovers.</p>
          <p><small>Powered by Supabase & Next.js</small></p>
        </footer>
      </div>
    </>
  )
}
