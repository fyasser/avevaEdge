// frontend/src/utils/aggregationUtils.js

/**
 * Formats a timestamp string or Date object into a key for grouping by minute.
 * @param {string|Date} timestamp - The timestamp to format.
 * @returns {string} - YYYY-MM-DDTHH:MM
 */
const getMinuteKey = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/**
 * Formats a timestamp string or Date object into a key for grouping by day.
 * @param {string|Date} timestamp - The timestamp to format.
 * @returns {string} - YYYY-MM-DD
 */
const getDayKey = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Formats a timestamp string or Date object into a key for grouping by month.
 * @param {string|Date} timestamp - The timestamp to format.
 * @returns {string} - YYYY-MM
 */
const getMonthKey = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Aggregates data by the specified time level.
 * @param {Array<Object>} data - The raw data array.
 * @param {string} level - Aggregation level: 'none', 'minute', 'day', 'month'.
 * @returns {Array<Object>} - The aggregated data.
 */
export const aggregateData = (data, level) => {
  if (level === 'none' || !data || data.length === 0) {
    return data;
  }

  const getKeyFn = level === 'minute' ? getMinuteKey : level === 'day' ? getDayKey : getMonthKey;

  const aggregatedMap = new Map();

  data.forEach(row => {
    const key = getKeyFn(row.Time_Stamp);
    if (!aggregatedMap.has(key)) {
      aggregatedMap.set(key, {
        Time_Stamp: level === 'minute' ? new Date(key + ':00Z').toISOString() : new Date(key + (level === 'month' ? '-01' : '') + 'T00:00:00Z').toISOString(), // Store as full ISO string for consistency, representing start of period
        rTotalQ_sum: 0,
        rTotalQPercentage_sum: 0,
        systemFluidState_sum: 0,
        count: 0,
        // Keep other non-numeric fields from the first row in the group if needed, or handle them specifically
        // For simplicity, we are focusing on averaging numeric fields.
      });
    }

    const currentGroup = aggregatedMap.get(key);
    currentGroup.rTotalQ_sum += row.rTotalQ || 0;
    currentGroup.rTotalQPercentage_sum += row.rTotalQPercentage || 0;
    currentGroup.systemFluidState_sum += row.systemFluidState || 0;
    currentGroup.count += 1;
  });

  return Array.from(aggregatedMap.values()).map(group => ({
    Time_Stamp: group.Time_Stamp,
    rTotalQ: group.count > 0 ? group.rTotalQ_sum / group.count : 0,
    rTotalQPercentage: group.count > 0 ? group.rTotalQPercentage_sum / group.count : 0,
    systemFluidState: group.count > 0 ? group.systemFluidState_sum / group.count : 0,
    // Note: Other columns from the original data are not present here unless explicitly handled.
    // This might affect column visibility if those columns are expected.
    aggregation_level: level, // Store the aggregation level for potential use in rendering/logic
    aggregated_count: group.count // Store how many raw records this aggregated row represents
  }));
};
