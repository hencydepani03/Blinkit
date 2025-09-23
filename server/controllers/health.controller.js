const mongoose = require('mongoose');

const states = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

exports.healthCheck = (req, res) => {
  const dbState = states[mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: dbState,
    timestamp: new Date().toISOString(),
  });
};
