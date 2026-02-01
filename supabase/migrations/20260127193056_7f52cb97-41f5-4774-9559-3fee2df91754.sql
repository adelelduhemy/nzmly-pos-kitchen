-- Create dishes table for meals/recipes
CREATE TABLE public.dishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dish_ingredients junction table to link dishes with raw materials
CREATE TABLE public.dish_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_consumed NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dish_id, inventory_item_id)
);

-- Enable RLS
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dishes
CREATE POLICY "Authenticated users can view dishes"
  ON public.dishes FOR SELECT
  USING (true);

CREATE POLICY "Owners and managers can insert dishes"
  ON public.dishes FOR INSERT
  WITH CHECK (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can update dishes"
  ON public.dishes FOR UPDATE
  USING (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can delete dishes"
  ON public.dishes FOR DELETE
  USING (is_owner_or_manager(auth.uid()));

-- RLS Policies for dish_ingredients
CREATE POLICY "Authenticated users can view dish ingredients"
  ON public.dish_ingredients FOR SELECT
  USING (true);

CREATE POLICY "Owners and managers can insert dish ingredients"
  ON public.dish_ingredients FOR INSERT
  WITH CHECK (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can update dish ingredients"
  ON public.dish_ingredients FOR UPDATE
  USING (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can delete dish ingredients"
  ON public.dish_ingredients FOR DELETE
  USING (is_owner_or_manager(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_dishes_updated_at
  BEFORE UPDATE ON public.dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dish_ingredients_updated_at
  BEFORE UPDATE ON public.dish_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();