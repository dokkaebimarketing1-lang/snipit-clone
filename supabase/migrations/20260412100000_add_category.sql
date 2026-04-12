-- Add category column to saved_ads
ALTER TABLE public.saved_ads
  ADD COLUMN IF NOT EXISTS category text;
