import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAttendanceData } from "../hooks/useAttendanceData";
import { useLocation } from "../hooks/useLocation";
import { useFilters } from "../hooks/useFilters";
import AttendanceSummaryCard from "../components/attendance/AttendanceSummaryCard";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import AttendanceForm from "../components/attendance/AttendanceForm";
import LocationPermissionBanner from "../components/attendance/LocationPermissionBanner";
import { getUniqueNames, getAvailableMonths } from "../utils/attendanceUtils";
import { monthNames, getCurrentMonthYear } from "../utils/dateUtils";

const Attendance = () => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const salesPersonName = currentUser?.salesPersonName || "Unknown User";
  const userRole = currentUser?.role || "User";

  const {
    historyAttendance,
    isLoadingHistory,
    hasCheckedInToday,
    attendance,
    fetchAttendanceHistory,
    filters,
    setFilters,
    filteredHistoryCallbackData,
  } = useAttendanceData(currentUser, isAuthenticated, userRole, salesPersonName);

  const { locationPermissionStatus, checkLocationPermission } = useLocation();

  const { hasActiveFilters } = useFilters(filters);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    const bgColor = type === "error" ? "bg-red-500" : "bg-green-500";

    toast.className = `fixed top-4 right-4 p-4 rounded-md text-white z-50 ${bgColor} max-w-sm shadow-lg`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  if (!isAuthenticated || !currentUser || !currentUser.salesPersonName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-red-600 rounded-full animate-spin"></div>
          <p className="font-medium text-slate-600">
            {!isAuthenticated
              ? "Please log in to view this page."
              : "Loading user data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 lg:p-8">
      <div className="mx-auto space-y-8 max-w-7xl">
        <LocationPermissionBanner
          locationPermissionStatus={locationPermissionStatus}
        />

        <AttendanceSummaryCard
          attendanceData={historyAttendance}
          isLoading={isLoadingHistory}
          userRole={userRole}
          salesPersonName={salesPersonName}
          selectedMonth={filters.month}
        />

        <AttendanceForm
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          salesPersonName={salesPersonName}
          userRole={userRole}
          attendance={attendance}
          hasCheckedInToday={hasCheckedInToday}
          fetchAttendanceHistory={fetchAttendanceHistory}
          showToast={showToast}
        />

        <AttendanceHistory
          attendanceData={historyAttendance}
          isLoading={isLoadingHistory}
          userRole={userRole}
          filters={filters}
          setFilters={setFilters}
          filteredData={filteredHistoryCallbackData}
          getUniqueNames={getUniqueNames}
          getAvailableMonths={(data) => getAvailableMonths(data, monthNames)}
          monthNames={monthNames}
        />
      </div>
    </div>
  );
};

export default Attendance;