import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, PageBreak
import pyodbc
import matplotlib.pyplot as plt
import io
from reportlab.lib.utils import ImageReader

# Database connection configuration
DB_CONFIG = {
    'server': 'WEGPC1GAG9KL\\SQLEXPRESS',
    'database': 'simulationDB',
    'username': 'Edge',
    'password': "F'yabdellah2025",
    'driver': '{ODBC Driver 17 for SQL Server}'
}

def fetch_data():
    """Fetch data from the database and return as a pandas DataFrame."""
    connection_string = (
        f"DRIVER={DB_CONFIG['driver']};"
        f"SERVER={DB_CONFIG['server']};"
        f"DATABASE={DB_CONFIG['database']};"
        f"UID={DB_CONFIG['username']};"
        f"PWD={DB_CONFIG['password']}"
    )
    try:
        conn = pyodbc.connect(connection_string)
        query = "SELECT TOP 100 Time_Stamp, Time_Stamp_ms, counter, rTotalQ, rTotalQPercentage FROM TREND001"
        df = pd.read_sql(query, conn)
        conn.close()
        return df
    except Exception as e:
        print("Error fetching data:", e)
        return pd.DataFrame()

def generate_visualizations(data):
    """Generate visualizations and return them as images with high quality."""
    # Line Chart for Flow over Time
    timestamps = [row[0] for row in data]
    flow = [row[3] for row in data]
    plt.figure(figsize=(10, 5), dpi=300)  # Increased DPI for better quality
    plt.plot(timestamps, flow, label='Flow', color='blue')
    plt.title('Flow Over Time')
    plt.xlabel('Timestamp')
    plt.ylabel('Flow')
    plt.legend()
    flow_chart = io.BytesIO()
    plt.savefig(flow_chart, format='png', dpi=300)  # Save with high DPI
    flow_chart.seek(0)
    plt.close()

    # Scatter Plot for Flow vs Pressure
    pressure = [row[4] for row in data]
    plt.figure(figsize=(10, 5), dpi=300)  # Increased DPI for better quality
    plt.scatter(flow, pressure, label='Flow vs Pressure', color='green')
    plt.title('Flow vs Pressure')
    plt.xlabel('Flow')
    plt.ylabel('Pressure')
    plt.legend()
    scatter_chart = io.BytesIO()
    plt.savefig(scatter_chart, format='png', dpi=300)  # Save with high DPI
    scatter_chart.seek(0)
    plt.close()

    # Bar Chart for Counter Distribution
    counters = [row[2] for row in data]
    plt.figure(figsize=(10, 5), dpi=600)  # Increased DPI for better quality
    plt.bar(range(len(counters)), counters, color='orange')
    plt.title('Counter Distribution')
    plt.xlabel('Index')
    plt.ylabel('Counter')
    bar_chart = io.BytesIO()
    plt.savefig(bar_chart, format='png', dpi=300)  # Save with high DPI
    bar_chart.seek(0)
    plt.close()

    return flow_chart, scatter_chart, bar_chart

def add_header_footer(c, width, height):
    """Add a header and footer to the PDF."""
    # Header
    c.setFillColor(colors.darkblue)
    c.rect(0, height - 50, width, 50, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(30, height - 35, "Trend Data Report")

    # Footer
    c.setFillColor(colors.darkblue)
    c.rect(0, 0, width, 50, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 10)
    c.drawString(30, 20, "Generated on April 17, 2025")
    c.drawRightString(width - 30, 20, "Page %d" % c.getPageNumber())

def generate_pdf(df, filename="report.pdf"):
    """Generate a PDF report."""
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Add header and footer
    add_header_footer(c, width, height)

    # Summary Statistics
    avg_flow = df['rTotalQ'].mean()
    max_flow = df['rTotalQ'].max()
    min_flow = df['rTotalQ'].min()
    avg_percentage = df['rTotalQPercentage'].mean()
    max_percentage = df['rTotalQPercentage'].max()
    min_percentage = df['rTotalQPercentage'].min()

    c.setFont("Helvetica", 12)
    c.setFillColor(colors.black)
    c.drawString(50, height - 100, f"Average Flow: {avg_flow:.2f}")
    c.drawString(50, height - 120, f"Max Flow: {max_flow:.2f}")
    c.drawString(50, height - 140, f"Min Flow: {min_flow:.2f}")
    c.drawString(50, height - 160, f"Average Percentage: {avg_percentage:.2f}")
    c.drawString(50, height - 180, f"Max Percentage: {max_percentage:.2f}")
    c.drawString(50, height - 200, f"Min Percentage: {min_percentage:.2f}")

    # Generate Visualizations
    flow_chart, scatter_chart, bar_chart = generate_visualizations(df.values.tolist())

    # Add Visualizations to PDF
    c.drawImage(ImageReader(flow_chart), 50, height - 400, width=500, height=150)
    c.drawImage(ImageReader(scatter_chart), 50, height - 600, width=500, height=150)
    c.showPage()

    # Add Bar Chart on a new page
    add_header_footer(c, width, height)
    c.drawImage(ImageReader(bar_chart), 50, height - 200, width=500, height=300)
    c.showPage()

    # Table data
    table_data = [df.columns.tolist()] + df.values.tolist()

    # Create table
    table = Table(table_data, colWidths=[100] * len(df.columns))
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))

    # Adjust table position and handle page overflow
    x_offset = 50
    y_offset = height - 100  # Adjust for margins and title

    table.wrapOn(c, width, height)
    table.drawOn(c, x_offset, y_offset - table._height)

    # Save PDF
    c.save()
    print(f"Report saved as {filename}")

if __name__ == "__main__":
    print("Fetching data from the database...")
    df = fetch_data()
    if not df.empty:
        print("Generating PDF report...")
        generate_pdf(df)
    else:
        print("No data available to generate the report.")