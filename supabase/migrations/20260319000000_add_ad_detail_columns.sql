-- Add multi-image support and full ad detail columns to scraped_ads
ALTER TABLE public.scraped_ads ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
ALTER TABLE public.scraped_ads ADD COLUMN IF NOT EXISTS landing_url text;
ALTER TABLE public.scraped_ads ADD COLUMN IF NOT EXISTS cta_text text;
ALTER TABLE public.scraped_ads ADD COLUMN IF NOT EXISTS full_copy_text text;

-- Backfill: copy existing image_url into image_urls array for existing rows
UPDATE public.scraped_ads
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND (image_urls IS NULL OR image_urls = '{}');
