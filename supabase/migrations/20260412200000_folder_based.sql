-- saved_ads에 folder_id 추가 (board_id 대신 폴더에 직접 연결)
ALTER TABLE public.saved_ads
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saved_ads_folder_id ON public.saved_ads (folder_id);
