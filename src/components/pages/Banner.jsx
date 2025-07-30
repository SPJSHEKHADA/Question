import React, { useState, useEffect, useContext, useRef } from "react";
import axiosInstance from "../../axiosInstance";
import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import { StoreContext } from "../context/storeContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Banner = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl, GLOBLEURLFORS3 } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [games, setGames] = useState([]);
  const [contests, setContests] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(window.innerWidth > 1024);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    action: "",
    file: null,
    start_time: "",
    end_time: "",
    status: "1",
    game_id: "",
    contest_id: "",
    action_url: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const actionOptions = [
    { value: "deposit", label: "💳 Deposit", color: "blue" },
    { value: "contest", label: "🏆 Contest", color: "purple" },
    { value: "web_view", label: "🌐 Web View", color: "green" },
    { value: "web_browser", label: "🔗 Web Browser", color: "indigo" },
    { value: "app_download", label: "📱 App Download", color: "cyan" },
    { value: "app_update", label: "🔄 App Update", color: "yellow" },
    { value: "whatsapp", label: "💬 WhatsApp", color: "green" },
    { value: "twitter", label: "🐦 Twitter", color: "blue" },
    { value: "facebook", label: "📘 Facebook", color: "blue" },
    { value: "telegram", label: "✈️ Telegram", color: "cyan" },
    { value: "telegram_support", label: "🆘 Telegram Support", color: "red" },
    { value: "instagram", label: "📷 Instagram", color: "pink" },
    { value: "kyc", label: "🆔 KYC", color: "orange" },
    { value: "refer", label: "👥 Refer", color: "emerald" },
    { value: "support", label: "🎧 Support", color: "gray" },
  ];

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

  useEffect(() => {
    loadGames();
    loadBannerList();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setShowForm(true);
      } else {
        setShowForm(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadContestList = async () => {
      if (formData.game_id) {
        try {
          const response = await axiosInstance.post(`${baseUrl}getContestList`, {
            game_id: formData.game_id,
          });
          setContests(response.data.data || []);
        } catch (error) {
          console.error("Error loading contests:", error);
          setContests([]);
        }
      } else {
        setContests([]);
      }
    };
    loadContestList();
  }, [formData.game_id, baseUrl]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${baseUrl}getGames`);
      setGames(response.data.data || []);
    } catch (error) {
      console.error("Error loading games:", error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const loadBannerList = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${baseUrl}getBannerList`);
      setBanners(response.data.data || []);
    } catch (error) {
      console.error("Error loading banners:", error);
      setError("Failed to load banners.");
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile) => {
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const clearImage = () => {
    setFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Ongoing";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return new Date(isoString).toLocaleDateString("en-US", options);
  };

  const getActionDetails = (action) => {
    const actionDetail = actionOptions.find(option => option.value === action);
    return actionDetail || { label: action, color: "gray" };
  };

  const getStatusColor = (status) => {
    return status === "1" ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200";
  };

  const isActive = (banner) => {
    const now = new Date();
    const startTime = new Date(banner.start_time);
    const endTime = banner.end_time ? new Date(banner.end_time) : null;
    
    return banner.status === "1" && now >= startTime && (!endTime || now <= endTime);
  };

  const filteredBanners = banners.filter((banner) => {
    const matchesSearch = 
      banner.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.id?.toString().includes(searchTerm) ||
      banner.action_url?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "All" || 
      (filterStatus === "Active" && isActive(banner)) ||
      (filterStatus === "Inactive" && !isActive(banner)) ||
      (filterStatus === "Enabled" && banner.status === "1") ||
      (filterStatus === "Disabled" && banner.status === "0");
    
    const matchesAction = filterAction === "All" || banner.action === filterAction;
    
    return matchesSearch && matchesStatus && matchesAction;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id && !file) {
      setError("Please select an image for the banner.");
      toast.error("Please select an image for the banner.");
      return;
    }

    setSaving(true);
    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined && key !== 'file') {
        data.append(key, formData[key]);
      }
    });

    if (file) {
      data.append("file", file);
    }

    try {
      const url = formData.id ? `${baseUrl}updateBanner` : `${baseUrl}addBanner`;
      const response = await axiosInstance({
        method: formData.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        url,
        data,
      });

      toast.success(`Banner ${formData.id ? 'updated' : 'created'} successfully!`);
      clearForm();
      loadBannerList();
    } catch (error) {
      console.error("Error submitting banner:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.error || error.message || "Failed to save banner";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      setSaving(true);
      const response = await axiosInstance.post(`${baseUrl}getOneBanner`, { id });
      const banner = response.data.data[0];
      
      setFormData({
        id: banner.id,
        action: banner.action,
        file: null,
        start_time: banner.start_time
          ? new Date(banner.start_time).toISOString().slice(0, 16)
          : "",
        end_time: banner.end_time
          ? new Date(banner.end_time).toISOString().slice(0, 16)
          : "",
        status: banner.status,
        game_id: banner.game_id ? String(banner.game_id) : "",
        contest_id: banner.contest_id ? String(banner.contest_id) : "",
        action_url: banner.action_url || "",
      });
      
      setPreviewImage(
        banner.image ? `${GLOBLEURLFORS3}banner-images/${banner.image}` : null
      );
      setError("");
      
      if (window.innerWidth <= 1024) {
        setShowForm(true);
        window.scrollTo(0, 0);
      }
      
      toast.info("Banner loaded for editing");
    } catch (error) {
      console.error("Error editing banner:", error);
      setError("Failed to load banner details.");
      toast.error("Failed to load banner details");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) {
      return;
    }

    try {
      setSaving(true);
      await axiosInstance.post(`${baseUrl}deleteBanner`, { id });
      toast.success("Banner deleted successfully!");
      loadBannerList();
      setError("");
    } catch (error) {
      console.error("Error deleting banner:", error);
      setError("Failed to delete banner.");
      toast.error("Failed to delete banner");
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setFormData({
      id: "",
      action: "",
      file: null,
      start_time: "",
      end_time: "",
      status: "1",
      game_id: "",
      contest_id: "",
      action_url: "",
    });
    setPreviewImage(null);
    setFile(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    if (window.innerWidth <= 1024) {
      setShowForm(false);
    }
  };

  const renderBannerCard = (banner) => (
    <div
      key={banner.id}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
    >
      <div className="relative">
        <img
          src={
            banner.image
              ? `${GLOBLEURLFORS3}banner-images/${banner.image}`
              : "/placeholder-image.jpg"
          }
          alt="Banner"
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = "/placeholder-image.jpg";
          }}
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(banner.status)}`}>
            {banner.status === "1" ? "✅ Enabled" : "❌ Disabled"}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isActive(banner) ? "bg-green-500 text-white" : "bg-gray-500 text-white"
          }`}>
            {isActive(banner) ? "🟢 Live" : "⭕ Inactive"}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
            ID: {banner.id}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getActionDetails(banner.action).color}-100 text-${getActionDetails(banner.action).color}-800`}>
            {getActionDetails(banner.action).label}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-5 h-5 mr-2">📅</span>
            <span className="font-medium">Created:</span>
            <span className="ml-1">{formatDate(banner.create_at)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-5 h-5 mr-2">▶️</span>
            <span className="font-medium">Start:</span>
            <span className="ml-1">{formatDate(banner.start_time)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-5 h-5 mr-2">⏹️</span>
            <span className="font-medium">End:</span>
            <span className="ml-1">{formatDate(banner.end_time)}</span>
          </div>
        </div>

        {banner.action_url && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-xs font-medium text-gray-600">Action URL:</span>
            <p className="text-sm text-blue-600 truncate">{banner.action_url}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(banner.id)}
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center font-medium disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => handleDelete(banner.id)}
            disabled={saving}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center font-medium disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="container mx-auto max-w-7xl">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Banner Management</h1>
              <p className="text-gray-600">Create and manage promotional banners for your application</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
              {/* Banner List Section */}
              <div className={`${showForm ? 'xl:w-2/3' : 'w-full'} transition-all duration-300`}>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  {/* Search and Filter Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <span className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                          🎯
                        </span>
                        Active Banners ({filteredBanners.length})
                      </h2>
                      
                      {/* Mobile Add Button */}
                      {!showForm && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="lg:hidden bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                        >
                          + Add New Banner
                        </button>
                      )}
                    </div>

                    {/* Search and Filters */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search banners..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
                      >
                        <option value="All">All Status</option>
                        <option value="Active">🟢 Live Banners</option>
                        <option value="Inactive">⭕ Inactive</option>
                        <option value="Enabled">✅ Enabled</option>
                        <option value="Disabled">❌ Disabled</option>
                      </select>

                      <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
                      >
                        <option value="All">All Actions</option>
                        {actionOptions.map((action) => (
                          <option key={action.value} value={action.value}>
                            {action.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <span className="text-purple-100 text-sm">View:</span>
                        <div className="flex bg-purple-700 rounded-lg p-1">
                          <button
                            onClick={() => setViewMode("grid")}
                            className={`px-3 py-1 rounded-md text-sm transition ${
                              viewMode === "grid" ? "bg-white text-purple-600" : "text-purple-200 hover:text-white"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setViewMode("list")}
                            className={`px-3 py-1 rounded-md text-sm transition ${
                              viewMode === "list" ? "bg-white text-purple-600" : "text-purple-200 hover:text-white"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner List */}
                  <div className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-600">Loading banners...</span>
                      </div>
                    ) : filteredBanners.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎯</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No banners found</h3>
                        <p className="text-gray-600">
                          {searchTerm || filterStatus !== "All" || filterAction !== "All"
                            ? "Try adjusting your search or filters"
                            : "Create your first banner to get started"}
                        </p>
                      </div>
                    ) : (
                      <div className={`grid gap-6 ${
                        viewMode === "grid" 
                          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                          : "grid-cols-1"
                      }`}>
                        {filteredBanners.map(renderBannerCard)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Section */}
              {showForm && (
                <div className="xl:w-1/3 w-full">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-t-2xl border-b border-blue-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-blue-800 flex items-center">
                          <span className="bg-blue-500 text-white rounded-full p-2 mr-3">
                            🎨
                          </span>
                          {formData.id ? "Edit Banner" : "Create Banner"}
                        </h3>
                        {window.innerWidth <= 1024 && (
                          <button
                            onClick={() => setShowForm(false)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-red-700 text-sm">{error}</span>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <input type="hidden" name="id" value={formData.id} />

                        {/* Action Type */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <h4 className="text-md font-semibold text-purple-800 mb-3">🎯 Action Configuration</h4>
                          <label className="block text-sm font-medium text-purple-700 mb-2">Action Type</label>
                          <select
                            name="action"
                            value={formData.action}
                            onChange={handleInputChange}
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                            required
                          >
                            <option value="">Select Action</option>
                            {actionOptions.map((action) => (
                              <option key={action.value} value={action.value}>
                                {action.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Image Upload */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                          <h4 className="text-md font-semibold text-green-800 mb-3">🖼️ Banner Image</h4>
                          <div
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                              dragActive ? "border-green-500 bg-green-50" : "border-green-300 bg-white"
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                          >
                            <input
                              type="file"
                              name="file"
                              accept="image/*"
                              onChange={handleFileInputChange}
                              ref={fileInputRef}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              required={!formData.id && !previewImage}
                            />
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-green-700 font-medium mb-1">
                                {dragActive ? "Drop image here" : "Click to upload or drag and drop"}
                              </p>
                              <p className="text-sm text-green-600">PNG, JPG (Max 5MB)</p>
                            </div>
                          </div>
                          
                          {previewImage && (
                            <div className="mt-4 relative">
                              <img
                                src={previewImage}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg border border-green-200"
                              />
                              <button
                                type="button"
                                onClick={clearImage}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Schedule Configuration */}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                          <h4 className="text-md font-semibold text-indigo-800 mb-3">⏰ Schedule Configuration</h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-indigo-700 mb-2">Start Time</label>
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
                              <label className="block text-sm font-medium text-indigo-700 mb-2">End Time (Optional)</label>
                              <input
                                type="datetime-local"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                                className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Target Configuration */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                          <h4 className="text-md font-semibold text-orange-800 mb-3">🎯 Target Configuration</h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-orange-700 mb-2">Status</label>
                              <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                                required
                              >
                                <option value="1">✅ Enabled</option>
                                <option value="0">❌ Disabled</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-orange-700 mb-2">Select Game</label>
                              <select
                                name="game_id"
                                value={formData.game_id}
                                onChange={handleInputChange}
                                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                                required
                              >
                                <option value="">Choose Game...</option>
                                {games.map((game) => (
                                  <option key={game.id} value={game.id}>
                                    {game.game_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-orange-700 mb-2">Contest (Optional)</label>
                              <select
                                name="contest_id"
                                value={formData.contest_id}
                                onChange={handleInputChange}
                                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                              >
                                <option value="">Select Contest...</option>
                                {contests.map((contest) => (
                                  <option key={contest.id} value={contest.id}>
                                    Contest #{contest.id}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-orange-700 mb-2">Action URL</label>
                              <input
                                type="url"
                                name="action_url"
                                value={formData.action_url}
                                onChange={handleInputChange}
                                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                                placeholder="https://example.com"
                                required
                              />
                              <p className="text-xs text-orange-600 mt-1">URL that will be triggered when banner is clicked</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={clearForm}
                            disabled={saving}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center justify-center font-medium disabled:opacity-50"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center font-semibold shadow-lg disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {formData.id ? "Update Banner" : "Create Banner"}
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Banner;