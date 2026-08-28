// Cashfree Order Verification API Serverless Handler
const https = require('https');
const webpush = require('web-push');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENV || "PRODUCTION";
    const host = env === "PRODUCTION" ? "api.cashfree.com" : "sandbox.cashfree.com";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vemlqojqluimqegryxug.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWxxb2pxbHVpbXFlZ3J5eHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk3Nzc3OSwiZXhwIjoyMTAxNTUzNzc5fQ.v-XqgNQuoir-nvrvEoIndsqu_G9WOEFJV";

    // Helper: Push notification to Admin PWA
    async function notifyAdmin(title, body, orderId, amount) {
      try {
        const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@urbanrichshop.com";
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BLAiHhe09D65RzlO2uYBZlskrAI7M3Xg4Bu5vHN4jLjlP6Ss5aEvViiTwOPgWLQqbAn27_ATJtaOmlreHSjdFTc";
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "LjCWxk2jZ7GDuOeKB7c98keCK2HmyROBzK8h99uQz84";
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

        const pushPayload = JSON.stringify({
          title,
          body,
          order_id: orderId,
          icon: '/images/logo.jpg'
        });

        const fetchRes = await fetch(`${supabaseUrl}/rest/v1/admin_push_subscriptions?select=*`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const subscriptions = await fetchRes.json();

        if (subscriptions && Array.isArray(subscriptions)) {
          await Promise.all(subscriptions.map(sub => {
            return webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, pushPayload).catch(() => {});
          }));
        }
      } catch (e) {
        console.error('Admin push dispatch error:', e);
      }
    }

    // Helper: Update Supabase order
    async function updateOrderInDb(paymentStatus, orderStatus) {
      try {
        const dbRes = await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${order_id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            payment_status: paymentStatus,
            order_status: orderStatus,
            updated_at: new Date().toISOString()
          })
        });
        const rows = await dbRes.json();
        return (rows && rows[0]) ? rows[0] : null;
      } catch (e) {
        console.error('Database update error:', e);
        return null;
      }
    }

    // Fetch existing order info from DB first
    let currentDbOrder = null;
    try {
      const fetchDb = await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${order_id}&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const rows = await fetchDb.json();
      if (rows && rows.length > 0) currentDbOrder = rows[0];
    } catch(e) {}

    // If Cashfree credentials not configured, fallback gracefully
    if (!appId || !secretKey) {
      console.warn('Cashfree credentials missing in env, returning current order state');
      return res.status(200).json({
        success: currentDbOrder ? currentDbOrder.payment_status === 'PAID' : false,
        payment_status: currentDbOrder ? currentDbOrder.payment_status : 'PENDING',
        order: currentDbOrder
      });
    }

    // Inquire Cashfree PG API
    const options = {
      hostname: host,
      port: 443,
      path: `/pg/orders/${encodeURIComponent(order_id)}`,
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey
      }
    };

    const cfPromise = new Promise((resolve, reject) => {
      const cfReq = https.request(options, (cfRes) => {
        let data = '';
        cfRes.on('data', chunk => { data += chunk; });
        cfRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: cfRes.statusCode, data: parsed });
          } catch(err) {
            resolve({ statusCode: cfRes.statusCode, raw: data });
          }
        });
      });
      cfReq.on('error', reject);
      cfReq.end();
    });

    const cfResult = await cfPromise;
    const cfData = cfResult.data || {};
    const cfStatus = cfData.order_status; // e.g. "PAID", "ACTIVE", "EXPIRED", "TERMINATED", "FAILED"

    const customerName = currentDbOrder?.customer_name || cfData.customer_details?.customer_name || 'Customer';
    const customerPhone = currentDbOrder?.customer_phone || cfData.customer_details?.customer_phone || '';
    const orderAmount = currentDbOrder?.total_amount || cfData.order_amount || 0;

    if (cfStatus === 'PAID') {
      const updatedOrder = await updateOrderInDb('PAID', 'PLACED');
      await notifyAdmin(
        '💰 PAYMENT SUCCESSFUL - NEW ORDER!',
        `Order #${order_id} for ₹${orderAmount} received from ${customerName} (Online Paid ✓)`,
        order_id,
        orderAmount
      );
      return res.status(200).json({
        success: true,
        payment_status: 'PAID',
        order_status: 'PLACED',
        order: updatedOrder || currentDbOrder,
        cashfree: cfData
      });
    } else {
      // Payment was cancelled / abandoned / not completed
      const updatedOrder = await updateOrderInDb('CANCELLED', 'PAYMENT_CANCELLED');
      await notifyAdmin(
        '⚠️ PAYMENT CANCELLED / NOT DONE',
        `Order #${order_id} (₹${orderAmount}) attempt by ${customerName} (${customerPhone}) was cancelled / unpaid.`,
        order_id,
        orderAmount
      );
      return res.status(200).json({
        success: false,
        payment_status: 'CANCELLED',
        order_status: 'PAYMENT_CANCELLED',
        order: updatedOrder || currentDbOrder,
        cashfree: cfData,
        message: 'Payment was cancelled or not completed.'
      });
    }

  } catch (error) {
    console.error('Verify Cashfree API handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};
