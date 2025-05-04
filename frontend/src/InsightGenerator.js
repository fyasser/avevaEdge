import React from 'react';
import { getFluidStateDescription } from './utils/chartInstanceManager';

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
  const efficiencyValues = data.map(item => item.flowPressureIndex);
  const systemFluidStates = data.map(item => item.systemFluidState || item.counter || 0);

  const avgFlow = flowValues.reduce((a, b) => a + b, 0) / flowValues.length;
  const avgPressure = pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length;
  const avgEfficiency = efficiencyValues.reduce((a, b) => a + b, 0) / efficiencyValues.length;
  
  // Calculate average system fluid state
  const avgSystemFluidState = systemFluidStates.reduce((a, b) => a + b, 0) / systemFluidStates.length;
  const currentFluidState = Math.round(avgSystemFluidState) % 5;
  const fluidStateInfo = getFluidStateDescription(currentFluidState);
  
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
  
  // System Fluid State insight - always show this insight
  insights.push({
    type: 'info',
    title: 'Current System Fluid State',
    description: `The system fluid is currently in a ${fluidStateInfo.description.toLowerCase()} state (${currentFluidState}/4).`,
    recommendation: getFluidStateRecommendation(currentFluidState),
    icon: 'opacity'
  });

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
      title: 'Low System Fluid State',
      description: `System fluid state below minimum ${lowEfficiencyPercentage.toFixed(1)}% of time`,
      recommendation: 'Schedule maintenance check',
      icon: 'trending_down'
    });
  }

  // If no issues found (except fluid state info), add a simple "all good" insight
  if (insights.length === 1) {
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

/**
 * Generate fluid state recommendations based on current fluid state
 * @param {number} fluidState - The current fluid state (0-4)
 * @returns {string} Recommendation text
 */
function getFluidStateRecommendation(fluidState) {
  switch (fluidState) {
    case 0:
      return "Solid state detected - Check for flow blockages and consider heating system to increase flow.";
    case 1:
      return "Semi-solid state - Monitor heating system performance and pump pressure to ensure proper flow.";
    case 2:
      return "Slurry state - Ensure proper mixing and pump configuration to prevent settling.";
    case 3:
      return "Liquid state - System is operating in optimal flow conditions. Maintain current parameters.";
    case 4:
      return "Gaseous state - Monitor for cavitation and verify pressure settings to prevent system damage.";
    default:
      return "Monitor system fluid state for changes.";
  }
}

export default InsightGenerator;