import { useState, useEffect } from "react";
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Filter, ChevronDown } from "lucide-react";
import { determineMispunchStatus, isDayComplete } from "../../utils/attendanceUtils";
import { monthNames } from "../../utils/dateUtils";

const AttendanceSummaryCard = ({
  attendanceData,
  isLoading,
  userRole,
  salesPersonName,
  selectedMonth,
  onFilterChange, // Callback to parent for filter changes
}) => {
  const [summaryData, setSummaryData] = useState({
    totalPresent: 0,
    totalLeave: 0,
    totalIn: 0,
    totalMid: 0,
    totalOut: 0,
    totalMispunch: 0,
    mispunchDetails: [],
  });
  
  // Filter states
  const [filterType, setFilterType] = useState("monthly"); // "daily", "weekly", "monthly", "yearly", "custom"
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedMonthYear, setSelectedMonthYear] = useState(selectedMonth || getCurrentMonthYear());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  
  // Get current month-year string
  function getCurrentMonthYear() {
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }
  
  // Get available years from attendance data
  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      const years = new Set();
      attendanceData.forEach((entry) => {
        let year = null;
        if (entry.date) {
          year = entry.date.split('-')[0];
        } else if (entry.dateTime) {
          const datePart = entry.dateTime.split(' ')[0];
          if (datePart.includes('-')) {
            year = datePart.split('-')[0];
          } else if (datePart.includes('/')) {
            year = datePart.split('/')[2];
          }
        }
        if (year) years.add(year);
      });
      const sortedYears = Array.from(years).sort((a, b) => b - a);
      setAvailableYears(sortedYears);
      if (sortedYears.length > 0 && !selectedYear) {
        setSelectedYear(sortedYears[0]);
      }
    }
  }, [attendanceData]);
  
  // Helper function to check if date is within range
  const isDateInRange = (dateStr, startDate, endDate) => {
    if (!dateStr) return false;
    
    let dateObj;
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      dateObj = new Date(year, month - 1, day);
    } else if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      dateObj = new Date(year, month - 1, day);
    } else {
      return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    return dateObj >= start && dateObj <= end;
  };
  
  // Helper to check if date matches week
  const isDateInWeek = (dateStr, weekStartDate) => {
    if (!dateStr) return false;
    
    let dateObj;
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      dateObj = new Date(year, month - 1, day);
    } else if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      dateObj = new Date(year, month - 1, day);
    } else {
      return false;
    }
    
    const weekStart = new Date(weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return dateObj >= weekStart && dateObj <= weekEnd;
  };
  
  // Helper to check if date matches month
  const isDateInMonth = (dateStr, monthYearStr) => {
    if (!dateStr || !monthYearStr) return false;
    
    const [monthName, yearStr] = monthYearStr.split(' ');
    const targetMonth = monthNames.indexOf(monthName);
    const targetYear = parseInt(yearStr);
    
    let dateYear, dateMonth;
    if (dateStr.includes('-')) {
      const [year, month] = dateStr.split('-');
      dateYear = parseInt(year);
      dateMonth = parseInt(month) - 1;
    } else if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      dateYear = parseInt(year);
      dateMonth = parseInt(month) - 1;
    } else {
      return false;
    }
    
    return dateYear === targetYear && dateMonth === targetMonth;
  };
  
  // Helper to check if date matches year
  const isDateInYear = (dateStr, yearStr) => {
    if (!dateStr || !yearStr) return false;
    
    let dateYear;
    if (dateStr.includes('-')) {
      dateYear = parseInt(dateStr.split('-')[0]);
    } else if (dateStr.includes('/')) {
      dateYear = parseInt(dateStr.split('/')[2]);
    } else {
      return false;
    }
    
    return dateYear === parseInt(yearStr);
  };
  
  // Generate weeks for current month/year
  const getWeeksInMonth = (monthYearStr) => {
    if (!monthYearStr) return [];
    
    const [monthName, yearStr] = monthYearStr.split(' ');
    const month = monthNames.indexOf(monthName);
    const year = parseInt(yearStr);
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks = [];
    let currentWeekStart = new Date(firstDay);
    
    // Adjust to start from Monday
    const dayOfWeek = currentWeekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(currentWeekStart.getDate() - diff);
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
        label: `${currentWeekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };
  
  // Filter data based on selected filter type
  const filterDataByDateRange = (data) => {
    if (!data || data.length === 0) return [];
    
    return data.filter(entry => {
      const dateStr = entry.date || (entry.dateTime ? entry.dateTime.split(' ')[0] : null);
      if (!dateStr) return false;
      
      switch (filterType) {
        case "custom":
          if (selectedDateRange.startDate && selectedDateRange.endDate) {
            return isDateInRange(dateStr, selectedDateRange.startDate, selectedDateRange.endDate);
          }
          return true;
          
        case "weekly":
          if (selectedMonthYear) {
            // For weekly, we need to check if date is in any week of selected month
            const weeks = getWeeksInMonth(selectedMonthYear);
            return weeks.some(week => isDateInWeek(dateStr, week.start));
          }
          return true;
          
        case "monthly":
          return isDateInMonth(dateStr, selectedMonthYear);
          
        case "yearly":
          return isDateInYear(dateStr, selectedYear);
          
        default:
          return true;
      }
    });
  };
  
  useEffect(() => {
    if (!attendanceData || attendanceData.length === 0) {
      setSummaryData({
        totalPresent: 0,
        totalLeave: 0,
        totalIn: 0,
        totalMid:0, 
        totalOut: 0,
        totalMispunch: 0,
        mispunchDetails: [],
      });
      return;
    }
    
    // Apply date range filter first
    const filteredByDate = filterDataByDateRange(attendanceData);
    
    // Filter data for current user (admin sees all, users see only their data)
    const userSpecificData =
      userRole?.toLowerCase() === "admin"
        ? filteredByDate
        : filteredByDate.filter(
          (entry) => entry.salesPersonName === salesPersonName
        );
    
    // Get target month/year based on filter type
    let targetMonth, targetYear;
    
    if (filterType === "monthly" && selectedMonthYear) {
      const [mName, yStr] = selectedMonthYear.split(" ");
      targetMonth = monthNames.indexOf(mName);
      targetYear = parseInt(yStr);
    } else if (filterType === "yearly" && selectedYear) {
      targetYear = parseInt(selectedYear);
      targetMonth = null; // Don't filter by month for yearly view
    } else if (filterType === "weekly" && selectedMonthYear) {
      const [mName, yStr] = selectedMonthYear.split(" ");
      targetMonth = monthNames.indexOf(mName);
      targetYear = parseInt(yStr);
    } else if (filterType === "custom") {
      targetMonth = null;
      targetYear = null;
    } else {
      const now = new Date();
      targetMonth = now.getMonth();
      targetYear = now.getFullYear();
    }
    
    // Group by employee and date to calculate daily statistics
    const employeeDailyRecords = {};
    
    userSpecificData.forEach((entry) => {
      // Robust status matching
      const statusNormalized = entry.status?.trim().toUpperCase();
      
      if (!entry.dateTime) return;
      
      const [year, month, day] = entry.date ? entry.date.split("-") : [null, null, null];
      let entryDate;
      
      if (year && month && day) {
        entryDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
      } else if (entry.dateTime) {
        entryDate = new Date(entry.dateTime);
        if (isNaN(entryDate.getTime())) {
          const dateStr = entry.dateTime.split(" ")[0];
          const [d, m, y] = dateStr.split("/");
          entryDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }
      }
      
      if (!entryDate || isNaN(entryDate.getTime())) return;
      
      // Apply month/year filtering based on filter type
      let shouldInclude = true;
      if (filterType === "monthly" && targetMonth !== undefined && targetYear !== undefined) {
        shouldInclude = entryDate.getMonth() === targetMonth && entryDate.getFullYear() === targetYear;
      } else if (filterType === "yearly" && targetYear !== undefined) {
        shouldInclude = entryDate.getFullYear() === targetYear;
      } else if (filterType === "weekly" && selectedMonthYear) {
        // For weekly, we already filtered by date range above
        shouldInclude = true;
      } else if (filterType === "custom") {
        // Already filtered by custom date range
        shouldInclude = true;
      }
      
      if (!shouldInclude) return;
      
      const dateStr = entry.date || (entry.dateTime ? entry.dateTime.split(" ")[0] : "unknown");
      const employeeName = entry.salesPersonName || "Unknown";
      const dateKey = `${employeeName}_${dateStr}`;
      
   if (!employeeDailyRecords[dateKey]) {
  employeeDailyRecords[dateKey] = {
    employee: employeeName,
    date: dateStr,
    inCount: 0,
    midCount: 0,   // ✅ ADD
    outCount: 0,
    leaveCount: 0,
    hasLeave: false,
    punches: [],
  };
}

      if (statusNormalized === "IN") {
        employeeDailyRecords[dateKey].inCount++;
        employeeDailyRecords[dateKey].punches.push({
          type: "IN",
          time: entry.dateTime,
          status: entry.status,
        });
      } 
      else if (statusNormalized === "MID") {
  employeeDailyRecords[dateKey].midCount++;   // ✅ ADD
  employeeDailyRecords[dateKey].punches.push({
    type: "MID",
    time: entry.dateTime,
    status: entry.status,
  });
}
      else if (statusNormalized === "OUT") {
        employeeDailyRecords[dateKey].outCount++;
        employeeDailyRecords[dateKey].punches.push({
          type: "OUT",
          time: entry.dateTime,
          status: entry.status,
        });
      } else if (
        statusNormalized === "LEAVE" ||
        statusNormalized === "LEAVES"
      ) {
        employeeDailyRecords[dateKey].leaveCount++;
        employeeDailyRecords[dateKey].hasLeave = true;
        employeeDailyRecords[dateKey].punches.push({
          type: "LEAVE",
          time: entry.dateTime,
          status: entry.status,
        });
      }
    });
    
    // Calculate totals and mispunch details
    let totalPresent = 0;
    let totalLeave = 0;
    let totalIn = 0;
    let totalOut = 0;
    let totalMispunch = 0;
    const mispunchDetails = [];
    
    Object.values(employeeDailyRecords).forEach((dayRecord) => {
      totalIn += dayRecord.inCount;
      totalOut += dayRecord.outCount;
      totalLeave += dayRecord.leaveCount;
      
      if (dayRecord.hasLeave) {
        // Don't count leave days as present or absent
      } else if (
  dayRecord.inCount > 0 &&
  dayRecord.midCount > 0 &&
  dayRecord.outCount > 0
) {
  totalPresent++;
}
      
      const mispunchStatus = determineMispunchStatus(
        dayRecord.inCount,
        dayRecord.outCount,
        dayRecord.date,
        dayRecord.hasLeave
      );
      
      if (mispunchStatus.isMispunch) {
        totalMispunch++;
        mispunchDetails.push({
          employee: dayRecord.employee,
          date: dayRecord.date,
          inCount: dayRecord.inCount,
          outCount: dayRecord.outCount,
          type: mispunchStatus.type,
          details: mispunchStatus.details,
          isDayComplete: isDayComplete(dayRecord.date),
          punches: dayRecord.punches,
        });
      }
    });
    
    setSummaryData({
      totalPresent,
      totalLeave: Math.max(
        totalLeave,
        Object.values(employeeDailyRecords).filter((day) => day.hasLeave).length
      ),
      totalIn,
      totalOut,
      totalMispunch,
      mispunchDetails,
    });
    
    // Notify parent about filter changes
    if (onFilterChange) {
      onFilterChange({
        type: filterType,
        value: filterType === "yearly" ? selectedYear : 
               filterType === "custom" ? selectedDateRange : selectedMonthYear
      });
    }
  }, [attendanceData, salesPersonName, userRole, filterType, selectedMonthYear, selectedYear, selectedDateRange]);
  
  // Handler for filter type change
  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    if (type === "yearly" && availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  };
  
  // Generate month options from available data or current year
  const getMonthOptions = () => {
    const months = new Set();
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((entry) => {
        let year, month;
        if (entry.date) {
          const [y, m] = entry.date.split('-');
          year = y;
          month = parseInt(m) - 1;
        } else if (entry.dateTime) {
          const datePart = entry.dateTime.split(' ')[0];
          if (datePart.includes('-')) {
            const [y, m] = datePart.split('-');
            year = y;
            month = parseInt(m) - 1;
          } else if (datePart.includes('/')) {
            const [d, m, y] = datePart.split('/');
            year = y;
            month = parseInt(m) - 1;
          }
        }
        if (year && month !== undefined) {
          months.add(`${monthNames[month]} ${year}`);
        }
      });
    }
    
    if (months.size === 0) {
      const now = new Date();
      months.add(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);
    }
    
    return Array.from(months).sort((a, b) => {
      const [aMonth, aYear] = a.split(" ");
      const [bMonth, bYear] = b.split(" ");
      const aDate = new Date(parseInt(aYear), monthNames.indexOf(aMonth));
      const bDate = new Date(parseInt(bYear), monthNames.indexOf(bMonth));
      return bDate - aDate;
    });
  };
  
  const getFilterDisplayText = () => {
    switch (filterType) {
      case "custom":
        if (selectedDateRange.startDate && selectedDateRange.endDate) {
          return `${selectedDateRange.startDate} to ${selectedDateRange.endDate}`;
        }
        return "Select date range";
      case "weekly":
        return `Weekly view for ${selectedMonthYear}`;
      case "monthly":
        return selectedMonthYear || getCurrentMonthYear();
      case "yearly":
        return selectedYear;
      default:
        return "Current Month";
    }
  };
  
  if (isLoading) {
    return (
      <div className="mb-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
          <h2 className="text-2xl font-bold text-white">Attendance Summary</h2>
          <p className="text-blue-50">Loading your attendance statistics...</p>
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading attendance summary...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
      <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                {userRole?.toLowerCase() === "admin"
                  ? "Overall Attendance Summary"
                  : "Your Attendance Summary"}
              </h2>
              <p className="text-blue-50">
                {userRole?.toLowerCase() === "admin"
                  ? "Complete attendance overview"
                  : `Monthly attendance overview for ${salesPersonName}`}
              </p>
            </div>
          </div>
          
          {/* Filter Dropdown Section */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-white" />
              <select
                value={filterType}
                onChange={(e) => handleFilterTypeChange(e.target.value)}
                className="px-3 py-2 text-sm text-white bg-white/20 border border-white/30 rounded-lg cursor-pointer hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="monthly" className="text-slate-700">Monthly View</option>
                <option value="weekly" className="text-slate-700">Weekly View</option>
                <option value="yearly" className="text-slate-700">Yearly View</option>
                <option value="custom" className="text-slate-700">Custom Date Range</option>
              </select>
              
              {/* Month/Year Selector based on filter type */}
              {filterType === "monthly" && (
                <select
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="px-3 py-2 text-sm text-white bg-white/20 border border-white/30 rounded-lg cursor-pointer hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {getMonthOptions().map((monthYear) => (
                    <option key={monthYear} value={monthYear} className="text-slate-700">
                      {monthYear}
                    </option>
                  ))}
                </select>
              )}
              
              {filterType === "yearly" && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 text-sm text-white bg-white/20 border border-white/30 rounded-lg cursor-pointer hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {availableYears.length > 0 ? availableYears.map((year) => (
                    <option key={year} value={year} className="text-slate-700">
                      {year}
                    </option>
                  )) : (
                    <option value={new Date().getFullYear()} className="text-slate-700">
                      {new Date().getFullYear()}
                    </option>
                  )}
                </select>
              )}
              
              {filterType === "weekly" && (
                <select
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="px-3 py-2 text-sm text-white bg-white/20 border border-white/30 rounded-lg cursor-pointer hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {getMonthOptions().map((monthYear) => (
                    <option key={monthYear} value={monthYear} className="text-slate-700">
                      {monthYear}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Custom Date Range Picker */}
            {filterType === "custom" && (
              <div className="mt-3 flex gap-2 items-center">
                <input
                  type="date"
                  value={selectedDateRange.startDate}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 text-sm text-slate-700 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start Date"
                />
                <span className="text-white">to</span>
                <input
                  type="date"
                  value={selectedDateRange.endDate}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 text-sm text-slate-700 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="End Date"
                />
                {(selectedDateRange.startDate || selectedDateRange.endDate) && (
                  <button
                    onClick={() => setSelectedDateRange({ startDate: "", endDate: "" })}
                    className="px-2 py-2 text-xs text-white bg-red-500/80 rounded-lg hover:bg-red-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            
            {/* Display current filter info */}
            <div className="mt-2 text-xs text-blue-100">
              Showing: {getFilterDisplayText()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-8">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

  {/* Present */}
  <div className="flex items-center justify-between p-5 border border-green-200 rounded-xl bg-green-50 shadow-md hover:shadow-lg">
    <div>
      <div className="text-sm text-green-600 font-medium">Present Days</div>
      <div className="text-2xl font-bold text-green-700">
        {summaryData.totalPresent}
      </div>
    </div>
    <CheckCircle className="w-10 h-10 text-green-600" />
  </div>

  {/* Leave */}
  <div className="flex items-center justify-between p-5 border border-amber-200 rounded-xl bg-amber-50 shadow-md hover:shadow-lg">
    <div>
      <div className="text-sm text-amber-600 font-medium">Leave Days</div>
      <div className="text-2xl font-bold text-amber-700">
        {summaryData.totalLeave}
      </div>
    </div>
    <XCircle className="w-10 h-10 text-amber-600" />
  </div>

  {/* IN */}
  <div className="flex items-center justify-between p-5 border border-blue-200 rounded-xl bg-blue-50 shadow-md hover:shadow-lg">
    <div>
      <div className="text-sm text-blue-600 font-medium">Total IN</div>
      <div className="text-2xl font-bold text-blue-700">
        {summaryData.totalIn}
      </div>
    </div>
    <Clock className="w-10 h-10 text-blue-600" />
  </div>

  {/* OUT */}
  <div className="flex items-center justify-between p-5 border border-purple-200 rounded-xl bg-purple-50 shadow-md hover:shadow-lg">
    <div>
      <div className="text-sm text-purple-600 font-medium">Total OUT</div>
      <div className="text-2xl font-bold text-purple-700">
        {summaryData.totalOut}
      </div>
    </div>
    <Clock className="w-10 h-10 text-purple-600" />
  </div>

  {/* MID */}
  <div className="flex items-center justify-between p-5 border border-cyan-200 rounded-xl bg-cyan-50 shadow-md hover:shadow-lg">
    <div>
      <div className="text-sm text-cyan-600 font-medium">Total Mid</div>
      <div className="text-2xl font-bold text-cyan-700">
        {summaryData.totalMid}
      </div>
    </div>
    <Clock className="w-10 h-10 text-cyan-600" />
  </div>

  {/* Mispunch */}
  <div className="flex items-center justify-between p-5 border border-red-200 rounded-xl bg-red-50 shadow-md hover:shadow-lg">
    <div>
      <div className="text-sm text-red-600 font-medium">Mispunch</div>
      <div className="text-2xl font-bold text-red-700">
        {summaryData.totalMispunch}
      </div>
    </div>
    <AlertTriangle className="w-10 h-10 text-red-600" />
  </div>

</div>
        
        {/* Mispunch Details Section */}
        {summaryData.mispunchDetails.length > 0 && (
          <div className="p-6 mt-8 border border-red-200 bg-red-50/50 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">
                Mispunch Details
              </h3>
            </div>
            <div className="space-y-3">
              {summaryData.mispunchDetails.map((detail, index) => (
                <div
                  key={index}
                  className="p-4 border border-red-200 rounded-lg bg-white/60"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-red-800">
                        {userRole?.toLowerCase() === "admin"
                          ? `${detail.employee} - `
                          : ""}
                        {detail.date}
                      </div>
                      <div className="mt-1 text-sm text-red-600">
                        {detail.details}
                      </div>
                      <div className="mt-1 text-xs text-red-500">
                        {detail.type === "missing_out" &&
                          "Day completed - Missing OUT punch(es)"}
                        {detail.type === "invalid" && "Invalid punch sequence"}
                        {detail.isDayComplete
                          ? " (Day Complete)"
                          : " (Day In Progress)"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded">
                        IN: {detail.inCount}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded">
                        OUT: {detail.outCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Additional Info */}
        <div className="p-4 mt-6 rounded-lg bg-slate-50/50">
          <div className="text-sm text-center text-slate-600">
            <span className="font-medium">Filter Applied:</span> {getFilterDisplayText()}
            {userRole?.toLowerCase() !== "admin" && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium">User:</span> {salesPersonName}
              </>
            )}
            <span className="mx-2">•</span>
            <span className="font-medium">Mispunch Cutoff:</span> 11:59 PM daily
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummaryCard;