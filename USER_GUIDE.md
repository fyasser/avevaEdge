# AvevaEdge Dashboard Application - User Guide

This user guide provides detailed instructions on how to use the AvevaEdge Dashboard application to monitor and analyze industrial or operational data.

## Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Key Metrics](#key-metrics)
3. [Working with Charts](#working-with-charts)
4. [Using Filters](#using-filters)
5. [Data Table Features](#data-table-features)
6. [Real-Time Updates](#real-time-updates)
7. [Generating Reports](#generating-reports)
8. [Data Analysis Capabilities](#data-analysis-capabilities)
9. [Customization Options](#customization-options)
10. [Troubleshooting](#troubleshooting)

## Dashboard Overview

The AvevaEdge Dashboard provides a comprehensive interface for visualizing and analyzing operational data:

- **Top Bar**: Contains the application title, theme toggle, and report generation button
- **Main Content Area**: Displays interactive charts and data tables
- **Chart Carousel**: Allows you to switch between different chart types
- **Filter Panel**: Provides options to filter data by various parameters
- **Data Table**: Displays detailed metrics with sorting and pagination options

## Key Metrics

The dashboard tracks four critical operational metrics:

### Flow (m³/h)
- Measures the volume of fluid moving through the system per hour
- Visualized primarily through line charts and scatter plots
- Typical range: 0-2000 m³/h

### Pressure (kPa)
- Tracks pressure levels within the system in kilopascals
- Visualized through line charts and as a secondary metric in scatter plots
- Typical range: 0-5000 kPa

### System Fluid State
- A composite metric representing the overall health of the fluid system
- Scaled from 0-100 (higher is better)
- Visualized through the distribution chart and as point sizes in scatter plots

### Noise (dB)
- Measures acoustic emissions from the system
- Helps identify mechanical issues or abnormal operation
- Visualized using AVEVA's warning yellow color across all charts
- Typical range: 0-120 dB

## Working with Charts

The AvevaEdge Dashboard offers four different chart types, each providing unique insights:

### Line Chart
- Shows trends over time for flow, pressure, and noise
- Hover over points to see exact values
- Use to identify patterns and anomalies over time

### Bar Chart
- Compares values across categories or time periods
- Good for comparing relative sizes of different metrics
- Shows clear visual separation between data points

### Distribution Chart (Doughnut)
- Shows the proportion of each metric relative to the total
- Helps understand the balance between different system parameters
- Click on segments to highlight specific metrics

### Scatter Plot
- Shows relationships between two variables (e.g., Flow vs Pressure)
- Point size represents System Fluid State
- Point color represents efficiency level
- Use to identify correlations and clusters

### Chart Navigation
1. Use the "Previous Chart" and "Next Chart" buttons below the chart
2. Click directly on the indicator dots to jump to a specific chart
3. Hover over data points to see detailed tooltips with exact values

## Using Filters

Filters allow you to focus on specific data subsets:

### Date Filter
1. Click "Show Filters" at the top of the chart area
2. Use the Date Filter to select a date range
3. The calendar interface allows you to select start and end dates
4. Click "Apply" to update the charts with filtered data

### Time Filter
1. In the filter panel, use the Time Filter dropdown
2. Filter by specific hours, minutes, or seconds
3. Combine with date filters for precise time windows
4. Useful for isolating specific operational periods

### Aggregation Options
1. Use Time Aggregation to group data by minute, hour, day, or month
2. Helps identify broader trends by reducing data granularity
3. Particularly useful for large datasets spanning long time periods

### Clearing Filters
1. Click "Clear Filters" to reset all filters
2. Individual filters can be cleared using the "X" button next to each filter
3. When filters are active, a green indicator shows how many are applied

## Data Table Features

The data table provides detailed access to all metrics:

### Basic Features
- View raw data in tabular format
- Sort any column by clicking on the column header
- Page through large datasets using the pagination controls
- Adjust rows per page using the dropdown selector

### Advanced Features
- Search functionality to find specific values
- Column customization to show/hide specific metrics
- Click on a row to see additional details for that time point
- Export table data for further analysis

## Real-Time Updates

The AvevaEdge Dashboard provides real-time data monitoring:

1. New data is automatically fetched from the server
2. Charts and tables update dynamically as new data arrives
3. A subtle visual indicator shows when updates occur
4. Maintains filter settings during updates so you don't lose context

## Generating Reports

To create a downloadable report of the current dashboard state:

1. Click the "Generate Report" button in the application header
2. The system will capture the current view, including all charts and filters
3. A report file will be automatically downloaded to your computer
4. Reports include a summary of applied filters and key statistics
5. For more detailed reports, use the "Detailed Report" option

## Data Analysis Capabilities

The dashboard provides several powerful analysis tools:

### Statistical Summaries
- View averages, minimums, maximums, and standard deviations
- Automatically calculated for all visible data
- Updates when filters are applied

### Trend Analysis
- Identifies whether metrics are trending up, down, or stable
- Calculates rate of change over selected time periods
- Visual indicators show trend direction and magnitude

### Correlation Analysis
- Examines relationships between different metrics
- Flow-pressure correlation coefficient
- Noise-flow correlation coefficient
- System efficiency impact analysis

### Threshold Monitoring
- Set thresholds for critical metrics
- Visual indicators when thresholds are exceeded
- Helps identify abnormal conditions quickly

## Customization Options

Personalize your dashboard experience:

### Dark Mode
- Toggle between light and dark themes using the button in the top bar
- Dark mode reduces eye strain in low-light environments
- Settings are saved between sessions

### Layout Adjustments
- Resize chart and table sections by dragging the divider
- Collapse sections you don't need to focus on others
- Your layout preferences are saved for future sessions

### Chart Preferences
- Adjust chart colors and styles
- Set default chart type
- Configure tooltip display options

## Troubleshooting

Solutions for common issues:

### No Data Displayed
- Check that the backend server is running
- Verify that filters aren't excluding all data
- Click "Clear Filters" to reset to default view
- Check network connection to the data source

### Charts Not Updating
- Verify that real-time updates are enabled
- Check backend connection in the status indicator
- Try refreshing the browser page

### Report Generation Fails
- Ensure Python components are properly installed
- Check that the backend server is running
- Verify file permissions for report output directory

### Filter Issues
- If filters seem stuck, try clearing all filters and applying them again
- Very narrow date/time ranges might exclude all data
- Check that time filter settings are appropriate for your dataset

---

For additional support, please contact your system administrator or refer to the technical documentation provided with the application.
