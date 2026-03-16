"use client";

import { useState, useEffect, useContext } from "react";
import { MapPin, Loader2, Upload, Eye, Plus, Trash2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import supabase from "../utils/supabase";

const Travel = () => {
  const [travels, setTravels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [foodingEntries, setFoodingEntries] = useState([
    { date: "", billImage: null, billImageName: "" }
  ]);

  const { currentUser, isAuthenticated } = useContext(AuthContext);

  const salesPersonName = currentUser?.salesPersonName || "Unknown User";
  const userRole = currentUser?.role || "User";

  const SPREADSHEET_ID = "10coGuAVkdMNVUoX_L2HedehSb7d5lpgGQHTNjAZiGaQ";
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbylk0DYGG9b3iru8zGT8e6yPmEEFShWppHX3YsAM9M_OUbogsHNtcdg3CZaL5Y35EHnkg/exec";
  const DRIVE_FOLDER_ID = "1W4vfmH4c_MSp76VjPlY0tkUsarJhPIyc";

  const formatDateInput = (date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDateDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatDateDisplay = (date) => {
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

  const [formData, setFormData] = useState({
    personName: salesPersonName,
    fromLocation: "",
    toLocation: "",
    vehicleType: "",
    noOfDays: "",
    accommodationType: "",
    stayBillImage: null,
    stayBillImageName: "",
    travelDate: formatDateInput(new Date()),
    // New fields
    travelReceiptImage: null,
    travelReceiptImageName: "",
    localTravelType: "",
    localTravelReceiptImage: null,
    localTravelReceiptImageName: "",
    returnDate: "",
    returnTicketImage: null,
    returnTicketImageName: "",
    advanceAmount: ""
  });

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 p-4 rounded-md text-white z-50 ${type === "success" ? "bg-green-500" : "bg-red-500"
      }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Fetch travel history
  const fetchTravelHistory = async () => {
    try {
      setIsLoadingHistory(true);

      const { data, error } = await supabase
        .from('travelling')
        .select('*')
        .eq('name', salesPersonName)
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      // Update state if you have one, e.g., setTravels(data);
      if (data) {
        setTravels(data);
      }

    } catch (error) {
      console.error("Error fetching travel history:", error);
      showToast("Error loading travel history", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load travel history on component mount
  useEffect(() => {
    if (currentUser?.salesPersonName) {
      fetchTravelHistory();
    }
  }, [currentUser?.salesPersonName]);

  const uploadFileToSupabase = async (file, bucketName) => {
    try {
      // 1. Convert File to Blob if necessary (File inherits from Blob)
      const blob = new Blob([file], { type: file.type });

      // 2. Upload to Supabase
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // Sanitize filename
      const filePath = `${Date.now()}_${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(error.message || "File upload failed");
      }

      // 3. Get Public URL
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromLocation.trim()) {
      newErrors.fromLocation = "From location is required";
    }
    if (!formData.toLocation.trim()) {
      newErrors.toLocation = "To location is required";
    }
    if (!formData.vehicleType) {
      newErrors.vehicleType = "Vehicle type is required";
    }
    if (!formData.noOfDays || formData.noOfDays < 1) {
      newErrors.noOfDays = "Number of days must be at least 1";
    }
    if (!formData.travelDate) {
      newErrors.travelDate = "Travel date is required";
    }

    // Validate fooding entries
    foodingEntries.forEach((entry, index) => {
      if (entry.date || entry.billImage) {
        if (!entry.date) {
          newErrors[`foodingDate${index}`] = "Date is required when bill is uploaded";
        }
        if (!entry.billImage) {
          newErrors[`foodingBill${index}`] = "Bill image is required when date is provided";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fix the form errors", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = formatDateTime(new Date());
      let stayBillLink = "";
      let travelReceiptLink = "";
      let localTravelReceiptLink = "";
      let returnTicketLink = "";

      // Upload stay bill if provided
      if (formData.stayBillImage) {
        try {
          stayBillLink = await uploadFileToSupabase(formData.stayBillImage, 'stay_bill_images');
        } catch (uploadError) {
          console.error("Error uploading stay bill:", uploadError);
          showToast("Error uploading stay bill. Please try again.", "error");
          return;
        }
      }

      // Upload travel receipt if provided
      if (formData.travelReceiptImage) {
        try {
          travelReceiptLink = await uploadFileToSupabase(formData.travelReceiptImage, 'travel_receipts');
        } catch (uploadError) {
          console.error("Error uploading travel receipt:", uploadError);
          showToast("Error uploading travel receipt. Please try again.", "error");
          return;
        }
      }

      // Upload local travel receipt if provided
      if (formData.localTravelReceiptImage) {
        try {
          localTravelReceiptLink = await uploadFileToSupabase(formData.localTravelReceiptImage, 'local_travel_receipts');
        } catch (uploadError) {
          console.error("Error uploading local travel receipt:", uploadError);
          showToast("Error uploading local travel receipt. Please try again.", "error");
          return;
        }
      }

      // Upload return ticket if provided
      if (formData.returnTicketImage) {
        try {
          returnTicketLink = await uploadFileToSupabase(formData.returnTicketImage, 'return_tickets');
        } catch (uploadError) {
          console.error("Error uploading return ticket:", uploadError);
          showToast("Error uploading return ticket. Please try again.", "error");
          return;
        }
      }

      // Upload fooding bills
      let foodingDatesArray = [];
      let foodingLinksArray = [];

      for (const [index, entry] of foodingEntries.entries()) {
        if (entry.date && entry.billImage) {
          try {
            const foodingLink = await uploadFileToSupabase(entry.billImage, 'food_bill_image');
            foodingDatesArray.push(entry.date);
            foodingLinksArray.push(foodingLink);
          } catch (uploadError) {
            console.error(`Error uploading fooding bill ${index + 1}:`, uploadError);
            showToast(`Error uploading fooding bill ${index + 1}. Please try again.`, "error");
            return;
          }
        }
      }

      const foodingDatesString = foodingDatesArray.length > 0 ? foodingDatesArray.join(',') : null;
      const foodingLinksString = foodingLinksArray.length > 0 ? foodingLinksArray.join(',') : null;

      // Submit form data to Supabase
      const { error: insertError } = await supabase.from('travelling').insert([{
        timestamp: new Date().toISOString(),
        name: formData.personName,
        from_location: formData.fromLocation,
        to_location: formData.toLocation,
        vehicle_type: formData.vehicleType,
        stay_date: formData.noOfDays ? formData.noOfDays.toString() : null,
        accommodation_type: formData.accommodationType || null,
        travel_date: formData.travelDate || null,
        stay_bill: stayBillLink || null,
        fooding_date: foodingDatesString,
        fooding_bill: foodingLinksString,
        travel_receipt: travelReceiptLink || null,
        local_travel_type: formData.localTravelType || null,
        local_travel_receipt: localTravelReceiptLink || null,
        return_date: formData.returnDate || null,
        return_ticket: returnTicketLink || null,
        advance_amount: formData.advanceAmount ? formData.advanceAmount.toString() : null
      }]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      showToast("Your travel information has been recorded successfully!");

      // Reset form
      setFormData({
        personName: salesPersonName,
        fromLocation: "",
        toLocation: "",
        vehicleType: "",
        noOfDays: "",
        accommodationType: "",
        stayBillImage: null,
        stayBillImageName: "",
        travelDate: formatDateInput(new Date()),
        travelReceiptImage: null,
        travelReceiptImageName: "",
        localTravelType: "",
        localTravelReceiptImage: null,
        localTravelReceiptImageName: "",
        returnDate: "",
        returnTicketImage: null,
        returnTicketImageName: "",
        advanceAmount: ""
      });

      setFoodingEntries([{ date: "", billImage: null, billImageName: "" }]);
      setErrors({});

      // Refresh travel history
      await fetchTravelHistory();

    } catch (error) {
      showToast(
        `Error recording data: ${error.message || "Unknown error"}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e, type, index = null) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast("File size should be less than 10MB.", "error");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast("Please select a valid image file.", "error");
        return;
      }

      if (type === "stay") {
        setFormData(prev => ({
          ...prev,
          stayBillImage: file,
          stayBillImageName: file.name,
        }));
      } else if (type === "travelReceipt") {
        setFormData(prev => ({
          ...prev,
          travelReceiptImage: file,
          travelReceiptImageName: file.name,
        }));
      } else if (type === "localTravelReceipt") {
        setFormData(prev => ({
          ...prev,
          localTravelReceiptImage: file,
          localTravelReceiptImageName: file.name,
        }));
      } else if (type === "returnTicket") {
        setFormData(prev => ({
          ...prev,
          returnTicketImage: file,
          returnTicketImageName: file.name,
        }));
      } else if (type === "fooding" && index !== null) {
        const updatedEntries = [...foodingEntries];
        updatedEntries[index].billImage = file;
        updatedEntries[index].billImageName = file.name;
        setFoodingEntries(updatedEntries);
      }
    }
  };

  const handleFoodingDateChange = (index, date) => {
    const updatedEntries = [...foodingEntries];
    updatedEntries[index].date = date;
    setFoodingEntries(updatedEntries);

    // Clear error if exists
    if (errors[`foodingDate${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`foodingDate${index}`]: "",
      }));
    }
  };

  const addFoodingEntry = () => {
    setFoodingEntries([...foodingEntries, { date: "", billImage: null, billImageName: "" }]);
  };

  const removeFoodingEntry = (index) => {
    if (foodingEntries.length > 1) {
      const updatedEntries = foodingEntries.filter((_, i) => i !== index);
      setFoodingEntries(updatedEntries);

      // Clear related errors
      const newErrors = { ...errors };
      delete newErrors[`foodingDate${index}`];
      delete newErrors[`foodingBill${index}`];
      setErrors(newErrors);
    }
  };

  const viewBillLink = (link) => {
    if (link && typeof link === 'string') {
      window.open(link, '_blank');
    } else {
      showToast("Bill link not available.", "error");
    }
  };

  const viewFoodingBills = (foodingData) => {
    if (foodingData && foodingData.length > 0) {
      const newWindow = window.open();
      if (newWindow) {
        let linksHtml = foodingData.map((bill, index) => `
          <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
            <h3 style="color: #333; margin-bottom: 10px;">Fooding Bill ${index + 1}</h3>
            <p style="color: #666; margin-bottom: 10px;"><strong>Date:</strong> ${bill.date}</p>
            <a href="${bill.billLink}" target="_blank" style="display: inline-block; background: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Bill Image</a>
          </div>
        `).join('');

        newWindow.document.write(`
          <html>
            <head>
              <title>Fooding Bills</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 style="text-align: center; color: #333; margin-bottom: 30px;">Fooding Bills</h1>
                ${linksHtml}
              </div>
            </body>
          </html>
        `);
      }
    } else {
      showToast("No fooding bills available.", "error");
    }
  };

  if (!isAuthenticated || !currentUser || !currentUser.salesPersonName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">
            {!isAuthenticated
              ? "Please log in to view this page."
              : "Loading user data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-0 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Travel Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-8 py-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Travel Information
            </h3>
            <p className="text-emerald-50 text-lg">
              Record your travel details and expenses
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-8">
            {/* Person Name (Pre-filled) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Person Name
              </label>
              <input
                type="text"
                name="personName"
                value={formData.personName}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 border border-slate-200 rounded-xl shadow-sm text-slate-700 font-medium cursor-not-allowed"
              />
            </div>

            {/* 1. Travel Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Travel Date
              </label>
              <input
                type="date"
                name="travelDate"
                value={formData.travelDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
              />
              {errors.travelDate && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {errors.travelDate}
                </p>
              )}
            </div>

            {/* 2. From Location and 3. To Location */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  From Location
                </label>
                <input
                  type="text"
                  name="fromLocation"
                  value={formData.fromLocation}
                  onChange={handleInputChange}
                  placeholder="Enter departure location"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                />
                {errors.fromLocation && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {errors.fromLocation}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  To Location
                </label>
                <input
                  type="text"
                  name="toLocation"
                  value={formData.toLocation}
                  onChange={handleInputChange}
                  placeholder="Enter destination location"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                />
                {errors.toLocation && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {errors.toLocation}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Vehicle Type and 5. Travel Receipt */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Vehicle Type
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                >
                  <option value="">Select vehicle type</option>
                  <option value="Train">Train</option>
                  <option value="Bus">Bus</option>
                  <option value="Rental Car">Rental Car</option>
                  <option value="Bike">Bike</option>
                </select>
                {errors.vehicleType && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {errors.vehicleType}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Travel Receipt
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "travelReceipt")}
                    className="hidden"
                    id="travelReceiptUpload"
                  />
                  <label
                    htmlFor="travelReceiptUpload"
                    className="flex items-center justify-center w-full px-4 py-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-slate-600 text-sm">
                        {formData.travelReceiptImageName || "Upload travel receipt"}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 6. Accommodation Type and Number of Days */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Accommodation Type
                </label>
                <input
                  type="text"
                  name="accommodationType"
                  value={formData.accommodationType}
                  onChange={handleInputChange}
                  placeholder="Enter accommodation type"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Number of Days of Stay
                </label>
                <input
                  type="number"
                  name="noOfDays"
                  value={formData.noOfDays}
                  onChange={handleInputChange}
                  placeholder="Enter number of days"
                  min="1"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                />
                {errors.noOfDays && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {errors.noOfDays}
                  </p>
                )}
              </div>
            </div>

            {/* 7. Stay Bill - Changed to normal size */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Stay Bill Image
              </label>
              <div className="relative max-w-sm"> {/* Limit width here */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "stay")}
                  className="hidden"
                  id="stayBillUpload"
                />
                <label
                  htmlFor="stayBillUpload"
                  className="flex items-center justify-center w-full px-4 py-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                >
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-slate-600 text-sm">
                      {formData.stayBillImageName || "Upload stay bill image"}
                    </p>
                  </div>
                </label>
              </div>
            </div>


            {/* 8. Fooding Bills Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Food Date & Food Bill
                </label>
                {/* <button
                  type="button"
                  onClick={addFoodingEntry}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Food Entry
                </button> */}
              </div>

              {foodingEntries.map((entry, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-600">Food Entry {index + 1}</h4>
                    {foodingEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFoodingEntry(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-600">
                        Food Date
                      </label>
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => handleFoodingDateChange(index, e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                      />
                      {errors[`foodingDate${index}`] && (
                        <p className="text-red-500 text-sm mt-2 font-medium">
                          {errors[`foodingDate${index}`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-600">
                        Food Bill Image
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "fooding", index)}
                          className="hidden"
                          id={`foodingBillUpload${index}`}
                        />
                        <label
                          htmlFor={`foodingBillUpload${index}`}
                          className="flex items-center justify-center w-full px-4 py-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                        >
                          <div className="text-center">
                            <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                            <p className="text-slate-600 text-sm">
                              {entry.billImageName || "Upload food bill"}
                            </p>
                          </div>
                        </label>
                      </div>
                      {errors[`foodingBill${index}`] && (
                        <p className="text-red-500 text-sm mt-2 font-medium">
                          {errors[`foodingBill${index}`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 9. Local Travel Type and 10. Local Travel Receipt */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Local Travel Type
                </label>
                <select
                  name="localTravelType"
                  value={formData.localTravelType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                >
                  <option value="">Select local travel type</option>
                  <option value="Bus">Bus</option>
                  <option value="Rental Car">Rental Car</option>
                  <option value="Auto">Auto</option>
                  <option value="Rental Bike">Rental Bike</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Local Travel Receipt
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "localTravelReceipt")}
                    className="hidden"
                    id="localTravelReceiptUpload"
                  />
                  <label
                    htmlFor="localTravelReceiptUpload"
                    className="flex items-center justify-center w-full px-4 py-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-slate-600 text-sm">
                        {formData.localTravelReceiptImageName || "Upload local travel receipt"}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 11. Return Date and 12. Return Ticket */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Return Date
                </label>
                <input
                  type="date"
                  name="returnDate"
                  value={formData.returnDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Return Ticket
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "returnTicket")}
                    className="hidden"
                    id="returnTicketUpload"
                  />
                  <label
                    htmlFor="returnTicketUpload"
                    className="flex items-center justify-center w-full px-4 py-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-slate-600 text-sm">
                        {formData.returnTicketImageName || "Upload return ticket"}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 13. Advance Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Advance Amount
              </label>
              <textarea
                name="advanceAmount"
                value={formData.advanceAmount}
                onChange={handleInputChange}
                placeholder="Enter advance amount details"
                rows="3"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium resize-none"
              />
            </div>

            {/* Current Date & Time Display */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
              <div className="text-sm font-semibold text-emerald-700 mb-2">
                Current Date & Time
              </div>
              <div className="text-sm sm:text-2xl font-bold text-emerald-800">
                {formatDateDisplay(new Date())}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isSubmitting || !currentUser?.salesPersonName}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting Travel Info...
                </span>
              ) : (
                "Submit Travel Information"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Travel;