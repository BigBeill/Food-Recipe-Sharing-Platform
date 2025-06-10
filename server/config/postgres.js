const { Pool } = require('pg');
require('dotenv').config()

const postgresConnection = new Pool({
  user: process.env.POSTGRES_DB_USER,
  database: process.env.POSTGRES_DB_DATABASE,
  password: process.env.POSTGRES_DB_PASSWORD,
  port: process.env.POSTGRES_DB_PORT,
})

postgresConnection.connect((error, client, release) => {
  if (error) { return console.error('Error acquiring client', error.stack); }
  console.log('Connected to PostgreSQL');
  release();
});

// Export the pool instance for use in other files
module.exports = postgresConnection;