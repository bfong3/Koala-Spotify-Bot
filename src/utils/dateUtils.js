const FIRST_DAY = '2024-10-01T08:00:00Z';


export const getCurrentWeek = () => {
    const firstDay = new Date(FIRST_DAY);
    const currentDay = new Date();

    // Calculate the difference in time (milliseconds)
    const diffInMs = currentDay - firstDay;

    // Convert the difference from milliseconds to days
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Calculate which week it is
    const weekNumber = Math.floor(diffInDays / 7) + 1;
    return weekNumber; 
}

const addDays = (date, days) => {
    const result = new Date(date); // Create a new Date object
    result.setDate(result.getDate() + days); // Add days
    return result;
};


export const getWeekRange = (weekNumber) => {
    if (weekNumber < 1) {
        throw new Error('Week number must be 1 or greater.');
    }

    // Parse the firstDay string into a Date object and strip the time portion
    const firstDay = new Date(FIRST_DAY);
    const firstDayNoTime = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());

    // Calculate the start of the specified week (weekNumber)
    const startOfWeek = addDays(firstDayNoTime, (weekNumber - 1) * 7);

    // Calculate the end of the week (6 days after startOfWeek)
    const endOfWeek = addDays(startOfWeek, 6);

    // Return the range of dates as an object in ISO format
    return {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString()
    };
};

export function getWeekNumber(date) {
    // Parse the firstDay string into a Date object
    const firstDayDate = new Date(FIRST_DAY);
    // Strip the time portion from firstDayDate
    const firstDayNoTime = new Date(firstDayDate.getFullYear(), firstDayDate.getMonth(), firstDayDate.getDate());

    // Calculate the difference in time between the given date and first day
    const diffTime = date - firstDayNoTime;

    // Calculate the number of weeks (7 days in a week)
    const weekNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1; // +1 to make it 1-based index

    return weekNumber > 0 ? weekNumber : null; // Return null if the date is before the first day
}


//Returns date in form of : "(year)-(mm)-(day)T(hr):(min):(sec)Z"
export function getCurrentTuesdayMidnightPSTinUTC() {
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



