import { useState, useEffect, useCallback, useRef } from "react";
import supabase from "../utils/supabase";
import { formatDateDDMMYYYY } from "../utils/dateUtils";

const PAGE_SIZE = 50;

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Helper: convert "April 2026" → { startDate: "2026-04-01", endDate: "2026-04-30" }
const monthYearToDateRange = (monthYear) => {
  const parts = monthYear.split(" ");
  if (parts.length !== 2) return null;
  const monthIndex = MONTH_ORDER.indexOf(parts[0]) + 1;
  const year = parseInt(parts[1]);
  if (monthIndex < 1 || isNaN(year)) return null;
  const mm = String(monthIndex).padStart(2, "0");
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
};

export const useAttendanceData = (currentUser, isAuthenticated, userRole, salesPersonName) => {
  // Today's records — used only for form logic (check IN/OUT/MID status)
  const [attendance, setAttendance] = useState([]);

  // Paginated history records — shown in AttendanceHistory table
  const [historyAttendance, setHistoryAttendance] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [inData, setInData] = useState({});
  const [outData, setOutData] = useState({});

  // Filter state
  const [filters, setFilters] = useState({ name: "", status: "", month: "" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Pre-fetched dropdown options
  const [uniqueNames, setUniqueNames] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  // Summary data for AttendanceSummaryCard (current month only — very lightweight)
  const [summaryAttendance, setSummaryAttendance] = useState([]);

  // filteredHistoryCallbackData = historyAttendance (backend already filtered)
  const filteredHistoryCallbackData = historyAttendance;

  // ─── Active session logic (for form) ──────────────────────────────────────
  const checkActiveSession = useCallback((attendanceData) => {
    if (!attendanceData || attendanceData.length === 0) {
      setHasActiveSession(false);
      setHasCheckedInToday(false);
      return;
    }

    const userRecords = attendanceData.filter(
      (record) =>
        record.salesPersonName === salesPersonName &&
        record.dateTime?.split(" ")[0].toString() === formatDateDDMMYYYY(new Date())
    );

    if (userRecords.length === 0) {
      setHasActiveSession(false);
      setHasCheckedInToday(false);
      return;
    }

    const mostRecentRecord = userRecords[0];
    const hasActive = mostRecentRecord.status === "IN";
    setHasActiveSession(hasActive);
    if (hasActive) setInData(mostRecentRecord);

    const hasOutActive = mostRecentRecord.status === "OUT";
    if (hasOutActive) setOutData(mostRecentRecord);

    const hasCheckedIn = userRecords.some((r) => r.status === "IN");
    setHasCheckedInToday(hasCheckedIn);
  }, [salesPersonName]);

  // ─── Summary: fetch CURRENT MONTH only (lightweight, fast) ────────────────
  // Uses `date` column (YYYY-MM-DD) — the only date column that exists
  const fetchSummaryData = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const mm = String(month).padStart(2, "0");
      const lastDay = new Date(year, month, 0).getDate();
      const startDate = `${year}-${mm}-01`;
      const endDate = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;

      let query = supabase
        .from("attendance")
        .select("person_name, timestamp, status, date")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("id", { ascending: false });

      if (userRole?.toLowerCase() !== "admin") {
        query = query.eq("person_name", salesPersonName);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((row) => ({
        salesPersonName: row.person_name,
        dateTime: row.timestamp,
        status: row.status,
        date: row.date,
      }));

      setSummaryAttendance(formatted);
    } catch (err) {
      console.error("Error fetching summary data:", err);
    }
  }, [isAuthenticated, currentUser, userRole, salesPersonName]);

  // ─── Unique names for filter dropdown ─────────────────────────────────────
  const fetchUniqueNames = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    try {
      let query = supabase.from("attendance").select("person_name");
      if (userRole?.toLowerCase() !== "admin") {
        query = query.eq("person_name", salesPersonName);
      }
      const { data, error } = await query;
      if (error) throw error;
      const names = [...new Set((data || []).map((r) => r.person_name).filter(Boolean))].sort();
      setUniqueNames(names);
    } catch (err) {
      console.error("Error fetching unique names:", err);
    }
  }, [isAuthenticated, currentUser, userRole, salesPersonName]);

  // ─── Available months — derived from `date` column (YYYY-MM-DD) ───────────
  const fetchAvailableMonths = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    try {
      // Fetch only the `date` column — tiny payload
      let query = supabase.from("attendance").select("date");
      if (userRole?.toLowerCase() !== "admin") {
        query = query.eq("person_name", salesPersonName);
      }
      const { data, error } = await query;
      if (error) throw error;

      const monthSet = new Set();
      (data || []).forEach((row) => {
        if (row.date) {
          const parts = row.date.split("-");
          if (parts.length >= 2) {
            const year = parts[0];
            const monthIdx = parseInt(parts[1]) - 1;
            if (monthIdx >= 0 && monthIdx < 12 && year) {
              monthSet.add(`${MONTH_ORDER[monthIdx]} ${year}`);
            }
          }
        }
      });

      const sorted = Array.from(monthSet).sort((a, b) => {
        const [aM, aY] = a.split(" ");
        const [bM, bY] = b.split(" ");
        if (aY !== bY) return parseInt(bY) - parseInt(aY);
        return MONTH_ORDER.indexOf(bM) - MONTH_ORDER.indexOf(aM);
      });

      setAvailableMonths(sorted);
    } catch (err) {
      console.error("Error fetching available months:", err);
    }
  }, [isAuthenticated, currentUser, userRole, salesPersonName]);

  // ─── Main history fetch: paginated + backend-filtered ─────────────────────
  const fetchAttendanceHistory = useCallback(
    async (filtersToUse, page = 1) => {
      if (!isAuthenticated || !currentUser) {
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const from = (page - 1) * PAGE_SIZE;
        const to = page * PAGE_SIZE - 1;
        const todayStr = new Date().toISOString().split("T")[0];

        // ── History query: paginated + filtered ──
        let historyQuery = supabase
          .from("attendance")
          .select("*", { count: "exact" })
          .order("id", { ascending: false })
          .range(from, to);

        // Role-based restriction
        if (userRole?.toLowerCase() !== "admin") {
          historyQuery = historyQuery.eq("person_name", salesPersonName);
        } else if (filtersToUse?.name) {
          historyQuery = historyQuery.ilike("person_name", `%${filtersToUse.name}%`);
        }

        if (filtersToUse?.status) {
          historyQuery = historyQuery.eq("status", filtersToUse.status);
        }

        // Month filter uses `date` column (YYYY-MM-DD) — NOT month_name/year_name
        if (filtersToUse?.month) {
          const range = monthYearToDateRange(filtersToUse.month);
          if (range) {
            historyQuery = historyQuery
              .gte("date", range.startDate)
              .lte("date", range.endDate);
          }
        }

        // ── Today's query: session tracking only ──
        const todayQuery = supabase
          .from("attendance")
          .select("*")
          .eq("person_name", salesPersonName)
          .eq("date", todayStr)
          .order("id", { ascending: false });

        // Run both in parallel
        const [historyResult, todayResult] = await Promise.all([
          historyQuery,
          todayQuery,
        ]);

        if (historyResult.error) throw historyResult.error;
        if (todayResult.error) throw todayResult.error;

        const formatRow = (row) => ({
          salesPersonName: row.person_name,
          dateTime: row.timestamp,
          status: row.status,
          mapLink: row.map_link,
          address: row.address,
          imageUrl: row.images,
          date: row.date,
        });

        const formattedHistory = (historyResult.data || []).map(formatRow);
        const formattedToday = (todayResult.data || []).map(formatRow);

        setHistoryAttendance(formattedHistory);
        setTotalCount(historyResult.count || 0);
        setAttendance(formattedToday);
        checkActiveSession(formattedToday);
      } catch (error) {
        console.error("Error fetching attendance history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [currentUser, isAuthenticated, salesPersonName, userRole, checkActiveSession]
  );

  // ─── Initial load ──────────────────────────────────────────────────────────
  const isReady = isAuthenticated && currentUser;
  useEffect(() => {
    if (isReady) {
      fetchAttendanceHistory(filters, 1);
      fetchSummaryData();
      fetchUniqueNames();
      fetchAvailableMonths();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser]);

  // ─── Re-fetch when filters change → reset to page 1 ───────────────────────
  const prevFiltersRef = useRef(null);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev === null) {
      prevFiltersRef.current = filters;
      return;
    }
    const changed =
      prev.name !== filters.name ||
      prev.status !== filters.status ||
      prev.month !== filters.month;

    if (changed && isReady) {
      prevFiltersRef.current = filters;
      setCurrentPage(1);
      fetchAttendanceHistory(filters, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ─── Re-fetch when page changes ───────────────────────────────────────────
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (prevPageRef.current !== currentPage && isReady) {
      prevPageRef.current = currentPage;
      fetchAttendanceHistory(filters, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ─── Manual refresh after form submit ─────────────────────────────────────
  const refreshHistory = useCallback(() => {
    fetchAttendanceHistory(filters, currentPage);
    fetchSummaryData();
    fetchUniqueNames();
    fetchAvailableMonths();
  }, [fetchAttendanceHistory, fetchSummaryData, fetchUniqueNames, fetchAvailableMonths, filters, currentPage]);

  return {
    attendance,
    historyAttendance,
    summaryAttendance,
    isLoadingHistory,
    hasActiveSession,
    hasCheckedInToday,
    inData,
    outData,
    filters,
    setFilters,
    filteredHistoryCallbackData,
    fetchAttendanceHistory: refreshHistory,
    checkActiveSession,
    currentPage,
    setCurrentPage,
    totalCount,
    pageSize: PAGE_SIZE,
    uniqueNames,
    availableMonths,
  };
};