// "use client";
// import { useState, useEffect, useContext, useRef, useCallback } from "react";
// import ReactDOM from "react-dom";
// import {
//   MapPin,
//   Loader2,
//   Download,
//   Calendar,
//   CheckCircle,
//   XCircle,
//   Clock,
//   AlertTriangle,
//   Upload,
//   Camera,
// } from "lucide-react";
// import { AuthContext } from "../context/AuthContext";
// import supabase from "../utils/supabase";

// const AttendanceSummaryCard = ({
//   attendanceData,
//   isLoading,
//   userRole,
//   salesPersonName,
//   selectedMonth,
// }) => {
//   const [summaryData, setSummaryData] = useState({
//     totalPresent: 0,
//     totalLeave: 0,
//     totalIn: 0,
//     totalOut: 0,
//     totalMispunch: 0,
//     mispunchDetails: [],
//   });

//   // Helper function to check if a day is complete (next day has started or past cutoff)
//   const isDayComplete = (dateStr) => {
//     if (!dateStr) return false;

//     const [day, month, year] = dateStr.split("/");
//     const targetDate = new Date(
//       parseInt(year),
//       parseInt(month) - 1,
//       parseInt(day)
//     );
//     const currentDate = new Date();

//     // Set cutoff time to 11:59 PM of the target date
//     const cutoffTime = new Date(targetDate);
//     cutoffTime.setHours(23, 59, 59, 999);

//     // Day is complete if current time is past the cutoff time
//     return currentDate > cutoffTime;
//   };

//   // Helper function to determine mispunch status
//   const determineMispunchStatus = (inCount, outCount, dateStr, hasLeave) => {
//     // If it's a leave day, no mispunch consideration
//     if (hasLeave) {
//       return { isMispunch: false, type: "leave" };
//     }

//     // If no punches at all, not a mispunch
//     if (inCount === 0 && outCount === 0) {
//       return { isMispunch: false, type: "absent" };
//     }

//     const isDayOver = isDayComplete(dateStr);

//     // Valid Attendance: At least one IN and one OUT
//     if (inCount >= 1 && outCount >= 1) {
//       // Perfect match
//       if (inCount === outCount) {
//         return { isMispunch: false, type: "complete" };
//       }
//       // Mismatched counts but has both In and Out (e.g. 2 IN, 1 OUT) - technically valid for "Present" status, just duplicate punches
//       return {
//         isMispunch: false, // Don't flag as mispunch to avoid confusing user
//         type: "complete_with_duplicates",
//         details: `${inCount} IN vs ${outCount} OUT - Valid attendance (duplicate punches detected)`,
//       };
//     }

//     // Missing OUT: Has IN but no OUT
//     if (inCount > 0 && outCount === 0) {
//       if (isDayOver) {
//         return {
//           isMispunch: true,
//           type: "missing_out",
//           details: `${inCount} IN - Missing OUT punch`,
//         };
//       } else {
//         return {
//           isMispunch: false,
//           type: "in_progress",
//           details: "Day in progress",
//         };
//       }
//     }

//     // Invalid: Has OUT but no IN
//     if (outCount > 0 && inCount === 0) {
//       return {
//         isMispunch: true,
//         type: "invalid",
//         details: `${outCount} OUT - Missing IN punch`,
//       };
//     }

//     return { isMispunch: false, type: "unknown" };
//   };

//   useEffect(() => {
//     if (!attendanceData || attendanceData.length === 0) {
//       setSummaryData({
//         totalPresent: 0,
//         totalLeave: 0,
//         totalIn: 0,
//         totalOut: 0,
//         totalMispunch: 0,
//         mispunchDetails: [],
//       });
//       return;
//     }

//     // Filter data for current user (admin sees all, users see only their data)
//     const userSpecificData =
//       userRole?.toLowerCase() === "admin"
//         ? attendanceData
//         : attendanceData.filter(
//           (entry) => entry.salesPersonName === salesPersonName
//         );

//     // Calculate statistics
//     let targetMonth, targetYear;

//     if (selectedMonth) {
//       const monthDate = new Date(selectedMonth); // "December 2025" -> Date obj
//       if (!isNaN(monthDate.getTime())) {
//         targetMonth = monthDate.getMonth();
//         targetYear = monthDate.getFullYear();
//       } else {
//         // Robust manual parsing:
//         const [mName, yStr] = selectedMonth.split(" ");
//         targetMonth = monthNames.indexOf(mName);
//         targetYear = parseInt(yStr);
//       }
//     } else {
//       const now = new Date();
//       targetMonth = now.getMonth();
//       targetYear = now.getFullYear();
//     }

//     // Group by employee and date to calculate daily statistics
//     const employeeDailyRecords = {};

//     userSpecificData.forEach((entry) => {
//       // Robust status matching
//       const statusNormalized = entry.status?.trim().toUpperCase();

//       if (!entry.dateTime) return;

//       const [year, month, day] = entry.date ? entry.date.split("-") : [null, null, null];
//       let entryDate;

//       if (year && month && day) {
//         entryDate = new Date(
//           parseInt(year),
//           parseInt(month) - 1,
//           parseInt(day)
//         );
//       } else if (entry.dateTime) {
//         // Fallback for ISO or legacy format
//         entryDate = new Date(entry.dateTime);
//         if (isNaN(entryDate.getTime())) {
//           // Try DD/MM/YYYY
//           const dateStr = entry.dateTime.split(" ")[0];
//           const [d, m, y] = dateStr.split("/");
//           entryDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
//         }
//       }

//       if (!entryDate || isNaN(entryDate.getTime())) return;

//       // Only count target month records
//       if (
//         entryDate.getMonth() === targetMonth &&
//         entryDate.getFullYear() === targetYear
//       ) {
//         const dateStr = entry.date || (entry.dateTime ? entry.dateTime.split(" ")[0] : "unknown");
//         const employeeName = entry.salesPersonName || "Unknown";
//         const dateKey = `${employeeName}_${dateStr}`;

//         if (!employeeDailyRecords[dateKey]) {
//           employeeDailyRecords[dateKey] = {
//             employee: employeeName,
//             date: dateStr,
//             inCount: 0,
//             outCount: 0,
//             leaveCount: 0,
//             hasLeave: false,
//             punches: [],
//           };
//         }

//         if (statusNormalized === "IN") {
//           employeeDailyRecords[dateKey].inCount++;
//           employeeDailyRecords[dateKey].punches.push({
//             type: "IN",
//             time: entry.dateTime,
//             status: entry.status,
//           });
//         } else if (statusNormalized === "OUT") {
//           employeeDailyRecords[dateKey].outCount++;
//           employeeDailyRecords[dateKey].punches.push({
//             type: "OUT",
//             time: entry.dateTime,
//             status: entry.status,
//           });
//         } else if (
//           statusNormalized === "LEAVE" ||
//           statusNormalized === "LEAVES"
//         ) {
//           employeeDailyRecords[dateKey].leaveCount++;
//           employeeDailyRecords[dateKey].hasLeave = true;
//           employeeDailyRecords[dateKey].punches.push({
//             type: "LEAVE",
//             time: entry.dateTime,
//             status: entry.status,
//           });
//         }
//       }
//     });

//     // Calculate totals and mispunch details
//     let totalPresent = 0;
//     let totalLeave = 0;
//     let totalIn = 0;
//     let totalOut = 0;
//     let totalMispunch = 0;
//     const mispunchDetails = [];

//     Object.values(employeeDailyRecords).forEach((dayRecord) => {
//       totalIn += dayRecord.inCount;
//       totalOut += dayRecord.outCount;
//       totalLeave += dayRecord.leaveCount;

//       // Determine if this is a leave day, present day, or absent day
//       if (dayRecord.hasLeave) {
//         // Don't count leave days as present or absent
//       } else if (dayRecord.inCount > 0 || dayRecord.outCount > 0) {
//         totalPresent++;
//       }

//       // Check for mispunch using the new logic
//       const mispunchStatus = determineMispunchStatus(
//         dayRecord.inCount,
//         dayRecord.outCount,
//         dayRecord.date,
//         dayRecord.hasLeave
//       );

//       if (mispunchStatus.isMispunch) {
//         totalMispunch++;
//         mispunchDetails.push({
//           employee: dayRecord.employee,
//           date: dayRecord.date,
//           inCount: dayRecord.inCount,
//           outCount: dayRecord.outCount,
//           type: mispunchStatus.type,
//           details: mispunchStatus.details,
//           isDayComplete: isDayComplete(dayRecord.date),
//           punches: dayRecord.punches,
//         });
//       }
//     });

//     // console.log(totalPresent,"totalpresent")
//     setSummaryData({
//       totalPresent,
//       totalLeave: Math.max(
//         totalLeave,
//         Object.values(employeeDailyRecords).filter((day) => day.hasLeave).length
//       ),
//       totalIn,
//       totalOut,
//       totalMispunch,
//       mispunchDetails,
//     });
//   }, [attendanceData, salesPersonName, userRole, selectedMonth]);

//   if (isLoading) {
//     return (
//       <div className="mb-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
//         <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
//           <h2 className="text-2xl font-bold text-white">Attendance Summary</h2>
//           <p className="text-blue-50">Loading your attendance statistics...</p>
//         </div>
//         <div className="p-8 text-center">
//           <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
//           <p className="text-slate-600">Loading attendance summary...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="mb-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
//       <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
//         <div className="flex items-center gap-3 mb-2">
//           <Calendar className="w-6 h-6 text-white" />
//           <h2 className="text-2xl font-bold text-white">
//             {userRole?.toLowerCase() === "admin"
//               ? "Overall Attendance Summary"
//               : "Your Attendance Summary"}
//           </h2>
//         </div>
//         <p className="text-blue-50">
//           {userRole?.toLowerCase() === "admin"
//             ? "Complete attendance overview for current month"
//             : `Monthly attendance overview for ${salesPersonName}`}
//         </p>
//       </div>

//       <div className="p-8">
//         <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
//           {/* Total Present Days */}
//           <div className="p-6 text-center transition-shadow border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-lg">
//             <div className="flex justify-center mb-3">
//               <CheckCircle className="w-8 h-8 text-green-600" />
//             </div>
//             <div className="mb-1 text-3xl font-bold text-green-700">
//               {summaryData.totalPresent}
//             </div>
//             <div className="text-sm font-medium text-green-600">
//               Present Days
//             </div>
//           </div>

//           {/* Total Leave Days */}
//           <div className="p-6 text-center transition-shadow border bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 rounded-xl hover:shadow-lg">
//             <div className="flex justify-center mb-3">
//               <XCircle className="w-8 h-8 text-amber-600" />
//             </div>
//             <div className="mb-1 text-3xl font-bold text-amber-700">
//               {summaryData.totalLeave}
//             </div>
//             <div className="text-sm font-medium text-amber-600">Leave Days</div>
//           </div>

//           {/* Total IN */}
//           <div className="p-6 text-center transition-shadow border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-lg">
//             <div className="flex justify-center mb-3">
//               <Clock className="w-8 h-8 text-blue-600" />
//             </div>
//             <div className="mb-1 text-3xl font-bold text-blue-700">
//               {summaryData.totalIn}
//             </div>
//             <div className="text-sm font-medium text-blue-600">Total IN</div>
//           </div>

//           {/* Total OUT */}
//           <div className="p-6 text-center transition-shadow border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl hover:shadow-lg">
//             <div className="flex justify-center mb-3">
//               <Clock className="w-8 h-8 text-purple-600" />
//             </div>
//             <div className="mb-1 text-3xl font-bold text-purple-700">
//               {summaryData.totalOut}
//             </div>
//             <div className="text-sm font-medium text-purple-600">Total OUT</div>
//           </div>

//           {/* Total Mispunch */}
//           <div className="p-6 text-center transition-shadow border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl hover:shadow-lg">
//             <div className="flex justify-center mb-3">
//               <AlertTriangle className="w-8 h-8 text-red-600" />
//             </div>
//             <div className="mb-1 text-3xl font-bold text-red-700">
//               {summaryData.totalMispunch}
//             </div>
//             <div className="text-sm font-medium text-red-600">Mispunch</div>
//           </div>
//         </div>

//         {/* Mispunch Details Section */}
//         {summaryData.mispunchDetails.length > 0 && (
//           <div className="p-6 mt-8 border border-red-200 bg-red-50/50 rounded-xl">
//             <div className="flex items-center gap-2 mb-4">
//               <AlertTriangle className="w-5 h-5 text-red-600" />
//               <h3 className="text-lg font-semibold text-red-800">
//                 Mispunch Details
//               </h3>
//             </div>
//             <div className="space-y-3">
//               {summaryData.mispunchDetails.map((detail, index) => (
//                 <div
//                   key={index}
//                   className="p-4 border border-red-200 rounded-lg bg-white/60"
//                 >
//                   <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//                     <div className="flex-1">
//                       <div className="font-medium text-red-800">
//                         {userRole?.toLowerCase() === "admin"
//                           ? `${detail.employee} - `
//                           : ""}
//                         {detail.date}
//                       </div>
//                       <div className="mt-1 text-sm text-red-600">
//                         {detail.details}
//                       </div>
//                       <div className="mt-1 text-xs text-red-500">
//                         {detail.type === "missing_out" &&
//                           "Day completed - Missing OUT punch(es)"}
//                         {detail.type === "invalid" && "Invalid punch sequence"}
//                         {detail.isDayComplete
//                           ? " (Day Complete)"
//                           : " (Day In Progress)"}
//                       </div>
//                     </div>
//                     <div className="flex gap-2">
//                       <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded">
//                         IN: {detail.inCount}
//                       </span>
//                       <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded">
//                         OUT: {detail.outCount}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Additional Info */}
//         <div className="p-4 mt-6 rounded-lg bg-slate-50/50">
//           <div className="text-sm text-center text-slate-600">
//             <span className="font-medium">Current Month:</span>{" "}
//             {new Date().toLocaleDateString("en-US", {
//               month: "long",
//               year: "numeric",
//             })}
//             {userRole?.toLowerCase() !== "admin" && (
//               <>
//                 <span className="mx-2">•</span>
//                 <span className="font-medium">User:</span> {salesPersonName}
//               </>
//             )}
//             <span className="mx-2">•</span>
//             <span className="font-medium">Mispunch Cutoff:</span> 11:59 PM daily
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // AttendanceHistory Component with filters in header and Excel download functionality
// const AttendanceHistory = ({
//   attendanceData,
//   isLoading,
//   userRole,
//   filters,
//   setFilters,
//   filteredData,
//   getUniqueNames,
//   getAvailableMonths,
//   monthNames, // Passed down if needed for other things, though we use getAvailableMonths mostly
// }) => {
//   // Helper to format date and time professionally
//   const formatDisplayDateTime = (dateTimeStr) => {
//     if (!dateTimeStr) return { date: "N/A", time: "N/A" };

//     try {
//       let dateObj;
//       if (dateTimeStr.includes("T")) {
//         // ISO format (e.g., 2026-01-18T08:12:14.038)
//         dateObj = new Date(dateTimeStr);
//       } else if (dateTimeStr.includes("/")) {
//         // Custom format (e.g., 18/01/2026 08:12:14 or 18/01/2026)
//         const [datePart, timePart] = dateTimeStr.split(" ");
//         const [day, month, year] = datePart.split("/");

//         if (timePart) {
//           const [hours, minutes, seconds] = timePart.split(":");
//           dateObj = new Date(
//             parseInt(year),
//             parseInt(month) - 1,
//             parseInt(day),
//             parseInt(hours) || 0,
//             parseInt(minutes) || 0,
//             parseInt(seconds) || 0
//           );
//         } else {
//           dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
//         }
//       } else {
//         // Last resort try constructor
//         dateObj = new Date(dateTimeStr);
//       }

//       if (isNaN(dateObj.getTime())) {
//         const parts = dateTimeStr.split(" ");
//         return { date: parts[0] || "N/A", time: parts[1] || "" };
//       }

//       return {
//         date: dateObj.toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         }),
//         time: dateObj.toLocaleTimeString("en-GB", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: true,
//         }).toLowerCase(),
//       };
//     } catch (e) {
//       console.error("Format error:", e);
//       const parts = dateTimeStr.split(" ");
//       return { date: parts[0] || "N/A", time: parts[1] || "" };
//     }
//   };

//   // Enhanced Excel download function
//   const downloadExcel = () => {
//     // Use filteredData passed from parent
//     if (!filteredData || filteredData.length === 0) {
//       alert("No data available to download");
//       return;
//     }

//     // Create proper Excel content with XML format
//     const currentDate = new Date().toLocaleDateString();
//     const fileName = `Attendance_History_${new Date().toISOString().split("T")[0]
//       }`;

//     // Create Excel XML structure
//     let excelContent = `<?xml version="1.0"?>
//       <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
//                 xmlns:o="urn:schemas-microsoft-com:office:office"
//                 xmlns:x="urn:schemas-microsoft-com:office:excel"
//                 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
//                 xmlns:html="http://www.w3.org/TR/REC-html40">
//         <Worksheet ss:Name="Attendance History">
//           <Table>
//             <Row>
//               <Cell><Data ss:Type="String">Name</Data></Cell>
//               <Cell><Data ss:Type="String">Date &amp; Time</Data></Cell>
//               <Cell><Data ss:Type="String">Status</Data></Cell>
//               <Cell><Data ss:Type="String">Map Link</Data></Cell>
//               <Cell><Data ss:Type="String">Address</Data></Cell>
//             </Row>`;

//     // Add data rows
//     filteredData.forEach((row) => {
//       excelContent += `
//         <Row>
//           <Cell><Data ss:Type="String">${row.salesPersonName || "N/A"
//         }</Data></Cell>
//           <Cell><Data ss:Type="String">${row.dateTime || "N/A"}</Data></Cell>
//           <Cell><Data ss:Type="String">${row.status || "N/A"}</Data></Cell>
//           <Cell><Data ss:Type="String">${row.mapLink || "N/A"}</Data></Cell>
//           <Cell><Data ss:Type="String">${(row.address || "N/A").replace(
//           /[<>&"']/g,
//           function (match) {
//             switch (match) {
//               case "<":
//                 return "&lt;";
//               case ">":
//                 return "&gt;";
//               case "&":
//                 return "&amp;";
//               case '"':
//                 return "&quot;";
//               case "'":
//                 return "&apos;";
//               default:
//                 return match;
//             }
//           }
//         )}</Data></Cell>
//         </Row>`;
//     });

//     excelContent += `
//           </Table>
//         </Worksheet>
//       </Workbook>`;

//     // Create and download the file
//     const blob = new Blob([excelContent], {
//       type: "application/vnd.ms-excel;charset=utf-8;",
//     });

//     const link = document.createElement("a");
//     const url = URL.createObjectURL(blob);
//     link.setAttribute("href", url);
//     link.setAttribute("download", `${fileName}.xls`);
//     link.style.visibility = "hidden";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   const handleFilterChange = (filterType, value) => {
//     setFilters((prev) => ({
//       ...prev,
//       [filterType]: value,
//     }));
//   };

//   const clearFilters = () => {
//     setFilters({
//       name: "",
//       status: "",
//       month: "",
//     });
//   };

//   const hasActiveFilters = filters.name || filters.status || filters.month;

//   if (isLoading) {
//     return (
//       <div className="mt-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
//         <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
//           <h2 className="text-2xl font-bold text-white">Attendance History</h2>
//           <p className="text-blue-50">Loading your attendance records...</p>
//         </div>
//         <div className="p-8 text-center">
//           <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
//           <p className="text-slate-600">Loading attendance history...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="mt-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
//       {/* Header with Filters and Download */}
//       <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
//         <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-center lg:justify-between">
//           <div>
//             <h2 className="text-2xl font-bold text-white">
//               Attendance History
//             </h2>
//             <p className="text-blue-50">Your records are displayed below.</p>
//           </div>

//           {/* Excel Download Button Only */}
//           {userRole?.toLowerCase() === "admin" && filteredData.length > 0 && (
//             <div className="flex gap-2">
//               <button
//                 onClick={downloadExcel}
//                 className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors bg-green-600 border border-green-500 rounded-lg shadow-md hover:bg-green-700"
//                 title="Download as Excel"
//               >
//                 <Download className="w-4 h-4" />
//                 Download
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Filters Row - Only show for admin */}
//         {userRole?.toLowerCase() === "admin" && (
//           <div className="grid items-end gap-3 md:grid-cols-4">
//             {/* Name Filter */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-blue-100">
//                 Filter by Name
//               </label>
//               <select
//                 value={filters.name}
//                 onChange={(e) => handleFilterChange("name", e.target.value)}
//                 className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700 focus:ring-2 focus:ring-white/50 focus:border-white/50"
//               >
//                 <option value="">All Names</option>
//                 {getUniqueNames(attendanceData || []).map((name) => (
//                   <option key={name} value={name}>
//                     {name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Status Filter */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-blue-100">
//                 Filter by Status
//               </label>
//               <select
//                 value={filters.status}
//                 onChange={(e) => handleFilterChange("status", e.target.value)}
//                 className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700 focus:ring-2 focus:ring-white/50 focus:border-white/50"
//               >
//                 <option value="">All Status</option>
//                 <option value="IN">IN</option>
//                 <option value="OUT">OUT</option>
//                 <option value="Leave">Leave</option>
//               </select>
//             </div>

//             {/* Month Filter */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-blue-100">
//                 Filter by Month
//               </label>
//               <select
//                 value={filters.month}
//                 onChange={(e) => handleFilterChange("month", e.target.value)}
//                 className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700 focus:ring-2 focus:ring-white/50 focus:border-white/50"
//               >
//                 <option value="">All Months</option>
//                 {getAvailableMonths(attendanceData || []).map((monthYear) => (
//                   <option key={monthYear} value={monthYear}>
//                     {monthYear}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Clear Filters Button */}
//             <div>
//               {hasActiveFilters && (
//                 <button
//                   onClick={clearFilters}
//                   className="w-full px-3 py-2 text-sm text-white transition-colors border rounded-lg bg-white/20 hover:bg-white/30 border-white/30"
//                 >
//                   Clear Filters
//                 </button>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Filter Results Info */}
//         {hasActiveFilters && (
//           <div className="p-3 mt-3 border rounded-lg bg-white/10 border-white/20">
//             <p className="text-sm text-blue-100">
//               Showing {filteredData.length} of {attendanceData?.length || 0}{" "}
//               records
//               {filters.name && ` • Name: ${filters.name}`}
//               {filters.status && ` • Status: ${filters.status}`}
//               {filters.month && ` • Month: ${filters.month}`}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Table Content */}
//       <div className="overflow-x-auto">
//         {!attendanceData || attendanceData.length === 0 ? (
//           <div className="p-8 text-center">
//             <div className="mb-2 text-lg text-slate-400">📊</div>
//             <h3 className="mb-2 text-lg font-semibold text-slate-600">
//               No Records Found
//             </h3>
//             <p className="text-slate-500">
//               {userRole?.toLowerCase() === "admin"
//                 ? "No attendance records available."
//                 : "You haven't marked any attendance yet."}
//             </p>
//           </div>
//         ) : filteredData.length === 0 && hasActiveFilters ? (
//           <div className="p-8 text-center">
//             <div className="mb-2 text-lg text-slate-400">🔍</div>
//             <h3 className="mb-2 text-lg font-semibold text-slate-600">
//               No Matching Records
//             </h3>
//             <p className="text-slate-500">
//               No records match your current filter criteria.
//             </p>
//           </div>
//         ) : (
//           <div className="min-w-full">
//             <table className="w-full border-collapse">
//               <thead className="border-b bg-slate-50/50 border-slate-200/50">
//                 <tr>
//                   <th className="w-32 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-r text-slate-600 border-slate-200/50">
//                     Name
//                   </th>
//                   <th className="w-48 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-r text-slate-600 border-slate-200/50">
//                     Date & Time
//                   </th>
//                   <th className="w-24 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-r text-slate-600 border-slate-200/50">
//                     Status
//                   </th>
//                   <th className="w-32 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-r text-slate-600 border-slate-200/50">
//                     Map Link
//                   </th>
//                   <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-600">
//                     Address
//                   </th>
//                   <th className="w-24 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-l text-slate-600 border-slate-200/50">
//                     Image
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-200/50">
//                 {filteredData.map((record, index) => (
//                   <tr
//                     key={index}
//                     className="transition-colors border-b hover:bg-slate-50/30 border-slate-200/30"
//                   >
//                     <td className="w-32 px-4 py-3 border-r border-slate-200/50">
//                       <div className="text-sm font-medium break-words text-slate-900">
//                         {record.salesPersonName || "N/A"}
//                       </div>
//                     </td>
//                     <td className="w-48 px-4 py-3 border-r border-slate-200/50">
//                       {record.dateTime ? (
//                         (() => {
//                           const { date, time } = formatDisplayDateTime(record.dateTime);
//                           return (
//                             <div className="flex flex-col gap-1">
//                               <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
//                                 <Calendar className="w-3.5 h-3.5 text-indigo-500" />
//                                 <span>{date}</span>
//                               </div>
//                               <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
//                                 <Clock className="w-3.5 h-3.5 text-amber-500" />
//                                 <span>{time}</span>
//                               </div>
//                             </div>
//                           );
//                         })()
//                       ) : (
//                         <span className="text-sm text-slate-400">N/A</span>
//                       )}
//                     </td>
//                     <td className="w-24 px-4 py-3 border-r border-slate-200/50">
//                       <span
//                         className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === "IN"
//                           ? "bg-green-100 text-green-800"
//                           : record.status === 'MID'
//                             ? "bg-blue-100 text-blue-800"
//                             : record.status === "OUT"
//                               ? "bg-red-100 text-red-800"
//                               : record.status === "Leave"
//                                 ? "bg-yellow-100 text-yellow-800"
//                                 : "bg-gray-100 text-gray-800"
//                           }`}
//                       >
//                         {record.status || "N/A"}
//                       </span>
//                     </td>
//                     <td className="w-32 px-4 py-3 border-r border-slate-200/50">
//                       {record.mapLink ? (
//                         <a
//                           href={record.mapLink}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="flex items-center gap-1 text-sm text-blue-600 break-all hover:text-blue-800"
//                         >
//                           <MapPin className="flex-shrink-0 w-4 h-4" />
//                           <span className="truncate">View Map</span>
//                         </a>
//                       ) : (
//                         <span className="text-sm text-slate-400">N/A</span>
//                       )}
//                     </td>
//                     <td className="px-4 py-3">
//                       <div
//                         className="max-w-md text-sm break-words text-slate-600"
//                         title={record.address}
//                       >
//                         {record.address || "N/A"}
//                       </div>
//                     </td>
//                     <td className="w-24 px-4 py-3 border-l border-slate-200/50">
//                       {record.imageUrl ? (
//                         <a
//                           href={record.imageUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="flex items-center justify-center transition-transform hover:scale-110"
//                         >
//                           <img
//                             src={record.imageUrl}
//                             alt="Attendance"
//                             className="object-cover w-12 h-12 rounded-lg shadow-sm border border-slate-200"
//                             onError={(e) => {
//                               e.target.onerror = null;
//                               e.target.src = "https://via.placeholder.com/150?text=No+Image";
//                             }}
//                           />
//                         </a>
//                       ) : (
//                         <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-lg bg-slate-100 text-slate-400">
//                           <Upload className="w-5 h-5" />
//                         </div>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // NOTE: File inputs are now rendered inline in the Attendance component,
// // outside the form element. The ImageCapturePortal approach was causing
// // memory issues on mobile. Simple inline inputs work better.

// // Main Attendance Component (rest of the code remains the same)
// const Attendance = () => {
//   // Office location (ye client se lekar set karna hoga)
//   const OFFICE_LOCATION = {
//     lat: 21.240739,
//     lng: 81.623879,
//   };
//   const ALLOWED_RADIUS_METERS = 10;

//   // Helper function to calculate distance between two coordinates
//   const calculateDistance = (lat1, lon1, lat2, lon2) => {
//     const R = 6371e3; // Earth's radius in meters
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c; // Distance in meters
//   };

//   const [attendance, setAttendance] = useState([]);
//   const [historyAttendance, setHistoryAttendance] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGettingLocation, setIsGettingLocation] = useState(false);
//   const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [locationData, setLocationData] = useState(null);
//   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
//   const [hasActiveSession, setHasActiveSession] = useState(false);
//   const [hasOutActiveSession, setHasOutActiveSession] = useState([]);
//   const [inData, setInData] = useState({});
//   const [outData, setOutData] = useState({});
//   const [locationPermissionStatus, setLocationPermissionStatus] =
//     useState("prompt"); // "granted", "denied", "prompt"

//   const { currentUser, isAuthenticated } = useContext(AuthContext);
//   const [userInField, setUserInField] = useState(null); // 'yes' or 'no'

//   // Fetch in_feild status from Supabase
//   useEffect(() => {
//     const fetchInFieldStatus = async () => {
//       if (currentUser?.username) {
//         try {
//           const { data, error } = await supabase
//             .from('users')
//             .select('in_feild')
//             .eq('user_name', currentUser.username)
//             .single();

//           if (error) throw error;
//           if (data) {
//             // Explicitly treat null or empty as 'no' (office worker)
//             const status = (data.in_feild === 'yes') ? 'yes' : 'no';
//             setUserInField(status);
//             console.log("Finalized in_feild status:", status);
//           }
//         } catch (err) {
//           console.error("Error fetching in_feild status:", err);
//           // Fallback to localStorage if Supabase fetch fails
//           const fallback = localStorage.getItem("InFiled") || "no";
//           setUserInField(fallback);
//         }
//       }
//     };

//     if (isAuthenticated) {
//       fetchInFieldStatus();
//     }
//   }, [currentUser, isAuthenticated]);

//   const [cameraPhoto, setCameraPhoto] = useState(null);
//   const [showCamera, setShowCamera] = useState(false);
//   const [stream, setStream] = useState(null);
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   const salesPersonName = currentUser?.salesPersonName || "Unknown User";
//   const userRole = currentUser?.role || "User";


//   const formatDateInput = (date) => {
//     return date.toISOString().split("T")[0];
//   };

//   // const formatDateMMDDYYYY = (date) => {
//   //   const day = String(date.getDate()).padStart(2, "0");
//   //   const month = String(date.getMonth() + 1).padStart(2, "0");
//   //   const year = date.getFullYear();
//   //   return `${month}/${day}/${year}`;
//   // };

//   const formatDateDDMMYYYY = (date) => {
//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
//   };

//   const formatDateTime = (date) => {
//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = date.getFullYear();
//     const hours = String(date.getHours()).padStart(2, "0");
//     const minutes = String(date.getMinutes()).padStart(2, "0");
//     const seconds = String(date.getSeconds()).padStart(2, "0");
//     return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
//   };

//   const formatDateDisplay = (date) => {
//     return date.toLocaleDateString("en-GB", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   };

//   const [formData, setFormData] = useState({
//     status: "",
//     startDate: formatDateInput(new Date()),
//     endDate: "",
//     reason: "",
//     image: "",
//   });

//   // Lifted Filter State
//   const [filters, setFilters] = useState({
//     name: "",
//     status: "",
//     month: "",
//   });
//   const [filteredHistoryCallbackData, setFilteredHistoryCallbackData] =
//     useState([]);

//   // Month names for dropdown
//   const monthNames = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];

//   const getUniqueNames = (data) => {
//     const names = data.map((entry) => entry.salesPersonName).filter(Boolean);
//     return [...new Set(names)].sort();
//   };

//  const getAvailableMonths = (data) => {
//   const months = new Set();
//   data.forEach((entry) => {
//     // Try to get date from various possible fields
//     let dateStr = null;
    
//     // Check different possible date fields in order of preference
//     if (entry.date) {
//       dateStr = entry.date; // Format: YYYY-MM-DD
//     } else if (entry.dateTime) {
//       dateStr = entry.dateTime.split(" ")[0]; // Could be DD/MM/YYYY or YYYY-MM-DD
//     } else if (entry.timestamp) {
//       // Handle timestamp which might be ISO format
//       const timestampDate = new Date(entry.timestamp);
//       if (!isNaN(timestampDate.getTime())) {
//         const year = timestampDate.getFullYear();
//         const month = timestampDate.getMonth();
//         months.add(`${monthNames[month]} ${year}`);
//         return;
//       }
//     }
    
//     if (!dateStr) return;
    
//     let day, month, year;
    
//     // Check if date is in YYYY-MM-DD format (with hyphens)
//     if (dateStr.includes('-')) {
//       [year, month, day] = dateStr.split('-');
//     } 
//     // Check if date is in DD/MM/YYYY format (with slashes)
//     else if (dateStr.includes('/')) {
//       [day, month, year] = dateStr.split('/');
//     } else {
//       return; // Unrecognized format
//     }
    
//     // Convert to numbers and validate
//     const monthNum = parseInt(month, 10) - 1;
//     const yearNum = parseInt(year, 10);
    
//     // Validate that we have valid numbers
//     if (!isNaN(monthNum) && monthNum >= 0 && monthNum < 12 && !isNaN(yearNum)) {
//       const monthName = monthNames[monthNum];
//       months.add(`${monthName} ${yearNum}`);
//     }
//   });
  
//   return Array.from(months).sort((a, b) => {
//     const [aMonth, aYear] = a.split(" ");
//     const [bMonth, bYear] = b.split(" ");
//     const aDate = new Date(parseInt(aYear), monthNames.indexOf(aMonth));
//     const bDate = new Date(parseInt(bYear), monthNames.indexOf(bMonth));
//     return bDate - aDate; // Sort in descending order (newest first)
//   });
// };

//  const applyFilters = (data) => {
//   if (!filters.name && !filters.status && !filters.month) {
//     return data;
//   }

//   return data.filter((entry) => {
//     // Filter by name
//     if (
//       filters.name &&
//       !entry.salesPersonName
//         ?.toLowerCase()
//         .includes(filters.name.toLowerCase())
//     ) {
//       return false;
//     }

//     // Filter by status
//     if (filters.status && entry.status !== filters.status) {
//       return false;
//     }

//     // Filter by month
//     if (filters.month) {
//       let entryMonth, entryYear;
      
//       // Try to get date from various fields
//       if (entry.date) {
//         // Format: YYYY-MM-DD
//         const [year, month] = entry.date.split('-');
//         entryYear = parseInt(year);
//         entryMonth = parseInt(month) - 1;
//       } else if (entry.timestamp) {
//         // Handle ISO timestamp
//         const date = new Date(entry.timestamp);
//         if (!isNaN(date.getTime())) {
//           entryYear = date.getFullYear();
//           entryMonth = date.getMonth();
//         }
//       } else if (entry.dateTime) {
//         // Handle dateTime field
//         const datePart = entry.dateTime.split(' ')[0];
//         if (datePart.includes('-')) {
//           const [year, month] = datePart.split('-');
//           entryYear = parseInt(year);
//           entryMonth = parseInt(month) - 1;
//         } else if (datePart.includes('/')) {
//           const [day, month, year] = datePart.split('/');
//           entryYear = parseInt(year);
//           entryMonth = parseInt(month) - 1;
//         }
//       }
      
//       // If we have valid month and year, compare with filter
//       if (entryYear !== undefined && entryMonth !== undefined) {
//         const entryMonthName = monthNames[entryMonth];
//         const entryMonthYear = `${entryMonthName} ${entryYear}`;
        
//         if (entryMonthYear !== filters.month) {
//           return false;
//         }
//       } else {
//         // Can't determine month/year, so exclude this entry
//         return false;
//       }
//     }

//     return true;
//   });
// };

//   // Effect to update filtered data when filters or attendance change
//   useEffect(() => {
//     const filtered = applyFilters(historyAttendance || []);
//     setFilteredHistoryCallbackData(filtered);
//   }, [filters, historyAttendance]);

//   const showToast = (message, type = "success") => {
//     const toast = document.createElement("div");
//     const bgColor = type === "error" ? "bg-red-500" : "bg-green-500";

//     toast.className = `fixed top-4 right-4 p-4 rounded-md text-white z-50 ${bgColor} max-w-sm shadow-lg`;
//     toast.textContent = message;
//     document.body.appendChild(toast);

//     setTimeout(() => {
//       if (toast.parentNode) {
//         document.body.removeChild(toast);
//       }
//     }, 3000);
//   };

//   const getFormattedAddress = async (latitude, longitude) => {
//     // Add a small helper for fetch with timeout
//     const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
//       const controller = new AbortController();
//       const id = setTimeout(() => controller.abort(), timeout);
//       try {
//         const response = await fetch(url, {
//           ...options,
//           signal: controller.signal
//         });
//         clearTimeout(id);
//         return response;
//       } catch (error) {
//         clearTimeout(id);
//         throw error;
//       }
//     };

//     try {
//       // Nominatim requires a User-Agent which browsers don't allow to be set.
//       // We also add a small delay to avoid 425 Too Early errors if retried.
//       const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

//       const response = await fetchWithTimeout(url, {
//         method: 'GET',
//         mode: 'cors',
//         headers: {
//           'Accept': 'application/json'
//         }
//       }, 6000); // 6 second timeout

//       if (!response.ok) {
//         throw new Error(`Geocoding failed with status: ${response.status}`);
//       }

//       const data = await response.json();

//       if (data && data.display_name) {
//         return data.display_name;
//       } else {
//         return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
//       }
//     } catch (error) {
//       console.error("Geocoding Error Details:", {
//         message: error.message,
//         type: error.name,
//         lat: latitude,
//         lng: longitude
//       });
//       // Always return coordinates as fallback - don't let geocoding failure block attendance
//       return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
//     }
//   };

//   const getCurrentLocation = () => {
//     return new Promise((resolve, reject) => {
//       if (!navigator.geolocation) {
//         reject(new Error("Geolocation is not supported by this browser."));
//         return;
//       }

//       const options = {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 0,
//       };

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const latitude = position.coords.latitude;
//           const longitude = position.coords.longitude;
//           const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

//           const formattedAddress = await getFormattedAddress(
//             latitude,
//             longitude
//           );

//           const locationInfo = {
//             latitude,
//             longitude,
//             mapLink,
//             formattedAddress,
//             timestamp: new Date().toISOString(),
//             accuracy: position.coords.accuracy,
//           };

//           resolve(locationInfo);
//         },
//         (error) => {
//           const errorMessages = {
//             1: "Location permission denied. Please enable location services.",
//             2: "Location information unavailable.",
//             3: "Location request timed out.",
//           };
//           reject(
//             new Error(errorMessages[error.code] || "An unknown error occurred.")
//           );
//         },
//         options
//       );
//     });
//   };

//   const checkActiveSession = (attendanceData) => {
//     if (!attendanceData || attendanceData.length === 0) {
//       setHasActiveSession(false);
//       setHasCheckedInToday(false);
//       return;
//     }

//     const userRecords = attendanceData.filter(
//       (record) =>
//         record.salesPersonName === salesPersonName &&
//         record.dateTime?.split(" ")[0].toString() ===
//         formatDateDDMMYYYY(new Date())
//     );

//     if (userRecords.length === 0) {
//       setHasActiveSession(false);
//       setHasCheckedInToday(false);
//       return;
//     }

//     const mostRecentRecord = userRecords[0];
//     const hasActive = mostRecentRecord.status === "IN";
//     setHasActiveSession(hasActive);
//     if (hasActive) {
//       setInData(mostRecentRecord);
//     }

//     const hasOutActive = mostRecentRecord.status === "OUT";
//     if (hasOutActive) {
//       setOutData(mostRecentRecord);
//     }

//     const hasCheckedIn = userRecords.some((record) => record.status === "IN");
//     setHasCheckedInToday(hasCheckedIn);
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.status) newErrors.status = "Status is required";

//     if (formData.status === "Leave") {
//       if (!formData.startDate) newErrors.startDate = "Start date is required";
//       if (
//         formData.startDate &&
//         formData.endDate &&
//         new Date(formData.endDate + "T00:00:00") <
//         new Date(formData.startDate + "T00:00:00")
//       ) {
//         newErrors.endDate = "End date cannot be before start date";
//       }
//       if (!formData.reason) newErrors.reason = "Reason is required for leave";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const fetchAttendanceHistory = async () => {
//     if (!isAuthenticated || !currentUser) {
//       console.log(
//         "Not authenticated or currentUser not available. Skipping history fetch."
//       );
//       setIsLoadingHistory(false);
//       return;
//     }

//     setIsLoadingHistory(true);
//     try {
//       const { data: rows, error } = await supabase
//         .from('attendance')
//         .select('*')
//         .order('id', { ascending: false });

//       if (error) {
//         throw error;
//       }

//       if (!rows || rows.length === 0) {
//         setAttendance([]);
//         setHistoryAttendance([]);
//         setIsLoadingHistory(false);
//         return;
//       }

//       const formattedHistory = rows
//         .map((row) => {
//           return {
//             salesPersonName: row.person_name,
//             dateTime: row.timestamp,
//             status: row.status,
//             mapLink: row.map_link,
//             address: row.address,
//             imageUrl: row.images,
//             date: row.date, // Preserve the YYYY-MM-DD date for filtering
//           };
//         })
//         .filter(Boolean);

//       const todayStr = new Date().toISOString().split('T')[0];

//       const filteredHistory = formattedHistory.filter(
//         (entry) =>
//           entry.salesPersonName === salesPersonName &&
//           entry.date === todayStr
//       );

//       const filteredHistoryData =
//         userRole.toLowerCase() === "admin"
//           ? formattedHistory
//           : formattedHistory.filter(
//             (entry) => entry.salesPersonName === salesPersonName
//           );

//       setAttendance(filteredHistory);
//       setHistoryAttendance(filteredHistoryData);

//       checkActiveSession(filteredHistory);
//     } catch (error) {
//       console.error("Error fetching attendance history:", error);
//       showToast("Failed to load attendance history.", "error");
//     } finally {
//       setIsLoadingHistory(false);
//     }
//   };

//   useEffect(() => {
//     fetchAttendanceHistory();
//   }, [currentUser, isAuthenticated]);

//   // Check location permission status on load
//   useEffect(() => {
//     const checkLocationPermission = async () => {
//       try {
//         // Check if geolocation is supported
//         if (!navigator.geolocation) {
//           setLocationPermissionStatus("denied");
//           return;
//         }

//         // Use Permissions API if available
//         if (navigator.permissions && navigator.permissions.query) {
//           const result = await navigator.permissions.query({
//             name: "geolocation",
//           });
//           setLocationPermissionStatus(result.state);

//           // Listen for permission changes
//           result.onchange = () => {
//             setLocationPermissionStatus(result.state);
//           };
//         } else {
//           // Fallback: try to get location to check permission
//           navigator.geolocation.getCurrentPosition(
//             () => setLocationPermissionStatus("granted"),
//             (error) => {
//               if (error.code === 1) {
//                 setLocationPermissionStatus("denied");
//               } else {
//                 setLocationPermissionStatus("prompt");
//               }
//             },
//             { timeout: 5000 }
//           );
//         }
//       } catch (error) {
//         console.error("Error checking location permission:", error);
//         setLocationPermissionStatus("prompt");
//       }
//     };

//     checkLocationPermission();
//   }, []);

//   const uploadImageToSupabase = async (base64Image, fileName) => {
//     try {
//       // 1. Convert base64 to Blob
//       const [header, base64Data] = base64Image.split(',');
//       const mimeMatch = header.match(/:(.*?);/);
//       const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

//       const byteCharacters = atob(base64Data);
//       const byteArrays = [];

//       for (let offset = 0; offset < byteCharacters.length; offset += 512) {
//         const slice = byteCharacters.slice(offset, offset + 512);
//         const byteNumbers = new Array(slice.length);
//         for (let i = 0; i < slice.length; i++) {
//           byteNumbers[i] = slice.charCodeAt(i);
//         }
//         const byteArray = new Uint8Array(byteNumbers);
//         byteArrays.push(byteArray);
//       }

//       const blob = new Blob(byteArrays, { type: mimeType });
//       const file = new File([blob], fileName, { type: mimeType });

//       // 2. Upload to Supabase
//       const bucket = 'attendance_image';
//       const filePath = `${Date.now()}_${fileName}`;

//       const { data, error } = await supabase.storage
//         .from(bucket)
//         .upload(filePath, file, {
//           cacheControl: '3600',
//           upsert: false,
//           contentType: mimeType,
//         });

//       if (error) {
//         console.error('Supabase upload error:', error);
//         throw new Error(error.message || "File upload failed");
//       }

//       // 3. Get Public URL
//       const { data: publicData } = supabase.storage
//         .from(bucket)
//         .getPublicUrl(data.path);

//       return publicData.publicUrl;
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       throw error;
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const isFieldWorker = userInField === "yes";

//     if (!validateForm()) {
//       showToast("Please fill in all required fields correctly.", "error");
//       return;
//     }

//     if (!isAuthenticated || !currentUser || !salesPersonName) {
//       showToast("User data not loaded. Please try logging in again.", "error");
//       return;
//     }

//     if (
//       (formData.status === "IN" || formData.status === "OUT" || formData.status === "MID") &&
//       !formData.image
//     ) {
//       showToast("Please capture a photo before submitting", "error");
//       setIsSubmitting(false);
//       return;
//     }

//     if (formData?.status === "IN") {
//       const indata = attendance.filter((item) => item.status === "IN");
//       if (indata.length > 0) {
//         showToast("Today Already in", "error");
//         return;
//       }
//     }

//     if (formData?.status === "MID") {
//       const indata = attendance.filter((item) => item.status === "IN");
//       if (indata.length === 0) {
//         showToast("Please mark IN first before selecting MID", "error");
//         return;
//       }
//     }

//     if (formData?.status === "OUT") {
//       const indata = attendance.filter((item) => item.status === "IN");
//       const middata = attendance.filter((item) => item.status === "MID");
//       const outdata = attendance.filter((item) => item.status === "OUT");

//       if (indata.length === 0) {
//         showToast("Please mark IN first", "error");
//         return;
//       }

//       if (middata.length === 0) {
//         showToast("Please mark MID before selecting OUT", "error");
//         return;
//       }

//       if (outdata.length > 0) {
//         showToast("Today Already out", "error");
//         return;
//       }
//     }

//     setIsSubmitting(true);
//     setIsGettingLocation(true);

//     try {
//       let currentLocation = null;

//       try {
//         currentLocation = await getCurrentLocation();

//         if (
//           (formData.status === "IN" || formData.status === "OUT" || formData.status === "MID") &&
//           !isFieldWorker // Only apply restriction if NOT a field worker (in_feild === 'no')
//         ) {
//           const distance = calculateDistance(
//             currentLocation.latitude,
//             currentLocation.longitude,
//             OFFICE_LOCATION.lat,
//             OFFICE_LOCATION.lng
//           );

//           // Agar distance 10 meters se zyada hai
//           if (distance > ALLOWED_RADIUS_METERS) {
//             showToast(
//               `You are ${distance.toFixed(1)} meters away from office. 
//             Attendance only allowed within ${ALLOWED_RADIUS_METERS} meters radius.`,
//               "error"
//             );
//             setIsSubmitting(false);
//             setIsGettingLocation(false);
//             return;
//           }

//           // Optional: Success message agar within radius hai
//           showToast(
//             `You are within ${ALLOWED_RADIUS_METERS}m radius (${distance.toFixed(
//               1
//             )}m)`,
//             "success"
//           );
//         }
//       } catch (locationError) {
//         console.error("Location error:", locationError);
//         showToast(locationError.message, "error");
//         setIsSubmitting(false);
//         setIsGettingLocation(false);
//         return;
//       }

//       setIsGettingLocation(false);

//       let imageUrl = formData.image;
//       if (
//         formData.image &&
//         formData.image.startsWith("data:") &&
//         (formData.status === "IN" || formData.status === "OUT" || formData.status === "MID")
//       ) {
//         imageUrl = await uploadImageToSupabase(
//           formData.image,
//           `attendance-${Date.now()}.jpg`
//         );
//       }

//       const currentDate = new Date();
//       const isoString = currentDate.toISOString();

//       const insertData = {
//         timestamp: isoString,
//         date_and_time: isoString,
//         end_date: formData.status === "Leave" && formData.endDate
//           ? new Date(formData.endDate + "T00:00:00").toISOString()
//           : null,
//         status: formData.status,
//         reason: formData.reason,
//         latitude: String(currentLocation.latitude),
//         longitude: String(currentLocation.longitude),
//         map_link: currentLocation.mapLink,
//         address: currentLocation.formattedAddress,
//         person_name: salesPersonName,
//         images: imageUrl || "",
//         date: formatDateInput(currentDate), // date column is date type, YYYY-MM-DD
//         time: currentDate.toLocaleTimeString('en-GB', { hour12: false }),
//         year_name: String(currentDate.getFullYear()),
//         month_name: monthNames[currentDate.getMonth()],
//       };

//       // ========== OPTIMISTIC UI UPDATE (10x FASTER) ==========
//       // Show success IMMEDIATELY - don't wait for server response
//       const successMessage =
//         formData.status === "IN"
//           ? "Check-in successful!"
//           : formData.status === "MID"
//             ? "Mid check successful!"
//             : formData.status === "OUT"
//               ? "Check-out successful!"
//               : "Leave application submitted successfully!";
//       showToast(successMessage, "success");

//       // Reset form IMMEDIATELY
//       setFormData({
//         status: "",
//         startDate: formatDateInput(new Date()),
//         endDate: "",
//         reason: "",
//         image: "",
//       });
//       setCameraPhoto(null);
//       setIsSubmitting(false);
//       setIsGettingLocation(false);

//       // ========== FIRE-AND-FORGET BACKGROUND SUBMISSION ==========
//       // Submit data in background - user doesn't wait
//       supabase
//         .from("attendance")
//         .insert([insertData])
//         .then(({ error }) => {
//           if (error) throw error;
//           console.log("✅ Data saved to Supabase successfully");
//           // Refresh history in background after successful save
//           fetchAttendanceHistory();
//         })
//         .catch((error) => {
//           console.error("Background save error:", error);
//           // Refresh history anyway after a delay
//           setTimeout(() => fetchAttendanceHistory(), 2000);
//         });

//       return;
//     } catch (error) {
//       console.error("Submission error:", error);
//       showToast("Error recording attendance. Please try again.", "error");
//     } finally {
//       setIsSubmitting(false);
//       setIsGettingLocation(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "status" && value === "Leave") {
//       if (hasCheckedInToday) {
//         setFormData((prev) => ({
//           ...prev,
//           [name]: value,
//           startDate: "",
//         }));
//       } else {
//         setFormData((prev) => ({
//           ...prev,
//           [name]: value,
//           startDate: formatDateInput(new Date()),
//         }));
//       }
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }

//     if (errors[name]) {
//       setErrors((prev) => ({
//         ...prev,
//         [name]: "",
//       }));
//     }
//   };

//   const showLeaveFields = formData.status === "Leave";

//   if (!isAuthenticated || !currentUser || !currentUser.salesPersonName) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
//         <div className="text-center">
//           <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-red-600 rounded-full animate-spin"></div>
//           <p className="font-medium text-slate-600">
//             {!isAuthenticated
//               ? "Please log in to view this page."
//               : "Loading user data..."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Refs for file inputs - passed to ImageCapturePortal
//   const uploadInputRef = useRef(null);
//   const captureInputRef = useRef(null);

//   /**
//    * Callback for ImageCapturePortal - sets the image in state
//    * This is the ONLY handler needed now - the portal handles all file reading
//    */
//   const onImageCapture = useCallback((base64Image) => {
//     if (base64Image) {
//       setFormData((prev) => ({ ...prev, image: base64Image }));
//       setCameraPhoto(base64Image);
//     }
//   }, []);

//   /**
//    * BULLETPROOF Mobile Image Upload Handler
//    *
//    * Key fixes for mobile page refresh:
//    * 1. Use onload instead of onloadend (more reliable on mobile)
//    * 2. Use requestAnimationFrame instead of setTimeout (better mobile compatibility)
//    * 3. Create new FileReader inside the async context
//    * 4. Clone the file blob to prevent reference loss
//    */
//   const handleImageUpload = (e) => {
//     // CRITICAL: Prevent ALL default behaviors immediately
//     if (e && e.preventDefault) {
//       e.preventDefault();
//     }
//     if (e && e.stopPropagation) {
//       e.stopPropagation();
//     }
//     if (e && e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
//       e.nativeEvent.stopImmediatePropagation();
//     }

//     // Get file safely
//     const files = e?.target?.files;
//     if (!files || files.length === 0) {
//       // Reset input on cancel
//       try {
//         if (e?.target) e.target.value = "";
//       } catch (err) {
//         // Ignore reset errors
//       }
//       return false;
//     }

//     // Clone the file to prevent reference loss on mobile
//     const file = files[0];
//     const fileBlob = new Blob([file], { type: file.type });

//     // Reset input immediately to allow re-selection
//     try {
//       if (e?.target) e.target.value = "";
//     } catch (err) {
//       // Ignore reset errors
//     }

//     // Use requestAnimationFrame to completely decouple from the event
//     requestAnimationFrame(() => {
//       const reader = new FileReader();

//       // Use onload (not onloadend) - more reliable on mobile
//       reader.onload = (event) => {
//         const result = event?.target?.result || reader.result;
//         if (result) {
//           // Update state with the base64 image
//           setFormData((prev) => ({ ...prev, image: result }));
//           setCameraPhoto(result);
//         }
//       };

//       reader.onerror = () => {
//         console.error("FileReader error:", reader.error);
//         showToast("Failed to read image. Please try again.", "error");
//       };

//       try {
//         reader.readAsDataURL(fileBlob);
//       } catch (error) {
//         console.error("FileReader exception:", error);
//         showToast("Failed to process image. Please try again.", "error");
//       }
//     });

//     return false;
//   };

//   /**
//    * BULLETPROOF Click Handler for File Inputs
//    * Uses requestAnimationFrame for better mobile compatibility
//    */
//   const handleFileInputClick = (inputRef, e) => {
//     // Prevent ALL possible default behaviors
//     if (e) {
//       e.preventDefault();
//       e.stopPropagation();
//       if (e.nativeEvent) {
//         e.nativeEvent.stopImmediatePropagation();
//       }
//     }

//     // Use requestAnimationFrame to completely decouple from form context
//     requestAnimationFrame(() => {
//       if (inputRef?.current) {
//         inputRef.current.click();
//       }
//     });

//     return false;
//   };

//   return (
//     <div className="min-h-screen p-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 lg:p-8">
//       <div className="mx-auto space-y-8 max-w-7xl">
//         {/* Location Permission Warning Banner */}
//         {locationPermissionStatus !== "granted" && (
//           <div className="overflow-hidden shadow-xl bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl animate-pulse">
//             <div className="flex items-center gap-4 px-6 py-4">
//               <div className="flex-shrink-0">
//                 <MapPin className="w-8 h-8 text-white" />
//               </div>
//               <div className="flex-1">
//                 <h3 className="text-lg font-bold text-white">
//                   📍 Location Permission Required
//                 </h3>
//                 <p className="mt-1 text-sm text-white/90">
//                   {locationPermissionStatus === "denied"
//                     ? "Location access is blocked. Please enable it in your browser settings to mark attendance."
//                     : "Please allow location access when prompted to mark your attendance accurately."}
//                 </p>
//                 {locationPermissionStatus === "denied" && (
//                   <div className="mt-2 text-xs text-white/80">
//                     <strong>How to enable:</strong> Click the lock/info icon in
//                     your browser's address bar → Site settings → Location →
//                     Allow
//                   </div>
//                 )}
//               </div>
//               <div className="flex-shrink-0">
//                 <div className="p-2 rounded-full bg-white/20">
//                   <AlertTriangle className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Attendance Summary Card */}
//         <AttendanceSummaryCard
//           attendanceData={historyAttendance}
//           isLoading={isLoadingHistory}
//           userRole={userRole}
//           salesPersonName={salesPersonName}
//           selectedMonth={filters.month}
//         />

//         <div className="overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
//           <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
//             <h3 className="mb-2 text-2xl font-bold text-white">
//               Mark Attendance
//             </h3>
//             <p className="text-lg text-emerald-50">
//               Record your daily attendance or apply for leave
//             </p>
//           </div>

//           {/* 
//             SIMPLE APPROACH: Hidden file inputs OUTSIDE the form element.
//             This prevents form submission when file picker opens/closes.
//             Much simpler than portal approach and doesn't cause memory issues.
//           */}
//           <input
//             ref={uploadInputRef}
//             type="file"
//             accept="image/*"
//             onChange={(e) => {
//               const file = e.target?.files?.[0];
//               if (file) {
//                 const reader = new FileReader();
//                 reader.onload = (event) => {
//                   if (event.target?.result) {
//                     setFormData((prev) => ({
//                       ...prev,
//                       image: event.target.result,
//                     }));
//                     setCameraPhoto(event.target.result);
//                   }
//                 };
//                 reader.readAsDataURL(file);
//               }
//               e.target.value = "";
//             }}
//             style={{ display: "none" }}
//           />
//           <input
//             ref={captureInputRef}
//             type="file"
//             accept="image/*"
//             capture="environment"
//             onChange={(e) => {
//               const file = e.target?.files?.[0];
//               if (file) {
//                 const reader = new FileReader();
//                 reader.onload = (event) => {
//                   if (event.target?.result) {
//                     setFormData((prev) => ({
//                       ...prev,
//                       image: event.target.result,
//                     }));
//                     setCameraPhoto(event.target.result);
//                   }
//                 };
//                 reader.readAsDataURL(file);
//               }
//               e.target.value = "";
//             }}
//             style={{ display: "none" }}
//           />

//           {/* Form - file inputs are above, outside the form */}
//           <form onSubmit={handleSubmit} className="p-8 space-y-8">
//             <div className="grid gap-6 lg:grid-cols-1">
//               <div className="space-y-2">
//                 <label className="block mb-3 text-sm font-semibold text-slate-700">
//                   Status
//                 </label>
//                 <select
//                   name="status"
//                   value={formData.status}
//                   onChange={handleInputChange}
//                   className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium ${errors.status ? "border-red-300" : "border-slate-200"
//                     }`}
//                 >
//                   <option value="">Select status</option>
//                   <option value="IN">IN</option>
//                   <option value="MID">MID</option>
//                   <option value="OUT">OUT</option>
//                   <option value="Leave">Leave</option>
//                 </select>
//                 {errors.status && (
//                   <p className="mt-2 text-sm font-medium text-red-500">
//                     {errors.status}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {(formData.status === "IN" || formData.status === "OUT" || formData.status === "MID") && (
//               <>
//                 {/* 
//                   SIMPLE MOBILE APPROACH: Visible file input with label styling.
//                   No hidden inputs, no refs, no complex click handlers.
//                   The label IS the button - much simpler and reliable on mobile.
//                 */}

//                 <div className="space-y-3">
//                   {/* Camera/Photo Input - Direct visible input styled as button */}
//                   <label className="flex items-center justify-center w-full px-4 py-3 text-blue-600 transition border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 hover:border-blue-400">
//                     <Camera className="w-5 h-5 mr-2" />
//                     <span className="font-medium">
//                       Take Photo or Select Image
//                     </span>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       capture="environment"
//                       className="hidden"
//                       onChange={(e) => {
//                         const file = e.target?.files?.[0];
//                         if (file) {
//                           const reader = new FileReader();
//                           reader.onload = (event) => {
//                             if (event.target?.result) {
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 image: event.target.result,
//                               }));
//                               setCameraPhoto(event.target.result);
//                             }
//                           };
//                           reader.readAsDataURL(file);
//                         }
//                         e.target.value = "";
//                       }}
//                     />
//                   </label>
//                 </div>

//                 {/* Image Preview */}
//                 {formData.image && (
//                   <div className="relative mt-4">
//                     <img
//                       src={formData.image}
//                       alt="Preview"
//                       className="object-cover w-full h-48 border-2 border-green-300 rounded-lg"
//                     />
//                     <div className="absolute px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full top-2 right-2">
//                       ✓ Photo Captured
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setFormData((prev) => ({ ...prev, image: null }));
//                         setCameraPhoto(null);
//                       }}
//                       className="absolute px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full top-2 left-2 hover:bg-red-600"
//                     >
//                       ✕ Remove
//                     </button>
//                   </div>
//                 )}
//               </>
//             )}

//             {!showLeaveFields && (
//               <div className="p-6 border bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-emerald-100">
//                 <div className="mb-2 text-sm font-semibold text-emerald-700">
//                   Current Date & Time
//                 </div>
//                 <div className="text-sm font-bold sm:text-2xl text-emerald-800">
//                   {formatDateDisplay(new Date())}
//                 </div>
//                 {(formData.status === "IN" || formData.status === "OUT") && (
//                   <div className="mt-3 text-sm text-emerald-600">
//                     📍 Location will be automatically captured when you submit
//                   </div>
//                 )}
//               </div>
//             )}

//             {showLeaveFields && (
//               <div className="p-0 mb-6 border bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:p-6 border-amber-100">
//                 <div className="mb-2 text-sm font-semibold text-amber-700">
//                   Leave Application
//                 </div>
//                 <div className="text-lg font-bold text-amber-800">
//                   {formatDateDisplay(new Date())}
//                 </div>
//                 <div className="mt-3 text-sm text-amber-600">
//                   📍 Current location will be captured for leave application
//                 </div>
//               </div>
//             )}

//             {showLeaveFields && (
//               <div className="space-y-6">
//                 <div className="grid gap-6 lg:grid-cols-2">
//                   <div className="space-y-2">
//                     <label className="block mb-3 text-sm font-semibold text-slate-700">
//                       Start Date
//                     </label>
//                     <input
//                       type="date"
//                       name="startDate"
//                       value={formData.startDate}
//                       onChange={handleInputChange}
//                       className="w-full px-4 py-3 font-medium transition-all duration-200 bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700"
//                     />
//                     {errors.startDate && (
//                       <p className="mt-2 text-sm font-medium text-red-500">
//                         {errors.startDate}
//                       </p>
//                     )}
//                   </div>

//                   <div className="space-y-2">
//                     <label className="block mb-3 text-sm font-semibold text-slate-700">
//                       End Date
//                     </label>
//                     <input
//                       type="date"
//                       name="endDate"
//                       value={formData.endDate}
//                       onChange={handleInputChange}
//                       min={formData.startDate}
//                       className="w-full px-4 py-3 font-medium transition-all duration-200 bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700"
//                     />
//                     {errors.endDate && (
//                       <p className="mt-2 text-sm font-medium text-red-500">
//                         {errors.endDate}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="block mb-3 text-sm font-semibold text-slate-700">
//                     Reason
//                   </label>
//                   <textarea
//                     name="reason"
//                     value={formData.reason}
//                     onChange={handleInputChange}
//                     placeholder="Enter reason for leave"
//                     className="w-full px-4 py-3 font-medium transition-all duration-200 bg-white border shadow-sm resize-none border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700 min-h-32"
//                   />
//                   {errors.reason && (
//                     <p className="mt-2 text-sm font-medium text-red-500">
//                       {errors.reason}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             )}

//             <button
//               type="submit"
//               className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//               disabled={
//                 isSubmitting ||
//                 isGettingLocation ||
//                 !currentUser?.salesPersonName
//               }
//             >
//               {isGettingLocation ? (
//                 <span className="flex items-center gap-2">
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                   Getting Location...
//                 </span>
//               ) : isSubmitting ? (
//                 showLeaveFields ? (
//                   "Submitting Leave..."
//                 ) : (
//                   "Marking Attendance..."
//                 )
//               ) : showLeaveFields ? (
//                 "Submit Leave Request"
//               ) : (
//                 "Mark Attendance"
//               )}
//             </button>
//           </form>
//         </div>
//       </div>

//       <AttendanceHistory
//         attendanceData={historyAttendance}
//         isLoading={isLoadingHistory}
//         userRole={userRole}
//         filters={filters}
//         setFilters={setFilters}
//         filteredData={filteredHistoryCallbackData}
//         getUniqueNames={getUniqueNames}
//         getAvailableMonths={getAvailableMonths}
//         monthNames={monthNames}
//       />
//     </div>
//   );
// };

// export default Attendance;
