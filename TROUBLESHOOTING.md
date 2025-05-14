# AvevaEdge Dashboard Application - Troubleshooting Guide

This guide addresses common issues users may encounter when installing or running the AvevaEdge Dashboard application and provides step-by-step solutions.

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Database Connection Problems](#database-connection-problems)
3. [Frontend Display Problems](#frontend-display-problems)
4. [Performance Issues](#performance-issues)
5. [Data Visualization Issues](#data-visualization-issues)
6. [Report Generation Problems](#report-generation-problems)
7. [System Requirements Check](#system-requirements-check)

## Installation Issues

### Node.js Installation Failures

**Problem**: Error messages during Node.js installation or "node not recognized" errors.

**Solutions**:
1. **Verify administrator privileges**:
   - Right-click the installer and select "Run as administrator"

2. **Path issue**:
   - Open System Properties (Right-click on This PC > Properties > Advanced system settings)
   - Click "Environment Variables"
   - Check if Node.js paths are in the "Path" variable (should include entries like C:\Program Files\nodejs\)
   - If missing, add them manually

3. **Clean reinstall**:
   - Uninstall Node.js from Control Panel
   - Delete any remaining Node.js folders in Program Files
   - Restart your computer
   - Download a fresh copy of the installer and try again

### SQL Server Installation Problems

**Problem**: SQL Server installation fails or server doesn't start.

**Solutions**:
1. **Check system requirements**:
   - Ensure your system meets the minimum requirements for SQL Server Express
   - Verify you have at least 2GB of free disk space

2. **Resolve port conflicts**:
   - SQL Server typically uses port 1433
   - Check if another service is using this port:
     ```
     netstat -ano | findstr 1433
     ```
   - If another service is using the port, you can configure SQL Server to use a different port

3. **Windows updates**:
   - Ensure Windows is up to date
   - Some SQL Server versions require specific Windows updates

## Database Connection Problems

### Cannot Connect to Database

**Problem**: Backend server shows "Failed to connect to database" errors.

**Solutions**:
1. **Verify SQL Server is running**:
   - Open Services (Press Win+R, type "services.msc")
   - Find "SQL Server (SQLEXPRESS)" and ensure it's "Running"
   - If not, right-click and select "Start"

2. **Check connection string**:
   - Verify server name in your .env file matches your SQL Server instance name
   - Common format is: `COMPUTERNAME\SQLEXPRESS`
   - You can confirm your instance name in SQL Server Configuration Manager

3. **Authentication issues**:
   - Verify SQL Server is configured for SQL Server authentication (not just Windows authentication)
   - Confirm the username and password in your .env file match what you created
   - Try connecting with SQL Server Management Studio to verify credentials work

4. **Firewall issues**:
   - Temporarily disable Windows Firewall to test connection
   - If this resolves the issue, add exceptions for SQL Server and Node.js application

### Database Not Initialized

**Problem**: Application shows "Table not found" or similar database structure errors.

**Solutions**:
1. **Verify database exists**:
   - Open SQL Server Management Studio
   - Connect to your instance
   - Check if "simulationDB" database exists
   - If not, create it manually

2. **Check if schema is created**:
   - If tables are missing, the application should initialize them automatically
   - Check server logs for schema creation errors
   - You can manually create missing tables if needed (see schema documentation)

## Frontend Display Problems

### Application Won't Start

**Problem**: Frontend fails to start or shows errors in the command prompt.

**Solutions**:
1. **Node module issues**:
   - Navigate to the frontend directory
   - Delete the "node_modules" folder
   - Run `npm install` to reinstall dependencies
   - Try starting the frontend again with `npm start`

2. **Port conflicts**:
   - Default port 3000 may be in use by another application
   - Change the port by setting the PORT environment variable:
     ```
     set PORT=3001
     npm start
     ```
   - Or accept the prompt to use an alternative port when offered

3. **Outdated packages**:
   - Update npm packages:
     ```
     npm update
     ```

### White Screen or Blank Page

**Problem**: Browser opens but shows blank white page with no content.

**Solutions**:
1. **Check browser console**:
   - Open browser developer tools (F12)
   - Look for errors in the Console tab
   - Address specific errors shown

2. **Backend connection**:
   - Verify backend server is running
   - Check if backend URL is correctly configured (should point to http://localhost:5000)
   - Try accessing backend directly in browser (http://localhost:5000) to see if it responds

3. **Cache issues**:
   - Clear browser cache and cookies
   - Try in incognito/private browsing mode
   - Try a different browser

## Performance Issues

### Slow Application Load Time

**Problem**: Dashboard takes a long time to load initially.

**Solutions**:
1. **Check database size**:
   - Large datasets can slow initial loading
   - Consider implementing data archiving strategies
   - Use the application's data aggregation features

2. **Hardware limitations**:
   - Verify system meets recommended requirements
   - Close other resource-intensive applications
   - If using a virtual machine, increase allocated resources

3. **Network issues**:
   - On networked systems, check network performance
   - Reduce network latency by ensuring backend and frontend run on the same machine

### Charts Render Slowly

**Problem**: Charts take a long time to update when changing views or applying filters.

**Solutions**:
1. **Reduce data points**:
   - Use date filters to limit the displayed time range
   - Increase data aggregation level (minute to hour, hour to day)
   - In application settings, reduce maximum displayed data points

2. **Browser performance**:
   - Use Chrome or Edge for best performance with Chart.js
   - Disable unnecessary browser extensions
   - Enable hardware acceleration in browser settings

## Data Visualization Issues

### Charts Show "No Data Available"

**Problem**: Charts display "No Data Available" message instead of data.

**Solutions**:
1. **Check filters**:
   - Verify that current filter settings aren't excluding all data
   - Click "Clear Filters" button to reset all filters
   - Try widening the date range filter

2. **Database content**:
   - Verify database contains data in the expected tables
   - Check data ranges match what you're trying to display
   - Database might be empty if this is a new installation

3. **Data format**:
   - Check if date formats in the database match expected formats
   - Ensure numerical columns contain valid numbers, not text

### Incorrect Data Display

**Problem**: Charts or tables show incorrect values or unexpected patterns.

**Solutions**:
1. **Date/time issues**:
   - Check if timezone settings are affecting data display
   - Verify server and client time settings are aligned

2. **Data aggregation**:
   - Check if data aggregation settings are appropriate for your analysis
   - Different aggregation methods (sum, average, max) can show very different results

3. **Scale issues**:
   - Verify axis scales are appropriate for the data ranges
   - Check if auto-scaling is enabled/disabled as needed

## Report Generation Problems

### Reports Fail to Generate

**Problem**: Clicking "Generate Report" doesn't produce a downloadable report.

**Solutions**:
1. **Python installation**:
   - Verify Python is correctly installed and in the system PATH
   - Check required Python libraries are installed:
     ```
     pip list | findstr "reportlab pandas pyodbc matplotlib fpdf"
     ```
   - If any are missing, install them:
     ```
     pip install reportlab pandas pyodbc matplotlib fpdf
     ```

2. **File permissions**:
   - Ensure the application has permission to write files to the temp directory
   - Try running the command prompt as administrator

3. **Backend connectivity**:
   - Ensure backend server is running
   - Check browser console for API errors when generating reports

### Report Missing Data

**Problem**: Generated reports are incomplete or missing sections.

**Solutions**:
1. **Filter settings**:
   - Current filters affect report content
   - Ensure filters are set correctly before generating reports
   - Try with minimal filters to see if more data appears

2. **Data access**:
   - Report generation may use different database queries
   - Check if the database user has proper permissions for all tables
   - Verify backend logs for any query errors during report generation

## System Requirements Check

If you're experiencing persistent issues, verify your system meets these requirements:

### Hardware Requirements
- **CPU**: Intel Core i5 (2.4 GHz) or better
- **RAM**: 8 GB minimum (16 GB recommended)
- **Disk Space**: 2 GB free minimum
- **Display**: 1366×768 resolution or higher

### Software Requirements
- **Operating System**: Windows 10 or newer
- **Node.js**: v14.0 or newer
- **SQL Server**: Express 2019 or newer
- **Python**: 3.9 or newer
- **Browser**: Chrome (recommended), Firefox, or Edge latest version

### Network Requirements
- Frontend to backend: localhost communication (ports 3000 and 5000)
- Backend to database: localhost or network (port 1433 for SQL Server)

## Additional Support

If the above solutions don't resolve your issue:

1. Check the application logs:
   - Frontend: Browser console (F12)
   - Backend: Command prompt running the server
   - Database: SQL Server error logs

2. Generate a system information report:
   - Open Command Prompt
   - Run: `systeminfo > sysinfo.txt`
   - This creates a text file with your system details that can help support personnel

3. Contact technical support:
   - Email: [Add support email]
   - Include: Problem description, steps to reproduce, screenshots, and system info

---

If you need further assistance, please contact your system administrator or application support team.
