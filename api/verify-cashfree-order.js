// Cashfree Order Verification API Serverless Handler (Deduplicated & DB Constraint-Safe)
const https = require('https');
const webpush = require('web-push');

const recentPushes = global.__recentPushes || (global.__recentPushes = new Map());

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { order_id, is_explicit_cancel } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENV || "PRODUCTION";
    const host = env === "PRODUCTION" ? "api.cashfree.com" : "sandbox.cashfree.com";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vemlqojqluimqegryxug.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWxxb2pxbHVpbXFlZ3J5eHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk3Nzc3OSwiZXhwIjoyMTAxNTUzNzc5fQ.v-XqgNQuoir-nvrvEoIndsqu_G9WOEFJV";

    // Helper: Push notification to Admin PWA with strict deduplication
    async function notifyAdminOnce(eventType, title, body, orderId, amount) {
      const pushKey = `${orderId}_${eventType}`;
      const now = Date.now();

      if (recentPushes.has(pushKey) && (now - recentPushes.get(pushKey) < 300000)) {
        console.log(`[Push Deduplicated] Push for ${pushKey} skipped.`);
        return;
      }
      recentPushes.set(pushKey, now);

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

    // Helper: Update Supabase order (Safe values: 'PAID' or 'FAILED', 'PLACED' or 'CANCELLED')
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
            payment_status: paymentStatus, // 'PAID' or 'FAILED'
            order_status: orderStatus,     // 'PLACED' or 'CANCELLED'
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

    // Fetch existing order info from DB
    let currentDbOrder = null;
    try {
      const fetchDb = await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${order_id}&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const rows = await fetchDb.json();
      if (rows && rows.length > 0) currentDbOrder = rows[0];
    } catch(e) {}

    const customerName = currentDbOrder?.customer_name || 'Customer';
    const customerPhone = currentDbOrder?.customer_phone || '';
    const orderAmount = currentDbOrder?.total_amount || 0;

    // If order in DB is already PAID, return success immediately
    if (currentDbOrder && currentDbOrder.payment_status === 'PAID') {
      return res.status(200).json({
        success: true,
        payment_status: 'PAID',
        order_status: 'PLACED',
        order: currentDbOrder
      });
    }

    // If explicitly cancelled from frontend
    if (is_explicit_cancel) {
      const updatedOrder = await updateOrderInDb('FAILED', 'CANCELLED');
      await notifyAdminOnce(
        'PAYMENT_CANCELLED',
        '⚠️ PAYMENT CANCELLED / NOT DONE',
        `Order #${order_id} (₹${orderAmount}) attempt by ${customerName} (${customerPhone}) was cancelled / unpaid.`,
        order_id,
        orderAmount
      );
      return res.status(200).json({
        success: false,
        payment_status: 'FAILED',
        order_status: 'CANCELLED',
        order: updatedOrder || currentDbOrder,
        message: 'Payment cancelled by user.'
      });
    }

    // If Cashfree credentials missing, return database state
    if (!appId || !secretKey) {
      const isPaid = currentDbOrder?.payment_status === 'PAID';
      return res.status(200).json({
        success: isPaid,
        payment_status: currentDbOrder ? currentDbOrder.payment_status : 'PENDING',
        order: currentDbOrder
      });
    }

    // Helper: Make HTTPS GET request to Cashfree
    function cashfreeGet(path) {
      return new Promise((resolve) => {
        const reqOpts = {
          hostname: host,
          port: 443,
          path: path,
          method: 'GET',
          headers: {
            'x-api-version': '2023-08-01',
            'x-client-id': appId,
            'x-client-secret': secretKey
          }
        };
        const r = https.request(reqOpts, (resp) => {
          let data = '';
          resp.on('data', chunk => { data += chunk; });
          resp.on('end', () => {
            try {
              resolve({ statusCode: resp.statusCode, data: JSON.parse(data) });
            } catch(err) {
              resolve({ statusCode: resp.statusCode, raw: data });
            }
          });
        });
        r.on('error', (err) => resolve({ error: err }));
        r.end();
      });
    }

    // Check order and payments on Cashfree
    const orderRes = await cashfreeGet(`/pg/orders/${encodeURIComponent(order_id)}`);
    const cfData = orderRes.data || {};
    const cfStatus = (cfData.order_status || '').toUpperCase();

    let hasSuccessfulPayment = (cfStatus === 'PAID');

    if (!hasSuccessfulPayment) {
      // Check payment attempts
      const payRes = await cashfreeGet(`/pg/orders/${encodeURIComponent(order_id)}/payments`);
      const payments = (payRes.data && Array.isArray(payRes.data)) ? payRes.data : [];
      hasSuccessfulPayment = payments.some(p => (p.payment_status || '').toUpperCase() === 'SUCCESS');
    }

    if (hasSuccessfulPayment) {
      const updatedOrder = await updateOrderInDb('PAID', 'PLACED');
      await notifyAdminOnce(
        'PAYMENT_SUCCESS',
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
      const updatedOrder = await updateOrderInDb('FAILED', 'CANCELLED');
      await notifyAdminOnce(
        'PAYMENT_CANCELLED',
        '⚠️ PAYMENT CANCELLED / NOT DONE',
        `Order #${order_id} (₹${orderAmount}) attempt by ${customerName} (${customerPhone}) was cancelled / unpaid.`,
        order_id,
        orderAmount
      );
      return res.status(200).json({
        success: false,
        payment_status: 'FAILED',
        order_status: 'CANCELLED',
        order: updatedOrder || currentDbOrder,
        cashfree: cfData,
        message: 'Payment was not completed or was cancelled.'
      });
    }

  } catch (error) {
    console.error('Verify Cashfree API handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};
