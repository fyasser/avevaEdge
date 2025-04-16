const sql = require('mssql');

// Database configuration
const config = {
    user: 'your-username', // Replace with your SQL Server username
    password: 'your-password', // Replace with your SQL Server password
    server: 'your-server-name', // Replace with your SQL Server instance name
    database: 'your-database-name', // Replace with your database name
    options: {
        encrypt: true, // Use encryption if required
        trustServerCertificate: true, // Set to true for local development
    },
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!', err);
        throw err;
    });

module.exports = { sql, poolPromise };