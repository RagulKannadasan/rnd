const emailjs = require('@emailjs/nodejs');

// Ensure these are set in your Netlify UI:
// Site settings > Build & deploy > Environment > Environment variables
const {
  REACT_APP_EMAILJS_SERVICE_ID: SERVICE_ID,
  REACT_APP_EMAILJS_TEMPLATE_ID: TEMPLATE_ID,
  REACT_APP_EMAILJS_PUBLIC_KEY: PUBLIC_KEY,
  REACT_APP_EMAILJS_PRIVATE_KEY: PRIVATE_KEY, // Your secret key
} = process.env;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);

    // Basic validation
    if (!data.from_name || !data.user_email || !data.message) {
      return { statusCode: 400, body: 'Bad Request: Missing required fields.' };
    }

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, data, {
      publicKey: PUBLIC_KEY,
      privateKey: PRIVATE_KEY,
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'Email sent successfully!' }) };
  } catch (error) {
    console.error('Error sending email:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send email.' }) };
  }
};