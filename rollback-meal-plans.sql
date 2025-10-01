-- Rollback script for meal plans feature
-- Run this in Supabase SQL Editor if you want to remove the meal plans feature

-- Drop the meal_plans table (this will delete all meal plan data)
DROP TABLE IF EXISTS public.meal_plans CASCADE;

-- That's it! This will remove the meal_plans table and all its data, indexes, and policies.
-- Your recipes and categories tables will remain untouched.
