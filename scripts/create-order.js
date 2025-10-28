const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID_TEST, // Use test key for development
      key_secret: process.env.RAZORPAY_KEY_SECRET_TEST,
    });

    const options = {
      amount: req.body.amount, // amount in smallest currency unit
      currency: "INR",
      receipt: "receipt_order_74394",
      payment_capture: 1
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Some error occured");

    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).send(error);
  }
};
