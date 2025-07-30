import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../../axiosInstance";
import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import { StoreContext } from "../context/storeContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AppSettings = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("android");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    android_app_ver: "",
    android_app_url: "",
    android_app_update_type: "normal_update",
    android_app_update_msg: "",
    android_play_store_app_ver: "",
    android_play_store_app_update_type: "normal_update",
    is_play_store_download: "Yes",
    android_play_store_app_update_msg: "",
    ios_app_ver: "",
    ios_app_update_type: "normal_update",
    beta_user_ids: "",
    beta_android_app_ver: "",
    beta_android_update_type: "",
    beta_play_store_app_ver: "",
    beta_play_store_update_type: "",
    beta_ios_app_ver: "",
    beta_ios_update_type: "",
    is_auto_verify_pan: "Yes",
    is_auto_verify_bank: "Yes",
    is_pan_verify_last_day: "",
    is_bank_verify_last_day: "",
    app_url: "",
  });

  const tabs = [
    { id: "android", label: "Android", icon: "🤖", color: "from-green-500 to-emerald-600" },
    { id: "ios", label: "iOS", icon: "🍎", color: "from-gray-500 to-gray-600" },
    { id: "beta", label: "Beta Testing", icon: "🧪", color: "from-purple-500 to-indigo-600" },
    { id: "verification", label: "Verification", icon: "✅", color: "from-blue-500 to-cyan-600" },
    { id: "misc", label: "Miscellaneous", icon: "⚙️", color: "from-orange-500 to-red-600" },
  ];

  useEffect(() => {
    checkRoleAccess(["admin", "agent", "accountant"]);
    fetchAppData();
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

  const checkRoleAccess = (roles) => {
    console.log("Checking role access for:", roles);
  };

  const fetchAppData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`${baseUrl}getAppUpdateInfo`);
      if (response.data.status === 200 && response.data.data) {
        setFormData((prev) => ({ ...prev, ...response.data.data }));
      }
    } catch (err) {
      console.error("Error fetching app data:", err);
      setError("Failed to load app data");
      toast.error("Failed to load app settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await axiosInstance.post(`${baseUrl}updateAppInfo`, formData);
      toast.success(response.data.msg || "Settings saved successfully!");
    } catch (err) {
      console.error("Update error:", err);
      const errorMsg = err.response?.data?.msg || "Error saving settings";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getUpdateTypeColor = (type) => {
    switch (type) {
      case 'force_update': return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getUpdateTypeIcon = (type) => {
    switch (type) {
      case 'force_update': return '🚨';
      case 'maintenance': return '🔧';
      default: return '✅';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "android":
        return (
          <div className="space-y-8">
            {/* Android App Section */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-6 flex items-center">
                <span className="bg-green-500 text-white rounded-full p-2 mr-3">
                  🤖
                </span>
                Android App Configuration
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">App Version</label>
                  <input
                    type="text"
                    name="android_app_ver"
                    value={formData.android_app_ver}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.0.0"
                    className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">App Download URL</label>
                  <input
                    type="url"
                    name="android_app_url"
                    value={formData.android_app_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/app.apk"
                    className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Update Type</label>
                  <select
                    name="android_app_update_type"
                    value={formData.android_app_update_type}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                  >
                    <option value="normal_update">✅ Normal Update</option>
                    <option value="force_update">🚨 Force Update</option>
                    <option value="maintenance">🔧 Maintenance Mode</option>
                  </select>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUpdateTypeColor(formData.android_app_update_type)}`}>
                      {getUpdateTypeIcon(formData.android_app_update_type)} {formData.android_app_update_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-green-700 mb-2">Update Message</label>
                  <textarea
                    name="android_app_update_msg"
                    value={formData.android_app_update_msg}
                    onChange={handleInputChange}
                    placeholder="Message to show users during update"
                    rows="4"
                    className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Play Store Section */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-6 flex items-center">
                <span className="bg-blue-500 text-white rounded-full p-2 mr-3">
                  🛍️
                </span>
                Google Play Store Configuration
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Play Store Version</label>
                  <input
                    type="text"
                    name="android_play_store_app_ver"
                    value={formData.android_play_store_app_ver}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.0.0"
                    className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Play Store Update Type</label>
                  <select
                    name="android_play_store_app_update_type"
                    value={formData.android_play_store_app_update_type}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                  >
                    <option value="normal_update">✅ Normal Update</option>
                    <option value="force_update">🚨 Force Update</option>
                    <option value="maintenance">🔧 Maintenance Mode</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Allow Play Store Download</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_play_store_download"
                        value="Yes"
                        checked={formData.is_play_store_download === "Yes"}
                        onChange={handleInputChange}
                        className="mr-2 text-blue-500"
                      />
                      <span className="text-sm font-medium">✅ Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_play_store_download"
                        value="No"
                        checked={formData.is_play_store_download === "No"}
                        onChange={handleInputChange}
                        className="mr-2 text-blue-500"
                      />
                      <span className="text-sm font-medium">❌ No</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Play Store Message</label>
                  <textarea
                    name="android_play_store_app_update_msg"
                    value={formData.android_play_store_app_update_msg}
                    onChange={handleInputChange}
                    placeholder="Message for Play Store users"
                    rows="4"
                    className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "ios":
        return (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-gray-500 text-white rounded-full p-2 mr-3">
                🍎
              </span>
              iOS App Configuration
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">iOS Version</label>
                <input
                  type="text"
                  name="ios_app_ver"
                  value={formData.ios_app_ver}
                  onChange={handleInputChange}
                  placeholder="e.g., 1.0.0"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-gray-500 focus:ring focus:ring-gray-200 transition bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">iOS Update Type</label>
                <select
                  name="ios_app_update_type"
                  value={formData.ios_app_update_type}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-gray-500 focus:ring focus:ring-gray-200 transition bg-white"
                >
                  <option value="normal_update">✅ Normal Update</option>
                  <option value="force_update">🚨 Force Update</option>
                  <option value="maintenance">🔧 Maintenance Mode</option>
                </select>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUpdateTypeColor(formData.ios_app_update_type)}`}>
                    {getUpdateTypeIcon(formData.ios_app_update_type)} {formData.ios_app_update_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "beta":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <h3 className="text-lg font-bold text-purple-800 mb-6 flex items-center">
                <span className="bg-purple-500 text-white rounded-full p-2 mr-3">
                  🧪
                </span>
                Beta Testing Configuration
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-purple-700 mb-2">Beta User IDs</label>
                  <textarea
                    name="beta_user_ids"
                    value={formData.beta_user_ids}
                    onChange={handleInputChange}
                    placeholder="Comma-separated user IDs (e.g., 123,456,789)"
                    rows="3"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                  />
                  <p className="text-xs text-purple-600 mt-1">Enter user IDs separated by commas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Beta Android Version</label>
                  <input
                    type="text"
                    name="beta_android_app_ver"
                    value={formData.beta_android_app_ver}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.1.0-beta"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Beta Android Update Type</label>
                  <input
                    type="text"
                    name="beta_android_update_type"
                    value={formData.beta_android_update_type}
                    onChange={handleInputChange}
                    placeholder="e.g., beta_update"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Beta Play Store Version</label>
                  <input
                    type="text"
                    name="beta_play_store_app_ver"
                    value={formData.beta_play_store_app_ver}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.1.0-beta"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Beta Play Store Update Type</label>
                  <input
                    type="text"
                    name="beta_play_store_update_type"
                    value={formData.beta_play_store_update_type}
                    onChange={handleInputChange}
                    placeholder="e.g., beta_update"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Beta iOS Version</label>
                  <input
                    type="text"
                    name="beta_ios_app_ver"
                    value={formData.beta_ios_app_ver}
                    onChange={handleInputChange}
                    placeholder="e.g., 1.1.0-beta"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Beta iOS Update Type</label>
                  <input
                    type="text"
                    name="beta_ios_update_type"
                    value={formData.beta_ios_update_type}
                    onChange={handleInputChange}
                    placeholder="e.g., beta_update"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-6 flex items-center">
              <span className="bg-blue-500 text-white rounded-full p-2 mr-3">
                ✅
              </span>
              Verification Settings
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Auto Verify PAN</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_auto_verify_pan"
                      value="Yes"
                      checked={formData.is_auto_verify_pan === "Yes"}
                      onChange={handleInputChange}
                      className="mr-2 text-blue-500"
                    />
                    <span className="text-sm font-medium">✅ Enabled</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_auto_verify_pan"
                      value="No"
                      checked={formData.is_auto_verify_pan === "No"}
                      onChange={handleInputChange}
                      className="mr-2 text-blue-500"
                    />
                    <span className="text-sm font-medium">❌ Disabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Auto Verify Bank</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_auto_verify_bank"
                      value="Yes"
                      checked={formData.is_auto_verify_bank === "Yes"}
                      onChange={handleInputChange}
                      className="mr-2 text-blue-500"
                    />
                    <span className="text-sm font-medium">✅ Enabled</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_auto_verify_bank"
                      value="No"
                      checked={formData.is_auto_verify_bank === "No"}
                      onChange={handleInputChange}
                      className="mr-2 text-blue-500"
                    />
                    <span className="text-sm font-medium">❌ Disabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">PAN Verification Grace Period (Days)</label>
                <input
                  type="number"
                  name="is_pan_verify_last_day"
                  value={formData.is_pan_verify_last_day}
                  onChange={handleInputChange}
                  placeholder="e.g., 30"
                  min="0"
                  className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Bank Verification Grace Period (Days)</label>
                <input
                  type="number"
                  name="is_bank_verify_last_day"
                  value={formData.is_bank_verify_last_day}
                  onChange={handleInputChange}
                  placeholder="e.g., 30"
                  min="0"
                  className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                />
              </div>
            </div>
          </div>
        );

      case "misc":
        return (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <h3 className="text-lg font-bold text-orange-800 mb-6 flex items-center">
              <span className="bg-orange-500 text-white rounded-full p-2 mr-3">
                ⚙️
              </span>
              Miscellaneous Settings
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-orange-700 mb-2">App URL</label>
                <input
                  type="url"
                  name="app_url"
                  value={formData.app_url}
                  onChange={handleInputChange}
                  placeholder="https://yourapp.com"
                  className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                />
                <p className="text-xs text-orange-600 mt-1">Main application URL or website</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="container mx-auto max-w-6xl">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">App Settings</h1>
              <p className="text-gray-600">Configure application updates, versions, and system settings</p>
            </div>

            {/* Settings Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Tab Navigation */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? "bg-white text-indigo-600 shadow-lg transform scale-105"
                          : "text-white hover:bg-white hover:bg-opacity-20"
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading settings...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-red-700 font-medium">{error}</span>
                      </div>
                    )}

                    {/* Tab Content */}
                    {renderTabContent()}

                    {/* Action Buttons */}
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => fetchAppData()}
                          disabled={loading || saving}
                          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center font-medium"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset
                        </button>
                        <button
                          type="submit"
                          disabled={loading || saving}
                          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition flex items-center font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Quick Settings Summary */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-3 mr-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Android Version</p>
                    <p className="text-lg font-bold text-gray-900">{formData.android_app_ver || "Not Set"}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-gray-100 rounded-full p-3 mr-4">
                    <span className="text-2xl">🍎</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">iOS Version</p>
                    <p className="text-lg font-bold text-gray-900">{formData.ios_app_ver || "Not Set"}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">PAN Auto Verify</p>
                    <p className="text-lg font-bold text-gray-900">{formData.is_auto_verify_pan === "Yes" ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-full p-3 mr-4">
                    <span className="text-2xl">🧪</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Beta Users</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formData.beta_user_ids ? formData.beta_user_ids.split(',').length : 0}
                    </p>
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

export default AppSettings;