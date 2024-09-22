// db.js
const { Pool } = require('pg');
require('dotenv').config();


console.log(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME);
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

const testConnection = async () => {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection successful.');
    } catch (err) {
      console.error('Database connection failed:', err);
      process.exit(-1); // Exit the process with an error code
    }
  };
  
  module.exports = { pool, testConnection };