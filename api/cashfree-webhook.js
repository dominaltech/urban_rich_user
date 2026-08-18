// Cashfree Webhook Handler
const webpush = require('web-push');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('Cashfree Webhook Payload Received:', JSON.stringify(payload));

    const eventType = payload.type || (payload.data && payload.data.payment ? 'PAYMENT_SUCCESS_WEBHOOK' : null);
    const orderData = payload.data ? payload.data.order : null;
    const paymentData = payload.data ? payload.data.payment : null;

    if (orderData && orderData.order_id) {
      const orderId = orderData.order_id;
      const amount = orderData.order_amount || (paymentData ? paymentData.payment_amount : 0);
      const isSuccess = payload.type === 'PAYMENT_SUCCESS_WEBHOOK' || (paymentData && paymentData.payment_status === 'SUCCESS');

      if (isSuccess) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vemlqojqluimqegryxug.supabase.co";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWxxb2pxbHVpbXFlZ3J5eHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk3Nzc3OSwiZXhwIjoyMTAxNTUzNzc5fQ.v-XqgNQuoir-nvrvEoIndsqu_G9WOEFJV";

        // 1. Update Supabase order status to PAID
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
            updated_at: new Date().toISOString()
          })
        }).catch(err => console.error('Webhook order update error:', err));

        // 2. Dispatch Push Notification to Admin PWA
        try {
          const vapidSubject = process.env.VAPID_SUBJECT || "mailto:urbanrich.bijapur@gmail.com";
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

    return res.status(200).json({ status: 'OK', received: true });
  } catch (error) {
    console.error('Cashfree webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};
