const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Import Routes
const aiRoutes = require('./routes/ai');
const paymentRoutes = require('./routes/payments');
const communityRoutes = require('./routes/community');
const eventsRoutes = require('./routes/events');
const fitnessRoutes = require('./routes/fitness');
const usersRoutes = require('./routes/users');

// Mount Routes
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/users', usersRoutes);

// Base Route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to R&D Vercel Server API',
    status: 'success'
  });
});

// Health check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Local Development Server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Development server running on http://localhost:${PORT}`);
  });
}

// Export the Express API for Vercel
module.exports = app;
