import React from 'react';

/**
 * Simplified InsightGenerator component that analyzes operational data and provides
 * basic actionable engineering insights without redundant metrics
 */
const InsightGenerator = ({ data, thresholds = {} }) => {
  // No data check
  if (!data || data.length === 0) {
    return (
      <div className="insights-container empty">
        <h3>No data available for insights analysis</h3>
      </div>
    );
  }

  // Default thresholds if not provided - simplified to just the most important ones
  const defaultThresholds = {
    flowVariation: 15,      // % variation considered significant
    pressureThreshold: 80,  // Pressure level that needs attention
    efficiencyMinimum: 65,  // % below which efficiency is concerning
  };

  // Combine provided thresholds with defaults
  const operationalThresholds = { ...defaultThresholds, ...thresholds };

  // Calculate key statistics - simplified to essential calculations
  const flowValues = data.map(item => item.rTotalQ);
  const pressureValues = data.map(item => item.rTotalQPercentage);
  const efficiencyValues = data.map(item => item.counter);

  const avgFlow = flowValues.reduce((a, b) => a + b, 0) / flowValues.length;
  const avgPressure = pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length;
  const avgEfficiency = efficiencyValues.reduce((a, b) => a + b, 0) / efficiencyValues.length;
  
  // Find max and min values - simplified calculations
  const maxFlow = Math.max(...flowValues);
  const minFlow = Math.min(...flowValues);
  
  // Flow stability analysis - simple and direct
  const flowVariationPercent = ((maxFlow - minFlow) / avgFlow) * 100;
  const isFlowStable = flowVariationPercent < operationalThresholds.flowVariation;
  
  // Pressure threshold check - simplified
  const highPressureInstances = pressureValues.filter(p => p > operationalThresholds.pressureThreshold).length;
  const highPressurePercentage = (highPressureInstances / pressureValues.length) * 100;
  
  // Efficiency analysis - simplified
  const lowEfficiencyInstances = efficiencyValues.filter(e => e < operationalThresholds.efficiencyMinimum).length;
  const lowEfficiencyPercentage = (lowEfficiencyInstances / efficiencyValues.length) * 100;

  // Generate insights based on analysis - reduced to just 2-3 key insights
  const insights = [];
  
  // Flow insight - just one key insight instead of multiple
  if (!isFlowStable && flowVariationPercent > operationalThresholds.flowVariation * 1.5) {
    insights.push({
      type: 'warning',
      title: 'Flow Stability Issue',
      description: `Flow variation of ${flowVariationPercent.toFixed(1)}% is high`,
      recommendation: 'Check system for issues',
      icon: 'warning'
    });
  }

  // Pressure insight - just when significantly high
  if (highPressurePercentage > 20) {
    insights.push({
      type: 'danger',
      title: 'High Pressure Detected',
      description: `System pressure exceeded threshold ${highPressurePercentage.toFixed(1)}% of time`,
      recommendation: 'Verify pressure relief systems',
      icon: 'error'
    });
  }

  // Efficiency insight - only if a significant issue
  if (lowEfficiencyPercentage > 30) {
    insights.push({
      type: 'warning',
      title: 'Low System Efficiency',
      description: `System efficiency below minimum ${lowEfficiencyPercentage.toFixed(1)}% of time`,
      recommendation: 'Schedule maintenance check',
      icon: 'trending_down'
    });
  }

  // If no issues found, add a simple "all good" insight
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      title: 'System Operating Normally',
      description: 'All parameters within expected ranges',
      recommendation: 'Continue normal operation',
      icon: 'check_circle'
    });
  }

  return (
    <div className="insights-container">
      <h3 className="insights-header">
        <span className="material-icons">lightbulb</span>
        Key System Insights
      </h3>
      
      {/* Metrics summary removed to avoid redundancy with top metrics panel */}
      
      <div className="insights-list">
        {insights.map((insight, index) => (
          <div key={index} className={`insight-card ${insight.type}`}>
            <div className="insight-header">
              <span className="material-icons">{insight.icon}</span>
              <h4>{insight.title}</h4>
            </div>
            <div className="insight-body">
              <p>{insight.description}</p>
              <div className="recommendation">
                <strong>Recommendation:</strong> {insight.recommendation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightGenerator;