# AvevaEdge Dashboard - User Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Setup Guide](#quick-setup-guide)
3. [Common Problems and Solutions](#troubleshooting)
4. [Moving to Another Computer](#transferring-the-project-to-another-pc)
---

# Overview

The AvevaEdge Dashboard Application is a web-based platform designed to visualize and interact with industrial or operational data. It provides real-time updates, interactive charts, and filtering options to help users monitor and analyze system performance effectively.

## Key Features

- **Real-time Data Visualization**: Multiple chart types including line, bar, doughnut, and scatter plots
- **Interactive Filtering**: Date, time, and parameter-based filtering
- **Data Aggregation**: Summarize data by various time intervals
- **Comprehensive Metrics**: Track flow, pressure, system fluid state, and noise levels
- **Report Generation**: Export data and visualizations for analysis
- **Responsive Design**: Optimized for different screen sizes
- **Dark/Light Themes**: Toggle between display modes for different environments

## Version Information

- **Application Version**: 0.1.0
- **Documentation Last Updated**: May 18, 2025
- **Supported Browsers**: Chrome (recommended), Firefox, Edge

---

# Quick Setup Guide

This section provides a streamlined process for setting up the AvevaEdge Dashboard application on your computer.

## Prerequisites

Before you begin, ensure you have administrator privileges on your PC and have installed:

1. **Node.js** (v18.17.1 or newer)
2. **SQL Server Express** (2019 or newer)
3. **SQL Server Management Studio** (18.10 or newer)
4. **Git** (2.33.0 or newer)
5. **Visual Studio Code** (recommended for editing configuration files)
6. **ODBC Driver 17 for SQL Server**

## Setup Steps

1. **Get the Project Files**:
   - **Option A**: Clone from GitHub:
     ```powershell
     cd C:\Users\YourUsername\Documents
     git clone https://github.com/fyasser/avevaEdge.git
     cd avevaEdge
     ```
   - **Option B**: Use the ZIP file:
     ```powershell
     # Extract the ZIP file
     Expand-Archive -Path C:\path\to\AvevaEdge.zip -DestinationPath C:\Users\YourUsername\Documents
     cd C:\Users\YourUsername\Documents\AvevaEdge
     ```

2. **Install Dependencies**:
   ```powershell
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure Database**:
   - Open SQL Server Management Studio
   - Create a database named `simulationDB`
   - Create a SQL user `Edge` with password `F'yabdellah2025`
   - Run the SQL script to create the required tables

4. **Configure Environment**:
   - Create a `.env` file in the backend folder
   - Add database configuration details (see Database Configuration section for details)

5. **Start the Application**:
   - In one terminal:
     ```powershell
     cd backend
     nodemon server.js
     ```
     or
     ```powershell
     cd backend
     npm start
     ```

   - In another terminal:
     ```powershell
     cd frontend
     npm start
     ```
   - Access the application at http://localhost:3000

For detailed installation instructions, refer to the [Transferring the Project to Another PC](#transferring-the-project-to-another-pc) section.

---

# Troubleshooting

This section addresses common issues you might encounter with the AvevaEdge Dashboard application.

## Common Issues and Solutions

### Installation Problems

| Problem | Solution |
|---------|----------|
| **Node.js "not recognized" errors** | • Run installer as administrator<br>• Check Path in Environment Variables<br>• Try a clean reinstall |
| **SQL Server installation fails** | • Verify system requirements<br>• Check for port conflicts (`netstat -ano \| findstr 1433`)<br>• Ensure Windows is up to date |

### Connection Problems

| Problem | Solution |
|---------|----------|
| **Database connection errors** | • Verify SQL Server is running in Services<br>• Check server name in `.env` file (use computer name WITHOUT backslash or instance)<br>• Confirm SQL authentication is enabled<br>• Test credentials in SSMS<br>• If you see "getaddrinfo ENOTFOUND", check your DB_SERVER format |
| **"Table not found" errors** | • Verify database exists<br>• Check if schema initialization completed<br>• Review backend server logs |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| **Application won't start** | • Try reinstalling dependencies:<br>  ```powershell<br>  cd frontend<br>  rm -r -force node_modules<br>  npm install<br>  ```<br>• Check for port conflicts (use alternate port)<br>  ```powershell<br>  $env:PORT=3001; npm start<br>  ```<br>• Verify your .env file is properly configured<br>  ```powershell<br>  # Check if the .env file is loaded correctly<br>  cat .\backend\.env<br>  ``` |
| **Blank page in browser** | • Check browser console (F12) for errors<br>• Verify backend is running<br>• Try clearing browser cache |

### Data Visualization Issues

| Problem | Solution |
|---------|----------|
| **Charts show "No Data Available"** | • Reset filters<br>• Check database contains data<br>• Verify data formats |
| **Report generation fails** | • Check file permissions<br>• Verify browser console for any JavaScript errors |

## Quick Diagnosis Steps

1. **Check both servers are running** - You should have two terminal windows open, one showing "Server running on port 5000" and another for the frontend
2. **Verify database connection** - Look for "Database connected successfully" in the backend terminal
3. **Check environment variables** - Ensure your `.env` file is correctly configured with valid database credentials:
   ```powershell
   cat .\backend\.env
   ```
4. **Check for browser console errors** - Press F12 in your browser to open developer tools
5. **Test API endpoints** - Try accessing http://localhost:5000/api/status in your browser

---

# Transferring the Project to Another PC

This section provides comprehensive instructions for replicating your AvevaEdge Dashboard setup on another PC, ensuring exact environment reproduction and successful operation.

## Complete Replication Process

Follow these steps in sequence to ensure proper replication:

1. **Configure hardware environment** - Ensure the target PC meets all system requirements
2. **Install required software** - Set up all necessary software components with the exact versions
3. **Clone the repository** - Retrieve the codebase from the Git repository
4. **Set up the database** - Configure SQL Server and create the necessary database structure
5. **Configure environment variables** - Set up the .env file with the correct connection parameters
6. **Install dependencies** - Install all required npm packages for both frontend and backend
7. **Validate the installation** - Test all components to ensure they work correctly

## Exact Environment Specifications

### Hardware Requirements
- **Processor**: Intel Core i5 (2.4 GHz) or AMD equivalent
- **RAM**: 8 GB minimum, 16 GB recommended
- **Storage**: 2 GB minimum available disk space
- **Network**: Ethernet connection recommended, WiFi supported
- **Display**: 1366 x 768 pixels minimum resolution

### Required Software Versions
1. **Node.js** | v16.20.2 or newer | [nodejs.org](https://nodejs.org/) 
   - During installation, select "Automatically install the necessary tools"
   - After installation, verify with: `node -v` and `npm -v`
   - The project has been tested with Node v16.20.2

2. **SQL Server Express** | 2019 or newer | [microsoft.com/sql-server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
   - Use "Basic" installation type
   - Enable "SQL Server Authentication Mode" during setup
   - Set port to default (1433)

3. **SQL Server Management Studio** | 18.10 or newer | [docs.microsoft.com/ssms](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
   - Install using default settings

5. **Git** | 2.33.0 or newer | [git-scm.com](https://git-scm.com/downloads)
   - Use default installation options
   - Verify with: `git --version`

6. **Visual Studio Code** | 1.60.0 or newer | [code.visualstudio.com](https://code.visualstudio.com/)
   - Install recommended extensions:
     - "SQL Server (mssql)" by Microsoft
     - "ESLint" for JavaScript linting
     - "npm" for package management

7. **ODBC Driver for SQL Server** | 17 or newer | [docs.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server](https://docs.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)
   - Required for database connectivity


### Exact Package Dependencies
This section only highlights the exact versions of each technology used that work together 
#### Frontend Dependencies (package.json)
```json
"dependencies": {
  "@testing-library/jest-dom": "^5.17.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/user-event": "^13.5.0",
  "chart.js": "^4.4.0",
  "chartjs-adapter-date-fns": "^3.0.0",
  "date-fns": "^2.30.0",
  "file-saver": "^2.0.5",
  "react": "^18.2.0",
  "react-chartjs-2": "^5.2.0",
  "react-dom": "^18.2.0",
  "react-responsive-carousel": "^3.2.23",
  "react-scripts": "^5.0.1",
  "socket.io-client": "^4.7.2",
  "web-vitals": "^2.1.4"
}
```

#### Backend Dependencies (package.json)
```json
"dependencies": {
  "body-parser": "^2.2.0",
  "cors": "^2.8.5",
  "express": "^5.1.0",
  "mssql": "^11.0.1",
  "nodemon": "^3.1.9"
}
```
**Install frontend dependencies**:
   ```powershell
   cd C:\AvevaEdge\frontend
   npm install
   ```

**Install backend dependencies**:
   ```powershell
   cd C:\AvevaEdge\backend
   npm install
   ```

### Getting the Project Files

You can obtain the project files using either of these two methods:

#### Option 1: Clone from GitHub (Recommended for Development)

If you have Git installed:

1. **Open a terminal** (PowerShell) and navigate to where you want to install the project:
   ```powershell
   cd C:\Users\YourUsername\Documents
   ```

2. **Clone the repository** using Git:
   ```powershell
   git clone https://github.com/fyasser/avevaEdge.git
   ```

3. **Navigate to the project directory**:
   ```powershell
   cd avevaEdge
   ```

#### Option 2: Use a ZIP File

If you have received a ZIP file of the project:

1. **Copy the ZIP file** to the location where you want to install the project (e.g., `C:\Users\YourUsername\Documents`)

2. **Extract the ZIP file**:
   - Right-click on the ZIP file and select "Extract All..."
   - Or use PowerShell:
     ```powershell
     Expand-Archive -Path .\AvevaEdge.zip -DestinationPath C:\Users\YourUsername\Documents
     ```

3. **Navigate to the project directory**:
   ```powershell
   cd C:\Users\YourUsername\Documents\AvevaEdge
   ```

### Database Configuration

All database connection settings are now stored in a single file: `backend/.env`

> **Video Tutorial**: For a visual step-by-step guide on connecting the AvevaEdge project with a database, watch [this tutorial video](https://www.youtube.com/watch?v=XedGddiUzHU).

### Database Setup Steps

#### Step 1: Create the Database

1. **Open SQL Server Management Studio** (SSMS)
   - Connect to your SQL Server instance using Windows Authentication
   
2. **Create a new database**:
   - Right-click on "Databases" > "New Database..."
   - Set Database name to: `simulationDB`
   - Click "OK" to create the database

3. **Create a new login**:
   - Expand "Security" > Right-click on "Logins" > "New Login..."
   - Set Login name to: `Edge`
   - Select "SQL Server authentication"
   - Enter Password: `F'yabdellah2025` (or your secure password)
   - Uncheck "Enforce password policy"
   - Click "OK" to create the login

4. **Set database permissions**:
   - Expand "Databases" > "simulationDB" > "Security" > Right-click "Users" > "New User..."
   - Set User name: `Edge`
   - Set Login name: `Edge`
   - Go to "Membership" tab > Check "db_owner"
   - Click "OK" to create the user and assign permissions

5. **Create the required table structure**:
   - In SSMS, connect to your simulationDB database
   - Click "New Query" and run this SQL script:

   ```sql
   CREATE TABLE MeterData (
       id INT IDENTITY(1,1) PRIMARY KEY,
       timestamp DATETIME,
       flow FLOAT,
       pressure FLOAT,
       system_fluid_state INT,
       noise FLOAT
   );
   ```

#### Step 2: Update the .env File

1. **Create or update the .env file** in the backend directory:
   ```powershell
   code C:\AvevaEdge\backend\.env
   ```

2. **Add the following configuration**, customizing for your environment:
   ```
   # AvevaEdge Dashboard - Database Environment Configuration
   
   # Primary Database Connection Details
   DB_USER=Edge                        # Your database username
   DB_PASSWORD=F'yabdellah2025         # Your database password
   DB_SERVER=YourPC                    # Replace YourPC with your computer name (NO backslash or instance)
   DB_NAME=simulationDB                # Database name
   DB_INSTANCE=SQLEXPRESS              # SQL Server instance name
   DB_PORT=1433                        # Database port (usually 1433)
   DB_DRIVER={ODBC Driver 17 for SQL Server}
   
   # SQL Server Connection Options
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true
   DB_ENABLE_ARITH_ABORT=true
   DB_CONNECT_TIMEOUT=60000
   DB_REQUEST_TIMEOUT=60000
   
   # Connection Pool Settings
   DB_POOL_MAX=10
   DB_POOL_MIN=0
   DB_POOL_IDLE_TIMEOUT=30000
   
   # BACKUP DATABASE CONFIGURATIONS - Used as fallbacks
   BACKUP_DB_SERVER1=localhost
   BACKUP_DB_SERVER2=127.0.0.1
   ```

3. **Find your computer name** to use in the DB_SERVER setting:
   ```powershell
   $env:COMPUTERNAME
   ```
   Replace "YourPC" in the DB_SERVER setting with your actual computer name
   
   > ⚠️ **IMPORTANT**: Do not include the instance name (e.g., `\SQLEXPRESS`) in the DB_SERVER value. Use only your computer name. The application will combine the server name and instance automatically.


### Final Setup and Verification

#### Step 1: Verify Node.js Dependencies Installation
After installing dependencies, you should verify that all packages were installed correctly:

```powershell
# Verify frontend packages
cd C:\AvevaEdge\frontend
npm list --depth=0

# Verify backend packages
cd C:\AvevaEdge\backend
npm list --depth=0
```

If any package is missing or has errors, run `npm install` again in the respective directory.

#### Step 2: Start the Application

1. **Start the backend server**:
   ```powershell
   cd C:\AvevaEdge\backend
   node server.js
   ```
   You should see "Server running on port 5000" and "Database connected successfully" messages.

2. **Start the frontend application** (in a new terminal window):
   ```powershell
   cd C:\AvevaEdge\frontend
   npm start
   ```
   This will open the application in your default web browser.

#### Step 3: Comprehensive Validation

1. **Check system connectivity**:
   - Verify backend terminal shows "Database connected successfully"
   - Check frontend connects to the backend (no connection errors in the console)
   - Access http://localhost:5000/api/status in a browser to verify the API is responsive

2. **Test core functionality**:
   - Verify all charts load correctly
   - Test data filtering capabilities
   - Check that real-time updates are working
   - Test report generation features

3. **Performance verification**:
   - Monitor CPU and memory usage under normal operation
   - Test with typical data query volumes
   - Verify response times for various operations

4. **Troubleshooting plan**:
   - Know how to access logs (browser console and server terminal)
   - Have database credentials and connection string ready for debugging
   - Understand how to restart all components if necessary

## Additional Resources

- **GitHub Repository**: [https://github.com/fyasser/avevaEdge](https://github.com/fyasser/avevaEdge)
- **Official Documentation**: Refer to the README.md file in the application folder for additional details

---

© 2025 AvevaEdge Dashboard Application
