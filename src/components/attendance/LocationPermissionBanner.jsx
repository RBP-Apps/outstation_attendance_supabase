import { MapPin, AlertTriangle } from "lucide-react";

const LocationPermissionBanner = ({ locationPermissionStatus }) => {
  if (locationPermissionStatus === "granted") return null;

  return (
    <div className="overflow-hidden shadow-xl bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl animate-pulse">
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex-shrink-0">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">
            📍 Location Permission Required
          </h3>
          <p className="mt-1 text-sm text-white/90">
            {locationPermissionStatus === "denied"
              ? "Location access is blocked. Please enable it in your browser settings to mark attendance."
              : "Please allow location access when prompted to mark your attendance accurately."}
          </p>
          {locationPermissionStatus === "denied" && (
            <div className="mt-2 text-xs text-white/80">
              <strong>How to enable:</strong> Click the lock/info icon in
              your browser's address bar → Site settings → Location →
              Allow
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="p-2 rounded-full bg-white/20">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionBanner;