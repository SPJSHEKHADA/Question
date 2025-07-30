import React, { useState, useEffect, useContext, useRef } from "react";
import axiosInstance from "../../axiosInstance";
import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import { StoreContext } from "../context/storeContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Offers = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl, GLOBLEURLFORS3 } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offers, setOffers] = useState([]);
  const [isOpen, setIsOpen] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [formData, setFormData] = useState({
    id: "",
    offer_title: "",
    offer_desc: "",
    discount_types: "",
    amount: "",
    coupon_code: "",
    deposit_val: "",
    trans_val: "",
    bonus_val: "",
    win_val: "",
    from_date: "",
    to_date: "",
    max_count: "",
    total_cupon_use_count: "",
    min_amount: "",
    max_amount: "",
    max_amount_credit: "",
    assign_user_id: "",
    assign_ref_codes: "",
    offer_tnc: "",
    is_display: "Yes",
    offer_img: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Load offers on component mount
  useEffect(() => {
    loadOfferList();
  }, []);

  useEffect(() => {
    const isLogin = getCookie("isLoggedIn");
    if (!isLogin || isLogin === "false") {
      console.log("Session expired.");
      toast.error("Session expired. Please log in again.");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  }, []);

  // Filter offers based on search and status
  const filteredOffers = offers.filter((offer) => {
    const matchesSearch = offer.offer_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.coupon_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || offer.is_display === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Toggle details for a specific offer
  const toggleDetails = (id) => {
    setIsOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle file input change for image preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, offer_img: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Clear form and file input
  const clearForm = () => {
    setFormData({
      id: "",
      offer_title: "",
      offer_desc: "",
      discount_types: "",
      amount: "",
      coupon_code: "",
      deposit_val: "",
      trans_val: "",
      bonus_val: "",
      win_val: "",
      from_date: "",
      to_date: "",
      max_count: "",
      total_cupon_use_count: "",
      min_amount: "",
      max_amount: "",
      max_amount_credit: "",
      assign_user_id: "",
      assign_ref_codes: "",
      offer_tnc: "",
      is_display: "Yes",
      offer_img: null,
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add or update offer
  const addOffer = async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setLoading(true);
    const method = formData.id ? "PUT" : "POST";
    const url = method === "POST" ? `${baseUrl}addOffer` : `${baseUrl}updateOffer`;
    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === "offer_img" && formData[key]) {
        data.append("file", formData[key]);
      } else if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    try {
      const response = await axiosInstance({
        method,
        url,
        data,
      });

      if (response.data.status !== 200) {
        toast.error("Something went wrong while saving the offer!");
        return;
      }

      toast.success(`Offer ${method === "POST" ? "added" : "updated"} successfully!`);
      clearForm();
      loadOfferList();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong while saving the offer!");
    } finally {
      setLoading(false);
    }
  };

  // Delete offer
  const deleteOffer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.delete(`${baseUrl}removeOffer`, {
        data: { id },
      });

      if (response.data.status !== 200) {
        toast.error("Something went wrong while deleting the offer!");
        return;
      }

      toast.success("Offer removed successfully!");
      loadOfferList();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong while deleting the offer!");
    } finally {
      setLoading(false);
    }
  };

  // Edit offer
  const editOffer = async (id) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`${baseUrl}getOneOffer`, { id });
      if (response.data.status !== 200 || !response.data.data) {
        toast.error("Failed to fetch offer data.");
        return;
      }

      const offer = response.data.data[0];
      const formattedData = { ...offer };

      if (offer.from_date) {
        formattedData.from_date = new Date(offer.from_date).toISOString().slice(0, 16);
      }
      if (offer.to_date) {
        formattedData.to_date = new Date(offer.to_date).toISOString().slice(0, 16);
      }

      setFormData({ ...formattedData, offer_img: null });
      setImagePreview(offer.offer_img ? `${GLOBLEURLFORS3}offer-images/${offer.offer_img}` : null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error fetching offer:", error);
      toast.error("Something went wrong while fetching the offer.");
    } finally {
      setLoading(false);
    }
  };

  // Load offer list
  const loadOfferList = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`${baseUrl}getOffers`);
      setOffers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="container mx-auto max-w-7xl">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Offers Management</h1>
              <p className="text-gray-600">Create, manage, and monitor your promotional offers</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
              {/* Offer List */}
              <div className="xl:w-2/3">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  {/* Filters Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <h2 className="text-xl font-bold text-white">Active Offers ({filteredOffers.length})</h2>
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search offers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                          />
                          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="All">All Status</option>
                          <option value="Yes">Active</option>
                          <option value="No">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Offers List */}
                  <div className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading offers...</span>
                      </div>
                    ) : filteredOffers.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl text-gray-300 mb-4">🎁</div>
                        <p className="text-gray-500 text-lg">No offers found</p>
                        <p className="text-gray-400">Create your first offer to get started</p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {filteredOffers.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
                          >
                            <div className="relative">
                              {item.offer_img && (
                                <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 overflow-hidden">
                                  <img
                                    src={`${GLOBLEURLFORS3}offer-images/${item.offer_img}`}
                                    alt={item.offer_title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
                                </div>
                              )}
                              
                              <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                      {item.offer_title}
                                    </h3>
                                    <p className="text-gray-600 text-sm line-clamp-2">{item.offer_desc}</p>
                                  </div>
                                  
                                  {item.coupon_code && (
                                    <div className="ml-4 text-right">
                                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                        {item.coupon_code}
                                      </div>
                                      <div className="text-gray-500 text-xs mt-1">
                                        Uses: {item.total_cupon_use_count}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Status and Date */}
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                      item.is_display === "Yes"
                                        ? "bg-green-100 text-green-800 border border-green-200"
                                        : "bg-red-100 text-red-800 border border-red-200"
                                    }`}
                                  >
                                    {item.is_display === "Yes" ? "🟢 Active" : "🔴 Inactive"}
                                  </span>
                                  <span className="text-gray-500 text-sm flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(item.from_date).toLocaleDateString()} - {new Date(item.to_date).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Offer Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                  {item.amount && (
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                      <div className="flex items-center">
                                        <div className="bg-blue-500 p-2 rounded-lg mr-3">
                                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-xs text-blue-600 font-medium">Discount Value</p>
                                          <p className="font-bold text-blue-800">{item.amount} {item.discount_types}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {item.max_amount_credit && (
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                                      <div className="flex items-center">
                                        <div className="bg-green-500 p-2 rounded-lg mr-3">
                                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-xs text-green-600 font-medium">Max Credit</p>
                                          <p className="font-bold text-green-800">{item.max_amount_credit}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {item.trans_val && (
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                      <div className="flex items-center">
                                        <div className="bg-purple-500 p-2 rounded-lg mr-3">
                                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-xs text-purple-600 font-medium">Transaction Value</p>
                                          <p className="font-bold text-purple-800">{item.trans_val}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Expanded Details */}
                                <div className={`transition-all duration-300 overflow-hidden ${isOpen[item.id] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                                  <div className="border-t border-gray-200 pt-4 mt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                      {item.min_amount && (
                                        <div className="bg-gray-50 p-3 rounded-lg border">
                                          <p className="text-xs text-gray-500 font-medium">Min Amount</p>
                                          <p className="font-semibold text-gray-800">{item.min_amount}</p>
                                        </div>
                                      )}
                                      {item.max_amount && (
                                        <div className="bg-gray-50 p-3 rounded-lg border">
                                          <p className="text-xs text-gray-500 font-medium">Max Amount</p>
                                          <p className="font-semibold text-gray-800">{item.max_amount}</p>
                                        </div>
                                      )}
                                      {item.assign_user_id && (
                                        <div className="bg-gray-50 p-3 rounded-lg border">
                                          <p className="text-xs text-gray-500 font-medium">Assigned Users</p>
                                          <p className="font-semibold text-gray-800">{item.assign_user_id || "No users"}</p>
                                        </div>
                                      )}
                                    </div>
                                    {item.offer_tnc && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <h6 className="text-sm font-semibold text-amber-800 mb-2 flex items-center">
                                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                          </svg>
                                          Terms & Conditions
                                        </h6>
                                        <p className="text-sm text-amber-700">{item.offer_tnc}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                  <button
                                    onClick={() => toggleDetails(item.id)}
                                    className="text-blue-600 font-medium hover:text-blue-800 transition flex items-center"
                                  >
                                    <svg className={`w-4 h-4 mr-1 transition-transform ${isOpen[item.id] ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    {isOpen[item.id] ? "Hide Details" : "Show Details"}
                                  </button>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => editOffer(item.id)}
                                      className="px-4 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center"
                                      disabled={loading}
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteOffer(item.id)}
                                      className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center"
                                      disabled={loading}
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Offer Form */}
              <div className="xl:w-1/3">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-6">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {formData.id ? "Edit Offer" : "Create New Offer"}
                    </h2>
                    <p className="text-purple-100 text-sm">Fill in the details to manage your offer</p>
                  </div>
                  
                  <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <form onSubmit={addOffer} className="space-y-6">
                      <input type="hidden" name="id" value={formData.id} />

                      {/* Basic Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                        <h6 className="text-sm font-bold text-blue-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Basic Information
                          <span className="text-red-500 ml-1">*</span>
                        </h6>
                        <div className="space-y-4">
                          <input
                            type="text"
                            name="offer_title"
                            value={formData.offer_title}
                            onChange={handleInputChange}
                            placeholder="Enter Offer Title"
                            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                            required
                          />
                          <textarea
                            name="offer_desc"
                            value={formData.offer_desc}
                            onChange={handleInputChange}
                            placeholder="Enter Offer Description"
                            rows="3"
                            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                            required
                          ></textarea>
                        </div>
                      </div>

                      {/* Discount Details */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                        <h6 className="text-sm font-bold text-green-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          Discount Details
                          <span className="text-red-500 ml-1">*</span>
                        </h6>
                        <div className="grid grid-cols-1 gap-4">
                          <select
                            name="discount_types"
                            value={formData.discount_types}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                            required
                          >
                            <option value="">Select Discount Type</option>
                            <option value="Per">Percentage (%)</option>
                            <option value="Flat">Flat Amount</option>
                          </select>
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            placeholder="Discount Value"
                            className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                            required
                          />
                          <input
                            type="text"
                            name="coupon_code"
                            value={formData.coupon_code}
                            onChange={handleInputChange}
                            placeholder="Coupon Code (Optional)"
                            className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                          />
                        </div>
                      </div>

                      {/* Value Parameters */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                        <h6 className="text-sm font-bold text-purple-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Value Parameters
                        </h6>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            name="deposit_val"
                            value={formData.deposit_val}
                            onChange={handleInputChange}
                            placeholder="Deposit Value"
                            min="0"
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                          />
                          <input
                            type="number"
                            name="trans_val"
                            value={formData.trans_val}
                            onChange={handleInputChange}
                            placeholder="Transaction Value"
                            min="0"
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                          />
                          <input
                            type="number"
                            name="bonus_val"
                            value={formData.bonus_val}
                            onChange={handleInputChange}
                            placeholder="Bonus Value"
                            min="0"
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                          />
                          <input
                            type="number"
                            name="win_val"
                            value={formData.win_val}
                            onChange={handleInputChange}
                            placeholder="Winning Value"
                            min="0"
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                          />
                        </div>
                      </div>

                      {/* Date & Usage */}
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200">
                        <h6 className="text-sm font-bold text-indigo-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Date & Usage
                          <span className="text-red-500 ml-1">*</span>
                        </h6>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-sm font-medium text-indigo-700 mb-1 block">From Date</label>
                            <input
                              type="datetime-local"
                              name="from_date"
                              value={formData.from_date}
                              onChange={handleInputChange}
                              className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-indigo-700 mb-1 block">To Date</label>
                            <input
                              type="datetime-local"
                              name="to_date"
                              value={formData.to_date}
                              onChange={handleInputChange}
                              className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              name="max_count"
                              value={formData.max_count}
                              onChange={handleInputChange}
                              placeholder="Max Uses Per User"
                              min="0"
                              className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                            />
                            <input
                              type="number"
                              name="total_cupon_use_count"
                              value={formData.total_cupon_use_count}
                              onChange={handleInputChange}
                              placeholder="Total Use Count"
                              min="0"
                              className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Amount Ranges */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
                        <h6 className="text-sm font-bold text-amber-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Amount Ranges
                        </h6>
                        <div className="grid grid-cols-1 gap-3">
                          <input
                            type="number"
                            name="min_amount"
                            value={formData.min_amount}
                            onChange={handleInputChange}
                            placeholder="Min Transaction Amount"
                            min="0"
                            className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring focus:ring-amber-200 transition bg-white"
                          />
                          <input
                            type="number"
                            name="max_amount"
                            value={formData.max_amount}
                            onChange={handleInputChange}
                            placeholder="Max Transaction Amount"
                            min="0"
                            className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring focus:ring-amber-200 transition bg-white"
                          />
                          <input
                            type="number"
                            name="max_amount_credit"
                            value={formData.max_amount_credit}
                            onChange={handleInputChange}
                            placeholder="Max Credit Amount"
                            min="0"
                            className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring focus:ring-amber-200 transition bg-white"
                          />
                        </div>
                      </div>

                      {/* User Assignments */}
                      <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-5 rounded-xl border border-rose-200">
                        <h6 className="text-sm font-bold text-rose-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          User Assignments
                        </h6>
                        <div className="space-y-3">
                          <textarea
                            name="assign_user_id"
                            value={formData.assign_user_id}
                            onChange={handleInputChange}
                            placeholder="User IDs (comma separated)"
                            rows="2"
                            className="w-full p-3 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring focus:ring-rose-200 transition bg-white"
                          ></textarea>
                          <textarea
                            name="assign_ref_codes"
                            value={formData.assign_ref_codes}
                            onChange={handleInputChange}
                            placeholder="Referral Codes (comma separated)"
                            rows="2"
                            className="w-full p-3 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring focus:ring-rose-200 transition bg-white"
                          ></textarea>
                        </div>
                      </div>

                      {/* Media & Display */}
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-200">
                        <h6 className="text-sm font-bold text-teal-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Media & Display
                        </h6>
                        <div className="space-y-4">
                          <div className="relative border-2 border-dashed border-teal-300 rounded-xl p-6 text-center bg-teal-25 hover:border-teal-400 transition-colors">
                            <input
                              type="file"
                              name="offer_img"
                              accept="image/*"
                              onChange={handleFileChange}
                              ref={fileInputRef}
                              className="w-full h-full opacity-0 cursor-pointer absolute inset-0"
                            />
                            <div className="text-teal-600">
                              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="font-medium mb-1">Upload Offer Image</p>
                              <p className="text-xs text-teal-500">PNG, JPG up to 2MB</p>
                            </div>
                          </div>
                          {imagePreview && (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-xl border border-teal-200"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview(null);
                                  setFormData({...formData, offer_img: null});
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <textarea
                            name="offer_tnc"
                            value={formData.offer_tnc}
                            onChange={handleInputChange}
                            placeholder="Terms & Conditions"
                            rows="3"
                            className="w-full p-3 border-2 border-teal-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition bg-white"
                          ></textarea>
                          <select
                            name="is_display"
                            value={formData.is_display}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-teal-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition bg-white"
                          >
                            <option value="Yes">🟢 Display Offer</option>
                            <option value="No">🔴 Hide Offer</option>
                          </select>
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {formData.id ? "Update Offer" : "Create Offer"}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={clearForm}
                          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Clear
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Offers;