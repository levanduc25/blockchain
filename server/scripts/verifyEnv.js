module.exports = function verifyEnv() {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'RPC_URL',
    'CONTRACT_ADDRESS',
    'ADMIN_ADDRESS',
    'ADMIN_PRIVATE_KEY'
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.error('Please add them to your .env file or environment before starting the server.');
    process.exit(1);
  }

  // Ensure some sensible defaults
  if (!process.env.PORT) process.env.PORT = '5000';

  return true;
};
