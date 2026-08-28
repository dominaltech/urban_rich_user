// Cashfree Webhook Handler (with strict deduplication and schema constraint safety)
const webpush = require('web-push');

const recentPushes = global.__recentPushes || (global.__recentPushes = new Map());

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('Cashfree Webhook Payload Received:', JSON.stringify(payload));

    const orderData = payload.data ? payload.data.order : null;
    const paymentData = payload.data ? payload.data.payment : null;

    if (orderData && orderData.order_id) {
      const orderId = orderData.order_id;
      const amount = orderData.order_amount || (paymentData ? paymentData.payment_amount : 0);
      const isSuccess = payload.type === 'PAYMENT_SUCCESS_WEBHOOK' || (paymentData && paymentData.payment_status === 'SUCCESS');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vemlqojqluimqegryxug.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWxxb2pxbHVpbXFlZ3J5eHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk3Nzc3OSwiZXhwIjoyMTAxNTUzNzc5fQ.v-XqgNQuoir-nvrvEoIndsqu_G9WOEFJV";

      // 1. Check current order status in DB to prevent redundant duplicate push
      let currentOrder = null;
      try {
        const fetchDb = await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${orderId}&select=*`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const rows = await fetchDb.json();
        if (rows && rows.length > 0) currentOrder = rows[0];
      } catch (e) {}

      if (isSuccess) {
        // 2. Update Supabase order status to PAID / PLACED (matches DB CHECK constraint)
        await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${orderId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            payment_status: 'PAID',
            order_status: 'PLACED',
            updated_at: new Date().toISOString()
          })
        }).catch(err => console.error('Webhook order update error:', err));

        // 3. Dispatch Push Notification only if not already notified
        const pushKey = `${orderId}_PAYMENT_SUCCESS`;
        const now = Date.now();
        const alreadyNotified = (currentOrder && currentOrder.payment_status === 'PAID') || (recentPushes.has(pushKey) && (now - recentPushes.get(pushKey) < 300000));

        if (!alreadyNotified) {
          recentPushes.set(pushKey, now);
          try {
            const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@urbanrichshop.com";
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BLAiHhe09D65RzlO2uYBZlskrAI7M3Xg4Bu5vHN4jLjlP6Ss5aEvViiTwOPgWLQqbAn27_ATJtaOmlreHSjdFTc";
            const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "LjCWxk2jZ7GDuOeKB7c98keCK2HmyROBzK8h99uQz84";
            webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

            const pushPayload = JSON.stringify({
              title: '💰 PAYMENT SUCCESSFUL - NEW ORDER!',
              body: `Order #${orderId} payment verified for ₹${amount} (Cashfree Paid)`,
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
          } catch(pushErr) {
            console.error('Webhook push dispatch error:', pushErr);
          }
        }
      }
    }

    return res.status(200).json({ status: 'OK', received: true });
  } catch (error) {
    console.error('Cashfree webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};
