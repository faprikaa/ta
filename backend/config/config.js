module.exports = {
  development: {
    port: process.env.PORT || 3000,
    database: process.env.DATABASE_URL || 'mongodb://localhost:27017/yourdb',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key'
  },
  production: {
    port: process.env.PORT,
    database: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET
  }
}; 