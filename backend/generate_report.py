import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, PageBreak
import pyodbc
import matplotlib.pyplot as plt
import io
from reportlab.lib.utils import ImageReader
from datetime import datetime
import json
from flask import Flask, request, send_file
from fpdf import FPDF

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

    # Add header with dynamic date and time
    c.setFont("Helvetica-Bold", 16)
    c.drawString(30, height - 50, "Trend Data Report")
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 65, f"Generated on: {datetime.now().strftime('%B %d, %Y %H:%M:%S')}")

    # Add summary section
    avg_flow = df['rTotalQ'].mean()
    max_flow = df['rTotalQ'].max()
    min_flow = df['rTotalQ'].min()
    avg_pressure = df['rTotalQPercentage'].mean()
    max_pressure = df['rTotalQPercentage'].max()
    min_pressure = df['rTotalQPercentage'].min()

    c.setFont("Helvetica", 12)
    c.drawString(30, height - 100, f"Average Flow: {avg_flow:.2f}")
    c.drawString(30, height - 115, f"Max Flow: {max_flow:.2f}")
    c.drawString(30, height - 130, f"Min Flow: {min_flow:.2f}")
    c.drawString(30, height - 145, f"Average Pressure: {avg_pressure:.2f}")
    c.drawString(30, height - 160, f"Max Pressure: {max_pressure:.2f}")
    c.drawString(30, height - 175, f"Min Pressure: {min_pressure:.2f}")

    # Add charts to the PDF
    flow_chart = io.BytesIO()
    plt.figure(figsize=(6, 4))
    plt.plot(df['Time_Stamp'], df['rTotalQ'], label='Flow', color='blue')
    plt.title('Flow Over Time')
    plt.xlabel('Time')
    plt.ylabel('Flow')
    plt.legend()
    plt.savefig(flow_chart, format='png')
    flow_chart.seek(0)
    plt.close()

    c.drawImage(ImageReader(flow_chart), 30, height - 400, width=500, height=150)

    # Add table with improved formatting
    table_data = [df.columns.tolist()] + df.values.tolist()
    table = Table(table_data, colWidths=[100] * len(df.columns))
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))

    table.wrapOn(c, width, height)
    table.drawOn(c, 30, height - 600)

    # Add page numbers
    c.drawString(30, 20, f"Page {c.getPageNumber()}")

    c.save()
    print(f"Report saved as {filename}")

app = Flask(__name__)

@app.route('/generate-report', methods=['POST'])
def generate_report():
    data = request.json
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    chart_types = data.get('chartTypes', [])

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(40, 10, 'Aveva Report')
    pdf.ln(10)
    pdf.set_font('Arial', '', 12)
    pdf.cell(40, 10, f'Date Range: {start_date} to {end_date}')
    pdf.ln(10)

    for chart in chart_types:
        pdf.cell(40, 10, f'Included Chart: {chart}')
        pdf.ln(10)

    pdf.output('report.pdf')
    return send_file('report.pdf', as_attachment=True)

@app.route('/download-html', methods=['GET'])
def download_html():
    """Endpoint to download the entire page's functionality as an HTML file."""
    html_content = """<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Aveva Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        select, button {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <h1>Aveva Report</h1>
    <form>
        <label for='chartType'>Select Chart Types:</label>
        <select name='chartType' multiple style='width: 100%;'>
            <option value='line'>Line Chart</option>
            <option value='scatter'>Scatter Chart</option>
            <option value='radar'>Radar Chart</option>
            <option value='doughnut'>Doughnut Chart</option>
        </select>
        <br>
        <button type='submit'>Generate Report</button>
    </form>
</body>
</html>"""

    with open('page.html', 'w', encoding='utf-8') as file:
        file.write(html_content)

    return send_file('page.html', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)

if __name__ == "__main__":
    print("Fetching data from the database...")
    df = fetch_data()
    if not df.empty:
        print("Generating PDF report...")
        generate_pdf(df)
    else:
        print("No data available to generate the report.")