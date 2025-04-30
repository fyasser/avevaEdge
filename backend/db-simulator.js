// Database Simulator that provides realistic-looking data
// when the actual SQL Server connection fails

function generateRandomData(count = 1000) {
  const data = [];
  const now = new Date();
  
  // Generate data points covering multiple days
  for (let i = 0; i < count; i++) {
    // Each data point is 15 minutes apart
    const timestamp = new Date(now.getTime() - (i * 15 * 60 * 1000));
    
    // Base value with sinusoidal pattern to simulate real data
    const hourOfDay = timestamp.getHours() + timestamp.getMinutes() / 60;
    const dayFactor = Math.sin(hourOfDay / 24 * Math.PI * 2);
    
    // Add some randomization for realism
    const randomFactor = Math.random() * 0.3 - 0.15;
    
    // Flow rate (rTotalQ) - varies between 100-300
    const flowBase = 200 + (dayFactor * 100);
    const flow = Math.round((flowBase + (randomFactor * flowBase)) * 100) / 100;
    
    // Percentage (rTotalQPercentage) - varies between 40-95
    const percentageBase = 70 + (dayFactor * 25);
    const percentage = Math.round((percentageBase + (randomFactor * percentageBase)) * 100) / 100;
    
    // Counter - varies between 0-100 with occasional high values
    const counterBase = 50 + (dayFactor * 40);
    const counter = Math.round((counterBase + (randomFactor * counterBase)) * 100) / 100;
    
    data.push({
      Time_Stamp: timestamp.toISOString(),
      rTotalQ: flow,
      rTotalQPercentage: percentage,
      counter: counter,
      // Include any other fields that might be expected by the frontend
      pumpId: 1,
      flowRate: flow * 0.8,
      pressure: percentage * 0.5,
      temperature: 20 + (5 * Math.random()),
      status: Math.random() > 0.05 ? 'Running' : 'Warning'
    });
  }
  
  return data;
}

function getHistoricalData(hoursBack = 168, interval = 15) {
  const data = [];
  const now = new Date();
  const pointsCount = (hoursBack * 60) / interval;
  
  for (let i = 0; i < pointsCount; i++) {
    const timestamp = new Date(now.getTime() - (i * interval * 60 * 1000));
    
    // Create pattern with morning peak, midday plateau, and evening peak
    const hourOfDay = timestamp.getHours();
    let baseFactor;
    
    if (hourOfDay >= 6 && hourOfDay < 10) {
      // Morning ramp up
      baseFactor = 0.3 + ((hourOfDay - 6) / 4) * 0.7;
    } else if (hourOfDay >= 10 && hourOfDay < 16) {
      // Midday plateau
      baseFactor = 0.8 + (Math.sin((hourOfDay - 10) / 6 * Math.PI) * 0.2);
    } else if (hourOfDay >= 16 && hourOfDay < 22) {
      // Evening peak and decline
      baseFactor = 1.0 - ((hourOfDay - 16) / 6) * 0.6;
    } else {
      // Night time low
      baseFactor = 0.2 + (Math.random() * 0.1);
    }
    
    // Add day of week pattern - weekends have different patterns
    const dayOfWeek = new Date(timestamp).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayFactor = isWeekend ? 0.7 : 1.0;
    
    // Randomization
    const randomFactor = Math.random() * 0.2 - 0.1;
    
    const finalFactor = baseFactor * dayFactor + randomFactor;
    
    // Generate correlated data
    const flow = Math.round((150 + (finalFactor * 200)) * 100) / 100;
    const percentage = Math.round((60 + (finalFactor * 35)) * 100) / 100;
    const counter = Math.round((40 + (finalFactor * 60)) * 100) / 100;
    
    data.push({
      Time_Stamp: timestamp.toISOString(),
      rTotalQ: flow,
      rTotalQPercentage: percentage,
      counter: counter,
      pumpId: 1,
      flowRate: flow * 0.8,
      pressure: percentage * 0.5,
      temperature: 20 + (5 * Math.random()),
      status: Math.random() > 0.05 ? 'Running' : 'Warning'
    });
  }
  
  return data.sort((a, b) => new Date(a.Time_Stamp) - new Date(b.Time_Stamp));
}

// Function to simulate a specific pump's data
function getPumpData(pumpId, hoursBack = 168) {
  const baseData = getHistoricalData(hoursBack);
  
  // Adjust data based on pump ID to simulate different characteristics
  return baseData.map(item => {
    // Each pump has slightly different characteristics
    const pumpFactor = (pumpId / 5) + 0.8; // Range from 0.8 to 1.8
    
    return {
      ...item,
      pumpId: pumpId,
      rTotalQ: Math.round((item.rTotalQ * pumpFactor) * 100) / 100,
      rTotalQPercentage: Math.min(100, Math.round((item.rTotalQPercentage * (1 / pumpFactor) * 1.1) * 100) / 100),
      counter: Math.min(100, Math.round((item.counter * (1 / pumpFactor) * 1.2) * 100) / 100)
    };
  });
}

// Generate summary data for all pumps
function getSummaryData() {
  const pumps = [1, 2, 3, 4, 5];
  const summary = [];
  
  pumps.forEach(pumpId => {
    const pumpData = getPumpData(pumpId, 2); // Last 2 hours
    
    // Calculate averages
    const avgFlow = pumpData.reduce((sum, item) => sum + item.rTotalQ, 0) / pumpData.length;
    const avgPercentage = pumpData.reduce((sum, item) => sum + item.rTotalQPercentage, 0) / pumpData.length;
    const avgCounter = pumpData.reduce((sum, item) => sum + item.counter, 0) / pumpData.length;
    
    // Last reading
    const lastReading = pumpData[0];
    
    summary.push({
      pumpId,
      avgFlow: Math.round(avgFlow * 100) / 100,
      avgPercentage: Math.round(avgPercentage * 100) / 100,
      avgCounter: Math.round(avgCounter * 100) / 100,
      lastFlow: lastReading.rTotalQ,
      lastPercentage: lastReading.rTotalQPercentage,
      lastCounter: lastReading.counter,
      lastTimestamp: lastReading.Time_Stamp,
      status: Math.random() > 0.1 ? 'Running' : 'Warning'
    });
  });
  
  return summary;
}

module.exports = {
  generateRandomData,
  getHistoricalData,
  getPumpData,
  getSummaryData
};