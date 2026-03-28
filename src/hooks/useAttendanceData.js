import { useState, useEffect, useCallback } from "react";
import supabase from "../utils/supabase";
import { applyFilters, getUniqueNames, getAvailableMonths } from "../utils/attendanceUtils";
import { monthNames } from "../utils/dateUtils";

export const useAttendanceData = (currentUser, isAuthenticated, userRole, salesPersonName) => {
  const [attendance, setAttendance] = useState([]);
  const [historyAttendance, setHistoryAttendance] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [inData, setInData] = useState({});
  const [outData, setOutData] = useState({});
  const [filters, setFilters] = useState({
    name: "",
    status: "",
    month: "",
  });
  const [filteredHistoryCallbackData, setFilteredHistoryCallbackData] = useState([]);

  const checkActiveSession = useCallback((attendanceData) => {
    if (!attendanceData || attendanceData.length === 0) {
      setHasActiveSession(false);
      setHasCheckedInToday(false);
      return;
    }

    const userRecords = attendanceData.filter(
      (record) =>
        record.salesPersonName === salesPersonName &&
        record.dateTime?.split(" ")[0].toString() ===
        formatDateDDMMYYYY(new Date())
    );

    if (userRecords.length === 0) {
      setHasActiveSession(false);
      setHasCheckedInToday(false);
      return;
    }

    const mostRecentRecord = userRecords[0];
    const hasActive = mostRecentRecord.status === "IN";
    setHasActiveSession(hasActive);
    if (hasActive) {
      setInData(mostRecentRecord);
    }

    const hasOutActive = mostRecentRecord.status === "OUT";
    if (hasOutActive) {
      setOutData(mostRecentRecord);
    }

    const hasCheckedIn = userRecords.some((record) => record.status === "IN");
    setHasCheckedInToday(hasCheckedIn);
  }, [salesPersonName]);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      console.log(
        "Not authenticated or currentUser not available. Skipping history fetch."
      );
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const { data: rows, error } = await supabase
        .from('attendance')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      if (!rows || rows.length === 0) {
        setAttendance([]);
        setHistoryAttendance([]);
        setIsLoadingHistory(false);
        return;
      }

      const formattedHistory = rows
        .map((row) => {
          return {
            salesPersonName: row.person_name,
            dateTime: row.timestamp,
            status: row.status,
            mapLink: row.map_link,
            address: row.address,
            imageUrl: row.images,
            date: row.date, // Preserve the YYYY-MM-DD date for filtering
          };
        })
        .filter(Boolean);

      const todayStr = new Date().toISOString().split('T')[0];

      const filteredHistory = formattedHistory.filter(
        (entry) =>
          entry.salesPersonName === salesPersonName &&
          entry.date === todayStr
      );

      const filteredHistoryData =
        userRole.toLowerCase() === "admin"
          ? formattedHistory
          : formattedHistory.filter(
            (entry) => entry.salesPersonName === salesPersonName
          );

      setAttendance(filteredHistory);
      setHistoryAttendance(filteredHistoryData);

      checkActiveSession(filteredHistory);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentUser, isAuthenticated, salesPersonName, userRole, checkActiveSession]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  useEffect(() => {
    const filtered = applyFilters(historyAttendance || [], filters, monthNames);
    setFilteredHistoryCallbackData(filtered);
  }, [filters, historyAttendance]);

  return {
    attendance,
    historyAttendance,
    isLoadingHistory,
    hasActiveSession,
    hasCheckedInToday,
    inData,
    outData,
    filters,
    setFilters,
    filteredHistoryCallbackData,
    fetchAttendanceHistory,
    checkActiveSession,
  };
};

// Import formatDateDDMMYYYY
import { formatDateDDMMYYYY } from "../utils/dateUtils";