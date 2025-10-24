const emailjs = require('@emailjs/nodejs');

const {
  EMAILJS_SERVICE_ID: SERVICE_ID,
  EMAILJS_TEMPLATE_ID: TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY: PUBLIC_KEY,
  EMAILJS_PRIVATE_KEY: PRIVATE_KEY,
} = process.env;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const data = req.body;

    if (!data.from_name || !data.user_email || !data.message) {
      return res.status(400).json({ message: 'Bad Request: Missing required fields.' });
    }

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, data, {
      publicKey: PUBLIC_KEY,
      privateKey: PRIVATE_KEY,
    });

    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Failed to send email.' });
  }
}