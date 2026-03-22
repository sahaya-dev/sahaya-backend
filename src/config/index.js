require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';

/** Dev DB insert tools: on in development, or when ENABLE_DEV_DB_TOOLS=true */
function isDevDbToolsEnabled() {
  if (process.env.ENABLE_DEV_DB_TOOLS === 'true') return true;
  return nodeEnv === 'development';
}

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sahaya',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
  devDbToolsEnabled: isDevDbToolsEnabled(),
  /** If set, all /api/dev/* DB routes require header X-Dev-Db-Key */
  devDbKey: process.env.DEV_DB_KEY || '',
};
