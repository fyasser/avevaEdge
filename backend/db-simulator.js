// Database simulator for when the SQL Server connection is unavailable
// This provides simulated data that mimics the structure of the TREND001 table

const { EventEmitter } = require('events');

// In-memory data store for simulated database records
const simulatedRecords = [];
const simulatedPool = new EventEmitter();
let isSimulating = false;

// Generate dates between start and end dates
function generateDateRange(startDate, endDate, intervalMinutes = 15) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let current = new Date(start);
    while (current <= end) {
        dates.push(new Date(current));
        current.setMinutes(current.getMinutes() + intervalMinutes);
    }
    
    return dates;
}

// Generate simulated data for TREND001 table
function generateSimulatedData(count = 100) {
    // Clear existing data
    simulatedRecords.length = 0;
    
    // Generate dates for the last week, with readings every 15 minutes
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const dates = generateDateRange(startDate, endDate);
    
    // Generate simulated records
    let counter = 1;
    
    dates.forEach(date => {
        // Create realistic variations in the data
        const hourOfDay = date.getHours();
        // Simulate higher usage during working hours
        const timeMultiplier = (hourOfDay >= 8 && hourOfDay <= 18) ? 1.5 : 0.7;
        
        // Generate random value with realistic patterns
        const rTotalQ = Math.round((40 + Math.random() * 60) * timeMultiplier);
        const rTotalQPercentage = Math.min(100, Math.round(rTotalQ / 1.2));
        
        simulatedRecords.push({
            Time_Stamp: date,
            Time_Stamp_ms: date.getTime(),
            counter: counter++,
            rTotalQ: rTotalQ,
            rTotalQPercentage: rTotalQPercentage
        });
    });
    
    console.log(`Generated ${simulatedRecords.length} simulated records from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    return simulatedRecords;
}

// Simulate a SQL pool with request functionality
simulatedPool.request = function() {
    const requestObj = {
        inputs: {},
        input: function(name, type, value) {
            this.inputs[name] = value;
            return this;
        },
        query: function(queryString) {
            return new Promise((resolve, reject) => {
                try {
                    console.log('Executing simulated query:', queryString);
                    console.log('With parameters:', this.inputs);
                    
                    // Start with all records
                    let filteredRecords = [...simulatedRecords];
                    
                    // Apply filters based on input parameters
                    if (this.inputs.start) {
                        filteredRecords = filteredRecords.filter(r => 
                            r.Time_Stamp >= new Date(this.inputs.start));
                    }
                    
                    if (this.inputs.end) {
                        filteredRecords = filteredRecords.filter(r => 
                            r.Time_Stamp <= new Date(this.inputs.end));
                    }
                    
                    if (this.inputs.lastPoll) {
                        filteredRecords = filteredRecords.filter(r => 
                            r.Time_Stamp > new Date(this.inputs.lastPoll));
                    }
                    
                    // Check for field-specific filters (minValue, maxValue, threshold)
                    let filterField = null;
                    
                    // Extract filter field from query
                    if (queryString.includes('rTotalQ >=') || 
                        queryString.includes('rTotalQ <=') || 
                        queryString.includes('rTotalQ >') || 
                        queryString.includes('rTotalQ <')) {
                        filterField = 'rTotalQ';
                    } else if (queryString.includes('rTotalQPercentage >=') || 
                               queryString.includes('rTotalQPercentage <=') || 
                               queryString.includes('rTotalQPercentage >') || 
                               queryString.includes('rTotalQPercentage <')) {
                        filterField = 'rTotalQPercentage';
                    }
                    
                    if (filterField) {
                        if (this.inputs.minValue !== undefined) {
                            filteredRecords = filteredRecords.filter(r => 
                                r[filterField] >= parseFloat(this.inputs.minValue));
                        }
                        
                        if (this.inputs.maxValue !== undefined) {
                            filteredRecords = filteredRecords.filter(r => 
                                r[filterField] <= parseFloat(this.inputs.maxValue));
                        }
                        
                        if (this.inputs.threshold !== undefined) {
                            const operator = queryString.includes(filterField + ' <') ? '<' : '>';
                            if (operator === '<') {
                                filteredRecords = filteredRecords.filter(r => 
                                    r[filterField] < parseFloat(this.inputs.threshold));
                            } else {
                                filteredRecords = filteredRecords.filter(r => 
                                    r[filterField] > parseFloat(this.inputs.threshold));
                            }
                        }
                    }
                    
                    // Handle sorting
                    if (queryString.includes('ORDER BY Time_Stamp DESC')) {
                        filteredRecords.sort((a, b) => b.Time_Stamp - a.Time_Stamp);
                    } else if (queryString.includes('ORDER BY Time_Stamp ASC')) {
                        filteredRecords.sort((a, b) => a.Time_Stamp - b.Time_Stamp);
                    }
                    
                    resolve({
                        recordset: filteredRecords
                    });
                } catch (err) {
                    console.error('Simulated query error:', err);
                    reject(err);
                }
            });
        }
    };
    return requestObj;
};

// API for the database simulator
module.exports = {
    // Initialize the database simulator with optional data count
    initSimulator: (dataCount = 1000) => {
        if (!isSimulating) {
            generateSimulatedData(dataCount);
            isSimulating = true;
            console.log(`Database simulator initialized with ${simulatedRecords.length} records`);
        }
        return simulatedRecords;
    },
    
    // Get the simulated pool that can be used in place of the SQL connection pool
    getSimulatedPool: () => {
        if (!isSimulating) {
            module.exports.initSimulator();
        }
        console.log('Using simulated database pool');
        return simulatedPool;
    },
    
    // Add new simulated records (for testing data updates)
    addSimulatedRecords: (count = 5) => {
        const lastRecord = simulatedRecords[simulatedRecords.length - 1];
        const lastDate = lastRecord ? new Date(lastRecord.Time_Stamp) : new Date();
        let counter = lastRecord ? lastRecord.counter + 1 : 1;
        
        const newRecords = [];
        for (let i = 0; i < count; i++) {
            const date = new Date(lastDate);
            date.setMinutes(date.getMinutes() + 15 * (i + 1));
            
            const hourOfDay = date.getHours();
            const timeMultiplier = (hourOfDay >= 8 && hourOfDay <= 18) ? 1.5 : 0.7;
            const rTotalQ = Math.round((40 + Math.random() * 60) * timeMultiplier);
            const rTotalQPercentage = Math.min(100, Math.round(rTotalQ / 1.2));
            
            const newRecord = {
                Time_Stamp: date,
                Time_Stamp_ms: date.getTime(),
                counter: counter++,
                rTotalQ: rTotalQ,
                rTotalQPercentage: rTotalQPercentage
            };
            
            newRecords.push(newRecord);
            simulatedRecords.push(newRecord);
        }
        
        return newRecords;
    },
    
    // Get all simulated records
    getAllRecords: () => {
        return simulatedRecords;
    }
};