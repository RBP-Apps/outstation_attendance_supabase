// Helper function to check if a day is complete (next day has started or past cutoff)
export const isDayComplete = (dateStr) => {
  if (!dateStr) return false;

  const [day, month, year] = dateStr.split("/");
  const targetDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  );
  const currentDate = new Date();

  // Set cutoff time to 11:59 PM of the target date
  const cutoffTime = new Date(targetDate);
  cutoffTime.setHours(23, 59, 59, 999);

  // Day is complete if current time is past the cutoff time
  return currentDate > cutoffTime;
};

// Helper function to determine mispunch status
export const determineMispunchStatus = (inCount, outCount, dateStr, hasLeave) => {
  // If it's a leave day, no mispunch consideration
  if (hasLeave) {
    return { isMispunch: false, type: "leave" };
  }

  // If no punches at all, not a mispunch
  if (inCount === 0 && outCount === 0) {
    return { isMispunch: false, type: "absent" };
  }

  const isDayOver = isDayComplete(dateStr);

  // Valid Attendance: At least one IN and one OUT
  if (inCount >= 1 && outCount >= 1) {
    // Perfect match
    if (inCount === outCount) {
      return { isMispunch: false, type: "complete" };
    }
    // Mismatched counts but has both In and Out (e.g. 2 IN, 1 OUT) - technically valid for "Present" status, just duplicate punches
    return {
      isMispunch: false, // Don't flag as mispunch to avoid confusing user
      type: "complete_with_duplicates",
      details: `${inCount} IN vs ${outCount} OUT - Valid attendance (duplicate punches detected)`,
    };
  }

  // Missing OUT: Has IN but no OUT
  if (inCount > 0 && outCount === 0) {
    if (isDayOver) {
      return {
        isMispunch: true,
        type: "missing_out",
        details: `${inCount} IN - Missing OUT punch`,
      };
    } else {
      return {
        isMispunch: false,
        type: "in_progress",
        details: "Day in progress",
      };
    }
  }

  // Invalid: Has OUT but no IN
  if (outCount > 0 && inCount === 0) {
    return {
      isMispunch: true,
      type: "invalid",
      details: `${outCount} OUT - Missing IN punch`,
    };
  }

  return { isMispunch: false, type: "unknown" };
};

// Calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Get unique names from attendance data
export const getUniqueNames = (data) => {
  const names = data.map((entry) => entry.salesPersonName).filter(Boolean);
  return [...new Set(names)].sort();
};

// Get available months from attendance data
export const getAvailableMonths = (data, monthNames) => {
  const months = new Set();
  data.forEach((entry) => {
    // Try to get date from various possible fields
    let dateStr = null;
    
    // Check different possible date fields in order of preference
    if (entry.date) {
      dateStr = entry.date; // Format: YYYY-MM-DD
    } else if (entry.dateTime) {
      dateStr = entry.dateTime.split(" ")[0]; // Could be DD/MM/YYYY or YYYY-MM-DD
    } else if (entry.timestamp) {
      // Handle timestamp which might be ISO format
      const timestampDate = new Date(entry.timestamp);
      if (!isNaN(timestampDate.getTime())) {
        const year = timestampDate.getFullYear();
        const month = timestampDate.getMonth();
        months.add(`${monthNames[month]} ${year}`);
        return;
      }
    }
    
    if (!dateStr) return;
    
    let day, month, year;
    
    // Check if date is in YYYY-MM-DD format (with hyphens)
    if (dateStr.includes('-')) {
      [year, month, day] = dateStr.split('-');
    } 
    // Check if date is in DD/MM/YYYY format (with slashes)
    else if (dateStr.includes('/')) {
      [day, month, year] = dateStr.split('/');
    } else {
      return; // Unrecognized format
    }
    
    // Convert to numbers and validate
    const monthNum = parseInt(month, 10) - 1;
    const yearNum = parseInt(year, 10);
    
    // Validate that we have valid numbers
    if (!isNaN(monthNum) && monthNum >= 0 && monthNum < 12 && !isNaN(yearNum)) {
      const monthName = monthNames[monthNum];
      months.add(`${monthName} ${yearNum}`);
    }
  });
  
  return Array.from(months).sort((a, b) => {
    const [aMonth, aYear] = a.split(" ");
    const [bMonth, bYear] = b.split(" ");
    const aDate = new Date(parseInt(aYear), monthNames.indexOf(aMonth));
    const bDate = new Date(parseInt(bYear), monthNames.indexOf(bMonth));
    return bDate - aDate; // Sort in descending order (newest first)
  });
};

// Apply filters to attendance data
export const applyFilters = (data, filters, monthNames) => {
  if (!filters.name && !filters.status && !filters.month) {
    return data;
  }

  return data.filter((entry) => {
    // Filter by name
    if (
      filters.name &&
      !entry.salesPersonName
        ?.toLowerCase()
        .includes(filters.name.toLowerCase())
    ) {
      return false;
    }

    // Filter by status
    if (filters.status && entry.status !== filters.status) {
      return false;
    }

    // Filter by month
    if (filters.month) {
      let entryMonth, entryYear;
      
      // Try to get date from various fields
      if (entry.date) {
        // Format: YYYY-MM-DD
        const [year, month] = entry.date.split('-');
        entryYear = parseInt(year);
        entryMonth = parseInt(month) - 1;
      } else if (entry.timestamp) {
        // Handle ISO timestamp
        const date = new Date(entry.timestamp);
        if (!isNaN(date.getTime())) {
          entryYear = date.getFullYear();
          entryMonth = date.getMonth();
        }
      } else if (entry.dateTime) {
        // Handle dateTime field
        const datePart = entry.dateTime.split(' ')[0];
        if (datePart.includes('-')) {
          const [year, month] = datePart.split('-');
          entryYear = parseInt(year);
          entryMonth = parseInt(month) - 1;
        } else if (datePart.includes('/')) {
          const [day, month, year] = datePart.split('/');
          entryYear = parseInt(year);
          entryMonth = parseInt(month) - 1;
        }
      }
      
      // If we have valid month and year, compare with filter
      if (entryYear !== undefined && entryMonth !== undefined) {
        const entryMonthName = monthNames[entryMonth];
        const entryMonthYear = `${entryMonthName} ${entryYear}`;
        
        if (entryMonthYear !== filters.month) {
          return false;
        }
      } else {
        // Can't determine month/year, so exclude this entry
        return false;
      }
    }

    return true;
  });
};