# AvevaEdge Dashboard Application

## Overview
The AvevaEdge Dashboard Application is a web-based platform designed to visualize and interact with industrial or operational data. It provides real-time updates, interactive charts, and filtering options to help users monitor and analyze system performance effectively.

---

## Features

### Frontend
- **Dashboard Layout**: Includes a sidebar, top bar, and main content area for charts and data tables.
- **Data Visualization**: Supports line charts, scatter plots, doughnut charts, and bar charts.
- **Filters and Aggregation**: Allows users to filter data by date range, thresholds, and aggregation levels.
- **Data Table**: Displays raw data with search, pagination, and sorting capabilities.
- **Real-Time Updates**: Uses Socket.IO to fetch and display new data dynamically.
- **Dark Mode**: Provides a toggle for light and dark themes.
- **Report Generation**: Generates and downloads HTML reports of the dashboard state.

### Backend
- **Database Integration**: Connects to a SQL Server database to fetch and filter data.
- **Real-Time Communication**: Uses Socket.IO to send real-time updates to the frontend.
- **API Endpoints**: Provides RESTful APIs for fetching filtered data and generating reports.
- **Error Handling**: Includes robust error handling for database and API operations.
- **Polling Mechanism**: Periodically checks for new data and emits updates to connected clients.

---

## Technologies Used

### Frontend
- **React**: For building the user interface.
- **Chart.js**: For rendering interactive charts.
- **Tailwind CSS**: For styling and responsive design.
- **FileSaver.js**: For downloading reports.
- **Date-fns**: For date formatting and manipulation.

### Backend
- **Node.js**: For server-side logic.
- **Express**: For building RESTful APIs.
- **Socket.IO**: For real-time communication.
- **MSSQL**: For database operations.
- **Python**: For advanced report generation (via `generate_report.py`).

---

## Project Structure

### Frontend
- **`src/`**: Contains all React components and utilities.
  - **`App.js`**: Main component managing the dashboard layout and state.
  - **`components/`**: Modular components like `ReportChart`, `FilterOptions`, and `DataTable`.
  - **`utils/`**: Utility functions for data processing and chart management.
  - **`public/`**: Static assets like `index.html` and icons.

### Backend
- **`server.js`**: Main server file handling API routes, Socket.IO events, and database connections.
- **`db-simulator.js`**: Simulates database operations for testing purposes.
- **`generate_report.py`**: Python script for generating detailed reports.
- **`routes/`**: API routes for data fetching and report generation.

---

## Setup Instructions

### Prerequisites
- **Node.js**: Install the latest version.
- **SQL Server**: Ensure a running instance with the required database.
- **Python**: For running the report generation script.

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Aveva
   ```
2. Install dependencies for both frontend and backend:
   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

### Configuration
- Update the database connection settings in `backend/server.js`.
- Ensure the SQL Server database is accessible with the provided credentials.

### Running the Application
1. Start the backend server:
   ```bash
   cd backend
   node server.js
   ```
2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```
3. Open the application in your browser at `http://localhost:3000`.

---

## Usage
- **Filters**: Apply filters to refine data displayed in charts and tables.
- **Real-Time Updates**: View live data updates without refreshing the page.
- **Report Generation**: Generate and download reports for analysis.

---

## API Endpoints
- **`GET /api/trend-data`**: Fetches filtered data from the database.
- **`POST /generate-report`**: Initiates report generation.
- **`GET /`**: Test route to verify database connection.

---

## Troubleshooting
- **Database Connection Issues**: Check the SQL Server configuration and credentials in `server.js`.
- **Frontend Not Loading**: Ensure the backend server is running and accessible.
- **Real-Time Updates Not Working**: Verify Socket.IO is correctly configured and not blocked by firewalls.

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contributors
- [Farida Kassem] - Developer
---
