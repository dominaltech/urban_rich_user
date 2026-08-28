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

    const cust = customer_details || {};
    const postData = JSON.stringify({
      order_id: order_id,
      order_amount: parseFloat(order_amount),
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
