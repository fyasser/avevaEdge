# AvevaEdge Dashboard Application - Quick Start Guide

This guide provides the essential steps to get the AvevaEdge Dashboard up and running quickly on your local PC.

## 1. System Requirements

- Windows 10 or newer
- 8 GB RAM minimum
- 2 GB free disk space
- Modern web browser (Chrome recommended)

## 2. Pre-Installation Checklist

Ensure you have administrator access to your PC to install:
- Node.js (v14.0 or newer)
- SQL Server Express
- Python 3.9 or newer

## 3. Installation Steps (Quick Version)

### Install Required Software

1. **Install Node.js**
   - Download from: https://nodejs.org/ (LTS version)
   - Run installer with default options

2. **Install SQL Server Express**
   - Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Choose "Basic" installation
   - Note your server name (e.g., YOURPC\SQLEXPRESS)

3. **Install Python**
   - Download from: https://www.python.org/downloads/
   - CHECK "Add Python to PATH" during installation

### Set Up the Database

1. Create database named `simulationDB`
2. Create SQL login: Username = `Edge`, Password = `F'yabdellah2025`
3. Give the login db_owner permissions to simulationDB

### Set Up the Application

1. Extract application files to a folder (e.g., C:\AvevaEdge)

2. Open Command Prompt as Administrator

3. Install frontend dependencies:
   ```
   cd C:\AvevaEdge\frontend
   npm install
   ```

4. Install backend dependencies:
   ```
   cd ..\backend
   npm install
   ```

5. Install Python packages:
   ```
   pip install pandas reportlab pyodbc matplotlib flask fpdf
   ```

6. Configure database connection:
   - Create or edit `.env` file in the backend folder
   - Add:
     ```
     DB_USER=Edge
     DB_PASSWORD=F'yabdellah2025
     DB_SERVER=YOURPC\SQLEXPRESS
     DB_NAME=simulationDB
     DB_INSTANCE=SQLEXPRESS
     ```
     (Replace YOURPC with your actual PC name)

## 4. Starting the Application

### Start Backend Server

1. Open Command Prompt
2. Navigate to backend folder:
   ```
   cd C:\AvevaEdge\backend
   ```
3. Run:
   ```
   node server.js
   ```
4. You should see "Server running on port 5000" and "Database connected successfully"

### Start Frontend Server

1. Open a new Command Prompt window
2. Navigate to frontend folder:
   ```
   cd C:\AvevaEdge\frontend
   ```
3. Run:
   ```
   npm start
   ```
4. Browser should automatically open to http://localhost:3000

## 5. Verifying Installation

1. The dashboard should display with charts and data
2. The status indicator should show "Connected"
3. Try switching between different chart types using the navigation buttons
4. Apply a date filter to test functionality

## 6. Common Issues and Solutions

| Problem | Solution |
|---------|----------|
| "Cannot connect to database" | Check SQL Server is running and credentials are correct |
| "Module not found" errors | Run `npm install` in both frontend and backend folders |
| Blank page in browser | Verify backend server is running on port 5000 |
| Charts show "No Data" | Try clearing filters or check database connection |

## 7. Next Steps

- For detailed usage instructions, see the USER_GUIDE.md file
- For complete installation details, see the INSTALLATION_GUIDE.md file

## 8. Support

If you encounter issues, please contact:
- Email: [Add support email]
- Phone: [Add support phone number]
- Hours: [Add support hours]
