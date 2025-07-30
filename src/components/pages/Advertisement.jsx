import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../../axiosInstance";
import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import { StoreContext } from "../context/storeContext";
import {
  FaCloudUploadAlt,
  FaPlay,
  FaSave,
  FaTimes,
  FaEdit,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaGamepad,
  FaTrophy,
  FaImage,
  FaVideo,
  FaChartLine,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate, useNavigate } from "react-router-dom";

const Advertisement = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl, GLOBLEURLFORS3 } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [formData, setFormData] = useState({
    id: "",
    ad_display_page: "",
    ad_display_count: "",
    ad_action: "",
    game_id: "",
    contest_id: "",
    ad_document_type: "",
    start_time: "",
    end_time: "",
    ad_document_url: null,
  });
  const [preview, setPreview] = useState({ type: "", url: "" });

  const adDisplayOptions = ["home", "contestList", "deposit", "homePlayStore"];
  const actionOptions = [
    "home",
    "deposit",
    "contest",
    "web_view",
    "web_browser",
    "app_update",
    "whatsapp",
    "twitter",
    "facebook",
    "telegram",
    "telegram_support",
    "instagram",
    "kyc",
    "refer",
    "support",
  ];
  const documentTypeOptions = ["Image", "Video"];

  useEffect(() => {
    fetchAds();
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

  // Filter ads based on search and filters
  const filteredAds = ads.filter((ad) => {
    const matchesSearch = 
      ad.ad_display_page?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.ad_action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.game_id?.toString().includes(searchTerm) ||
      ad.contest_id?.toString().includes(searchTerm);
    
    const isActive = new Date() >= new Date(ad.start_time) && new Date() <= new Date(ad.end_time);
    const matchesStatus = filterStatus === "All" || 
      (filterStatus === "Active" && isActive) || 
      (filterStatus === "Inactive" && !isActive);
    
    const matchesType = filterType === "All" || ad.ad_document_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${baseUrl}getAllAdsAdmin`);
      if (response.data.status === 200) {
        setAds(response.data.data || []);
      } else {
        toast.error(response.data.msg || "Error fetching ads");
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error("Failed to load advertisements");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5242880) {
        toast.error("File size exceeds 5MB limit");
        return;
      }
      setFormData((prev) => ({ ...prev, ad_document_url: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview({
          type: file.type.startsWith("image/") ? "image" : "video",
          url: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.ad_display_page ||
      !formData.ad_display_count ||
      !formData.ad_action ||
      !formData.game_id ||
      !formData.contest_id ||
      !formData.ad_document_type ||
      !formData.start_time ||
      !formData.end_time 
    ) {
      toast.error("Please fill all required fields, including a document");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "ad_document_url" && formData[key] instanceof File) {
        data.append(key, formData[key]);
      } else if (key !== "ad_document_url" && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    try {
      setLoading(true);
      const url = formData.id
        ? `${baseUrl}updateAd/${formData.id}`
        : `${baseUrl}createAd`;
      const method = formData.id ? "put" : "post";
      const response = await axiosInstance[method](url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.status === 200) {
        toast.success(
          formData.id ? "Ad updated successfully" : "Ad created successfully"
        );
        clearForm();
        fetchAds();
      } else {
        toast.error(response.data.msg || "Operation failed");
      }
    } catch (error) {
      console.error(
        "Error submitting form:",
        error.response ? error.response.data : error.message
      );
      toast.error("Failed to save advertisement. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`${baseUrl}getOneAd`, {
        adId: id,
      });
      if (response.data.status === 200) {
        const ad = response.data.data;
        setFormData({
          id: ad.id,
          ad_display_page: ad.ad_display_page || "",
          ad_display_count: ad.ad_display_count || "",
          ad_action: ad.ad_action || "",
          game_id: ad.game_id || "",
          contest_id: ad.contest_id || "",
          ad_document_type: ad.ad_document_type || "",
          start_time: ad.start_time
            ? new Date(ad.start_time).toISOString().slice(0, 16)
            : "",
          end_time: ad.end_time
            ? new Date(ad.end_time).toISOString().slice(0, 16)
            : "",
          ad_document_url: null,
        });
        setPreview({
          type: ad.ad_document_type.toLowerCase(),
          url: `${GLOBLEURLFORS3}ads-data/${ad.ad_document_url}`,
        });
      } else {
        toast.error(response.data.msg || "Failed to load ad details");
      }
    } catch (error) {
      console.error("Error fetching ad:", error);
      toast.error("Failed to load ad details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`${baseUrl}deleteAd/${id}`);
      if (response.data.status === 200) {
        toast.success("Ad deleted successfully");
        fetchAds();
      } else {
        toast.error(response.data.msg || "Failed to delete ad");
      }
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast.error("Failed to delete ad");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      id: "",
      ad_display_page: "",
      ad_display_count: "",
      ad_action: "",
      game_id: "",
      contest_id: "",
      ad_document_type: "",
      start_time: "",
      end_time: "",
      ad_document_url: null,
    });
    setPreview({ type: "", url: "" });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'home': return '🏠';
      case 'deposit': return '💰';
      case 'contest': return '🏆';
      case 'web_view': case 'web_browser': return '🌐';
      case 'app_update': return '📱';
      case 'whatsapp': return '💬';
      case 'twitter': return '🐦';
      case 'facebook': return '📘';
      case 'telegram': return '✈️';
      case 'instagram': return '📷';
      case 'kyc': return '🆔';
      case 'refer': return '👥';
      case 'support': return '🆘';
      default: return '⚡';
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 overflow-y-auto p-6">
          <ToastContainer position="top-right" autoClose={3000} />
          
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertisement Management</h1>
            <p className="text-gray-600">Create, manage, and monitor your advertising campaigns</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Ads List Section */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Filter Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Active Advertisements ({filteredAds.length})</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search ads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="All">All Types</option>
                        <option value="Image">Images</option>
                        <option value="Video">Videos</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ads Grid */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-gray-600">Loading advertisements...</span>
                    </div>
                  ) : filteredAds.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl text-gray-300 mb-4">📢</div>
                      <p className="text-gray-500 text-lg">No advertisements found</p>
                      <p className="text-gray-400">Create your first ad campaign to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredAds.map((ad) => {
                        const isActive = new Date() >= new Date(ad.start_time) && new Date() <= new Date(ad.end_time);
                        return (
                          <div
                            key={ad.id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
                          >
                            {/* Media Section */}
                            <div className="relative">
                              {ad.ad_document_type === "Image" ? (
                                <div className="relative h-48 bg-gradient-to-r from-indigo-100 to-purple-100 overflow-hidden">
                                  <img
                                    src={`${GLOBLEURLFORS3}ads-data/${ad.ad_document_url}`}
                                    alt="Ad"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute top-3 left-3">
                                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                      <FaImage className="mr-1" /> Image
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative h-48 bg-gradient-to-r from-purple-100 to-pink-100 overflow-hidden">
                                  <video
                                    src={`${GLOBLEURLFORS3}ads-data/${ad.ad_document_url}`}
                                    className="w-full h-full object-cover"
                                    controls
                                  />
                                  <div className="absolute top-3 left-3">
                                    <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                      <FaVideo className="mr-1" /> Video
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Status Badge */}
                              <div className="absolute top-3 right-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    isActive
                                      ? "bg-green-100 text-green-800 border border-green-200"
                                      : "bg-red-100 text-red-800 border border-red-200"
                                  }`}
                                >
                                  {isActive ? "🟢 Active" : "🔴 Inactive"}
                                </span>
                              </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-6">
                              {/* Header Info */}
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 capitalize">
                                  {ad.ad_display_page}
                                </h3>
                                <div className="text-2xl">
                                  {getActionIcon(ad.ad_action)}
                                </div>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                                  <div className="flex items-center">
                                    <FaGamepad className="text-blue-500 mr-2" />
                                    <div>
                                      <p className="text-xs text-blue-600 font-medium">Game ID</p>
                                      <p className="font-bold text-blue-800">{ad.game_id}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                                  <div className="flex items-center">
                                    <FaTrophy className="text-green-500 mr-2" />
                                    <div>
                                      <p className="text-xs text-green-600 font-medium">Contest ID</p>
                                      <p className="font-bold text-green-800">{ad.contest_id}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                                  <div className="flex items-center">
                                    <FaEye className="text-purple-500 mr-2" />
                                    <div>
                                      <p className="text-xs text-purple-600 font-medium">Display Count</p>
                                      <p className="font-bold text-purple-800">{ad.ad_display_count}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                                  <div className="flex items-center">
                                    <FaChartLine className="text-orange-500 mr-2" />
                                    <div>
                                      <p className="text-xs text-orange-600 font-medium">Read Count</p>
                                      <p className="font-bold text-orange-800">{ad.read_count || 0}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action & Duration */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="font-medium mr-2">Action:</span>
                                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-semibold">
                                    {ad.ad_action}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <FaCalendarAlt className="mr-2" />
                                  <span className="text-xs">
                                    {new Date(ad.start_time).toLocaleDateString()} - {new Date(ad.end_time).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(ad.id)}
                                  disabled={loading}
                                  className="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center text-sm font-medium"
                                >
                                  <FaEdit className="mr-1" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(ad.id)}
                                  disabled={loading}
                                  className="flex-1 bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition flex items-center justify-center text-sm font-medium"
                                >
                                  <FaTrash className="mr-1" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {formData.id ? "Edit Advertisement" : "Create New Ad"}
                  </h2>
                  <p className="text-purple-100 text-sm">Configure your advertising campaign</p>
                </div>

                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <input type="hidden" name="id" value={formData.id} />
                    
                    {/* Display Configuration */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                      <h6 className="text-sm font-bold text-blue-800 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Display Configuration
                        <span className="text-red-500 ml-1">*</span>
                      </h6>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">Ad Display Page</label>
                          <select
                            name="ad_display_page"
                            value={formData.ad_display_page}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                            required
                          >
                            <option value="">Select Display Page</option>
                            {adDisplayOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">Display Count</label>
                          <input
                            type="number"
                            name="ad_display_count"
                            value={formData.ad_display_count}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                            placeholder="Enter display count"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Configuration */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                      <h6 className="text-sm font-bold text-green-800 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Action Configuration
                        <span className="text-red-500 ml-1">*</span>
                      </h6>
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">Action Type</label>
                        <select
                          name="ad_action"
                          value={formData.ad_action}
                          onChange={handleInputChange}
                          className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                          required
                        >
                          <option value="">Select Action</option>
                          {actionOptions.map((option) => (
                            <option key={option} value={option}>
                              {getActionIcon(option)} {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Game & Contest IDs */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                      <h6 className="text-sm font-bold text-purple-800 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Targeting
                        <span className="text-red-500 ml-1">*</span>
                      </h6>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-1">Game ID</label>
                          <input
                            type="number"
                            name="game_id"
                            value={formData.game_id}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                            placeholder="Game ID"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-1">Contest ID</label>
                          <input
                            type="number"
                            name="contest_id"
                            value={formData.contest_id}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                            placeholder="Contest ID"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200">
                      <h6 className="text-sm font-bold text-indigo-800 mb-4 flex items-center">
                        <FaCalendarAlt className="mr-2" />
                        Schedule
                        <span className="text-red-500 ml-1">*</span>
                      </h6>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-indigo-700 mb-1">Start Time</label>
                          <input
                            type="datetime-local"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-indigo-700 mb-1">End Time</label>
                          <input
                            type="datetime-local"
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Media Upload */}
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-200">
                      <h6 className="text-sm font-bold text-teal-800 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Media Upload
                        <span className="text-red-500 ml-1">*</span>
                      </h6>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-teal-700 mb-1">Document Type</label>
                          <select
                            name="ad_document_type"
                            value={formData.ad_document_type}
                            onChange={(e) => {
                              handleInputChange(e);
                              setPreview({ type: "", url: "" });
                              setFormData((prev) => ({
                                ...prev,
                                ad_document_url: null,
                              }));
                            }}
                            className="w-full p-3 border-2 border-teal-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition bg-white"
                            required
                          >
                            <option value="">Select Type</option>
                            {documentTypeOptions.map((option) => (
                              <option key={option} value={option}>
                                {option === "Image" ? "🖼️" : "🎥"} {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="relative border-2 border-dashed border-teal-300 rounded-xl p-6 text-center bg-teal-25 hover:border-teal-400 transition-colors">
                          <input
                            type="file"
                            name="ad_document_url"
                            accept="image/jpeg,image/jpg,image/png,video/mp4"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="text-teal-600">
                            <FaCloudUploadAlt className="text-3xl mx-auto mb-2" />
                            <p className="font-medium mb-1">Upload Media File</p>
                            <p className="text-xs text-teal-500">PNG, JPG, MP4 (Max 5MB)</p>
                          </div>
                        </div>
                        
                        {preview.type === "image" && (
                          <div className="relative">
                            <img
                              src={preview.url}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-xl border border-teal-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPreview({ type: "", url: "" });
                                setFormData({...formData, ad_document_url: null});
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        
                        {preview.type === "video" && (
                          <div className="relative">
                            <video
                              src={preview.url}
                              controls
                              className="w-full h-48 object-cover rounded-xl border border-teal-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPreview({ type: "", url: "" });
                                setFormData({...formData, ad_document_url: null});
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-2" />
                            {formData.id ? "Update Advertisement" : "Create Advertisement"}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={clearForm}
                        className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-xl transition flex items-center justify-center font-medium"
                      >
                        <FaTimes className="mr-2" />
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advertisement;