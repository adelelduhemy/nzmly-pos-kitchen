-- Create database function for atomic stock adjustment
-- This prevents race conditions by doing read-update-record in a single transaction

CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_item_id UUID,
  p_quantity DECIMAL,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_stock DECIMAL;
  v_new_stock DECIMAL;
  v_transaction_type transaction_type;
BEGIN
  -- Lock the row and get current stock
  SELECT current_stock INTO v_previous_stock
  FROM inventory_items
  WHERE id = p_item_id
  FOR UPDATE;

  -- Calculate new stock
  v_new_stock := v_previous_stock + p_quantity;

  -- Prevent negative stock
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', v_previous_stock, -p_quantity;
  END IF;

  -- Update stock
  UPDATE inventory_items
  SET current_stock = v_new_stock
  WHERE id = p_item_id;

  -- Determine transaction type
  IF p_quantity > 0 THEN
    v_transaction_type := 'in';
  ELSE
    v_transaction_type := 'out';
  END IF;

  -- Record transaction
  INSERT INTO inventory_transactions (
    inventory_item_id,
    type,
    quantity,
    notes,
    created_by
  ) VALUES (
    p_item_id,
    v_transaction_type,
    ABS(p_quantity),
    p_reason,
    auth.uid()
  );

  -- Return result
  RETURN json_build_object(
    'previous_stock', v_previous_stock,
    'new_stock', v_new_stock,
    'quantity_changed', p_quantity
  );
END;
$$;
