import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://uyvkcyupnofxlcmurdjl.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dmtjeXVwbm9meGxjbXVyZGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzU4NjgsImV4cCI6MjA3MDYxMTg2OH0.cb4EWvhx7jTI6U5psy-YMtdcpOr5jZSiataAcJbTR54"

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to fetch a recipe by ID from recipes_staging
export const fetchRecipe = async (recipeId) => {
  const { data, error } = await supabase
    .from('recipes_staging')
    .select('*')
    .eq('id', recipeId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch recipe: ${error.message}`)
  }

  if (!data || !data.recipe) {
    throw new Error('Recipe data not found')
  }

  return data
}

// Helper function to increment view count (adds meta.views)
export const incrementViews = async (recipeId) => {
  try {
    // First get current meta data
    const { data: currentData, error: fetchError } = await supabase
      .from('recipes_staging')
      .select('meta')
      .eq('id', recipeId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch current meta:', fetchError)
      return
    }

    // Update meta with incremented views
    const currentMeta = currentData?.meta || {}
    const newViews = (currentMeta.views || 0) + 1
    const updatedMeta = {
      ...currentMeta,
      views: newViews,
      last_viewed: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('recipes_staging')
      .update({ 
        meta: updatedMeta,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId)

    if (updateError) {
      console.error('Failed to increment views:', updateError)
    }
  } catch (error) {
    console.error('Error incrementing views:', error)
  }
}

// Helper function to fetch recent recipes
export const fetchRecentRecipes = async (limit = 10) => {
  const { data, error } = await supabase
    .from('recipes_staging')
    .select('id, slug, recipe, meta, created_at')
    .eq('status', 'published') // Only show published recipes
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch recent recipes:', error)
    return []
  }

  // Transform data to extract title from recipe JSON
  return (data || []).map(item => ({
    id: item.id,
    slug: item.slug,
    title: item.recipe?.title || 'Untitled Recipe',
    cuisine: item.recipe?.cuisine || 'Unknown',
    created_at: item.created_at,
    views: item.meta?.views || 0,
    total_time: item.recipe?.total_time_minutes || 0,
    servings: item.recipe?.servings || 0,
    difficulty: item.recipe?.difficulty || 'unknown'
  }))
}

// Helper function to generate HTML from recipe JSON
export const generateRecipeHTML = (recipeData) => {
  const recipe = recipeData.recipe
  
  if (!recipe) {
    throw new Error('Invalid recipe data')
  }

  return `
<!DOCTYPE html>
<html lang="${recipe.locale || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${recipe.title} - Recipe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .recipe-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .recipe-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .recipe-title {
            font-size: 2.5rem;
            margin: 0 0 10px 0;
            font-weight: 700;
        }
        
        .recipe-meta {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .recipe-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .section {
            padding: 30px 40px;
        }
        
        .section-title {
            font-size: 1.8rem;
            color: #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
            display: inline-block;
        }
        
        .ingredients-list {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        
        .ingredient {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .ingredient:last-child {
            border-bottom: none;
        }
        
        .ingredient-name {
            font-weight: 500;
            flex: 1;
        }
        
        .ingredient-amount {
            font-weight: bold;
            color: #667eea;
            margin-left: 15px;
        }
        
        .ingredient-notes {
            font-size: 0.85rem;
            color: #666;
            margin-top: 4px;
            font-style: italic;
        }
        
        .steps-container {
            counter-reset: step-counter;
        }
        
        .step {
            counter-increment: step-counter;
            margin: 25px 0;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 15px;
            position: relative;
            margin-left: 40px;
        }
        
        .step::before {
            content: counter(step-counter);
            position: absolute;
            left: -40px;
            top: 25px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }
        
        .step-title {
            font-weight: 600;
            font-size: 1.2rem;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .step-instruction {
            margin-bottom: 15px;
            line-height: 1.7;
        }
        
        .step-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
            font-size: 0.9rem;
        }
        
        .step-detail {
            background: rgba(102, 126, 234, 0.1);
            padding: 8px 12px;
            border-radius: 20px;
            text-align: center;
        }
        
        .nutrition-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .nutrition-item {
            text-align: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        
        .nutrition-value {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .nutrition-label {
            font-size: 0.9rem;
            opacity: 0.9;
            text-transform: uppercase;
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        
        .tag {
            background: #667eea;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .allergens, .equipment, .safety-notes {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .allergens {
            background: #ffe6e6;
            border-color: #ffcccc;
        }
        
        .safety-notes {
            background: #ffe6e6;
            border-color: #ffcccc;
        }
        
        .warning-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #856404;
        }
        
        .allergens .warning-title {
            color: #d63384;
        }
        
        @media (max-width: 768px) {
            body { padding: 10px; }
            .recipe-header { padding: 30px 20px; }
            .recipe-title { font-size: 2rem; }
            .section { padding: 20px; }
            .step { margin-left: 20px; padding: 20px; }
            .step::before { left: -20px; width: 35px; height: 35px; font-size: 1rem; }
            .recipe-stats { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media print {
            body { background: white; }
            .recipe-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="recipe-container">
        <div class="recipe-header">
            <h1 class="recipe-title">${recipe.title}</h1>
        </div>

        <div class="recipe-stats">
            <div class="stat-item">
                <div class="stat-value">⏱️ ${recipe.total_time_minutes || 0}</div>
                <div class="stat-label">Minutes</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">👥 ${recipe.servings || 0}</div>
                <div class="stat-label">Servings</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">🌶️ ${recipe.spice_level || 0}/10</div>
                <div class="stat-label">Spice Level</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">👨‍🍳 ${recipe.difficulty || 'Unknown'}</div>
                <div class="stat-label">Difficulty</div>
            </div>
        </div>

        ${recipe.nutrition ? `
        <div class="section">
            <h2 class="section-title">🍽️ Nutrition (per serving)</h2>
            <div class="nutrition-grid">
                <div class="nutrition-item">
                    <div class="nutrition-value">${recipe.nutrition.per_serving_kcal || 0}</div>
                    <div class="nutrition-label">Calories</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${recipe.nutrition.macros_g?.carbs || 0}g</div>
                    <div class="nutrition-label">Carbs</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${recipe.nutrition.macros_g?.protein || 0}g</div>
                    <div class="nutrition-label">Protein</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${recipe.nutrition.macros_g?.fat || 0}g</div>
                    <div class="nutrition-label">Fat</div>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2 class="section-title">🛒 Ingredients</h2>
            <div class="ingredients-list">
                ${recipe.ingredients?.map(ingredient => {
                    const prep = ingredient.prep ? `${ingredient.prep} ` : '';
                    const notes = ingredient.notes ? `<div class="ingredient-notes">${ingredient.notes}</div>` : '';
                    const usUnits = ingredient.alt_us_units ? ` (${ingredient.alt_us_units})` : '';
                    return `
                        <div class="ingredient">
                            <div class="ingredient-name">
                                ${prep}${ingredient.name}
                                ${notes}
                            </div>
                            <div class="ingredient-amount">${ingredient.quantity} ${ingredient.unit}${usUnits}</div>
                        </div>
                    `;
                }).join('') || '<p>No ingredients listed</p>'}
            </div>
        </div>

        ${recipe.equipment && recipe.equipment.length > 0 ? `
        <div class="section">
            <div class="equipment">
                <div class="warning-title">🔧 Equipment Needed</div>
                ${recipe.equipment.map(item => `
                    <div>• ${item.quantity || 1}x ${item.name} ${item.notes ? `(${item.notes})` : ''}</div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${recipe.safety_notes && recipe.safety_notes.length > 0 ? `
        <div class="section">
            <div class="safety-notes">
                <div class="warning-title">⚠️ Safety Notes</div>
                ${recipe.safety_notes.map(note => `<div>• ${note}</div>`).join('')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2 class="section-title">👨‍🍳 Instructions</h2>
            <div class="steps-container">
                ${recipe.steps?.map(step => {
                    const timing = step.timer_seconds > 0 ? `${Math.round(step.timer_seconds / 60)} min` : '';
                    const heat = step.heat !== 'off' ? step.heat : '';
                    const temp = step.target_temp_c > 0 ? `${step.target_temp_c}°C` : '';
                    
                    return `
                        <div class="step">
                            <div class="step-title">${step.title}</div>
                            <div class="step-instruction">${step.instruction}</div>
                            <div class="step-details">
                                ${timing ? `<div class="step-detail">⏱️ ${timing}</div>` : ''}
                                ${heat ? `<div class="step-detail">🔥 ${heat}</div>` : ''}
                                ${temp ? `<div class="step-detail">🌡️ ${temp}</div>` : ''}
                                ${step.visual_doneness ? `<div class="step-detail">👀 ${step.visual_doneness}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('') || '<p>No instructions available</p>'}
            </div>
        </div>

        ${recipe.allergens && recipe.allergens.length > 0 ? `
        <div class="section">
            <div class="allergens">
                <div class="warning-title">🚨 Contains Allergens</div>
                <p><strong>${recipe.allergens.map(allergen => allergen.toUpperCase()).join(', ')}</strong></p>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <div style="text-align: center; color: #666; padding: 20px;">
                <p>✨ Enjoy your homemade ${recipe.title}! 🍽️</p>
                <p><small>Generated on ${new Date().toLocaleDateString()}</small></p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}
