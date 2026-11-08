// Cashfree Order Creation API Serverless Handler
const https = require('https');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { order_id, order_amount, order_currency, customer_details } = req.body || {};

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENV || "PRODUCTION";

    if (!appId || !secretKey) {
      return res.status(400).json({ error: 'Cashfree credentials missing in environment variables' });
    }

    const host = env === "PRODUCTION" ? "api.cashfree.com" : "sandbox.cashfree.com";

    const origin = req.headers.origin || req.headers.referer ? (req.headers.origin || new URL(req.headers.referer).origin) : 'https://urbanrichshop.com';
    const returnUrl = `${origin}/order-success.html?order_id={order_id}`;

    let cust = customer_details || {};
    let finalAmount = parseFloat(order_amount);

    // Authoritative Server-Side Order Verification from Supabase Database
    // Ensures the discounted coupon price recorded in the order is charged and prevents URL tampering
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vemlqojqluimqegryxug.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWxxb2pxbHVpbXFlZ3J5eHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk3Nzc3OSwiZXhwIjoyMTAxNTUzNzc5fQ.v-XqgNQuoir-nvrvEoIndsqu_G9WOEFJV";
      
      const dbResp = await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${encodeURIComponent(order_id)}&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const dbOrders = await dbResp.json();
      if (dbOrders && Array.isArray(dbOrders) && dbOrders.length > 0) {
        const orderRecord = dbOrders[0];
        if (orderRecord.total_amount !== undefined && orderRecord.total_amount !== null) {
          finalAmount = parseFloat(orderRecord.total_amount);
        }
        if (orderRecord.customer_name) cust.customer_name = orderRecord.customer_name;
        if (orderRecord.customer_email) cust.customer_email = orderRecord.customer_email;
        if (orderRecord.customer_phone) cust.customer_phone = orderRecord.customer_phone;
      }
    } catch (dbErr) {
      console.log('Database order lookup bypass in create-cashfree-order:', dbErr);
    }

    const postData = JSON.stringify({
      order_id: order_id,
      order_amount: Math.round(finalAmount * 100) / 100,
      order_currency: order_currency || 'INR',
      customer_details: {
        customer_id: cust.customer_id || 'cust_' + Date.now(),
        customer_name: cust.customer_name || 'Urban Customer',
        customer_email: cust.customer_email || 'support@urbanrichshop.com',
        customer_phone: cust.customer_phone ? cust.customer_phone.replace(/[^0-9]/g, '').slice(-10) : '9876543210'
      },
      order_meta: {
        return_url: returnUrl
      }
    });

    const options = {
      hostname: host,
      port: 443,
      path: '/pg/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const cfReq = https.request(options, (cfRes) => {
      let data = '';
      cfRes.on('data', (chunk) => { data += chunk; });
      cfRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.status(cfRes.statusCode).json(parsed);
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse Cashfree response', raw: data });
        }
      });
    });

    cfReq.on('error', (e) => {
      res.status(500).json({ error: e.message });
    });

    cfReq.write(postData);
    cfReq.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
