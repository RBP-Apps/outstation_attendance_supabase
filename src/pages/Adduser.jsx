"use client";
import { useEffect, useState , useRef  } from "react";
import supabase from "../utils/supabase";

export default function UserRegistration() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [masterData, setMasterData] = useState([]);
  const [masterForm, setMasterForm] = useState({
    department: "",
    given_by: "",
  });

  // ========== PAGE OPTIONS को masterData से dynamic बनाएं ==========
  const [pageOptions, setPageOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pageAccess, setPageAccess] = useState([]);
  const [openPageBox, setOpenPageBox] = useState(false);
  const dropdownRef = useRef(null);



  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setOpenPageBox(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


const handleCloseModal = () => {
  setOpen(false);

  // form reset
  setFormData({
    sales_person_name: "",
    user_name: "",
    password: "",
    admin: "USER",
    access: "",
    in_office: "NO",
  });

  // dropdown reset
  setPageAccess([]);
  setOpenPageBox(false);
};

  const togglePage = (page) => {
    setPageAccess((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page],
    );
  };

  // ========== ALL PAGES TOGGLE UPDATE ==========
  const toggleAllPages = () => {
    if (pageAccess.length === pageOptions.length) {
      setPageAccess([]);
    } else {
      setPageAccess([...pageOptions]);
    }
  };

  const [formData, setFormData] = useState({
    sales_person_name: "",
    user_name: "",
    password: "",
    admin: "USER",
    access: "",
    in_office: "NO",
  });

  // ========== FILTER STATES ==========
  const [salesPersonFilter, setSalesPersonFilter] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  const [editData, setEditData] = useState(formData);

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // ================= FETCH MASTER DATA =================
  const fetchMasterData = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMasterData(data || []);
      setLoading(false);

      // Master data से unique departments निकालें
      const departments = [...new Set(data.map((item) => item.department))];
      setPageOptions(departments.sort());
    } catch (error) {
      console.error("Error fetching master data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setEditData(user);
  };

  // ========== HANDLE SUBMIT UPDATE ==========
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      sales_person_name: formData.sales_person_name,
      user_name: formData.user_name,
      password: formData.password,
      admin: formData.admin,
      access: pageAccess.length === pageOptions.length ? "ALL" : pageAccess.join(","),
      in_office: formData.in_office,
    };

    try {
      const { error } = await supabase.from("users").insert([payload]);

      if (error) throw error;

      setOpen(false);
      setFormData({
        sales_person_name: "",
        user_name: "",
        password: "",
        admin: "USER",
        access: "",
        in_office: "NO",
      });

      setPageAccess([]);
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleUpdate = async (id) => {
    const payload = {};

    Object.keys(editData).forEach((key) => {
      if (editData[key] !== "" && editData[key] !== undefined) {
        payload[key] = editData[key];
      }
    });

    try {
      const { error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      setEditUserId(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;

    try {
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;

      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };


 
  // ================= FILTER LOGIC =================
  const filteredUsers = users.filter((u) => {
    // 1. Sales Person Filter
    const matchSales = salesPersonFilter
      ? u.sales_person_name?.toLowerCase().includes(salesPersonFilter.toLowerCase())
      : true;
      
    // 2. Global Search
    const matchGlobal = globalSearch
      ? Object.values(u).some(
          (val) =>
            val !== null &&
            val !== undefined &&
            val.toString().toLowerCase().includes(globalSearch.toLowerCase())
        )
      : true;

    return matchSales && matchGlobal;
  });

  // ================= UI =================
  return (
    <div className="p-2 md:p-4 lg:p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Add User
          </h1>
        </div>

        <div className="flex gap-3">
          {/* Add Settings Button here */}

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Add New User
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-50">
              <svg
                xmlns="http://www.w3.org2000/svg"
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.553 0-1 .447-1 1s.447 1 1 1 1-.447 1-1-.447-1-1-1z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Admin Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.admin === "ADMIN").length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.admin === "USER").length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800 whitespace-nowrap">
              User Accounts
            </h2>
            <div className="flex items-center gap-3 text-sm w-full lg:w-auto">
              
              {/* Sales Person Datalist Input */}
              <div className="relative flex-1 lg:w-48">
                <input
                  type="text"
                  list="sales-person-list"
                  placeholder="Sales Person..."
                  value={salesPersonFilter}
                  onChange={(e) => setSalesPersonFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <datalist id="sales-person-list">
                  {[...new Set(users.map(u => u.sales_person_name).filter(Boolean))].map((name, idx) => (
                    <option key={idx} value={name} />
                  ))}
                </datalist>
              </div>

              {/* Global Search */}
              <div className="relative flex-1 lg:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Global Search..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded bg-white pl-8 pr-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Clear Filter Button */}
              {(salesPersonFilter || globalSearch) && (
                <button
                  onClick={() => {
                    setSalesPersonFilter("");
                    setGlobalSearch("");
                  }}
                  className="text-gray-500 hover:text-red-500 bg-white border border-gray-300 p-1.5 rounded transition-colors flex-shrink-0"
                  title="Clear Filters"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <div className="hidden lg:flex items-center gap-2 text-sm ml-2">
                <span className="text-gray-600">Sort by:</span>
                <select className="border-0 bg-transparent text-purple-700 font-medium focus:outline-none w-20">
                  <option>Date Added</option>
                  <option>Name</option>
                  <option>Role</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <th className="px-4 py-3 text-center font-medium rounded-tl-xl">
                  Sales Person
                </th>
                <th className="px-4 py-3 text-center font-medium">User Name</th>
                <th className="px-4 py-3 text-center font-medium">Password</th>
                <th className="px-4 py-3 text-center font-medium">Admin</th>
                <th className="px-4 py-3 text-center font-medium">Access</th>
                <th className="px-4 py-3 text-center font-medium">In Office</th>
                <th className="px-4 py-3 text-center font-medium rounded-tr-xl">
                  Actions
                </th>
               </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-100 hover:bg-purple-50 transition-all duration-150"
                >
                  {/* SALES PERSON NAME COLUMN */}
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center mr-3">
                        <span className="font-bold text-purple-700">
                          {u.sales_person_name
                            ? u.sales_person_name.charAt(0).toUpperCase()
                            : "S"}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {editUserId === u.id ? (
                            <input
                              name="sales_person_name"
                              value={editData.sales_person_name || ""}
                              onChange={handleEditChange}
                              className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          ) : (
                            u.sales_person_name
                          )}
                        </div>
                        <div className="text-gray-500 text-xs">ID: {u.id}</div>
                      </div>
                    </div>
                   </td>

                  {/* USER NAME COLUMN */}
                  <td className="px-4 py-4 text-center">
                    {editUserId === u.id ? (
                      <input
                        name="user_name"
                        value={editData.user_name || ""}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-sm font-medium">{u.user_name}</span>
                    )}
                   </td>

                  {/* PASSWORD COLUMN */}
                  <td className="px-4 py-4 text-center">
                    {editUserId === u.id ? (
                      <input
                        name="password"
                        value={editData.password || ""}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="font-mono bg-gray-50 px-2 py-1 rounded">
                        {u.password}
                      </span>
                    )}
                   </td>

                  {/* ADMIN COLUMN */}
                  <td className="px-4 py-4 text-center">
                    {editUserId === u.id ? (
                      <select
                        name="admin"
                        value={editData.admin || "USER"}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${u.admin === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {u.admin}
                      </span>
                    )}
                   </td>

                  {/* ACCESS COLUMN */}
                  <td className="px-4 py-4 text-center">
                    {editUserId === u.id ? (
                      <input
                        name="access"
                        value={editData.access || ""}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : u.access ? (
                      <div className="text-sm bg-gray-50 px-3 py-1 rounded truncate max-w-[150px]">
                        {u.access}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not set</span>
                    )}
                   </td>

                  {/* IN OFFICE COLUMN */}
                  <td className="px-4 py-4 text-center">
                    {editUserId === u.id ? (
                      <select
                        name="in_office"
                        value={editData.in_office || "NO"}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${u.in_office === "YES" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {u.in_office || "NO"}
                      </span>
                    )}
                   </td>

                  {/* ACTIONS COLUMN */}
                  <td className="px-4 py-4 text-center">
                    {editUserId === u.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(u.id)}
                          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Save
                        </button>
                        <button
                          onClick={() => setEditUserId(null)}
                          className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(u)}
                          className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} total users
        </div>
      </div>

      {/* ================= MOBILE CARD VIEW ================= */}
      <div className="md:hidden space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col gap-4 mb-4 border-b border-gray-100 pb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                User Accounts
              </h2>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
                {filteredUsers.length} users
              </span>
            </div>

            {/* Mobile Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  list="sales-person-list-mobile"
                  placeholder="Filter Sales Person..."
                  value={salesPersonFilter}
                  onChange={(e) => setSalesPersonFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <datalist id="sales-person-list-mobile">
                  {[...new Set(users.map(u => u.sales_person_name).filter(Boolean))].map((name, idx) => (
                    <option key={idx} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Global Search..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {(salesPersonFilter || globalSearch) && (
                <button
                  onClick={() => {
                    setSalesPersonFilter("");
                    setGlobalSearch("");
                  }}
                  className="text-gray-600 hover:text-red-500 bg-gray-50 border border-gray-200 py-2 rounded-lg transition-colors text-sm font-medium w-full text-center"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all duration-200"
              >
                {/* USER HEADER */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center mr-3">
                      <span className="font-bold text-lg text-purple-700">
                        {u.sales_person_name
                          ? u.sales_person_name.charAt(0).toUpperCase()
                          : "S"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {u.sales_person_name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.admin === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                        >
                          {u.admin}
                        </span>
                        <span className="text-gray-500 text-xs ml-2">
                          ID: {u.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  {editUserId === u.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleUpdate(u.id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditUserId(null)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-2 bg-purple-100 text-purple-600 rounded-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* USER DETAILS */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">User Name</p>
                    {editUserId === u.id ? (
                      <input
                        name="user_name"
                        value={editData.user_name || ""}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium">{u.user_name}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Password</p>
                    {editUserId === u.id ? (
                      <input
                        name="password"
                        value={editData.password || ""}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                        {u.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Admin Role</p>
                    {editUserId === u.id ? (
                      <select
                        name="admin"
                        value={editData.admin || "USER"}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium">{u.admin}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">In Office</p>
                    {editUserId === u.id ? (
                      <select
                        name="in_office"
                        value={editData.in_office || "NO"}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium">{u.in_office || "NO"}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Access</p>
                    {editUserId === u.id ? (
                      <input
                        name="access"
                        value={editData.access || ""}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium truncate">
                        {u.access || "Not set"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= ADD USER MODAL ================= */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Add New User</h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-white hover:text-gray-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-purple-100 text-sm mt-1">
                Fill in the user details below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Person Name
                </label>
                <input
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  name="sales_person_name"
                  placeholder="Enter sales person name"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Name
                </label>
                <input
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  name="user_name"
                  placeholder="Enter username"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Role
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="admin"
                    onChange={handleChange}
                    value={formData.admin}
                  >
                    <option value="USER">Regular User</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    In Office
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="in_office"
                    onChange={handleChange}
                    value={formData.in_office}
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
              </div>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Access (Departments)
                </label>

                {/* Select box */}
                <div
                  onClick={() => setOpenPageBox(!openPageBox)}
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full cursor-pointer bg-white flex justify-between items-center"
                >
                  <span className="text-gray-600">
                    {pageAccess.length === 0
                      ? "Select departments"
                      : `${pageAccess.length} selected`}
                  </span>
                  <span>▾</span>
                </div>

                {/* Dropdown */}
                {openPageBox && (
 <div className="absolute z-50 bottom-full mb-1 w-full max-h-64 overflow-y-auto border bg-white rounded-lg shadow-lg p-3 space-y-2">
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">
                          Loading departments...
                        </p>
                      </div>
                    ) : pageOptions.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No departments found
                      </p>
                    ) : (
                      <>
                        {/* All Departments */}
                        <label className="flex items-center gap-2 font-medium text-green-600">
                          <input
                            type="checkbox"
                            checked={pageAccess.length === pageOptions.length}
                            onChange={toggleAllPages}
                          />
                          All Departments
                        </label>

                        <hr />

                        {pageOptions.map((page) => (
                          <label key={page} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pageAccess.includes(page)}
                              onChange={() => togglePage(page)}
                            />
                            {page}
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}