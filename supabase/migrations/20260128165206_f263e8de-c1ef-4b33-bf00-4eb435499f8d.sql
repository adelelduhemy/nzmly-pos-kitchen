-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  notes TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty_transactions table for tracking points
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_coupons for personalized coupons
CREATE TABLE public.customer_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (customer_id, coupon_id)
);

-- Create sms_campaigns table
CREATE TABLE public.sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'loyal', 'inactive', 'new', 'custom')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add customer_id to orders table
ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Cashiers can insert customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Cashiers can update customers" ON public.customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owners and managers can delete customers" ON public.customers FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Loyalty transactions policies
CREATE POLICY "Authenticated users can view loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (true);
CREATE POLICY "Cashiers can insert loyalty transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners and managers can delete loyalty transactions" ON public.loyalty_transactions FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Coupons policies
CREATE POLICY "Authenticated users can view coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Owners and managers can insert coupons" ON public.coupons FOR INSERT WITH CHECK (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can update coupons" ON public.coupons FOR UPDATE USING (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can delete coupons" ON public.coupons FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Customer coupons policies
CREATE POLICY "Authenticated users can view customer coupons" ON public.customer_coupons FOR SELECT USING (true);
CREATE POLICY "Cashiers can insert customer coupons" ON public.customer_coupons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Cashiers can update customer coupons" ON public.customer_coupons FOR UPDATE USING (auth.uid() IS NOT NULL);

-- SMS campaigns policies
CREATE POLICY "Owners and managers can view sms campaigns" ON public.sms_campaigns FOR SELECT USING (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can insert sms campaigns" ON public.sms_campaigns FOR INSERT WITH CHECK (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can update sms campaigns" ON public.sms_campaigns FOR UPDATE USING (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can delete sms campaigns" ON public.sms_campaigns FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Create function to update customer stats after order
CREATE OR REPLACE FUNCTION public.update_customer_stats_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE public.customers
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      loyalty_points = loyalty_points + FLOOR(NEW.total / 10), -- 1 point per 10 SAR
      updated_at = now()
    WHERE id = NEW.customer_id;
    
    -- Record loyalty transaction
    INSERT INTO public.loyalty_transactions (customer_id, order_id, points, type, description)
    VALUES (NEW.customer_id, NEW.id, FLOOR(NEW.total / 10), 'earn', 'نقاط مكتسبة من طلب #' || NEW.order_number);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for customer stats
CREATE TRIGGER update_customer_stats_trigger
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_stats_on_order();

-- Update timestamps triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sms_campaigns_updated_at BEFORE UPDATE ON public.sms_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();