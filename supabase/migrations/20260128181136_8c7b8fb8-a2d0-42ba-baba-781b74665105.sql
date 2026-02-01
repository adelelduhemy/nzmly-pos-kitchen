-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true);

-- Allow anyone to view menu images (public bucket)
CREATE POLICY "Anyone can view menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Allow authenticated owners/managers to upload menu images
CREATE POLICY "Owners and managers can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' 
  AND is_owner_or_manager(auth.uid())
);

-- Allow authenticated owners/managers to update menu images
CREATE POLICY "Owners and managers can update menu images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images' 
  AND is_owner_or_manager(auth.uid())
);

-- Allow authenticated owners/managers to delete menu images
CREATE POLICY "Owners and managers can delete menu images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images' 
  AND is_owner_or_manager(auth.uid())
);