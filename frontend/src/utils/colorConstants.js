// Color constants for consistent visualization across the application
export const COLORS = {
  // Main AVEVA color palette
  AVEVA_BLUE: 'rgb(9, 56, 92)',
  AVEVA_BLUE_LIGHT: 'rgba(0, 79, 139, 0.7)',
  
  // Chart colors
  FLOW_COLOR: 'rgba(75, 192, 192, 1)',
  FLOW_BACKGROUND: 'rgba(75, 192, 192, 0.2)',
  
  PRESSURE_COLOR: 'rgba(255, 99, 132, 1)',
  PRESSURE_BACKGROUND: 'rgba(255, 99, 132, 0.2)',
  
  SYSTEM_FLUID_COLOR: 'rgba(54, 162, 235, 1)',
  SYSTEM_FLUID_BACKGROUND: 'rgba(54, 162, 235, 0.6)',
  
  // Noise colors - consistent across all chart types
  NOISE_COLOR: 'rgba(255, 193, 7, 1)', // AVEVA warning yellow
  NOISE_BACKGROUND: 'rgba(255, 193, 7, 0.2)',
  NOISE_HOVER: 'rgba(255, 193, 7, 0.8)',
  
  // State colors for efficiency visualization
  HIGH_EFFICIENCY: 'rgba(0, 153, 255, 0.7)',
  MEDIUM_EFFICIENCY: 'rgba(46, 204, 113, 0.7)',
  LOW_EFFICIENCY: 'rgba(255, 195, 0, 0.7)',
  VERY_LOW_EFFICIENCY: 'rgba(255, 87, 51, 0.7)',
  
  // UI colors
  GRID_LINES: 'rgba(0, 0, 0, 0.07)',
  TEXT_COLOR: 'rgba(45, 55, 72, 1)',
  TOOLTIP_BACKGROUND: 'rgba(10, 10, 10, 0.9)'
};

// Helper function to get colors based on metric type
export const getMetricColors = (metricType) => {
  switch(metricType.toLowerCase()) {
    case 'flow':
      return {
        primary: COLORS.FLOW_COLOR,
        background: COLORS.FLOW_BACKGROUND,
        hover: 'rgba(75, 192, 192, 0.8)'
      };
    case 'pressure':
      return {
        primary: COLORS.PRESSURE_COLOR,
        background: COLORS.PRESSURE_BACKGROUND,
        hover: 'rgba(255, 99, 132, 0.8)'
      };
    case 'noise':
      return {
        primary: COLORS.NOISE_COLOR,
        background: COLORS.NOISE_BACKGROUND,
        hover: COLORS.NOISE_HOVER
      };
    case 'system':
      return {
        primary: COLORS.SYSTEM_FLUID_COLOR,
        background: COLORS.SYSTEM_FLUID_BACKGROUND,
        hover: 'rgba(54, 162, 235, 0.8)'
      };
    default:
      return {
        primary: COLORS.FLOW_COLOR,
        background: COLORS.FLOW_BACKGROUND,
        hover: 'rgba(75, 192, 192, 0.8)'
      };
  }
};

export default COLORS;
