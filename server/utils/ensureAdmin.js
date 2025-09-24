const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Ensures a static admin exists with given credentials
// Defaults to admin@blinkit.com / admin123 if env not provided
module.exports = async function ensureAdmin() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@blinkit.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    // If user exists but not admin, upgrade role to admin (optional policy)
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: passwordHash,
    role: 'admin'
  });
  return admin;
}
