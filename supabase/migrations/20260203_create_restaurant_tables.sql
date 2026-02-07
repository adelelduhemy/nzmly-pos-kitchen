-- Create restaurant_tables table for managing table inventory
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number VARCHAR(10) NOT NULL,
  section VARCHAR(20) NOT NULL CHECK (section IN ('indoor', 'outdoor')),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(table_number)
);

-- Create index for faster queries
CREATE INDEX idx_restaurant_tables_status ON restaurant_tables(status) WHERE is_active = true;
CREATE INDEX idx_restaurant_tables_section ON restaurant_tables(section) WHERE is_active = true;

-- Enable RLS
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tables are viewable by authenticated users"
  ON restaurant_tables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tables can be updated by authenticated users"
  ON restaurant_tables FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tables can be inserted by owners and managers"
  ON restaurant_tables FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Tables can be deleted by owners and managers"
  ON restaurant_tables FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER set_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
