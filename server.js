const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS (optional)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-id');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
db.initializeDatabase();

app.listen(PORT, () => {
  console.log(`Finance Backend API running on port ${PORT}`);
  console.log(`\nAPI Base URL: http://localhost:${PORT}/api`);
  console.log(`\nExample requests:`);
  console.log(`  GET  /api/profile?userId=1`);
  console.log(`  GET  /api/records?userId=1`);
  console.log(`  GET  /api/dashboard/summary?userId=1`);
  console.log(`\nAuthentication:`);
  console.log(`  Use ?userId=1 or header: x-user-id: 1`);
  console.log(`\nDemo users available (ids 1-3):`);
  console.log(`  1. john_viewer (role: viewer)`);
  console.log(`  2. sarah_analyst (role: analyst)`);
  console.log(`  3. admin_user (role: admin)`);
});
