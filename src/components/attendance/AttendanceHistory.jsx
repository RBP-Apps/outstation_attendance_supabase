// import { Download, Calendar, Clock, MapPin, Upload } from "lucide-react";
// import { formatDisplayDateTime } from "../../utils/dateUtils";

// const AttendanceHistory = ({
//   attendanceData,
//   isLoading,
//   userRole,
//   filters,
//   setFilters,
//   filteredData,
//   getUniqueNames,
//   getAvailableMonths,
//   monthNames,
// }) => {
//   // Helper to format date and time professionally
//   const formatDisplayDateTimeHelper = (dateTimeStr) => {
//     return formatDisplayDateTime(dateTimeStr);
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
//       {/* <div className="overflow-x-auto"> */}
//       <div className="overflow-x-auto max-h-[400px] overflow-y-auto">

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
//               {/* <thead className="border-b bg-slate-50/50 border-slate-200/50"> */}
//               <thead className="sticky top-0 z-10 border-b bg-slate-50 border-slate-200">
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
//                           const { date, time } = formatDisplayDateTimeHelper(record.dateTime);
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

// export default AttendanceHistory;





import { Download, Calendar, Clock, MapPin, Upload, Filter, X } from "lucide-react";
import { formatDisplayDateTime } from "../../utils/dateUtils";
import { useState } from "react";

const AttendanceHistory = ({
  attendanceData,
  isLoading,
  userRole,
  filters,
  setFilters,
  filteredData,
  getUniqueNames,
  getAvailableMonths,
  monthNames,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Helper to format date and time professionally
  const formatDisplayDateTimeHelper = (dateTimeStr) => {
    return formatDisplayDateTime(dateTimeStr);
  };

  // Enhanced Excel download function
  const downloadExcel = () => {
    // Use filteredData passed from parent
    if (!filteredData || filteredData.length === 0) {
      alert("No data available to download");
      return;
    }

    // Create proper Excel content with XML format
    const currentDate = new Date().toLocaleDateString();
    const fileName = `Attendance_History_${new Date().toISOString().split("T")[0]
      }`;

    // Create Excel XML structure
    let excelContent = `<?xml version="1.0"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:o="urn:schemas-microsoft-com:office:office"
                xmlns:x="urn:schemas-microsoft-com:office:excel"
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:html="http://www.w3.org/TR/REC-html40">
        <Worksheet ss:Name="Attendance History">
          <Table>
            <Row>
              <Cell><Data ss:Type="String">Name</Data></Cell>
              <Cell><Data ss:Type="String">Date &amp; Time</Data></Cell>
              <Cell><Data ss:Type="String">Status</Data></Cell>
              <Cell><Data ss:Type="String">Map Link</Data></Cell>
              <Cell><Data ss:Type="String">Address</Data></Cell>
            </Row>`;

    // Add data rows
    filteredData.forEach((row) => {
      excelContent += `
        <Row>
          <Cell><Data ss:Type="String">${row.salesPersonName || "N/A"
        }</Data></Cell>
          <Cell><Data ss:Type="String">${row.dateTime || "N/A"}</Data></Cell>
          <Cell><Data ss:Type="String">${row.status || "N/A"}</Data></Cell>
          <Cell><Data ss:Type="String">${row.mapLink || "N/A"}</Data></Cell>
          <Cell><Data ss:Type="String">${(row.address || "N/A").replace(
          /[<>&"']/g,
          function (match) {
            switch (match) {
              case "<":
                return "&lt;";
              case ">":
                return "&gt;";
              case "&":
                return "&amp;";
              case '"':
                return "&quot;";
              case "'":
                return "&apos;";
              default:
                return match;
            }
          }
        )}</Data></Cell>
        </Row>`;
    });

    excelContent += `
          </Table>
        </Worksheet>
      </Workbook>`;

    // Create and download the file
    const blob = new Blob([excelContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      status: "",
      month: "",
    });
    setShowMobileFilters(false);
  };

  const hasActiveFilters = filters.name || filters.status || filters.month;

  // Mobile Card Component
  const MobileCard = ({ record }) => {
    const { date, time } = formatDisplayDateTimeHelper(record.dateTime) || { date: "N/A", time: "N/A" };
    
    return (
      <div className="mb-4 overflow-hidden bg-white border rounded-xl shadow-sm border-slate-200 hover:shadow-md transition-shadow">
        <div className="p-4">
          {/* Header with Name and Status */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">
              {record.salesPersonName || "N/A"}
            </h3>
            <span
              className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                record.status === "IN"
                  ? "bg-green-100 text-green-800"
                  : record.status === 'MID'
                    ? "bg-blue-100 text-blue-800"
                    : record.status === "OUT"
                      ? "bg-red-100 text-red-800"
                      : record.status === "Leave"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
              }`}
            >
              {record.status || "N/A"}
            </span>
          </div>

          {/* Date and Time */}
          <div className="mb-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">{date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="font-medium">{time}</span>
            </div>
          </div>

          {/* Address */}
          {record.address && (
            <div className="mb-3 text-sm text-slate-600">
              <p className="line-clamp-2">{record.address}</p>
            </div>
          )}

          {/* Map Link and Image */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {record.mapLink ? (
              <a
                href={record.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>View Map</span>
              </a>
            ) : (
              <span className="text-sm text-slate-400">No map link</span>
            )}
            
            {record.imageUrl ? (
              <a
                href={record.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 transition-transform hover:scale-105"
              >
                <img
                  src={record.imageUrl}
                  alt="Attendance"
                  className="object-cover w-10 h-10 rounded-lg border border-slate-200 shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />
              </a>
            ) : (
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-400">
                <Upload className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mt-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
          <h2 className="text-2xl font-bold text-white">Attendance History</h2>
          <p className="text-blue-50">Loading your attendance records...</p>
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading attendance history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
      {/* Header with Filters and Download */}
      <div className="px-4 py-4 md:px-8 md:py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
        <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">
              Attendance History
            </h2>
            <p className="text-sm text-blue-50 md:text-base">Your records are displayed below.</p>
          </div>

          {/* Excel Download Button */}
          {userRole?.toLowerCase() === "admin" && filteredData.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={downloadExcel}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-white transition-colors bg-green-600 border border-green-500 rounded-lg shadow-md hover:bg-green-700 md:px-4"
                title="Download as Excel"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters - Desktop View (md and above) */}
        {userRole?.toLowerCase() === "admin" && (
          <>
            {/* Desktop Filters - Hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-4 md:gap-3">
              {/* Name Filter */}
              <div>
                <label className="block mb-1 text-sm font-medium text-blue-100">
                  Filter by Name
                </label>
                <select
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                >
                  <option value="">All Names</option>
                  {getUniqueNames(attendanceData || []).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block mb-1 text-sm font-medium text-blue-100">
                  Filter by Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                >
                  <option value="">All Status</option>
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block mb-1 text-sm font-medium text-blue-100">
                  Filter by Month
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => handleFilterChange("month", e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                >
                  <option value="">All Months</option>
                  {getAvailableMonths(attendanceData || []).map((monthYear) => (
                    <option key={monthYear} value={monthYear}>
                      {monthYear}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              <div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 text-sm text-white transition-colors border rounded-lg bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Filter Button - Visible only on mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center justify-between w-full px-4 py-2 text-white transition-colors bg-white/20 rounded-lg hover:bg-white/30"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {hasActiveFilters && (
                    <span className="px-1.5 py-0.5 text-xs bg-white/30 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showMobileFilters ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mobile Filter Panel */}
              {showMobileFilters && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-blue-100">
                      Filter by Name
                    </label>
                    <select
                      value={filters.name}
                      onChange={(e) => handleFilterChange("name", e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700"
                    >
                      <option value="">All Names</option>
                      {getUniqueNames(attendanceData || []).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-blue-100">
                      Filter by Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange("status", e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700"
                    >
                      <option value="">All Status</option>
                      <option value="IN">IN</option>
                      <option value="OUT">OUT</option>
                      <option value="Leave">Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-blue-100">
                      Filter by Month
                    </label>
                    <select
                      value={filters.month}
                      onChange={(e) => handleFilterChange("month", e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white/90 border-white/30 text-slate-700"
                    >
                      <option value="">All Months</option>
                      {getAvailableMonths(attendanceData || []).map((monthYear) => (
                        <option key={monthYear} value={monthYear}>
                          {monthYear}
                        </option>
                      ))}
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm text-white transition-colors border rounded-lg bg-white/20 hover:bg-white/30 border-white/30"
                    >
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Filter Results Info */}
        {hasActiveFilters && (
          <div className="p-3 mt-3 border rounded-lg bg-white/10 border-white/20">
            <p className="text-sm text-blue-100">
              Showing {filteredData.length} of {attendanceData?.length || 0}{" "}
              records
              {filters.name && ` • Name: ${filters.name}`}
              {filters.status && ` • Status: ${filters.status}`}
              {filters.month && ` • Month: ${filters.month}`}
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        {!attendanceData || attendanceData.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-2 text-lg text-slate-400">📊</div>
            <h3 className="mb-2 text-lg font-semibold text-slate-600">
              No Records Found
            </h3>
            <p className="text-slate-500">
              {userRole?.toLowerCase() === "admin"
                ? "No attendance records available."
                : "You haven't marked any attendance yet."}
            </p>
          </div>
        ) : filteredData.length === 0 && hasActiveFilters ? (
          <div className="p-8 text-center">
            <div className="mb-2 text-lg text-slate-400">🔍</div>
            <h3 className="mb-2 text-lg font-semibold text-slate-600">
              No Matching Records
            </h3>
            <p className="text-slate-500">
              No records match your current filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block min-w-full">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 border-b bg-slate-50 border-slate-200">
                  <tr>
                    <th className="w-32 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-r text-slate-600 border-slate-200/50">
                      Name
                    </th>
                    <th className="w-48 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-r text-slate-600 border-slate-200/50">
                      Date & Time
                    </th>
                    <th className="w-24 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-r text-slate-600 border-slate-200/50">
                      Status
                    </th>
                    <th className="w-32 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-r text-slate-600 border-slate-200/50">
                      Map Link
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-600">
                      Address
                    </th>
                    <th className="w-24 px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase border-l text-slate-600 border-slate-200/50">
                      Image
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {filteredData.map((record, index) => (
                    <tr
                      key={index}
                      className="transition-colors border-b hover:bg-slate-50/30 border-slate-200/30"
                    >
                      <td className="w-32 px-4 py-3 border-r border-slate-200/50">
                        <div className="text-sm font-medium break-words text-slate-900">
                          {record.salesPersonName || "N/A"}
                        </div>
                      </td>
                      <td className="w-48 px-4 py-3 border-r border-slate-200/50">
                        {record.dateTime ? (
                          (() => {
                            const { date, time } = formatDisplayDateTimeHelper(record.dateTime);
                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{date}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{time}</span>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="w-24 px-4 py-3 border-r border-slate-200/50">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === "IN"
                              ? "bg-green-100 text-green-800"
                              : record.status === 'MID'
                                ? "bg-blue-100 text-blue-800"
                                : record.status === "OUT"
                                  ? "bg-red-100 text-red-800"
                                  : record.status === "Leave"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {record.status || "N/A"}
                        </span>
                      </td>
                      <td className="w-32 px-4 py-3 border-r border-slate-200/50">
                        {record.mapLink ? (
                          <a
                            href={record.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-600 break-all hover:text-blue-800"
                          >
                            <MapPin className="flex-shrink-0 w-4 h-4" />
                            <span className="truncate">View Map</span>
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="max-w-md text-sm break-words text-slate-600"
                          title={record.address}
                        >
                          {record.address || "N/A"}
                        </div>
                      </td>
                      <td className="w-24 px-4 py-3 border-l border-slate-200/50">
                        {record.imageUrl ? (
                          <a
                            href={record.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center transition-transform hover:scale-110"
                          >
                            <img
                              src={record.imageUrl}
                              alt="Attendance"
                              className="object-cover w-12 h-12 rounded-lg shadow-sm border border-slate-200"
                              onError={(e) => {
                                e.target.onerror = null;
                              }}
                            />
                          </a>
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-lg bg-slate-100 text-slate-400">
                            <Upload className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Visible only on mobile */}
            <div className="p-4 md:hidden">
              {filteredData.map((record, index) => (
                <MobileCard key={index} record={record} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;