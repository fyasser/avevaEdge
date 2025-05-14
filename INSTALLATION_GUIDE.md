# AvevaEdge Dashboard Application - Installation Guide for Non-Developers

This guide provides step-by-step instructions for installing and running the AvevaEdge Dashboard application on a local PC. It is designed for users with limited or no development experience.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Pre-requisite Software Installation](#pre-requisite-software-installation)
3. [Database Setup](#database-setup)
4. [Application Setup](#application-setup)
5. [Running the Application](#running-the-application)
6. [Accessing the Dashboard](#accessing-the-dashboard)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)
8. [Support Contacts](#support-contacts)

## System Requirements

To run the AvevaEdge Dashboard application, your PC should meet the following minimum requirements:

- **Operating System**: Windows 10 or newer
- **Processor**: Intel Core i5 or equivalent (2.4 GHz or faster)
- **Memory**: 8 GB RAM (16 GB recommended)
- **Disk Space**: At least 2 GB of free disk space
- **Network**: Internet connection for initial setup
- **Browser**: Chrome (recommended), Firefox, or Edge
- **Screen Resolution**: Minimum 1366 x 768 pixels

## Pre-requisite Software Installation

The application requires several software components to run properly. Follow these steps to install them:

### 1. Install Node.js

Node.js is required to run both the frontend and backend components of the application.

1. Download the Node.js installer from [https://nodejs.org/](https://nodejs.org/)
   - Choose the "LTS" (Long Term Support) version
2. Run the installer and follow the on-screen instructions
   - Accept the license agreement
   - Click "Next" through the default installation options
   - Click "Install"
3. To verify installation:
   - Open Command Prompt (search for "cmd" in the Windows start menu)
   - Type `node --version` and press Enter
   - You should see a version number (e.g., v18.17.1)

### 2. Install SQL Server Express

The application requires SQL Server to store and retrieve data.

1. Download SQL Server Express from [https://www.microsoft.com/en-us/sql-server/sql-server-downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
   - Click on "Download now" under "Express"
2. Run the installer and follow these steps:
   - Select "Basic" installation type
   - Accept the license terms
   - Select an installation location or use the default
   - Click "Install"
3. Take note of the following information displayed at the end of installation:
   - Server name (typically your PC name followed by \SQLEXPRESS)
   - Authentication method

### 3. Install SQL Server Management Studio (SSMS)

This tool will help you manage the database.

1. Download SSMS from [https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
2. Run the installer and follow the on-screen instructions
3. Once installed, open SSMS from the Start menu

### 4. Install Python (for Report Generation)

Python is needed for the advanced report generation feature.

1. Download Python from [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - Choose Python 3.9 or newer
2. Run the installer
   - **IMPORTANT**: Check the box that says "Add Python to PATH"
   - Select "Install Now"
3. To verify installation:
   - Open Command Prompt
   - Type `python --version` and press Enter
   - You should see a version number (e.g., Python 3.9.7)

## Database Setup

### 1. Create the Database

1. Open SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance:
   - Server type: Database Engine
   - Server name: Your server name (e.g., YOURPCNAME\SQLEXPRESS)
   - Authentication: Windows Authentication (or use SQL Server authentication if you set it up)
3. Create a new database:
   - Right-click on "Databases" in the Object Explorer
   - Select "New Database"
   - Enter "simulationDB" as the database name
   - Click "OK"

### 2. Create a Database User

1. In SSMS, expand your server in Object Explorer
2. Go to Security > Logins
3. Right-click on "Logins" and select "New Login"
4. Configure the login:
   - Login name: Edge
   - Select "SQL Server authentication"
   - Enter password: F'yabdellah2025
   - Uncheck "Enforce password policy"
   - Select "simulationDB" as the default database
   - Click "OK"
5. Set user permissions:
   - Expand Databases > simulationDB > Security
   - Right-click on "Users" and select "New User"
   - User name: Edge
   - Login name: Edge
   - Under "Role Members", check "db_owner"
   - Click "OK"

### 3. Enable SQL Server Authentication

1. In SSMS, right-click on your server in Object Explorer
2. Select "Properties"
3. Click on "Security"
4. Under "Server authentication", select "SQL Server and Windows Authentication mode"
5. Click "OK"
6. Restart SQL Server:
   - Right-click on the server name
   - Select "Restart"

## Application Setup

### 1. Install the Application

1. Extract the AvevaEdge application files to a folder on your PC (e.g., C:\AvevaEdge)
2. Open Command Prompt as Administrator
3. Navigate to the application folder:
   ```
   cd C:\AvevaEdge
   ```
4. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```
5. Return to the main folder and install backend dependencies:
   ```
   cd ..
   cd backend
   npm install
   ```

### 2. Configure the Database Connection

1. In the backend folder, locate the `.env` file (or create one if it doesn't exist)
2. Edit the file with a text editor (like Notepad) and add these lines:
   ```
   DB_USER=Edge
   DB_PASSWORD=F'yabdellah2025
   DB_SERVER=YOURPCNAME\SQLEXPRESS
   DB_NAME=simulationDB
   DB_INSTANCE=SQLEXPRESS
   PORT=5000
   SOCKET_CORS_ORIGIN=http://localhost:3000
   SOCKET_METHODS=GET,POST
   ```
   (Replace YOURPCNAME with your actual PC name)

### 3. Install Python Dependencies

1. Open Command Prompt as Administrator
2. Navigate to the backend folder:
   ```
   cd C:\AvevaEdge\backend
   ```
3. Install required Python packages:
   ```
   pip install pandas reportlab pyodbc matplotlib flask fpdf
   ```

## Running the Application

### 1. Start the Backend Server

1. Open Command Prompt
2. Navigate to the backend folder:
   ```
   cd C:\AvevaEdge\backend
   ```
3. Start the server:
   ```
   node server.js
   ```
4. The backend should start and display a message like:
   ```
   Server running on port 5000
   Database connected successfully
   ```
5. **Leave this command prompt open** while using the application

### 2. Start the Frontend Server

1. Open a new Command Prompt window
2. Navigate to the frontend folder:
   ```
   cd C:\AvevaEdge\frontend
   ```
3. Start the frontend:
   ```
   npm start
   ```
4. The frontend should start and automatically open in your default web browser
5. **Leave this command prompt open** while using the application

## Accessing the Dashboard

1. If the application doesn't automatically open in your browser, open your web browser and go to:
   ```
   http://localhost:3000
   ```
2. The AvevaEdge Dashboard should now be displayed
3. You can begin interacting with the data, applying filters, and generating reports

## Using the Dashboard

### Overview of Features

- **Dashboard Layout**: The main view includes charts, filters, and a data table
- **Charts**: Toggle between line charts, bar charts, doughnut charts, and scatter plots
- **Filtering**: Use date and time filters to focus on specific periods
- **Data Table**: Displays raw data with pagination and sorting capabilities
- **Real-Time Updates**: Data refreshes automatically to show the latest information
- **Reports**: Generate downloadable reports of the dashboard state

### Common Tasks

#### Filtering Data

1. Click "Show Filters" near the top of the chart area
2. Use the Date Filter to select a specific date range
3. Use the Time Filter to focus on specific hours or minutes
4. Charts and tables will update automatically to show filtered data
5. Click "Clear Filters" to reset to the full dataset

#### Switching Between Chart Types

1. Use the "Previous Chart" and "Next Chart" buttons below the chart area
2. Alternatively, click on the indicator dots to jump directly to a specific chart type

#### Generating a Report

1. Click the "Generate Report" button in the application header
2. The report will be generated and automatically downloaded
3. Open the downloaded file to view the detailed report

## Troubleshooting Common Issues

### Backend Server Won't Start

**Symptoms**: Error messages when starting the backend server

**Solutions**:
1. Check SQL Server connection:
   - Verify SQL Server is running
   - Check that the database name and server name are correct in .env file
   - Ensure the SQL Server login credentials are correct

2. Port conflict:
   - If you see "Port 5000 is already in use", try changing the PORT value in the .env file to 5001
   - Update the frontend's connection settings accordingly

### Frontend Server Won't Start

**Symptoms**: Error messages when starting the frontend server

**Solutions**:
1. Node modules issues:
   - Navigate to frontend folder
   - Delete the "node_modules" folder
   - Run `npm install` again

2. Port conflict:
   - If port 3000 is in use, React will prompt you to use a different port (usually 3001)
   - Accept the prompt to use the alternative port

### Data Not Displaying

**Symptoms**: Charts show "No Data Available"

**Solutions**:
1. Check backend connection:
   - Verify the backend server is running
   - Check browser console for connection errors (press F12 to open developer tools)

2. Check database:
   - Login to SQL Server Management Studio
   - Verify the simulationDB database contains data
   - If no data exists, the application will use the simulation mode

### Report Generation Fails

**Symptoms**: Error when trying to generate reports

**Solutions**:
1. Check Python installation:
   - Verify Python is installed and in the PATH
   - Verify all required Python packages are installed

2. Check file permissions:
   - Ensure the application has permission to write files to the directory

## Support Contacts

If you continue to experience issues:

1. IT Support: [Add your IT support contact]
2. Application Administrator: [Add application administrator contact]
3. Documentation: Refer to the README.md file in the application folder for additional details

---

This installation guide was last updated: May 14, 2025
