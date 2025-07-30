import React, { useState, useEffect, useContext, useRef } from "react";
import axiosInstance from "../../axiosInstance";
import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import { StoreContext } from "../context/storeContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Games = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl, GLOBLEURLFORS3 } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [formData, setFormData] = useState({
    id: "",
    game_name: "",
    game_mode: "",
    game_code: "",
    game_desc: "",
    game_cat_name: "",
    game_label: "",
    type: "",
    type_new: "",
    order_id: "",
    maintanance_msg: "",
    no_of_player: "",
    games_tnc: "",
    is_maintanance: "",
    is_auto_game_start: "",
    game_status: "",
    is_contest_waiting: "",
    socket_url: "",
    file_url: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadGames();
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setShowForm(true);
      } else {
        setShowForm(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
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

  // Filter games based on search and filters
  const filteredGames = games.filter((game) => {
    const matchesSearch = 
      game.game_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.game_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.game_cat_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "All" || game.game_status === filterStatus;
    const matchesCategory = filterCategory === "All" || game.game_cat_name === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(games.map(game => game.game_cat_name).filter(Boolean))];

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${baseUrl}getGamesAdmin`);
      if (response.status === 200) {
        setGames(response.data.data);
      }
    } catch (error) {
      console.error("❌ Error fetching games:", error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "file_url" && value) {
        data.append("file_url", value);
      } else if (value) {
        data.append(key, value);
      }
    });

    try {
      const method = formData.id ? "PUT" : "POST";
      const url = formData.id ? `${baseUrl}updateGame` : `${baseUrl}addGame`;
      const response = await axiosInstance({
        method,
        url,
        data,
      });

      if (response.data.status === 200) {
        toast.success(`Game ${formData.id ? "updated" : "added"} successfully!`);
        clearForm();
        loadGames();
        if (window.innerWidth <= 1024) {
          setShowForm(false);
        }
      } else {
        toast.error(`Game not ${formData.id ? "updated" : "added"}: ${response.data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const editGame = async (gameId) => {
    if (window.innerWidth <= 1024) {
      setShowForm(true);
      window.scrollTo(0, 0);
    }
    
    setLoading(true);
    try {
      const response = await axiosInstance.post(`${baseUrl}getOneGame`, { gameId });
      if (response.data.data) {
        const game = response.data.data;
        setFormData({
          id: game.id || "",
          game_name: game.game_name || "",
          game_mode: game.game_mode || "",
          game_code: game.game_code || "",
          game_desc: game.game_desc || "",
          game_cat_name: game.game_cat_name || "",
          game_label: game.game_label || "",
          type: game.type || "",
          type_new: game.type_new || "",
          order_id: game.order_id || "",
          maintanance_msg: game.maintanance_msg || "",
          no_of_player: game.no_of_player || "",
          games_tnc: game.games_tnc || "",
          is_maintanance: game.is_maintanance || "",
          is_auto_game_start: game.is_auto_game_start || "",
          game_status: game.game_status || "",
          is_contest_waiting: game.is_contest_waiting || "",
          socket_url: game.socket_url || "",
          file_url: null,
        });
        setImagePreview(game.img_square ? `${GLOBLEURLFORS3}game-images/${game.img_square}` : null);
      }
    } catch (error) {
      console.error("Error fetching game data:", error);
      toast.error("Failed to load game data");
    } finally {
      setLoading(false);
    }
  };

  const deleteGame = async (gameId) => {
    if (!window.confirm("Are you sure you want to delete this game?")) return;
    
    setLoading(true);
    try {
      await axiosInstance.delete(`${baseUrl}deleteGame`, { data: { gameId } });
      toast.success("Game deleted successfully!");
      loadGames();
    } catch (error) {
      console.error("❌ Error deleting game:", error);
      toast.error("Failed to delete game");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      id: "",
      game_name: "",
      game_mode: "",
      game_code: "",
      game_desc: "",
      game_cat_name: "",
      game_label: "",
      type: "",
      type_new: "",
      order_id: "",
      maintanance_msg: "",
      no_of_player: "",
      games_tnc: "",
      is_maintanance: "",
      is_auto_game_start: "",
      game_status: "",
      is_contest_waiting: "",
      socket_url: "",
      file_url: null,
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (window.innerWidth <= 1024) {
      setShowForm(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMaintenanceStatus = (isMaintenance) => {
    return isMaintenance === 'yes' || isMaintenance === '1' || isMaintenance === true;
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Games Management</h1>
              <p className="text-gray-600">Create, manage, and monitor your game catalog</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Games List Section */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  {/* Filter Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                      <h2 className="text-xl font-bold text-white">Game Library ({filteredGames.length})</h2>
                      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search games..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                          />
                          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="All">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="All">All Categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-purple-100 text-sm">View:</span>
                      <div className="flex bg-purple-700 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`px-3 py-1 rounded-md text-sm transition ${
                            viewMode === "grid" ? "bg-white text-purple-600" : "text-purple-200 hover:text-white"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`px-3 py-1 rounded-md text-sm transition ${
                            viewMode === "list" ? "bg-white text-purple-600" : "text-purple-200 hover:text-white"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Games Content */}
                  <div className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <span className="ml-3 text-gray-600">Loading games...</span>
                      </div>
                    ) : filteredGames.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl text-gray-300 mb-4">🎮</div>
                        <p className="text-gray-500 text-lg">No games found</p>
                        <p className="text-gray-400">Create your first game to get started</p>
                      </div>
                    ) : (
                      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
                        {filteredGames.map((game) => (
                          <div
                            key={game.id}
                            className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group ${
                              viewMode === "list" ? "flex" : ""
                            }`}
                          >
                            {/* Game Image */}
                            <div className={`relative ${viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "h-48"} bg-gradient-to-r from-purple-100 to-pink-100 overflow-hidden`}>
                              <img
                                src={`${GLOBLEURLFORS3}game-images/${game.img_square}`}
                                alt={game.game_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.src = '/api/placeholder/200/200';
                                }}
                              />
                              
                              {/* Status Badges */}
                              <div className="absolute top-2 left-2 flex gap-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(game.game_status)}`}>
                                  {game.game_status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                                </span>
                              </div>
                              
                              {getMaintenanceStatus(game.is_maintanance) && (
                                <div className="absolute top-2 right-2">
                                  <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-1 rounded-full text-xs font-semibold">
                                    🔧 Maintenance
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Game Info */}
                            <div className="p-4 flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                  {game.game_name}
                                </h3>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                                  {game.game_code}
                                </span>
                              </div>
                              
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{game.game_desc}</p>
                              
                              {/* Game Stats */}
                              <div className={`grid ${viewMode === "list" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"} gap-3 mb-4`}>
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <div>
                                      <p className="text-xs text-blue-600 font-medium">Category</p>
                                      <p className="font-bold text-blue-800 text-sm">{game.game_cat_name || "N/A"}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                    <div>
                                      <p className="text-xs text-green-600 font-medium">Players</p>
                                      <p className="font-bold text-green-800 text-sm">{game.no_of_player || "N/A"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Info (shown in list view or on hover) */}
                              <div className={`${viewMode === "list" ? "block" : "hidden group-hover:block"} space-y-1 text-xs text-gray-600 mb-3`}>
                                <p><strong>Mode:</strong> {game.game_mode || "N/A"}</p>
                                <p><strong>Order ID:</strong> {game.order_id || "N/A"}</p>
                                <p><strong>Auto Start:</strong> {game.is_auto_game_start || "N/A"}</p>
                                <p><strong>Updated:</strong> {new Date(game.update_at).toLocaleDateString()}</p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => editGame(game.id)}
                                  disabled={loading}
                                  className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center text-sm font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteGame(game.id)}
                                  disabled={loading}
                                  className="flex-1 bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition flex items-center justify-center text-sm font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mobile Add Game Button */}
                <div className="xl:hidden mt-6">
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {showForm ? "Hide Form" : "Add New Game"}
                  </button>
                </div>
              </div>

              {/* Form Section */}
              <div className={`xl:col-span-1 ${showForm ? "block" : "hidden xl:block"}`}>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-6">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {formData.id ? "Edit Game" : "Add New Game"}
                    </h2>
                    <p className="text-indigo-100 text-sm">Configure game settings and properties</p>
                  </div>

                  <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Game Name</label>
                            <input
                              type="text"
                              name="game_name"
                              id="game_name"
                              value={formData.game_name}
                              onChange={handleInputChange}
                              placeholder="Enter game name"
                              required
                              className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Game Code</label>
                            <input
                              type="text"
                              name="game_code"
                              value={formData.game_code}
                              onChange={handleInputChange}
                              placeholder="Enter game code"
                              className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Game Description</label>
                            <textarea
                              name="game_desc"
                              value={formData.game_desc}
                              onChange={handleInputChange}
                              placeholder="Enter game description"
                              rows="3"
                              required
                              className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Game Configuration */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                        <h6 className="text-sm font-bold text-green-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Game Configuration
                          <span className="text-red-500 ml-1">*</span>
                        </h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Game Mode</label>
                            <input
                              type="text"
                              name="game_mode"
                              value={formData.game_mode}
                              onChange={handleInputChange}
                              placeholder="Enter game mode"
                              required
                              className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Category Name</label>
                            <input
                              type="text"
                              name="game_cat_name"
                              value={formData.game_cat_name}
                              onChange={handleInputChange}
                              placeholder="Enter category name"
                              required
                              className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Game Label</label>
                            <input
                              type="text"
                              name="game_label"
                              value={formData.game_label}
                              onChange={handleInputChange}
                              placeholder="Enter game label"
                              required
                              className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Number of Players</label>
                            <input
                              type="number"
                              name="no_of_player"
                              value={formData.no_of_player}
                              onChange={handleInputChange}
                              placeholder="Enter number of players"
                              required
                              className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Advanced Settings */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                        <h6 className="text-sm font-bold text-purple-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                          Advanced Settings
                        </h6>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-1">Type</label>
                              <input
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                placeholder="Enter type"
                                required
                                className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-1">Type New</label>
                              <input
                                type="text"
                                name="type_new"
                                value={formData.type_new}
                                onChange={handleInputChange}
                                placeholder="Enter new type"
                                required
                                className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-1">Order ID</label>
                              <input
                                type="number"
                                name="order_id"
                                value={formData.order_id}
                                onChange={handleInputChange}
                                placeholder="Enter order ID"
                                className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-1">Game Status</label>
                              <select
                                name="game_status"
                                value={formData.game_status}
                                onChange={handleInputChange}
                                required
                                className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                              >
                                <option value="">Select status</option>
                                <option value="active">🟢 Active</option>
                                <option value="inactive">🔴 Inactive</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-1">Socket URL</label>
                            <input
                              type="url"
                              name="socket_url"
                              value={formData.socket_url}
                              onChange={handleInputChange}
                              placeholder="Enter socket URL"
                              className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-1">Maintenance Message</label>
                            <textarea
                              name="maintanance_msg"
                              value={formData.maintanance_msg}
                              onChange={handleInputChange}
                              placeholder="Enter maintenance message"
                              rows="2"
                              className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-1">Terms & Conditions</label>
                            <textarea
                              name="games_tnc"
                              value={formData.games_tnc}
                              onChange={handleInputChange}
                              placeholder="Enter terms and conditions"
                              rows="3"
                              className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Game Flags */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                        <h6 className="text-sm font-bold text-orange-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                          Game Flags
                        </h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-orange-700 mb-1">Maintenance Mode</label>
                            <select
                              name="is_maintanance"
                              value={formData.is_maintanance}
                              onChange={handleInputChange}
                              className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                            >
                              <option value="">Select maintenance</option>
                              <option value="yes">🔧 Yes</option>
                              <option value="no">✅ No</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-orange-700 mb-1">Auto Game Start</label>
                            <select
                              name="is_auto_game_start"
                              value={formData.is_auto_game_start}
                              onChange={handleInputChange}
                              className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                            >
                              <option value="">Select auto start</option>
                              <option value="yes">⚡ Yes</option>
                              <option value="no">⏸️ No</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-orange-700 mb-1">Contest Waiting</label>
                            <select
                              name="is_contest_waiting"
                              value={formData.is_contest_waiting}
                              onChange={handleInputChange}
                              className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                            >
                              <option value="">Select contest waiting</option>
                              <option value="yes">⏳ Yes</option>
                              <option value="no">🚀 No</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-200">
                        <h6 className="text-sm font-bold text-teal-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Game Image
                        </h6>
                        <div className="space-y-4">
                          <div className="relative border-2 border-dashed border-teal-300 rounded-xl p-6 text-center bg-teal-25 hover:border-teal-400 transition-colors">
                            <input
                              type="file"
                              name="file_url"
                              accept="image/*"
                              onChange={handleInputChange}
                              ref={fileInputRef}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="text-teal-600">
                              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="font-medium mb-1">Upload Game Image</p>
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
                                  setFormData({...formData, file_url: null});
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
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                              {formData.id ? "Update Game" : "Create Game"}
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

export default Games;