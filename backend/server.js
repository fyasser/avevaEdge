const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sql = require('mssql'); // Import the mssql package
const cors = require('cors'); // Import the cors package
const fs = require('fs');
const path = require('path');

// Custom environment variable loader (replacing dotenv)
function loadEnvFile() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envLines = envContent.split('\n');
            
            envLines.forEach(line => {
                // Skip comments and empty lines
                if (line.trim() === '' || line.trim().startsWith('#') || line.trim().startsWith('//')) {
                    return;
                }
                
                // Split by the first = character
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    // Join the rest with = in case there are = in the value
                    let value = parts.slice(1).join('=').trim();
                    
                    // Remove comments at end of line
                    const commentIndex = value.indexOf('#');
                    if (commentIndex !== -1) {
                        value = value.substring(0, commentIndex).trim();
                    }
                    
                    // Strip quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) || 
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length - 1);
                    }
                    
                    process.env[key] = value;
                }
            });
        }
    } catch (error) {
        console.error('Error loading .env file:', error);
    }
}

// Load environment variables
loadEnvFile();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000", // Allow frontend to connect
    methods: (process.env.SOCKET_METHODS || "GET,POST").split(',')
  }
});
const PORT = process.env.PORT || 5000;

// Database configuration for the AvevaEdge project
const config = {
    user: process.env.DB_USER || "Edge",
    password: process.env.DB_PASSWORD || "F'yabdellah2025",
    server: process.env.DB_SERVER || "localhost", // Use environment variable in production
    database: process.env.DB_NAME || "simulationDB",
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || false,
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || true,
        enableArithAbort: process.env.DB_ENABLE_ARITH_ABORT === 'true' || true,
        connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000'),
        requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '60000'),
        instanceName: process.env.DB_INSTANCE || "SQLEXPRESS" // Specify instance name separately
    },
    pool: {
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        min: parseInt(process.env.DB_POOL_MIN || '0'),
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000')
    }
};

// Array of backup configurations to try in sequence
const backupConfigs = [
    {
        user: "Edge",
        password: "F'yabdellah2025",
        server: "WEGPC1GAG9KL", // Try machine name without instance
        database: "simulationDB", 
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
            connectTimeout: 60000,
            requestTimeout: 60000,
            instanceName: "SQLEXPRESS" // Specify instance name separately
        }
    },
    {
        user: "Edge",
        password: "F'yabdellah2025",
        server: "WEGPC1GAG9KL\\SQLEXPRESS", // Try with escaped backslash
        database: "simulationDB", 
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
            connectTimeout: 60000,
            requestTimeout: 60000
        }
    },
    {
        // Try Windows authentication
        server: "WEGPC1GAG9KL\\SQLEXPRESS",
        database: "simulationDB",
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
            connectTimeout: 60000,
            requestTimeout: 60000,
            trustedConnection: true // Use Windows authentication
        }
    },
    {
        // Try IP address if hostname resolution is an issue
        user: "Edge",
        password: "F'yabdellah2025",
        server: "127.0.0.1", // Local IP address
        database: "simulationDB",
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
            connectTimeout: 60000,
            requestTimeout: 60000,
            instanceName: "SQLEXPRESS"
        }
    }
];

// Track last poll time to only fetch new data
let lastPollTime = new Date(0); // Start from earliest timestamp

// Store client filter preferences (key = socket ID, value = filter settings)
const clientFilters = new Map();

// Create a connection pool with trial of multiple configurations
const tryConnection = async (configIndex = 0) => {
    if (configIndex === 0) {
        try {
            // Try primary configuration first
            const pool = await new sql.ConnectionPool(config).connect();
            console.log('Connected to SQL Server successfully using primary configuration');
            return pool;
        } catch (err) {
            console.error(`Primary database connection failed: ${err.message}`);
            return tryConnection(1); // Move to first backup config
        }
    } else if (configIndex < backupConfigs.length + 1) {
        const currentConfig = backupConfigs[configIndex - 1];
        const configType = configIndex === 4 ? "Windows authentication" : 
                           configIndex === 5 ? "localhost IP" : `backup config ${configIndex}`;
        
        try {
            console.log(`Attempting to connect with ${configType}...`);
            const pool = await new sql.ConnectionPool(currentConfig).connect();
            console.log(`Connected to SQL Server successfully using ${configType}`);
            return pool;
        } catch (err) {
            console.error(`Connection with ${configType} failed: ${err.message}`);
            return tryConnection(configIndex + 1); // Try next config
        }
    } else {
        // All configurations failed
        console.error('All database configurations failed!');
        throw new Error('Unable to connect to database with any configuration');
    }
};

// Initialize connection pool
const poolPromise = tryConnection().catch(err => {
    console.error('Database Connection Failed!');
    console.error('Error:', err.message);
    
    // Don't use the simulator unless specifically requested
    // Returning null will cause database operations to fail explicitly
    return null;
});

// Function to check for new data from AvevaEdge and emit to clients
async function checkForNewData() {
    try {
        // Group clients by filter settings to minimize redundant queries
        const filterGroups = new Map();
        
        // Group clients with same filter settings
        clientFilters.forEach((filters, socketId) => {
            // Create a key based on filter settings
            const filterKey = JSON.stringify(filters);
            if (!filterGroups.has(filterKey)) {
                filterGroups.set(filterKey, { filters, socketIds: [] });
            }
            filterGroups.get(filterKey).socketIds.push(socketId);
        });
        
        // Process each filter group
        for (const [_, groupData] of filterGroups) {
            const { filters, socketIds } = groupData;
            
            try {
                // Get the database pool
                const pool = await poolPromise;
                
                // Start building query for new data
                let query = `
                    SELECT Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage, cPlant_1_rNoise
                    FROM TREND001 
                    WHERE Time_Stamp > @lastPoll
                `;
                
                // Create request object
                const request = pool.request();
                request.input('lastPoll', sql.DateTime, lastPollTime);
                
                // Apply filters if provided
                if (filters.filterField) {
                    if (filters.minValue !== undefined && filters.minValue !== '') {
                        query += ` AND ${filters.filterField} >= @minValue`;
                        request.input('minValue', sql.Float, parseFloat(filters.minValue));
                    }
                    
                    if (filters.maxValue !== undefined && filters.maxValue !== '') {
                        query += ` AND ${filters.filterField} <= @maxValue`;
                        request.input('maxValue', sql.Float, parseFloat(filters.maxValue));
                    }
                    
                    if (filters.threshold !== undefined && filters.threshold !== '') {
                        const operator = filters.comparisonOperator === 'lt' ? '<' : '>';
                        query += ` AND ${filters.filterField} ${operator} @threshold`;
                        request.input('threshold', sql.Float, parseFloat(filters.threshold));
                    }
                }
                
                // Limit results and order by timestamp
                query += ' ORDER BY Time_Stamp ASC';
                
                // Execute the query
                const result = await request.query(query);
                
                if (result.recordset.length > 0) {
                    // Update last poll time to the latest timestamp
                    lastPollTime = new Date(result.recordset[result.recordset.length - 1].Time_Stamp);
                    
                    // Emit to each client with this filter set
                    socketIds.forEach(socketId => {
                        io.to(socketId).emit('new-data', result.recordset);
                    });
                    
                    console.log(`Emitted ${result.recordset.length} new records to ${socketIds.length} clients. Latest timestamp: ${lastPollTime}`);
                }
            } catch (err) {
                console.error('Error fetching new data from database:', err);
                // Continue to next filter group on error
            }
        }
    } catch (err) {
        console.error('Error checking for new data:', err);
    }
}

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS

// Set up polling interval for new data check
const POLL_INTERVAL = 3000; // Check every 3 seconds
setInterval(checkForNewData, POLL_INTERVAL);

io.on('connection', (socket) => {
  console.log('Client connected, ID:', socket.id);
  
  // Initialize empty filter for the client
  clientFilters.set(socket.id, {});

  // Handle client filter updates
  socket.on('update-filters', (filters) => {
    console.log(`Client ${socket.id} updated filters:`, filters);
    clientFilters.set(socket.id, filters);
    
    // Only send data when client explicitly provides filters
    if (filters && (filters.start || filters.end)) {
      sendFilteredData(socket, filters);
    }
  });
  
  // IMPORTANT: Don't send any initial data - wait for filters
  
  socket.on('disconnect', () => {
    console.log('Client disconnected, ID:', socket.id);
    // Clean up client filter preferences
    clientFilters.delete(socket.id);
  });
});

// Function to send filtered data to a client
async function sendFilteredData(socket, filters) {
  try {
      // Make a deep copy of filters to avoid modifying the original
      const adjustedFilters = { ...filters };
      
      // Adjust date handling for both start and end dates
      if (adjustedFilters.start) {
          // Set start time to beginning of day (00:00:00.000)
          const startDate = new Date(adjustedFilters.start);
          startDate.setHours(0, 0, 0, 0);
          adjustedFilters.start = startDate.toISOString();
          console.log(`Adjusted start date to beginning of day: ${adjustedFilters.start}`);
      }
      
      if (adjustedFilters.end) {
          // Set end time to end of day (23:59:59.999)
          const endDate = new Date(adjustedFilters.end);
          endDate.setHours(23, 59, 59, 999);
          adjustedFilters.end = endDate.toISOString();
          console.log(`Adjusted end date to end of day: ${adjustedFilters.end}`);
      }
      
      // Get real database data with adjusted filters
      const pool = await poolPromise;
      
      // Build query
      let query = `
          SELECT Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage, cPlant_1_rNoise 
          FROM TREND001 
          WHERE 1=1
      `;
      
      // Create request object
      const request = pool.request();
      
      // Add date range filter if provided
      if (adjustedFilters.start && adjustedFilters.end) {
          query += ' AND Time_Stamp BETWEEN @start AND @end';
          request.input('start', sql.DateTime, new Date(adjustedFilters.start));
          request.input('end', sql.DateTime, new Date(adjustedFilters.end));
      } else if (adjustedFilters.start) {
          query += ' AND Time_Stamp >= @start';
          request.input('start', sql.DateTime, new Date(adjustedFilters.start));
      } else if (adjustedFilters.end) {
          query += ' AND Time_Stamp <= @end';
          request.input('end', sql.DateTime, new Date(adjustedFilters.end));
      }
      
      // Add value filters if provided
      if (adjustedFilters.filterField) {
          if (adjustedFilters.minValue !== undefined && adjustedFilters.minValue !== '') {
              query += ` AND ${adjustedFilters.filterField} >= @minValue`;
              request.input('minValue', sql.Float, parseFloat(adjustedFilters.minValue));
          }
          
          if (adjustedFilters.maxValue !== undefined && adjustedFilters.maxValue !== '') {
              query += ` AND ${adjustedFilters.filterField} <= @maxValue`;
              request.input('maxValue', sql.Float, parseFloat(adjustedFilters.maxValue));
          }
          
          if (adjustedFilters.threshold !== undefined && adjustedFilters.threshold !== '') {
              const operator = adjustedFilters.comparisonOperator === 'lt' ? '<' : '>';
              query += ` AND ${adjustedFilters.filterField} ${operator} @threshold`;
              request.input('threshold', sql.Float, parseFloat(adjustedFilters.threshold));
          }
      }
      
      // Order by timestamp (newest first for initial data load) and limit results
      query += ' ORDER BY Time_Stamp DESC';
      
      // Execute the query
      const result = await request.query(query);
      console.log(`Retrieved ${result.recordset.length} records from database for client ${socket.id}`);
      
      // Send filtered initial data to client
      socket.emit('initial-data', result.recordset);
      
  } catch (err) {
      console.error('Error preparing filtered data for client:', err);
      socket.emit('initial-data', []);
      socket.emit('error', { message: 'Failed to retrieve data from database' });
  }
}

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

// Add an API endpoint to serve data from the TREND001 table with filtering
app.get('/api/trend-data', async (req, res) => {
    try {
        // Extract filter parameters
        const { start, end, filterField, minValue, maxValue, threshold, comparisonOperator } = req.query;
        
        // Adjust end date to include full day if needed
        let adjustedEnd = end;
        if (end) {
            const endDate = new Date(end);
            if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getSeconds() === 0) {
                // Set time to 23:59:59 to include the entire day
                endDate.setHours(23, 59, 59, 999);
                adjustedEnd = endDate.toISOString();
                console.log(`API: Adjusted end date to end of day: ${adjustedEnd}`);
            }
        }
        
        // Get database connection
        const pool = await poolPromise;
        
        // Start building query
        let query = `
            SELECT Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage, cPlant_1_rNoise 
            FROM TREND001 
            WHERE 1=1
        `;
        
        // Create request object
        const request = pool.request();
        
        // Add date range filter if provided
        if (start && adjustedEnd) {
            query += ' AND Time_Stamp BETWEEN @start AND @end';
            request.input('start', sql.DateTime, new Date(start));
            request.input('end', sql.DateTime, new Date(adjustedEnd));
        } else if (start) {
            query += ' AND Time_Stamp >= @start';
            request.input('start', sql.DateTime, new Date(start));
        } else if (adjustedEnd) {
            query += ' AND Time_Stamp <= @end';
            request.input('end', sql.DateTime, new Date(adjustedEnd));
        }
        
        // Add value filters if provided
        if (filterField) {
            if (minValue !== undefined && minValue !== '') {
                query += ` AND ${filterField} >= @minValue`;
                request.input('minValue', sql.Float, parseFloat(minValue));
            }
            
            if (maxValue !== undefined && maxValue !== '') {
                query += ` AND ${filterField} <= @maxValue`;
                request.input('maxValue', sql.Float, parseFloat(maxValue));
            }
            
            if (threshold !== undefined && threshold !== '') {
                const operator = comparisonOperator === 'lt' ? '<' : '>';
                query += ` AND ${filterField} ${operator} @threshold`;
                request.input('threshold', sql.Float, parseFloat(threshold));
            }
        }
        
        // Order by timestamp (newest first)
        query += ' ORDER BY Time_Stamp DESC';
        
        // Execute the query
        const result = await request.query(query);
        res.json(result.recordset);
        
    } catch (err) {
        console.error('Error fetching trend data:', err);
        res.status(500).json({ error: 'Failed to retrieve data', details: err.message });
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
    console.log(`Checking for new data every ${POLL_INTERVAL/1000} seconds`);
});