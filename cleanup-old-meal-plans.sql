-- One-time cleanup script for existing old meal plans
-- Run this in Supabase SQL Editor to clean up any existing old meal plans
-- After this, the app will automatically keep only current + future weeks

-- Delete all meal plans older than the current week (Monday)
DELETE FROM public.meal_plans
WHERE week_start_date < DATE_TRUNC('week', CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 day' * EXTRACT(DOW FROM CURRENT_DATE)::int);

-- This query:
-- 1. Gets the current week's Monday
-- 2. Deletes all meal plans with week_start_date before that Monday
-- 3. Keeps current week and future weeks intact

-- You only need to run this once (optional)
-- The app now automatically cleans up old meal plans on every page load
