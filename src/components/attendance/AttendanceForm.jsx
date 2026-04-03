// import { useState, useEffect } from "react";
// import { Loader2 } from "lucide-react";
// import StatusSelector from "./StatusSelector";
// import ImageUploadSection from "./ImageUploadSection";
// import CurrentDateTimeDisplay from "./CurrentDateTimeDisplay";
// import LeaveFormFields from "./LeaveFormFields";
// import { formatDateInput, formatDateDisplay } from "../../utils/dateUtils";
// import { calculateDistance } from "../../utils/attendanceUtils";
// import supabase from "../../utils/supabase";
// import { monthNames } from "../../utils/dateUtils";

// const OFFICE_LOCATION = {
//   lat: 21.240739,
//   lng: 81.623879,
// };
// const ALLOWED_RADIUS_METERS = 10;

// const AttendanceForm = ({
//   currentUser,
//   isAuthenticated,
//   salesPersonName,
//   userRole,
//   attendance,
//   hasCheckedInToday,
//   fetchAttendanceHistory,
//   showToast,
// }) => {
//   const [formData, setFormData] = useState({
//     status: "",
//     startDate: formatDateInput(new Date()),
//     endDate: "",
//     reason: "",
//     image: "",
//   });
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGettingLocation, setIsGettingLocation] = useState(false);
//   const [cameraPhoto, setCameraPhoto] = useState(null);
//   const [userInField, setUserInField] = useState(null);

//   // Fetch in_feild status from Supabase
//   useEffect(() => {
//     const fetchInFieldStatus = async () => {
//       if (currentUser?.username) {
//         try {
//           const { data, error } = await supabase
//             .from('users')
//             .select('in_office')
//             .eq('user_name', currentUser.username)
//             .single();

//           if (error) throw error;
//           if (data) {
//             // Explicitly treat null or empty as 'no' (office worker)
//             const status = (data.in_feild === 'yes') ? 'yes' : 'no';
//             setUserInField(status);
//             console.log("Finalized in_office status:", status);
//           }
//         } catch (err) {
//           console.error("Error fetching in_office status:", err);
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

//   const getFormattedAddress = async (latitude, longitude) => {
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
//       const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

//       const response = await fetchWithTimeout(url, {
//         method: 'GET',
//         mode: 'cors',
//         headers: {
//           'Accept': 'application/json'
//         }
//       }, 6000);

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
//       console.error("Geocoding Error Details:", error);
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

//   const uploadImageToSupabase = async (base64Image, fileName) => {
//     try {
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

//       const { data: publicData } = supabase.storage
//         .from(bucket)
//         .getPublicUrl(data.path);

//       return publicData.publicUrl;
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       throw error;
//     }
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

//   const handleSubmit = async (e) => {
//     e.preventDefault();

// const isOfficeUser =
//   String(currentUser?.in_office || "").toLowerCase() === "yes";



//     if (!validateForm()) {
//       showToast("Please fill in all required fields correctly.", "error");
//       return;
//     }

//     if (!isAuthenticated || !currentUser || !salesPersonName) {
//       showToast("User data not loaded. Please try logging in again.", "error");
//       return;
//     }

//    if (
//   (formData.status === "IN" || formData.status === "OUT" || formData.status === "MID") &&
//   isOfficeUser
// ) {
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
//           isOfficeUser
//         ) {
//           const distance = calculateDistance(
//             currentLocation.latitude,
//             currentLocation.longitude,
//             OFFICE_LOCATION.lat,
//             OFFICE_LOCATION.lng
//           );

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
//         date: formatDateInput(currentDate),
//         time: currentDate.toLocaleTimeString('en-GB', { hour12: false }),
//         year_name: String(currentDate.getFullYear()),
//         month_name: monthNames[currentDate.getMonth()],
//       };

//       // Show success message immediately
//       const successMessage =
//         formData.status === "IN"
//           ? "Check-in successful!"
//           : formData.status === "MID"
//             ? "Mid check successful!"
//             : formData.status === "OUT"
//               ? "Check-out successful!"
//               : "Leave application submitted successfully!";
//       showToast(successMessage, "success");

//       // Reset form immediately
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

//       // Fire-and-forget background submission
//       supabase
//         .from("attendance")
//         .insert([insertData])
//         .then(({ error }) => {
//           if (error) throw error;
//           console.log("✅ Data saved to Supabase successfully");
//           fetchAttendanceHistory();
//         })
//         .catch((error) => {
//           console.error("Background save error:", error);
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

//   return (
//     <div className="overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
//       <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
//         <h3 className="mb-2 text-2xl font-bold text-white">
//           Mark Attendance
//         </h3>
//         <p className="text-lg text-emerald-50">
//           Record your daily attendance or apply for leave
//         </p>
//       </div>

//       <form onSubmit={handleSubmit} className="p-8 space-y-8">
//         <div className="grid gap-6 lg:grid-cols-1">
//           <StatusSelector
//             value={formData.status}
//             onChange={handleInputChange}
//             error={errors.status}
//           />
//         </div>

//         {(formData.status === "IN" || formData.status === "OUT" || formData.status === "MID") && (
//           <ImageUploadSection
//             formData={formData}
//             setFormData={setFormData}
//             setCameraPhoto={setCameraPhoto}
//           />
//         )}

//         {!showLeaveFields && (
//           <CurrentDateTimeDisplay status={formData.status} />
//         )}

//         {showLeaveFields && (
//           <div className="p-0 mb-6 border bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:p-6 border-amber-100">
//             <div className="mb-2 text-sm font-semibold text-amber-700">
//               Leave Application
//             </div>
//             <div className="text-lg font-bold text-amber-800">
//               {formatDateDisplay(new Date())}
//             </div>
//             <div className="mt-3 text-sm text-amber-600">
//               📍 Current location will be captured for leave application
//             </div>
//           </div>
//         )}

//         {showLeaveFields && (
//           <LeaveFormFields
//             formData={formData}
//             onChange={handleInputChange}
//             errors={errors}
//           />
//         )}

//         <button
//           type="submit"
//           className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//           disabled={
//             isSubmitting ||
//             isGettingLocation ||
//             !currentUser?.salesPersonName
//           }
//         >
//           {isGettingLocation ? (
//             <span className="flex items-center gap-2">
//               <Loader2 className="w-5 h-5 animate-spin" />
//               Getting Location...
//             </span>
//           ) : isSubmitting ? (
//             showLeaveFields ? (
//               "Submitting Leave..."
//             ) : (
//               "Marking Attendance..."
//             )
//           ) : showLeaveFields ? (
//             "Submit Leave Request"
//           ) : (
//             "Mark Attendance"
//           )}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AttendanceForm;







import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import StatusSelector from "./StatusSelector";
import ImageUploadSection from "./ImageUploadSection";
import CurrentDateTimeDisplay from "./CurrentDateTimeDisplay";
import LeaveFormFields from "./LeaveFormFields";
import { formatDateInput, formatDateDisplay } from "../../utils/dateUtils";
import { calculateDistance } from "../../utils/attendanceUtils";
import supabase from "../../utils/supabase";
import { monthNames } from "../../utils/dateUtils";

const OFFICE_LOCATION = {
  lat: 21.240739,
  lng: 81.623879,
};
const ALLOWED_RADIUS_METERS = 10;

const AttendanceForm = ({
  currentUser,
  isAuthenticated,
  salesPersonName,
  userRole,
  attendance,
  hasCheckedInToday,
  fetchAttendanceHistory,
  showToast,
}) => {
  const [formData, setFormData] = useState({
    status: "",
    startDate: formatDateInput(new Date()),
    endDate: "",
    reason: "",
    image: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [cameraPhoto, setCameraPhoto] = useState(null);
  const [userInField, setUserInField] = useState(null);

  // Fetch in_feild status from Supabase
  useEffect(() => {
    const fetchInFieldStatus = async () => {
      if (currentUser?.username) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('in_office')
            .eq('user_name', currentUser.username)
            .single();

          if (error) throw error;
          if (data) {
            // Explicitly treat null or empty as 'no' (office worker)
            const status = (data.in_office === 'yes') ? 'yes' : 'no';
            setUserInField(status);
            console.log("Finalized in_office status:", status);
          }
        } catch (err) {
          console.error("Error fetching in_office status:", err);
          // Fallback to localStorage if Supabase fetch fails
          const fallback = localStorage.getItem("InFiled") || "no";
          setUserInField(fallback);
        }
      }
    };

    if (isAuthenticated) {
      fetchInFieldStatus();
    }
  }, [currentUser, isAuthenticated]);

  const getFormattedAddress = async (latitude, longitude) => {
    const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      }, 6000);

      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.display_name) {
        return data.display_name;
      } else {
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
    } catch (error) {
      console.error("Geocoding Error Details:", error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

          const formattedAddress = await getFormattedAddress(
            latitude,
            longitude
          );

          const locationInfo = {
            latitude,
            longitude,
            mapLink,
            formattedAddress,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
          };

          resolve(locationInfo);
        },
        (error) => {
          const errorMessages = {
            1: "Location permission denied. Please enable location services.",
            2: "Location information unavailable.",
            3: "Location request timed out.",
          };
          reject(
            new Error(errorMessages[error.code] || "An unknown error occurred.")
          );
        },
        options
      );
    });
  };

  const uploadImageToSupabase = async (base64Image, fileName) => {
    try {
      const [header, base64Data] = base64Image.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: mimeType });
      const file = new File([blob], fileName, { type: mimeType });

      const bucket = 'attendance_image';
      const filePath = `${Date.now()}_${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: mimeType,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(error.message || "File upload failed");
      }

      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.status) newErrors.status = "Status is required";

    if (formData.status === "Leave") {
      if (!formData.startDate) newErrors.startDate = "Start date is required";
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.endDate + "T00:00:00") <
        new Date(formData.startDate + "T00:00:00")
      ) {
        newErrors.endDate = "End date cannot be before start date";
      }
      if (!formData.reason) newErrors.reason = "Reason is required for leave";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isFieldWorker = userInField === "yes";

    if (!validateForm()) {
      showToast("Please fill in all required fields correctly.", "error");
      return;
    }

    if (!isAuthenticated || !currentUser || !salesPersonName) {
      showToast("User data not loaded. Please try logging in again.", "error");
      return;
    }

    if (
      (formData.status === "IN" || formData.status === "OUT" || formData.status === "MID") &&
      !formData.image
    ) {
      showToast("Please capture a photo before submitting", "error");
      setIsSubmitting(false);
      return;
    }

    if (formData?.status === "IN") {
      const indata = attendance.filter((item) => item.status === "IN");
      if (indata.length > 0) {
        showToast("Today Already in", "error");
        return;
      }
    }

    if (formData?.status === "MID") {
      const indata = attendance.filter((item) => item.status === "IN");
      if (indata.length === 0) {
        showToast("Please mark IN first before selecting MID", "error");
        return;
      }
    }

    if (formData?.status === "OUT") {
      const indata = attendance.filter((item) => item.status === "IN");
      const middata = attendance.filter((item) => item.status === "MID");
      const outdata = attendance.filter((item) => item.status === "OUT");

      if (indata.length === 0) {
        showToast("Please mark IN first", "error");
        return;
      }

      if (middata.length === 0) {
        showToast("Please mark MID before selecting OUT", "error");
        return;
      }

      if (outdata.length > 0) {
        showToast("Today Already out", "error");
        return;
      }
    }

    setIsSubmitting(true);
    setIsGettingLocation(true);

    try {
      let currentLocation = null;

      try {
        currentLocation = await getCurrentLocation();

        if (
          (formData.status === "IN" || formData.status === "OUT" || formData.status === "MID") &&
          isFieldWorker
        ) {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            OFFICE_LOCATION.lat,
            OFFICE_LOCATION.lng
          );

          if (distance > ALLOWED_RADIUS_METERS) {
            showToast(
              `You are ${distance.toFixed(1)} meters away from office. 
            Attendance only allowed within ${ALLOWED_RADIUS_METERS} meters radius.`,
              "error"
            );
            setIsSubmitting(false);
            setIsGettingLocation(false);
            return;
          }

          showToast(
            `You are within ${ALLOWED_RADIUS_METERS}m radius (${distance.toFixed(
              1
            )}m)`,
            "success"
          );
        }
      } catch (locationError) {
        console.error("Location error:", locationError);
        showToast(locationError.message, "error");
        setIsSubmitting(false);
        setIsGettingLocation(false);
        return;
      }

      setIsGettingLocation(false);

      let imageUrl = formData.image;
      if (
        formData.image &&
        formData.image.startsWith("data:") &&
        (formData.status === "IN" || formData.status === "OUT" || formData.status === "MID")
      ) {
        imageUrl = await uploadImageToSupabase(
          formData.image,
          `attendance-${Date.now()}.jpg`
        );
      }

      const currentDate = new Date();
      const isoString = currentDate.toISOString();

      const insertData = {
        timestamp: isoString,
        date_and_time: isoString,
        end_date: formData.status === "Leave" && formData.endDate
          ? new Date(formData.endDate + "T00:00:00").toISOString()
          : null,
        status: formData.status,
        reason: formData.reason,
        latitude: String(currentLocation.latitude),
        longitude: String(currentLocation.longitude),
        map_link: currentLocation.mapLink,
        address: currentLocation.formattedAddress,
        person_name: salesPersonName,
        images: imageUrl || "",
        date: formatDateInput(currentDate),
        time: currentDate.toLocaleTimeString('en-GB', { hour12: false }),
        year_name: String(currentDate.getFullYear()),
        month_name: monthNames[currentDate.getMonth()],
      };

      // Show success message immediately
      const successMessage =
        formData.status === "IN"
          ? "Check-in successful!"
          : formData.status === "MID"
            ? "Mid check successful!"
            : formData.status === "OUT"
              ? "Check-out successful!"
              : "Leave application submitted successfully!";
      showToast(successMessage, "success");

      // Reset form immediately
      setFormData({
        status: "",
        startDate: formatDateInput(new Date()),
        endDate: "",
        reason: "",
        image: "",
      });
      setCameraPhoto(null);
      setIsSubmitting(false);
      setIsGettingLocation(false);

      // Fire-and-forget background submission
      supabase
        .from("attendance")
        .insert([insertData])
        .then(({ error }) => {
          if (error) throw error;
          console.log("✅ Data saved to Supabase successfully");
          fetchAttendanceHistory();
        })
        .catch((error) => {
          console.error("Background save error:", error);
          setTimeout(() => fetchAttendanceHistory(), 2000);
        });

      return;
    } catch (error) {
      console.error("Submission error:", error);
      showToast("Error recording attendance. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
      setIsGettingLocation(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "status" && value === "Leave") {
      if (hasCheckedInToday) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          startDate: "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          startDate: formatDateInput(new Date()),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const showLeaveFields = formData.status === "Leave";

  return (
    <div className="overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl border-white/20">
      <div className="px-8 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
        <h3 className="mb-2 text-2xl font-bold text-white">
          Mark Attendance
        </h3>
        <p className="text-lg text-emerald-50">
          Record your daily attendance or apply for leave
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid gap-6 lg:grid-cols-1">
          <StatusSelector
            value={formData.status}
            onChange={handleInputChange}
            error={errors.status}
          />
        </div>

        {(formData.status === "IN" || formData.status === "OUT" || formData.status === "MID") && (
          <ImageUploadSection
            formData={formData}
            setFormData={setFormData}
            setCameraPhoto={setCameraPhoto}
          />
        )}

        {!showLeaveFields && (
          <CurrentDateTimeDisplay status={formData.status} />
        )}

        {showLeaveFields && (
          <div className="p-0 mb-6 border bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:p-6 border-amber-100">
            <div className="mb-2 text-sm font-semibold text-amber-700">
              Leave Application
            </div>
            <div className="text-lg font-bold text-amber-800">
              {formatDateDisplay(new Date())}
            </div>
            <div className="mt-3 text-sm text-amber-600">
              📍 Current location will be captured for leave application
            </div>
          </div>
        )}

        {showLeaveFields && (
          <LeaveFormFields
            formData={formData}
            onChange={handleInputChange}
            errors={errors}
          />
        )}

        <button
          type="submit"
          className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={
            isSubmitting ||
            isGettingLocation ||
            !currentUser?.salesPersonName
          }
        >
          {isGettingLocation ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Getting Location...
            </span>
          ) : isSubmitting ? (
            showLeaveFields ? (
              "Submitting Leave..."
            ) : (
              "Marking Attendance..."
            )
          ) : showLeaveFields ? (
            "Submit Leave Request"
          ) : (
            "Mark Attendance"
          )}
        </button>
      </form>
    </div>
  );
};

export default AttendanceForm;