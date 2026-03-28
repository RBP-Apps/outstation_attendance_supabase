export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const formatDateInput = (date) => {
  return date.toISOString().split("T")[0];
};

export const formatDateDDMMYYYY = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const formatDateDisplay = (date) => {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// In src/utils/dateUtils.js, add this function:
export const getCurrentMonthYear = () => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const now = new Date();
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
};

export const formatDisplayDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return { date: "N/A", time: "N/A" };

  try {
    let dateObj;
    if (dateTimeStr.includes("T")) {
      // ISO format (e.g., 2026-01-18T08:12:14.038)
      dateObj = new Date(dateTimeStr);
    } else if (dateTimeStr.includes("/")) {
      // Custom format (e.g., 18/01/2026 08:12:14 or 18/01/2026)
      const [datePart, timePart] = dateTimeStr.split(" ");
      const [day, month, year] = datePart.split("/");

      if (timePart) {
        const [hours, minutes, seconds] = timePart.split(":");
        dateObj = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours) || 0,
          parseInt(minutes) || 0,
          parseInt(seconds) || 0
        );
      } else {
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    } else {
      // Last resort try constructor
      dateObj = new Date(dateTimeStr);
    }

    if (isNaN(dateObj.getTime())) {
      const parts = dateTimeStr.split(" ");
      return { date: parts[0] || "N/A", time: parts[1] || "" };
    }

    return {
      date: dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).toLowerCase(),
    };
  } catch (e) {
    console.error("Format error:", e);
    const parts = dateTimeStr.split(" ");
    return { date: parts[0] || "N/A", time: parts[1] || "" };
  }
};