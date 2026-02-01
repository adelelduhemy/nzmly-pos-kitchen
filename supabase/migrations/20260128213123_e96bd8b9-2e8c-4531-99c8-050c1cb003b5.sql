-- Create templates table
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ar text NOT NULL,
  description text,
  description_ar text,
  preview_image text,
  layout_type text NOT NULL DEFAULT 'classic_grid',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view templates
CREATE POLICY "Anyone can view templates" ON public.templates
FOR SELECT USING (true);

-- Only owners can manage templates
CREATE POLICY "Owners can insert templates" ON public.templates
FOR INSERT WITH CHECK (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners can update templates" ON public.templates
FOR UPDATE USING (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners can delete templates" ON public.templates
FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Add new columns to restaurant_settings for full customization
ALTER TABLE public.restaurant_settings
ADD COLUMN IF NOT EXISTS selected_template_id uuid REFERENCES public.templates(id),
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#1e40af',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS category_layout text DEFAULT 'grid',
ADD COLUMN IF NOT EXISTS show_prices boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_offers boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_ratings boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_order_button boolean DEFAULT true;

-- Insert default templates
INSERT INTO public.templates (name, name_ar, description, description_ar, layout_type, is_default) VALUES
('Classic Grid', 'الشبكة الكلاسيكية', 'Clean white background with category grid layout. Perfect for family restaurants.', 'خلفية بيضاء نظيفة مع تخطيط شبكي للأقسام. مثالي للمطاعم العائلية.', 'classic_grid', true),
('Modern Dark', 'العصري الداكن', 'Dark elegant theme with large images and horizontal category scroll. Great for cafes and modern brands.', 'ثيم داكن أنيق مع صور كبيرة وتمرير أفقي للأقسام. رائع للكافيهات والعلامات التجارية العصرية.', 'modern_dark', false),
('Promo Focused', 'التركيز على العروض', 'Large promo banner at top with prominent order button. Ideal for delivery-focused restaurants.', 'بانر عروض كبير في الأعلى مع زر طلب بارز. مثالي للمطاعم التي تعتمد على التوصيل.', 'promo_focused', false),
('Minimal Fast Order', 'الطلب السريع البسيط', 'Simple and minimalist design without large images. Fast loading and quick ordering.', 'تصميم بسيط وminimalist بدون صور كبيرة. سريع التحميل والطلب.', 'minimal_fast', false);