export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
          name_ar: string
          name_en: string
          start_date: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          name_ar: string
          name_en: string
          start_date?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          name_ar?: string
          name_en?: string
          start_date?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      customer_coupons: {
        Row: {
          coupon_id: string
          created_at: string
          customer_id: string
          id: string
          is_used: boolean
          used_at: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          customer_id: string
          id?: string
          is_used?: boolean
          used_at?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_used?: boolean
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          loyalty_points: number
          name: string
          notes: string | null
          phone: string
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          loyalty_points?: number
          name: string
          notes?: string | null
          phone: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          loyalty_points?: number
          name?: string
          notes?: string | null
          phone?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      dish_ingredients: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          inventory_item_id: string
          quantity_consumed: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          inventory_item_id: string
          quantity_consumed?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          inventory_item_id?: string
          quantity_consumed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          cost_per_unit: number
          created_at: string
          current_stock: number
          id: string
          is_active: boolean
          minimum_stock: number
          name_ar: string
          name_en: string
          sku: string | null
          unit: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          minimum_stock?: number
          name_ar: string
          name_en: string
          sku?: string | null
          unit?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          minimum_stock?: number
          name_ar?: string
          name_en?: string
          sku?: string | null
          unit?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          notes: string | null
          quantity: number
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          notes?: string | null
          quantity: number
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          notes?: string | null
          quantity?: number
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name_ar: string
          name_en: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar: string
          name_en: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          dish_id: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean | null
          name_ar: string
          name_en: string
          price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          dish_id?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean | null
          name_ar: string
          name_en: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          dish_id?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean | null
          name_ar?: string
          name_en?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          dish_id: string | null
          dish_name: string
          id: string
          notes: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          dish_id?: string | null
          dish_name: string
          id?: string
          notes?: string | null
          order_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          dish_id?: string | null
          dish_name?: string
          id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cashier_id: string | null
          coupon_id: string | null
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          idempotency_key: string | null
          location_id: string | null
          version: number | null
          notes: string | null
          order_number: string
          order_type: string
          payment_method: string | null
          shift_id: string | null
          status: string
          stock_returned_at: string | null
          subtotal: number
          table_id: string | null
          table_number: string | null
          total: number
          updated_at: string
          vat: number
        }
        Insert: {
          cashier_id?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number: string
          order_type?: string
          payment_method?: string | null
          shift_id?: string | null
          status?: string
          stock_returned_at?: string | null
          subtotal?: number
          table_id?: string | null
          table_number?: string | null
          total?: number
          updated_at?: string
          vat?: number
        }
        Update: {
          cashier_id?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number?: string
          order_type?: string
          payment_method?: string | null
          shift_id?: string | null
          status?: string
          stock_returned_at?: string | null
          subtotal?: number
          table_id?: string | null
          table_number?: string | null
          total?: number
          updated_at?: string
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_number: string
          received_at: string | null
          status: string
          subtotal: number
          supplier_id: string
          total: number
          updated_at: string
          vat: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          received_at?: string | null
          status?: string
          subtotal?: number
          supplier_id: string
          total?: number
          updated_at?: string
          vat?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          received_at?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          total?: number
          updated_at?: string
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      },
      recipes: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          menu_item_id: string
          quantity: number
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          menu_item_id: string
          quantity: number
          unit: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          menu_item_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          }
        ]
      },
      restaurant_tables: {
        Row: {
          id: string
          table_number: string
          section: string
          capacity: number
          status: string
          current_order_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_number: string
          section: string
          capacity: number
          status?: string
          current_order_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_number?: string
          section?: string
          capacity?: number
          status?: string
          current_order_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_current_order_id_fkey"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      },
      restaurant_settings: {
        Row: {
          address: string | null
          banner_url: string | null
          category_layout: string | null
          created_at: string
          font_family: string | null
          id: string
          instagram: string | null
          is_menu_active: boolean
          logo_url: string | null
          loyalty_points_per_sar: number
          loyalty_redemption_value: number
          menu_slug: string | null
          phone: string | null
          primary_color: string | null
          restaurant_name_ar: string
          restaurant_name_en: string
          secondary_color: string | null
          selected_template_id: string | null
          show_offers: boolean | null
          show_order_button: boolean | null
          show_prices: boolean | null
          show_ratings: boolean | null
          twitter: string | null
          updated_at: string
          welcome_message_ar: string | null
          welcome_message_en: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          category_layout?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          instagram?: string | null
          is_menu_active?: boolean
          logo_url?: string | null
          loyalty_points_per_sar?: number
          loyalty_redemption_value?: number
          menu_slug?: string | null
          phone?: string | null
          primary_color?: string | null
          restaurant_name_ar?: string
          restaurant_name_en?: string
          secondary_color?: string | null
          selected_template_id?: string | null
          show_offers?: boolean | null
          show_order_button?: boolean | null
          show_prices?: boolean | null
          show_ratings?: boolean | null
          twitter?: string | null
          updated_at?: string
          welcome_message_ar?: string | null
          welcome_message_en?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          category_layout?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          instagram?: string | null
          is_menu_active?: boolean
          logo_url?: string | null
          loyalty_points_per_sar?: number
          loyalty_redemption_value?: number
          menu_slug?: string | null
          phone?: string | null
          primary_color?: string | null
          restaurant_name_ar?: string
          restaurant_name_en?: string
          secondary_color?: string | null
          selected_template_id?: string | null
          show_offers?: boolean | null
          show_order_button?: boolean | null
          show_prices?: boolean | null
          show_ratings?: boolean | null
          twitter?: string | null
          updated_at?: string
          welcome_message_ar?: string | null
          welcome_message_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_selected_template_id_fkey"
            columns: ["selected_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          card_sales: number | null
          cash_sales: number | null
          closing_cash: number | null
          created_at: string
          discounts_total: number | null
          ended_at: string | null
          id: string
          notes: string | null
          online_sales: number | null
          opening_cash: number
          shift_date: string
          started_at: string
          status: string
          total_orders: number | null
          total_sales: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_sales?: number | null
          cash_sales?: number | null
          closing_cash?: number | null
          created_at?: string
          discounts_total?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          online_sales?: number | null
          opening_cash?: number
          shift_date?: string
          started_at?: string
          status?: string
          total_orders?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_sales?: number | null
          cash_sales?: number | null
          closing_cash?: number | null
          created_at?: string
          discounts_total?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          online_sales?: number | null
          opening_cash?: number
          shift_date?: string
          started_at?: string
          status?: string
          total_orders?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string
          target_audience: string
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_audience: string
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_audience?: string
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          total_purchases: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          total_purchases?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          total_purchases?: number
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean
          is_default: boolean
          layout_type: string
          name: string
          name_ar: string
          preview_image: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          layout_type?: string
          name: string
          name_ar: string
          preview_image?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          layout_type?: string
          name?: string
          name_ar?: string
          preview_image?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          type: Database["public"]["Enums"]["warehouse_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          type: Database["public"]["Enums"]["warehouse_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          type?: Database["public"]["Enums"]["warehouse_type"]
          updated_at?: string
        }
        Relationships: []
      },
      role_permissions: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          resource: string
          can_view: boolean
          can_edit: boolean
          can_delete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          resource: string
          can_view?: boolean
          can_edit?: boolean
          can_delete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          resource?: string
          can_view?: boolean
          can_edit?: boolean
          can_delete?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_inventory: { Args: { _user_id: string }; Returns: boolean }
      create_order_atomic: {
        Args: {
          p_idempotency_key: string
          p_order_type: string
          p_table_number: string | null
          p_subtotal: number
          p_vat: number
          p_discount: number
          p_total: number
          p_payment_method: string
          p_payment_status: string
          p_notes: string | null
          p_items: Json
          p_customer_id?: string | null
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner_or_manager: { Args: { _user_id: string }; Returns: boolean }
      redeem_loyalty_points: {
        Args: { p_customer_id: string; p_points: number }
        Returns: Json
      }
      update_order_status: {
        Args: {
          p_order_id: string
          p_new_status: string
          p_expected_version: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "cashier" | "kitchen" | "inventory"
      expense_category:
      | "rent"
      | "utilities"
      | "salaries"
      | "supplies"
      | "maintenance"
      | "marketing"
      | "other"
      transaction_type: "in" | "out"
      warehouse_type: "raw_materials" | "work_in_progress" | "finished_goods"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "manager", "cashier", "kitchen", "inventory"],
      expense_category: [
        "rent",
        "utilities",
        "salaries",
        "supplies",
        "maintenance",
        "marketing",
        "other",
      ],
      transaction_type: ["in", "out"],
      warehouse_type: ["raw_materials", "work_in_progress", "finished_goods"],
    },
  },
} as const
