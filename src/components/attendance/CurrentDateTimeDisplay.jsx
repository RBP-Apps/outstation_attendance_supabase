import { formatDateDisplay } from "../../utils/dateUtils";

const CurrentDateTimeDisplay = ({ status }) => {
  return (
    <div className="p-6 border bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-emerald-100">
      <div className="mb-2 text-sm font-semibold text-emerald-700">
        Current Date & Time
      </div>
      <div className="text-sm font-bold sm:text-2xl text-emerald-800">
        {formatDateDisplay(new Date())}
      </div>
      {(status === "IN" || status === "OUT") && (
        <div className="mt-3 text-sm text-emerald-600">
          📍 Location will be automatically captured when you submit
        </div>
      )}
    </div>
  );
};

export default CurrentDateTimeDisplay;