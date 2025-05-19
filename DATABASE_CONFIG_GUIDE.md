# AvevaEdge Dashboard - Using Your Own Database Configuration

This guide explains how to modify the AvevaEdge Dashboard to work with your own database configuration.

## How to Configure Your Database Connection

All database connection settings are now stored in a single file: `backend/.env`

### Step 1: Update the .env File

1. Open the file `backend/.env` 
2. Modify these settings to match your database:

```
DB_USER=YourUsername               # Your database username
DB_PASSWORD=YourPassword           # Your database password
DB_SERVER=YourServer\YourInstance  # Your server and instance name
DB_NAME=YourDatabaseName           # Your database name
DB_INSTANCE=YourInstance           # Your SQL Server instance name
DB_PORT=1433                       # Your database port (usually 1433)
DB_DRIVER={ODBC Driver 17 for SQL Server}  # Your ODBC driver
```

### Step 2: Database Schema Requirements

Your database must have the following table structure:

```sql
-- Main data table
CREATE TABLE MeterData (
    id INT IDENTITY(1,1) PRIMARY KEY,
    timestamp DATETIME,
    flow FLOAT,
    pressure FLOAT,
    system_fluid_state INT,
    noise FLOAT
);
```

> Note: This is a simple example. Your actual database schema may vary depending on your specific requirements.

### Step 3: Testing Your Configuration

1. Start the application by opening two separate terminal windows:
   
   **Terminal 1 - Start the backend server:**
   ```powershell
   cd backend
   node server.js
   ```
   
   **Terminal 2 - Start the frontend application:**
   ```powershell
   cd frontend
   npm start
   ```

2. Check the backend terminal output for any database connection errors
3. If you see "Database connected successfully", your configuration is working correctly

## Troubleshooting Database Connections

If you encounter connection issues:

1. **Error: Login failed for user 'YourUsername'**
   - Verify your username and password are correct
   - Check that SQL Server allows SQL authentication
   - Ensure the user has proper permissions to the database

2. **Error: Cannot connect to 'YourServer\YourInstance'**
   - Verify the server name and instance are correct
   - Make sure SQL Server is running
   - Check that remote connections are enabled on the server
   - Verify firewall settings allow connections to the database port

3. **Error: Database 'YourDatabaseName' not found**
   - Make sure you've created the database
   - Check that the user has permissions to access the database

4. **Error: Driver not found**
   - Install the correct ODBC driver for SQL Server
   - Update the DB_DRIVER setting in the .env file

For additional help, please contact your database administrator.
