require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsertOrder() {
  try {
    // 1. Get a user
    const { data: users, error: uError } = await supabase.from('profiles').select('id').limit(1);
    if (uError || !users || users.length === 0) {
      console.error('Error fetching test user:', uError);
      return;
    }
    const testUserId = users[0].id;
    console.log('Using test user ID:', testUserId);

    // 2. Get a product
    const { data: products, error: pError } = await supabase.from('products').select('id, name, price').limit(1);
    if (pError || !products || products.length === 0) {
      console.error('Error fetching test product:', pError);
      return;
    }
    const product = products[0];
    console.log('Using test product:', product);

    // 3. Prepare order data exactly matching orderController.js
    const orderItems = [{
      product: product.id,
      name: product.name,
      qty: 1,
      price: product.price
    }];
    const shippingAddress = {
      address: 'Test Street 123',
      city: 'Test City',
      postalCode: '123456',
      country: 'Test Country'
    };

    const orderInsertData = {
      user_id: testUserId,
      order_items: orderItems,
      shipping_address: shippingAddress,
      payment_method: 'Razorpay',
      items_price: Number(product.price),
      shipping_price: Number(0),
      total_price: Number(product.price),
      status: 'pending'
    };

    console.log('Inserting order:', orderInsertData);
    const { data: createdOrder, error: oError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (oError) {
      console.error('Insert order error details:', oError);
    } else {
      console.log('Order successfully inserted:', createdOrder);
      
      // Cleanup: delete the test order
      const { error: dError } = await supabase.from('orders').delete().eq('id', createdOrder.id);
      if (dError) {
        console.error('Cleanup delete error:', dError);
      } else {
        console.log('Cleanup successful.');
      }
    }
  } catch (err) {
    console.error('Fatal script error:', err);
  }
}

testInsertOrder();
