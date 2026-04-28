import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  Download, Calendar, Clock, MapPin, Filter, X, Search,
  Users, UserCheck, UserMinus, UserPlus, TrendingUp,
  BarChart3, PieChart as PieChartIcon, Table as TableIcon, Map as MapIcon,
  ChevronRight, ArrowUpDown, ExternalLink, Image as ImageIcon,
  MoreVertical, FileSpreadsheet, FileText, Info
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../utils/supabase";
import { AuthContext } from "../context/AuthContext";
import { formatDisplayDateTime, monthNames } from "../utils/dateUtils";

// --- Helper Functions ---

const calculateHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  try {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (isNaN(start) || isNaN(end)) return 0;

    let diff = (end - start) / (1000 * 60 * 60); // hours
    if (diff < 0) diff += 24; // Handle overnight shifts if any
    return parseFloat(diff.toFixed(2));
  } catch (e) {
    return 0;
  }
};

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'PRESENT': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'PARTIAL': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'ABSENT': return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const GroupedReport = () => {
  const { currentUser, userType } = useContext(AuthContext);
  const isAdmin = userType?.toLowerCase() === "admin";

  // State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("table"); // 'table' or 'map' or 'charts'
  const [selectedDayRecords, setSelectedDayRecords] = useState(null); // For Modal
  const [isTodayActive, setIsTodayActive] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    month: "",
    year: new Date().getFullYear().toString(),
    userName: "",
    status: [], // Multi-select
    location: ""
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Attendance
        const { data: attData, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .order('date', { ascending: false })
          .order('time', { ascending: true });

        if (attError) throw attError;
        setAttendanceRecords(attData || []);

        // Fetch Users (for stats)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_name, sales_person_name, admin');

        if (userError) throw userError;
        setUsers(userData || []);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Grouping & Logic ---
  const processedData = useMemo(() => {
    const grouped = {};
    const today = new Date().toISOString().split('T')[0];
    const isTodayView = filters.startDate === today && filters.endDate === today;

    // First, process existing attendance records
    attendanceRecords.forEach((rec) => {
      const key = `${rec.person_name}_${rec.date}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: rec.person_name,
          date: rec.date,
          records: [],
          firstIn: null,
          lastOut: null,
          midEntries: [],
          totalHours: 0,
          location: rec.address,
          city: rec.address?.split(',').slice(-3, -2)[0]?.trim() || "Unknown",
          latestImage: rec.images,
          mapLink: rec.map_link,
          lat: rec.latitude,
          lng: rec.longitude,
          status: 'Partial'
        };
      }

      grouped[key].records.push(rec);

      if (rec.status === 'IN' && !grouped[key].firstIn) {
        grouped[key].firstIn = rec.time;
      }
      if (rec.status === 'OUT') {
        grouped[key].lastOut = rec.time;
      }
      if (rec.status === 'MID') {
        grouped[key].midEntries.push(rec.time);
      }

      // Update latest info
      grouped[key].location = rec.address || grouped[key].location;
      if (rec.images) grouped[key].latestImage = rec.images;
      if (rec.map_link) grouped[key].mapLink = rec.map_link;
    });

    // If "Today" view is active, ensure all users are present in "grouped" for today
    if (isTodayView && users.length > 0) {
      users.forEach(user => {
        const key = `${user.sales_person_name}_${today}`;
        if (!grouped[key]) {
          grouped[key] = {
            name: user.sales_person_name,
            date: today,
            records: [],
            firstIn: null,
            lastOut: null,
            midEntries: [],
            totalHours: 0,
            location: 'N/A',
            city: 'Unknown',
            latestImage: null,
            mapLink: null,
            lat: null,
            lng: null,
            status: 'Absent'
          };
        }
      });
    }

    // Finalize groups and calculate status
    return Object.values(grouped).map(group => {
      const hours = calculateHours(group.firstIn, group.lastOut);
      group.totalHours = hours;

      if (group.firstIn && group.midEntries.length > 0 && group.lastOut) {
        group.status = 'Present';
      } else if (!group.firstIn && group.midEntries.length === 0 && !group.lastOut) {
        group.status = 'Absent';
      } else {
        group.status = 'Partial';
      }

      return group;
    });
  }, [attendanceRecords, users, filters.startDate, filters.endDate]);

  // --- Filtering ---
  const filteredData = useMemo(() => {
    return processedData.filter(item => {
      const matchesName = !filters.userName || item.name.toLowerCase().includes(filters.userName.toLowerCase());
      const matchesDateRange = (!filters.startDate || item.date >= filters.startDate) &&
        (!filters.endDate || item.date <= filters.endDate);
      const matchesMonth = !filters.month || item.date.includes(`-${filters.month.padStart(2, '0')}-`);
      const matchesStatus = filters.status.length === 0 || filters.status.includes(item.status);
      const matchesLocation = !filters.location || item.location?.toLowerCase().includes(filters.location.toLowerCase());

      return matchesName && matchesDateRange && matchesMonth && matchesStatus && matchesLocation;
    });
  }, [processedData, filters]);

  // --- Stats ---
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const presentToday = filteredData.filter(d => d.status === 'Present').length;
    const partialToday = filteredData.filter(d => d.status === 'Partial').length;
    const avgHours = filteredData.length > 0
      ? (filteredData.reduce((acc, curr) => acc + curr.totalHours, 0) / filteredData.length).toFixed(1)
      : 0;

    return {
      totalUsers,
      present: presentToday,
      partial: partialToday,
      absent: Math.max(0, totalUsers - (presentToday + partialToday)),
      avgHours
    };
  }, [filteredData, users]);

  // --- Charts Data ---
  const chartData = useMemo(() => {
    const userMap = {};
    filteredData.forEach(d => {
      userMap[d.name] = (userMap[d.name] || 0) + 1;
    });
    const userBarData = Object.entries(userMap).map(([name, count]) => ({ name, count })).slice(0, 10);

    // Status Pie
    const pieData = [
      { name: 'Present', value: stats.present, color: '#10b981' },
      { name: 'Partial', value: stats.partial, color: '#f59e0b' },
      { name: 'Absent', value: stats.absent, color: '#ef4444' },
    ];

    return { userBarData, pieData };
  }, [filteredData, stats]);

  // --- Export Functions ---
  const exportToCSV = () => {
    const headers = ["Date", "User Name", "First IN", "Last OUT", "Total Hours", "Status", "Location", "Map Link"];
    const rows = filteredData.map(item => [
      item.date,
      item.name,
      item.firstIn || "N/A",
      item.lastOut || "N/A",
      item.totalHours,
      item.status,
      item.location?.replace(/,/g, ' '),
      item.mapLink
    ]);

    const csvContent = "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    let excelContent = `<?xml version="1.0"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:o="urn:schemas-microsoft-com:office:office"
                xmlns:x="urn:schemas-microsoft-com:office:excel"
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:html="http://www.w3.org/TR/REC-html40">
        <Worksheet ss:Name="Attendance Report">
          <Table>
            <Row ss:StyleID="Header">
              <Cell><Data ss:Type="String">Date</Data></Cell>
              <Cell><Data ss:Type="String">User Name</Data></Cell>
              <Cell><Data ss:Type="String">First IN</Data></Cell>
              <Cell><Data ss:Type="String">Last OUT</Data></Cell>
              <Cell><Data ss:Type="String">Total Hours</Data></Cell>
              <Cell><Data ss:Type="String">Status</Data></Cell>
              <Cell><Data ss:Type="String">Location</Data></Cell>
            </Row>`;

    filteredData.forEach(item => {
      excelContent += `
        <Row>
          <Cell><Data ss:Type="String">${item.date}</Data></Cell>
          <Cell><Data ss:Type="String">${item.name}</Data></Cell>
          <Cell><Data ss:Type="String">${item.firstIn || "-"}</Data></Cell>
          <Cell><Data ss:Type="String">${item.lastOut || "-"}</Data></Cell>
          <Cell><Data ss:Type="Number">${item.totalHours}</Data></Cell>
          <Cell><Data ss:Type="String">${item.status}</Data></Cell>
          <Cell><Data ss:Type="String">${item.location || "-"}</Data></Cell>
        </Row>`;
    });

    excelContent += `</Table></Worksheet></Workbook>`;

    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_Report_${Date.now()}.xls`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  // const clearFilters = () => {
  //   setFilters({
  //     startDate: "",
  //     endDate: "",
  //     month: "",
  //     year: new Date().getFullYear().toString(),
  //     userName: "",
  //     status: [],
  //     location: ""
  //   });
  // };


  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      month: "",
      year: new Date().getFullYear().toString(),
      userName: "",
      status: [],
      location: ""
    });

    setIsTodayActive(false); // 🔥 ADD THIS
  };


  const setTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({
      startDate: today,
      endDate: today,
      month: "",
      year: new Date().getFullYear().toString(),
      userName: "",
      status: [],
      location: ""
    });

    setIsTodayActive(true); // 🔥 ADD THIS
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-6 font-sans">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Analytics
          </h1>
          <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Admin Dashboard • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </motion.div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            CSV
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg text-white text-sm font-medium hover:bg-blue-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue", trend: "+2%" },
          { label: "Total Present", value: stats.present, icon: UserCheck, color: "emerald", trend: "Normal" },
          { label: "Partial/MID", value: stats.partial, icon: TrendingUp, color: "amber", trend: "High" },
          { label: "Absent", value: stats.absent, icon: UserMinus, color: "rose", trend: "-5%" },
          { label: "Avg Hours", value: `${stats.avgHours}h`, icon: Clock, color: "indigo", trend: "Target: 8h" }
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg bg-${card.color}-50`}>
                <card.icon className={`w-5 h-5 text-${card.color}-600`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${card.color}-50 text-${card.color}-700`}>
                {card.trend}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{card.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* User Search */}
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-medium text-gray-600">Search User</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Type name to search..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={filters.userName}
                onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">From Date</label>
            <input
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">To Date</label>
            <input
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          {/* Month Selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Month</label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            >
              <option value="">All Months</option>
              {monthNames.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Filter Actions */}
          <div className="flex items-end gap-2 lg:col-span-1">
            <button
              onClick={setTodayFilter}
              disabled={isTodayActive}
              className={`flex-1 font-medium py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2 shadow-sm
    ${isTodayActive
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }
  `}
            >
              Today
            </button>
            <button
              onClick={clearFilters}
              className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 px-3 rounded-lg hover:bg-gray-200 transition-all text-sm flex items-center justify-center gap-2"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Multi-Status Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <label className="text-xs font-medium text-gray-600 mr-2">Status:</label>
          {['Present', 'Partial', 'Absent',].map(s => (
            <button
              key={s}
              onClick={() => {
                const newStatus = filters.status.includes(s)
                  ? filters.status.filter(i => i !== s)
                  : [...filters.status, s];
                setFilters({ ...filters, status: newStatus });
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${filters.status.includes(s)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Tabs & View */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Table/Map/Graph Toggle */}
        <div className="flex border-b border-gray-200 px-6 py-3 bg-gray-50/50 items-center justify-between">
          <div className="flex gap-1">
            {[
              { id: 'table', icon: TableIcon, label: 'Table View' },
              { id: 'charts', icon: PieChartIcon, label: 'Analytics' },
              { id: 'map', icon: MapIcon, label: 'Map View' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-500">
            Showing <span className="text-blue-600 font-semibold">{filteredData.length}</span> records
          </div>
        </div>

        {/* View Render */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'table' && (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                // className="overflow-x-auto"
                className="overflow-x-auto max-h-[500px] overflow-y-auto"
              >
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">User Details</th>
                      <th className="px-4 py-3">Check-In</th>
                      <th className="px-4 py-3">Check-Out</th>
                      <th className="px-4 py-3">Total Hours</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Primary Location</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredData.map((item, idx) => (
                      <motion.tr
                        key={`${item.name}_${item.date}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedDayRecords(item)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-700">{item.date}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                              {item.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3 text-green-600" />
                            <span>{item.firstIn || '--:--'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3 text-red-600" />
                            <span>{item.lastOut || '--:--'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm font-semibold ${item.totalHours >= 8 ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.totalHours}h
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                            <span className="text-xs text-gray-600 line-clamp-1">
                              {item.location || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Search className="w-12 h-12 text-gray-300 mb-3" />
                            <h3 className="text-base font-semibold text-gray-700">No matches found</h3>
                            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'charts' && (
              <motion.div
                key="charts"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Attendance Records per User
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.userBarData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#6b7280' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-emerald-600" />
                    Overall Status Distribution
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.pieData}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700">Team Locations</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    Viewing real-time physical distribution of staff members.
                    Interactive maps are currently synchronized with the latest entries.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
                    {filteredData.slice(0, 6).map(item => (
                      <div key={`map_${item.name}`} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-left">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          <a href={item.mapLink} target="_blank" className="p-1 rounded-md bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{item.location}</p>
                        <div className="text-xs text-gray-400 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last Active: {item.lastOut || item.firstIn || '--:--'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline Modal */}
      <AnimatePresence>
        {selectedDayRecords && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDayRecords(null)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-blue-600 p-6 text-white">
                <button
                  onClick={() => setSelectedDayRecords(null)}
                  className="absolute top-4 right-4 p-1 rounded-md bg-white/10 hover:bg-white/20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xl font-semibold">
                    {selectedDayRecords.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedDayRecords.name}</h2>
                    <p className="text-sm text-blue-100">{selectedDayRecords.date} • {selectedDayRecords.status} Status</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Daily Timeline</h3>

                  <div className="relative border-l-2 border-gray-200 ml-4 space-y-6 pb-6">
                    {selectedDayRecords.records.map((rec, i) => (
                      <div key={rec.id} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${rec.status === 'IN' ? 'bg-green-500' :
                            rec.status === 'OUT' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${rec.status === 'IN' ? 'bg-green-600' :
                                rec.status === 'OUT' ? 'bg-red-600' : 'bg-yellow-600'
                              }`}>
                              {rec.status}
                            </span>
                            <span className="text-sm font-medium text-gray-700">{rec.time}</span>
                          </div>

                          <div className="flex gap-3">
                            {rec.images && (
                              <div className="h-16 w-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                <img src={rec.images} className="h-full w-full object-cover" alt="Verification" />
                              </div>
                            )}
                            <div className="space-y-1 flex-1">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                                <span className="text-xs text-gray-600">{rec.address}</span>
                              </div>
                              <a href={rec.map_link} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> View location
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-700 uppercase">Total Hours</p>
                      <h4 className="text-2xl font-bold text-blue-900">{selectedDayRecords.totalHours} Hours</h4>
                    </div>
                    <Clock className="w-8 h-8 text-blue-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="text-center py-6">
        <p className="text-xs text-gray-400">
          Attendance Intelligence System • Enterprise
        </p>
      </div>

    </div>
  );
};

export default GroupedReport;