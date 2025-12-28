const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'stackly',
  password: 'stackly_dev_password',
  database: 'stackly',
});

client.connect()
  .then(() => {
    console.log('SUCCESS! Connected to PostgreSQL');
    return client.query('SELECT 1');
  })
  .then((res) => {
    console.log('Query result:', res.rows);
    client.end();
  })
  .catch((err) => {
    console.error('FAILED:', err.message);
    client.end();
  });
