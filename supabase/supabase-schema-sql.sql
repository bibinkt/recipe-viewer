-- Recipe Viewer Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Create the recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id BIGSERIAL PRIMARY KEY,
  recipe_id VARCHAR(100) UNIQUE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  recipe_data JSONB,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_id ON recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_views ON recipes(views DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Enable read access for all users" ON recipes
    FOR SELECT USING (true);

-- Optional: Create policy for authenticated users to insert recipes
-- Uncomment if you want to allow authenticated users to add recipes
-- CREATE POLICY "Enable insert for authenticated users only" ON recipes
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to increment view count safely
CREATE OR REPLACE FUNCTION increment_views(recipe_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE recipes 
  SET views = COALESCE(views, 0) + 1,
      updated_at = NOW()
  WHERE recipes.recipe_id = increment_views.recipe_id;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a view for public recipe data (excluding sensitive info)
CREATE OR REPLACE VIEW public_recipes AS
SELECT 
  recipe_id,
  title,
  html_content,
  views,
  created_at
FROM recipes
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON public_recipes TO anon;
GRANT SELECT ON public_recipes TO authenticated;

-- Sample data (optional - remove if not needed)
-- INSERT INTO recipes (recipe_id, file_name, title, html_content, recipe_data) VALUES
-- (
--   'recipe_sample_123',
--   'sample_recipe',
--   'Sample Delicious Recipe',
--   '<h1>Sample Recipe</h1><p>This is a sample recipe for testing.</p>',
--   '{"cuisine": "Sample", "servings": 4, "time": 30}'
-- );

-- Show table structure
\d recipes;

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'recipes';