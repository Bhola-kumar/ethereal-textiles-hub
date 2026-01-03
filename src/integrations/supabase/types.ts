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
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          pincode: string
          state: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          pincode: string
          state: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          pincode?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      featured_collections: {
        Row: {
          badge_text: string | null
          created_at: string
          created_by: string
          description: string | null
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_text: string
          link_url: string
          start_date: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string
          link_url?: string
          start_date?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string
          link_url?: string
          start_date?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_product_requests: {
        Row: {
          admin_notes: string | null
          id: string
          product_id: string
          request_message: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          seller_id: string
          status: string
        }
        Insert: {
          admin_notes?: string | null
          id?: string
          product_id: string
          request_message?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          admin_notes?: string | null
          id?: string
          product_id?: string
          request_message?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_product_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_product_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_products: {
        Row: {
          added_by: string
          created_at: string
          display_order: number | null
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          product_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          added_by: string
          created_at?: string
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          product_id: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          product_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products_with_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          section_key: string
          section_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key: string
          section_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          customer_cancel_reason: string | null
          decline_reason: string | null
          declined_at: string | null
          discount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_cost: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          customer_cancel_reason?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          customer_cancel_reason?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: Json
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          available_colors: string[] | null
          available_sizes: string[] | null
          care_instructions: string[] | null
          category_id: string | null
          color: string | null
          created_at: string
          description: string | null
          fabric: string | null
          gsm: number | null
          id: string
          images: string[] | null
          is_new: boolean | null
          is_published: boolean | null
          is_trending: boolean | null
          length: number | null
          name: string
          original_price: number | null
          pattern: string | null
          price: number
          rating: number | null
          reviews_count: number | null
          seller_id: string | null
          size: string | null
          slug: string
          stock: number
          updated_at: string
          width: number | null
        }
        Insert: {
          available_colors?: string[] | null
          available_sizes?: string[] | null
          care_instructions?: string[] | null
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          fabric?: string | null
          gsm?: number | null
          id?: string
          images?: string[] | null
          is_new?: boolean | null
          is_published?: boolean | null
          is_trending?: boolean | null
          length?: number | null
          name: string
          original_price?: number | null
          pattern?: string | null
          price: number
          rating?: number | null
          reviews_count?: number | null
          seller_id?: string | null
          size?: string | null
          slug: string
          stock?: number
          updated_at?: string
          width?: number | null
        }
        Update: {
          available_colors?: string[] | null
          available_sizes?: string[] | null
          care_instructions?: string[] | null
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          fabric?: string | null
          gsm?: number | null
          id?: string
          images?: string[] | null
          is_new?: boolean | null
          is_published?: boolean | null
          is_trending?: boolean | null
          length?: number | null
          name?: string
          original_price?: number | null
          pattern?: string | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          seller_id?: string | null
          size?: string | null
          slug?: string
          stock?: number
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          order_item_id: string | null
          processed_at: string | null
          reason: string
          refund_amount: number | null
          refund_status: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          order_item_id?: string | null
          processed_at?: string | null
          reason: string
          refund_amount?: number | null
          refund_status?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          order_item_id?: string | null
          processed_at?: string | null
          reason?: string
          refund_amount?: number | null
          refund_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      review_likes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_seller: boolean | null
          review_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_seller?: boolean | null
          review_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_seller?: boolean | null
          review_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          accepts_cod: boolean | null
          address: string | null
          auto_confirm_hours: number | null
          auto_confirm_orders: boolean | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          banner_url: string | null
          charge_convenience: boolean | null
          charge_gst: boolean | null
          city: string | null
          convenience_charge: number | null
          created_at: string
          description: string | null
          email: string | null
          free_shipping_above: number | null
          gst_number: string | null
          gst_percentage: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          payment_instructions: string | null
          payment_qr_url: string | null
          phone: string | null
          pincode: string | null
          seller_id: string
          shipping_charge: number | null
          shop_name: string
          shop_slug: string
          state: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          accepts_cod?: boolean | null
          address?: string | null
          auto_confirm_hours?: number | null
          auto_confirm_orders?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          banner_url?: string | null
          charge_convenience?: boolean | null
          charge_gst?: boolean | null
          city?: string | null
          convenience_charge?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          free_shipping_above?: number | null
          gst_number?: string | null
          gst_percentage?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          payment_instructions?: string | null
          payment_qr_url?: string | null
          phone?: string | null
          pincode?: string | null
          seller_id: string
          shipping_charge?: number | null
          shop_name: string
          shop_slug: string
          state?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          accepts_cod?: boolean | null
          address?: string | null
          auto_confirm_hours?: number | null
          auto_confirm_orders?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          banner_url?: string | null
          charge_convenience?: boolean | null
          charge_gst?: boolean | null
          city?: string | null
          convenience_charge?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          free_shipping_above?: number | null
          gst_number?: string | null
          gst_percentage?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          payment_instructions?: string | null
          payment_qr_url?: string | null
          phone?: string | null
          pincode?: string | null
          seller_id?: string
          shipping_charge?: number | null
          shop_name?: string
          shop_slug?: string
          state?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_ai_response: boolean | null
          is_from_support: boolean | null
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_ai_response?: boolean | null
          is_from_support?: boolean | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_ai_response?: boolean | null
          is_from_support?: boolean | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          priority: string
          product_id: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          priority?: string
          product_id?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          priority?: string
          product_id?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_shop"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      products_with_shop: {
        Row: {
          available_colors: string[] | null
          available_sizes: string[] | null
          care_instructions: string[] | null
          category_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          fabric: string | null
          gsm: number | null
          id: string | null
          images: string[] | null
          is_new: boolean | null
          is_published: boolean | null
          is_trending: boolean | null
          length: number | null
          name: string | null
          original_price: number | null
          pattern: string | null
          price: number | null
          rating: number | null
          reviews_count: number | null
          seller_id: string | null
          shop_city: string | null
          shop_id: string | null
          shop_is_verified: boolean | null
          shop_logo_url: string | null
          shop_name: string | null
          shop_slug: string | null
          shop_state: string | null
          size: string | null
          slug: string | null
          stock: number | null
          updated_at: string | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shops_payment_public: {
        Row: {
          accepts_cod: boolean | null
          charge_convenience: boolean | null
          charge_gst: boolean | null
          convenience_charge: number | null
          free_shipping_above: number | null
          gst_percentage: number | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          payment_instructions: string | null
          payment_qr_url: string | null
          seller_id: string | null
          shipping_charge: number | null
          shop_name: string | null
          shop_slug: string | null
          upi_id: string | null
        }
        Insert: {
          accepts_cod?: boolean | null
          charge_convenience?: boolean | null
          charge_gst?: boolean | null
          convenience_charge?: number | null
          free_shipping_above?: number | null
          gst_percentage?: number | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          payment_instructions?: string | null
          payment_qr_url?: string | null
          seller_id?: string | null
          shipping_charge?: number | null
          shop_name?: string | null
          shop_slug?: string | null
          upi_id?: string | null
        }
        Update: {
          accepts_cod?: boolean | null
          charge_convenience?: boolean | null
          charge_gst?: boolean | null
          convenience_charge?: number | null
          free_shipping_above?: number | null
          gst_percentage?: number | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          payment_instructions?: string | null
          payment_qr_url?: string | null
          seller_id?: string | null
          shipping_charge?: number | null
          shop_name?: string | null
          shop_slug?: string | null
          upi_id?: string | null
        }
        Relationships: []
      }
      shops_public: {
        Row: {
          banner_url: string | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          shop_name: string | null
          shop_slug: string | null
          state: string | null
        }
        Insert: {
          banner_url?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          shop_name?: string | null
          shop_slug?: string | null
          state?: string | null
        }
        Update: {
          banner_url?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          shop_name?: string | null
          shop_slug?: string | null
          state?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_order_total: {
        Args: {
          p_product_ids: string[]
          p_quantities: number[]
          p_seller_ids: string[]
        }
        Returns: Json
      }
      grant_seller_role: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_seller_for_order: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "seller" | "customer"
      order_status:
        | "pending"
        | "confirmed"
        | "packed"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "returned"
      payment_status: "pending" | "paid" | "failed" | "refunded"
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
      app_role: ["admin", "seller", "customer"],
      order_status: [
        "pending",
        "confirmed",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
