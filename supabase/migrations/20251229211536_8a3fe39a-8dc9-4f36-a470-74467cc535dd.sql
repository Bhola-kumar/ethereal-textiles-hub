-- Create a function to calculate and validate order totals server-side
CREATE OR REPLACE FUNCTION public.calculate_order_total(
  p_product_ids uuid[],
  p_quantities int[],
  p_seller_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal numeric := 0;
  v_total_shipping numeric := 0;
  v_total_gst numeric := 0;
  v_total_convenience numeric := 0;
  v_total numeric := 0;
  v_item_count int;
  v_product record;
  v_shop record;
  v_seller_subtotals jsonb := '{}';
  v_items jsonb := '[]';
  i int;
BEGIN
  -- Validate arrays have same length
  IF array_length(p_product_ids, 1) != array_length(p_quantities, 1) THEN
    RAISE EXCEPTION 'Product IDs and quantities arrays must have same length';
  END IF;
  
  v_item_count := array_length(p_product_ids, 1);
  
  -- Calculate subtotal by fetching current prices from products table
  FOR i IN 1..v_item_count LOOP
    SELECT id, name, price, seller_id, stock, is_published
    INTO v_product
    FROM products
    WHERE id = p_product_ids[i];
    
    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', p_product_ids[i];
    END IF;
    
    IF NOT v_product.is_published THEN
      RAISE EXCEPTION 'Product not available: %', v_product.name;
    END IF;
    
    IF v_product.stock < p_quantities[i] THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', v_product.name;
    END IF;
    
    -- Add to subtotal
    v_subtotal := v_subtotal + (v_product.price * p_quantities[i]);
    
    -- Track subtotal per seller for charge calculations
    IF v_seller_subtotals ? v_product.seller_id::text THEN
      v_seller_subtotals := jsonb_set(
        v_seller_subtotals,
        ARRAY[v_product.seller_id::text],
        to_jsonb((v_seller_subtotals->>(v_product.seller_id::text))::numeric + (v_product.price * p_quantities[i]))
      );
    ELSE
      v_seller_subtotals := v_seller_subtotals || jsonb_build_object(v_product.seller_id::text, v_product.price * p_quantities[i]);
    END IF;
    
    -- Add item details for verification
    v_items := v_items || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'price', v_product.price,
      'quantity', p_quantities[i],
      'line_total', v_product.price * p_quantities[i]
    );
  END LOOP;
  
  -- Calculate seller charges (shipping, GST, convenience)
  FOR v_shop IN
    SELECT 
      seller_id,
      shipping_charge,
      free_shipping_above,
      charge_gst,
      gst_percentage,
      charge_convenience,
      convenience_charge
    FROM shops
    WHERE seller_id = ANY(
      SELECT DISTINCT (key)::uuid FROM jsonb_each_text(v_seller_subtotals)
    )
  LOOP
    DECLARE
      seller_subtotal numeric;
      shipping numeric := 0;
      gst numeric := 0;
      convenience numeric := 0;
    BEGIN
      seller_subtotal := (v_seller_subtotals->>(v_shop.seller_id::text))::numeric;
      
      -- Calculate shipping (check free shipping threshold)
      IF v_shop.free_shipping_above IS NOT NULL AND seller_subtotal >= v_shop.free_shipping_above THEN
        shipping := 0;
      ELSE
        shipping := COALESCE(v_shop.shipping_charge, 0);
      END IF;
      
      -- Calculate GST if enabled
      IF v_shop.charge_gst = true AND v_shop.gst_percentage > 0 THEN
        gst := seller_subtotal * (v_shop.gst_percentage / 100);
      END IF;
      
      -- Calculate convenience charge if enabled
      IF v_shop.charge_convenience = true THEN
        convenience := COALESCE(v_shop.convenience_charge, 0);
      END IF;
      
      v_total_shipping := v_total_shipping + shipping;
      v_total_gst := v_total_gst + gst;
      v_total_convenience := v_total_convenience + convenience;
    END;
  END LOOP;
  
  v_total := v_subtotal + v_total_shipping + v_total_gst + v_total_convenience;
  
  RETURN jsonb_build_object(
    'subtotal', v_subtotal,
    'shipping', v_total_shipping,
    'gst', v_total_gst,
    'convenience', v_total_convenience,
    'total', v_total,
    'items', v_items,
    'validated', true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_order_total(uuid[], int[], uuid[]) TO authenticated;