/**
 * Formats duration in minutes into a user-friendly string.
 * Converts to Weeks (Hours) if minutes >= 60, otherwise displays in minutes.
 * Example:
 * 2400 mins -> "8 Weeks (40 Hours)"
 * 120 mins -> "2 Hours"
 * 45 mins -> "45 min"
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  const mins = parseInt(minutes, 10);
  if (isNaN(mins) || mins <= 0) return '0 min';
  
  if (mins < 60) {
    return `${mins} min`;
  }
  
  const hours = Math.round(mins / 60);
  // Assuming a standard training dedication of 5 hours/week for conversion:
  if (hours >= 5) {
    const weeks = Math.round(hours / 5);
    const weekLabel = weeks === 1 ? 'Week' : 'Weeks';
    return `${weeks} ${weekLabel} (${hours} Hours)`;
  }
  
  return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
};
