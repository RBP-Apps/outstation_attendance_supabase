import { useState, useCallback } from "react";

export const useLocation = () => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState("prompt");

  const getFormattedAddress = async (latitude, longitude) => {
    // Add a small helper for fetch with timeout
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
      // Nominatim requires a User-Agent which browsers don't allow to be set.
      // We also add a small delay to avoid 425 Too Early errors if retried.
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      }, 6000); // 6 second timeout

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
      console.error("Geocoding Error Details:", {
        message: error.message,
        type: error.name,
        lat: latitude,
        lng: longitude
      });
      // Always return coordinates as fallback - don't let geocoding failure block attendance
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  const getCurrentLocation = useCallback(() => {
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
  }, []);

  const checkLocationPermission = useCallback(async () => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationPermissionStatus("denied");
        return;
      }

      // Use Permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({
          name: "geolocation",
        });
        setLocationPermissionStatus(result.state);

        // Listen for permission changes
        result.onchange = () => {
          setLocationPermissionStatus(result.state);
        };
      } else {
        // Fallback: try to get location to check permission
        navigator.geolocation.getCurrentPosition(
          () => setLocationPermissionStatus("granted"),
          (error) => {
            if (error.code === 1) {
              setLocationPermissionStatus("denied");
            } else {
              setLocationPermissionStatus("prompt");
            }
          },
          { timeout: 5000 }
        );
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
      setLocationPermissionStatus("prompt");
    }
  }, []);

  return {
    isGettingLocation,
    setIsGettingLocation,
    locationData,
    setLocationData,
    locationPermissionStatus,
    getCurrentLocation,
    checkLocationPermission,
  };
};