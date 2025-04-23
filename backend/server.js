const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sql = require('mssql'); // Import the mssql package
const cors = require('cors'); // Import the cors package

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 5000; // Updated port to 5000

// Database configuration
const config = {
    user: "Edge",
    password: "F'yabdellah2025",
    server: "WEGPC1GAG9KL\\SQLEXPRESS", // Use the IP address
    database: "simulationDB",
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    port: 1433, // Explicitly specify the port
    requestTimeout: 30000, // Increase timeout to 30 seconds
    connectionTimeout: 30000
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Original Error:', err.originalError);
        console.error('Stack Trace:', err.stack);
        throw err;
    });

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Test route to verify database connection
app.get('/', async (req, res) => {
    try {
        const pool = await poolPromise; // Get the connection pool
        const result = await pool.request().query('SELECT 1 AS Test'); // Test query
        res.json({ message: 'Database connected successfully!', result: result.recordset });
    } catch (err) {
        console.error('Error in test route:', err);
        res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
});

// Add an API endpoint to serve data from the TREND001 table
app.get('/api/trend-data', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT TOP 100 Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage FROM TREND001');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching trend data:', err);
        res.status(500).json({ error: 'Failed to fetch data', details: err.message });
    }
});

// Add an API endpoint to serve data from the database
app.get('/api/data', async (req, res) => {
    const connectionString = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=WEGPC1GAG9KL\\SQLEXPRESS;DATABASE=simulationDB;UID=Edge;PWD='F'yabdellah2025`;

    try {
        const conn = pyodbc.connectSync(connectionString);
        const query = "SELECT TOP 100 Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage FROM TREND001";
        const result = conn.querySync(query);
        conn.closeSync();

        res.json(result);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data from the database' });
    }
});

app.post('/generate-report', (req, res) => {
  const { startDate, endDate, chartTypes } = req.body;

  // Simulate report generation
  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;
    io.emit('report-progress', { progress });

    if (progress >= 100) {
      clearInterval(interval);
      io.emit('report-complete', { message: 'Report generation complete!' });
    }
  }, 1000);

  res.status(200).send({ message: 'Report generation started' });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});