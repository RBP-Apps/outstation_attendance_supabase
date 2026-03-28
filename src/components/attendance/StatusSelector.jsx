const StatusSelector = ({ value, onChange, error }) => {
  return (
    <div className="space-y-2">
      <label className="block mb-3 text-sm font-semibold text-slate-700">
        Status
      </label>
      <select
        name="status"
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-700 font-medium ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      >
        <option value="">Select status</option>
        <option value="IN">IN</option>
        <option value="MID">MID</option>
        <option value="OUT">OUT</option>
        <option value="Leave">Leave</option>
      </select>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

export default StatusSelector;