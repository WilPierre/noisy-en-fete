const Stripe = require('stripe');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { amount, orderId, tableNum } = req.body;

    if (!amount || amount < 50) return res.status(400).json({ error: 'Montant invalide' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // en centimes
      currency: 'eur',
      payment_method_types: ['card'], // CB uniquement
      metadata: { orderId: String(orderId), tableNum: String(tableNum) },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
