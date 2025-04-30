const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sql = require('mssql'); // Import the mssql package
const cors = require('cors'); // Import the cors package

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Allow frontend to connect
    methods: ["GET", "POST"]
  }
});
const PORT = 5000;

// Database configuration for the AvevaEdge project
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

// Flag to control whether we use real database or simulated data
let useSimulatedData = false;

// Track last poll time to only fetch new data
let lastPollTime = new Date(0); // Start from earliest timestamp

// Store client filter preferences (key = socket ID, value = filter settings)
const clientFilters = new Map();

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        useSimulatedData = false; // Use real data since connection successful
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Original Error:', err.originalError);
        console.error('Stack Trace:', err.stack);
        
        // Fall back to simulated data
        console.log('Falling back to simulated data generation');
        useSimulatedData = true;
        
        // Return a fake pool for consistent API
        return {
            request: () => ({
                input: () => ({ query: async () => ({ recordset: [] }) }),
                query: async () => ({ recordset: [] })
            })
        };
    });

// Data simulation functions for fallback
function generateSimulatedData(count = 1000, filters = null) {
    // Generate simulated data points
    const now = new Date();
    const data = [];
    
    // Check if we're filtering for today specifically
    let isFilteringForToday = false;
    if (filters && filters.start && filters.end) {
        const startDate = new Date(filters.start);
        const endDate = new Date(filters.end);
        const today = new Date();
        
        // Check if filter range includes today
        if (startDate.toDateString() === today.toDateString() ||
            endDate.toDateString() === today.toDateString() ||
            (startDate < today && today < endDate)) {
            isFilteringForToday = true;
            console.log("Detected filtering for today's data - ensuring recent data is included");
        }
    }
    
    // Generate data points - ensure we have today's data if filtering for today
    for (let i = 0; i < count; i++) {
        // Create time points - if filtering for today, make sure we have recent data
        let timeOffset = i * 5 * 60 * 1000; // 5 minute intervals
        
        // If filtering for today, make sure half the data points are from today
        if (isFilteringForToday && i < count / 2) {
            // Set timeOffset to be within the last 24 hours
            timeOffset = i * (24 * 60 * 60 * 1000 / (count / 2));
        }
        
        const timestamp = new Date(now.getTime() - timeOffset);
        
        // Simulate flow data with realistic patterns
        const baseFlow = 100 + Math.sin(i * 0.1) * 20; // Sine wave pattern
        const randomVariation = Math.random() * 10 - 5; // Random variation
        const flow = baseFlow + randomVariation;
        
        // Simulate pressure as percentage (40-80% range with variation)
        const basePressure = 60 + Math.cos(i * 0.2) * 20;
        const pressureVariation = Math.random() * 5 - 2.5;
        const pressure = basePressure + pressureVariation;
        
        // Simulate counter (generally increases over time with occasional drops)
        const counterBase = 10000 - i * 50;
        const counterVariation = Math.random() * 20 - 5;
        const counter = counterBase + counterVariation;
        
        data.push({
            Time_Stamp: timestamp,
            Time_Stamp_ms: timestamp.getTime(),
            rTotalQ: flow,
            rTotalQPercentage: pressure,
            counter: counter
        });
    }
    
    // Apply filters if provided
    let filteredData = data;
    if (filters) {
        if (filters.start && filters.end) {
            const startDate = new Date(filters.start);
            const endDate = new Date(filters.end);
            console.log(`Filtering simulated data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
            
            filteredData = filteredData.filter(item => {
                const itemDate = new Date(item.Time_Stamp);
                return itemDate >= startDate && itemDate <= endDate;
            });
            
            console.log(`Filter applied: ${filteredData.length} records match the date range`);
        }
        
        if (filters.filterField) {
            if (filters.minValue !== undefined && filters.minValue !== '') {
                filteredData = filteredData.filter(item => 
                    item[filters.filterField] >= parseFloat(filters.minValue)
                );
            }
            
            if (filters.maxValue !== undefined && filters.maxValue !== '') {
                filteredData = filteredData.filter(item => 
                    item[filters.filterField] <= parseFloat(filters.maxValue)
                );
            }
            
            if (filters.threshold !== undefined && filters.threshold !== '') {
                const operator = filters.comparisonOperator === 'lt' ? '<' : '>';
                filteredData = filteredData.filter(item => {
                    if (operator === '<') {
                        return item[filters.filterField] < parseFloat(filters.threshold);
                    } else {
                        return item[filters.filterField] > parseFloat(filters.threshold);
                    }
                });
            }
        }
    }
    
    // Sort by timestamp (newest first for initial data load)
    return filteredData.sort((a, b) => b.Time_Stamp - a.Time_Stamp);
}

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
            
            if (useSimulatedData) {
                // Generate a few new simulated data points with filters applied
                const newRecords = generateSimulatedData(3, filters).slice(0, 3);
                
                // Update timestamps to be after lastPollTime
                newRecords.forEach((record, i) => {
                    record.Time_Stamp = new Date(Date.now() + i * 1000);
                    record.Time_Stamp_ms = record.Time_Stamp.getTime();
                });
                
                // Sort by timestamp (ascending)
                newRecords.sort((a, b) => a.Time_Stamp - b.Time_Stamp);
                
                if (newRecords.length > 0) {
                    // Update last poll time
                    lastPollTime = new Date(newRecords[newRecords.length - 1].Time_Stamp);
                    
                    // Emit the new simulated data to clients with this filter
                    socketIds.forEach(socketId => {
                        io.to(socketId).emit('new-data', newRecords);
                    });
                    
                    console.log(`Emitted ${newRecords.length} new simulated records to ${socketIds.length} clients. Latest timestamp: ${lastPollTime}`);
                }
            } else {
                // Real database query logic with filters
                const pool = await poolPromise;
                
                // Start building query with base conditions
                let query = `
                    SELECT Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage 
                    FROM TREND001 
                    WHERE Time_Stamp > @lastPoll
                `;
                
                // Create request object
                const request = pool.request()
                    .input('lastPoll', sql.DateTime, lastPollTime);
                
                // Add filter conditions
                if (filters.start && filters.end) {
                    query += ' AND Time_Stamp BETWEEN @start AND @end';
                    request.input('start', sql.DateTime, new Date(filters.start));
                    request.input('end', sql.DateTime, new Date(filters.end));
                }
                
                if (filters.filterField) {
                    // Validate field name for security
                    const validFields = ['rTotalQ', 'rTotalQPercentage', 'counter'];
                    if (validFields.includes(filters.filterField)) {
                        
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
                }
                
                // Order by timestamp
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
            }
        }
    } catch (err) {
        console.error('Error checking for new data:', err);
        
        if (!useSimulatedData) {
            console.log('Error occurred with database. Switching to simulated data');
            useSimulatedData = true;
        }
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
  // Removed: sendFilteredData(socket, {});
  
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
      
      let initialData;
      
      if (useSimulatedData) {
          // Generate simulated data with adjusted date filters
          console.log(`Generating simulated data with date range: ${adjustedFilters.start} to ${adjustedFilters.end}`);
          initialData = generateSimulatedData(1000, adjustedFilters);
          console.log(`Generated ${initialData.length} filtered simulated records for client ${socket.id}`);
      } else {
          // Try to get real data with filters
          const pool = await poolPromise;
          
          // Start building query
          let query = `
              SELECT Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage 
              FROM TREND001 
              WHERE 1=1
          `;
          
          // Create request object
          const request = pool.request();
          
          // Add filter conditions with adjusted dates
          if (adjustedFilters.start && adjustedFilters.end) {
              query += ' AND Time_Stamp BETWEEN @start AND @end';
              request.input('start', sql.DateTime, new Date(adjustedFilters.start));
              request.input('end', sql.DateTime, new Date(adjustedFilters.end));
              console.log(`Using adjusted date range in SQL: ${adjustedFilters.start} to ${adjustedFilters.end}`);
          }
          
          if (adjustedFilters.filterField) {
              // Validate field name for security
              const validFields = ['rTotalQ', 'rTotalQPercentage', 'counter'];
              if (validFields.includes(adjustedFilters.filterField)) {
                  
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
          }
          
          // Order by timestamp (newest first for initial data)
          query += ' ORDER BY Time_Stamp DESC';
          
          // Add limit if needed to prevent fetching too much data
          //query += ' FETCH FIRST 1000 ROWS ONLY'; // Uncomment if SQL Server version supports it
          
          // Execute the query
          const result = await request.query(query);
          initialData = result.recordset;
          console.log(`Fetched ${initialData.length} filtered records for client ${socket.id}`);
      }
      
      // Send filtered initial data to client
      socket.emit('initial-data', initialData);
  } catch (err) {
      console.error('Error preparing filtered data for client:', err);
      
      // Fall back to simulated data if we couldn't get real data
      const simulatedData = generateSimulatedData(1000, filters);
      socket.emit('initial-data', simulatedData);
      console.log(`Sent ${simulatedData.length} fallback simulated records to client ${socket.id} after error`);
      
      // Switch to simulated data mode
      useSimulatedData = true;
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
        
        // Construct filter object for consistency with socket-based filtering
        const filters = {
            start,
            end: adjustedEnd || end,
            filterField,
            minValue,
            maxValue,
            threshold,
            comparisonOperator
        };
        
        let filteredData;
        
        if (useSimulatedData) {
            // Generate simulated data with filters applied
            filteredData = generateSimulatedData(1000, filters);
        } else {
            // Real database query with filters
            const pool = await poolPromise;
            
            // Start building the query
            let query = `
                SELECT Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage 
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
                console.log(`API SQL Query: Using date range: ${start} to ${adjustedEnd}`);
            } else if (start && end) {
                query += ' AND Time_Stamp BETWEEN @start AND @end';
                request.input('start', sql.DateTime, new Date(start));
                request.input('end', sql.DateTime, new Date(end));
            }
            
            // Add min/max value filter if field and values provided
            if (filterField) {
                // Validate field name for security
                const validFields = ['rTotalQ', 'rTotalQPercentage', 'counter'];
                if (validFields.includes(filterField)) {
                    
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
            }
            
            // Order by timestamp (newest first)
            query += ' ORDER BY Time_Stamp DESC';
            
            // Add limit if needed to prevent fetching too much data
            //query += ' FETCH FIRST 1000 ROWS ONLY'; // Uncomment if SQL Server version supports it
            
            // Execute the query
            const result = await request.query(query);
            filteredData = result.recordset;
        }
        
        res.json(filteredData);
    } catch (err) {
        console.error('Error fetching trend data:', err);
        
        // Fall back to simulated data
        useSimulatedData = true;
        const simulatedData = generateSimulatedData(1000, {
            start: req.query.start,
            end: req.query.end,
            filterField: req.query.filterField,
            minValue: req.query.minValue,
            maxValue: req.query.maxValue,
            threshold: req.query.threshold,
            comparisonOperator: req.query.comparisonOperator
        });
        
        res.json(simulatedData);
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
    if (useSimulatedData) {
        console.log('NOTICE: Using simulated data generation (database connection failed)');
    } else {
        console.log('Using real database connection');
    }
});