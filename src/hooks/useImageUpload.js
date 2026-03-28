import { useState, useCallback } from "react";
import supabase from "../utils/supabase";

export const useImageUpload = () => {
  const [cameraPhoto, setCameraPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImageToSupabase = useCallback(async (base64Image, fileName) => {
    try {
      setIsUploading(true);
      // 1. Convert base64 to Blob
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

      // 2. Upload to Supabase
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

      // 3. Get Public URL
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setIsUploading(false);
      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsUploading(false);
      throw error;
    }
  }, []);

  const handleImageUpload = useCallback((e, setFormData, setCameraPhoto, showToast) => {
    // CRITICAL: Prevent ALL default behaviors immediately
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (e && e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }

    // Get file safely
    const files = e?.target?.files;
    if (!files || files.length === 0) {
      // Reset input on cancel
      try {
        if (e?.target) e.target.value = "";
      } catch (err) {
        // Ignore reset errors
      }
      return false;
    }

    // Clone the file to prevent reference loss on mobile
    const file = files[0];
    const fileBlob = new Blob([file], { type: file.type });

    // Reset input immediately to allow re-selection
    try {
      if (e?.target) e.target.value = "";
    } catch (err) {
      // Ignore reset errors
    }

    // Use requestAnimationFrame to completely decouple from the event
    requestAnimationFrame(() => {
      const reader = new FileReader();

      // Use onload (not onloadend) - more reliable on mobile
      reader.onload = (event) => {
        const result = event?.target?.result || reader.result;
        if (result) {
          // Update state with the base64 image
          setFormData((prev) => ({ ...prev, image: result }));
          setCameraPhoto(result);
        }
      };

      reader.onerror = () => {
        console.error("FileReader error:", reader.error);
        if (showToast) showToast("Failed to read image. Please try again.", "error");
      };

      try {
        reader.readAsDataURL(fileBlob);
      } catch (error) {
        console.error("FileReader exception:", error);
        if (showToast) showToast("Failed to process image. Please try again.", "error");
      }
    });

    return false;
  }, []);

  return {
    cameraPhoto,
    setCameraPhoto,
    isUploading,
    uploadImageToSupabase,
    handleImageUpload,
  };
};