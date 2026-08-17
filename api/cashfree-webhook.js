// Cashfree Webhook Handler
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    console.log('Cashfree Webhook Received:', payload);

    // Return success to Cashfree webhook dispatcher
    return res.status(200).json({ status: 'OK', received: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
