//Returns date in form of : "(year)-(mm)-(day)T(hr):(min):(sec)Z"
function getCurrentTuesdayMidnightPSTinUTC() {
    // Get the current date
    let now = new Date();
    
    // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    let currentDay = now.getDay();
    
    // Calculate how many days to go back to the most recent Tuesday
    let daysToTuesday = (currentDay + 5) % 7; // Days to go back to Tuesday
    
    // Subtract those days to get Tuesday
    let tuesday = new Date(now);
    tuesday.setDate(now.getDate() - daysToTuesday); // Set to the Tuesday of the current week
    
    // Set the time to 12:00 AM PST (UTC-8)
    tuesday.setUTCHours(8, 0, 0, 0); // 12:00 AM PST = 08:00 UTC
    
    // Convert to ISO 8601 format with 'Z' (which represents UTC time)
    return tuesday.toISOString();
}

export { getCurrentTuesdayMidnightPSTinUTC };


