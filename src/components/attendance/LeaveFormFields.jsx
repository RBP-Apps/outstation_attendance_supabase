// import { Camera } from "lucide-react";

// const ImageUploadSection = ({ formData, setFormData, setCameraPhoto }) => {
//   return (
//     <div className="space-y-3">
//       {/* Camera/Photo Input - Direct visible input styled as button */}
//       <label className="flex items-center justify-center w-full px-4 py-3 text-blue-600 transition border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 hover:border-blue-400">
//         <Camera className="w-5 h-5 mr-2" />
//         <span className="font-medium">
//           Take Photo or Select Image
//         </span>
//         <input
//           type="file"
//           accept="image/*"
//           capture="environment"
//           className="hidden"
//           onChange={(e) => {
//             const file = e.target?.files?.[0];
//             if (file) {
//               const reader = new FileReader();
//               reader.onload = (event) => {
//                 if (event.target?.result) {
//                   setFormData((prev) => ({
//                     ...prev,
//                     image: event.target.result,
//                   }));
//                   setCameraPhoto(event.target.result);
//                 }
//               };
//               reader.readAsDataURL(file);
//             }
//             e.target.value = "";
//           }}
//         />
//       </label>

//       {/* Image Preview */}
//       {formData.image && (
//         <div className="relative mt-4">
//           <img
//             src={formData.image}
//             alt="Preview"
//             className="object-cover w-full h-48 border-2 border-green-300 rounded-lg"
//           />
//           <div className="absolute px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full top-2 right-2">
//             ✓ Photo Captured
//           </div>
//           <button
//             type="button"
//             onClick={() => {
//               setFormData((prev) => ({ ...prev, image: null }));
//               setCameraPhoto(null);
//             }}
//             className="absolute px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full top-2 left-2 hover:bg-red-600"
//           >
//             ✕ Remove
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ImageUploadSection;



const LeaveFormFields = ({ formData, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="block mb-3 text-sm font-semibold text-slate-700">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={onChange}
            className="w-full px-4 py-3 font-medium transition-all duration-200 bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700"
          />
          {errors.startDate && (
            <p className="mt-2 text-sm font-medium text-red-500">
              {errors.startDate}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block mb-3 text-sm font-semibold text-slate-700">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={onChange}
            min={formData.startDate}
            className="w-full px-4 py-3 font-medium transition-all duration-200 bg-white border shadow-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700"
          />
          {errors.endDate && (
            <p className="mt-2 text-sm font-medium text-red-500">
              {errors.endDate}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block mb-3 text-sm font-semibold text-slate-700">
          Reason
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={onChange}
          placeholder="Enter reason for leave"
          className="w-full px-4 py-3 font-medium transition-all duration-200 bg-white border shadow-sm resize-none border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700 min-h-32"
        />
        {errors.reason && (
          <p className="mt-2 text-sm font-medium text-red-500">
            {errors.reason}
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaveFormFields;