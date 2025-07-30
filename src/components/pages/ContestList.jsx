import React, { useState, useEffect, useContext, useMemo } from 'react';
import axiosInstance from '../../axiosInstance';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { StoreContext } from '../context/storeContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ContestList = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl, user } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contests, setContests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('All');
  const [filterGame, setFilterGame] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(window.innerWidth > 1024);
  const [viewMode, setViewMode] = useState('card');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [formData, setFormData] = useState({
    id: '',
    comp_id: '',
    dist_amt: '',
    entry_fee: '',
    game_round: '',
    game_time: '',
    game_use_coin: '',
    is_pass: '',
    my_pass_data: '',
    no_spot: '',
    game_id: '',
  });

  useEffect(() => {
    loadGames();
    loadContestList();
    loadCompanyList();
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

  const loadContestList = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`${baseUrl}getContestList`);
      setContests(response.data.data || []);
    } catch (error) {
      console.error('Error loading contests:', error);
      toast.error('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyList = async () => {
    try {
      const response = await axiosInstance.get(`${baseUrl}getCompanyList`);
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const loadGames = async () => {
    try {
      const response = await axiosInstance.get(`${baseUrl}getGames`);
      setGames(response.data.data || []);
    } catch (error) {
      console.error('Error loading games:', error);
      toast.error('Failed to load games');
    }
  };

  // Get company and game names for display
  const getCompanyName = (compId) => {
    const company = companies.find(c => c.id == compId);
    return company ? company.name : `Company ${compId}`;
  };

  const getGameName = (gameId) => {
    const game = games.find(g => g.id == gameId);
    return game ? game.game_name : `Game ${gameId}`;
  };

  // Filter and sort contests
  const filteredAndSortedContests = useMemo(() => {
    let filtered = contests.filter(contest => {
      const matchesSearch = 
        contest.id?.toString().includes(searchTerm) ||
        getCompanyName(contest.comp_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getGameName(contest.game_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        contest.dist_amt?.toString().includes(searchTerm) ||
        contest.entry_fee?.toString().includes(searchTerm);

      const matchesCompany = filterCompany === 'All' || contest.comp_id == filterCompany;
      const matchesGame = filterGame === 'All' || contest.game_id == filterGame;

      return matchesSearch && matchesCompany && matchesGame;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'dist_amt' || sortBy === 'entry_fee' || sortBy === 'no_spot') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [contests, searchTerm, filterCompany, filterGame, sortBy, sortOrder, companies, games]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalContests: filteredAndSortedContests.length,
      totalDistAmount: 0,
      totalEntryFees: 0,
      totalSpots: 0,
      avgEntryFee: 0,
    };

    filteredAndSortedContests.forEach(contest => {
      stats.totalDistAmount += parseFloat(contest.dist_amt) || 0;
      stats.totalEntryFees += parseFloat(contest.entry_fee) || 0;
      stats.totalSpots += parseInt(contest.no_spot) || 0;
    });

    stats.avgEntryFee = stats.totalContests > 0 ? stats.totalEntryFees / stats.totalContests : 0;

    return stats;
  }, [filteredAndSortedContests]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !['admin'].includes(user.role)) {
      toast.error('You do not have permission to add or update contests.');
      return;
    }
    
    if (parseInt(formData.no_spot) < 2) {
      toast.error('Number of spots should be at least 2');
      return;
    }

    setSaving(true);
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = method === 'POST' ? `${baseUrl}addContestList` : `${baseUrl}updateContestList`;
      
      const response = await axiosInstance({
        method,
        url,
        data: formData,
      });
      
      if (response.data.status !== 200) {
        toast.error(`Error: ${response.data.message || 'Something went wrong while saving the contest!'}`);
        return;
      }
      
      toast.success(`Contest ${method === 'POST' ? 'added' : 'updated'} successfully!`);
      clearForm();
      loadContestList();
    } catch (error) {
      console.error('Error saving contest:', error.response?.data || error);
      toast.error(`Error: ${error.response?.data?.message || 'Something went wrong while saving the contest!'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      setSaving(true);
      const response = await axiosInstance.post(`${baseUrl}getOneContestList`, { id });
      const contest = response.data.data[0];
      
      setFormData({
        id: contest.id,
        comp_id: contest.comp_id,
        dist_amt: contest.dist_amt,
        entry_fee: contest.entry_fee,
        game_round: contest.game_round,
        game_time: contest.game_time,
        game_use_coin: contest.game_use_coin,
        is_pass: contest.is_pass,
        my_pass_data: contest.my_pass_data,
        no_spot: contest.no_spot,
        game_id: contest.game_id,
      });

      if (window.innerWidth <= 1024) {
        setShowForm(true);
        window.scrollTo(0, 0);
      }
      
      toast.info('Contest loaded for editing');
    } catch (error) {
      console.error('Error editing contest:', error);
      toast.error('Failed to load contest details');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (id) => {
    try {
      setSaving(true);
      const response = await axiosInstance.post(`${baseUrl}copyContestList`, { id });
      toast.success('Contest copied successfully!');
      loadContestList();
    } catch (error) {
      console.error('Error copying contest:', error);
      toast.error('Failed to copy contest');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contest?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await axiosInstance.delete(`${baseUrl}api/deleteContestList`, { data: { id } });
      
      if (response.data.status !== 200) {
        toast.error('Something went wrong while deleting the contest!');
        return;
      }
      
      toast.success('Contest removed successfully!');
      loadContestList();
    } catch (error) {
      console.error('Error deleting contest:', error);
      toast.error('Failed to delete contest');
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setFormData({
      id: '',
      comp_id: '',
      dist_amt: '',
      entry_fee: '',
      game_round: '',
      game_time: '',
      game_use_coin: '',
      is_pass: '',
      my_pass_data: '',
      no_spot: '',
      game_id: '',
    });

    if (window.innerWidth <= 1024) {
      setShowForm(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCompany('All');
    setFilterGame('All');
  };

  const renderContestCard = (contest) => (
    <div
      key={contest.id}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
    >
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Contest #{contest.id}</h3>
          <div className="flex items-center space-x-2">
            <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
              🎮 {getGameName(contest.game_id)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-2 mr-3">
                <span className="text-white text-lg">💰</span>
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Prize Pool</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(contest.dist_amt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-full p-2 mr-3">
                <span className="text-white text-lg">🎫</span>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Entry Fee</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(contest.entry_fee)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="bg-purple-500 rounded-full p-2 mr-3">
                <span className="text-white text-lg">👥</span>
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Spots</p>
                <p className="text-xl font-bold text-purple-800">{contest.no_spot}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <div className="bg-orange-500 rounded-full p-2 mr-3">
                <span className="text-white text-lg">⏱️</span>
              </div>
              <div>
                <p className="text-sm text-orange-700 font-medium">Game Time</p>
                <p className="text-lg font-bold text-orange-800">{contest.game_time}min</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
            <span className="text-gray-600">Company:</span>
            <span className="ml-1 font-medium">{getCompanyName(contest.comp_id)}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span className="text-gray-600">Round:</span>
            <span className="ml-1 font-medium">{contest.game_round}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            <span className="text-gray-600">Use Coin:</span>
            <span className="ml-1 font-medium">{contest.game_use_coin}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
            <span className="text-gray-600">Pass:</span>
            <span className="ml-1 font-medium">{contest.is_pass}</span>
          </div>
        </div>

        {contest.my_pass_data && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-xs font-medium text-gray-600">Pass Data:</span>
            <p className="text-sm text-gray-800 mt-1">{contest.my_pass_data}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleCopy(contest.id)}
            disabled={saving}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center font-medium disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          <button
            onClick={() => handleEdit(contest.id)}
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center font-medium disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => handleDelete(contest.id)}
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Contest Management</h1>
              <p className="text-gray-600">Create and manage gaming contests with prize pools and entry fees</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
              {/* Contest List Section */}
              <div className={`${showForm ? 'xl:w-2/3' : 'w-full'} transition-all duration-300`}>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  {/* Search and Filter Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <span className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                          🏆
                        </span>
                        Active Contests ({filteredAndSortedContests.length})
                      </h2>
                      
                      {/* Mobile Add Button */}
                      {!showForm && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="lg:hidden bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                        >
                          + Add New Contest
                        </button>
                      )}
                    </div>

                    {/* Search and Filters */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search contests..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
                      >
                        <option value="All">All Companies</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filterGame}
                        onChange={(e) => setFilterGame(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
                      >
                        <option value="All">All Games</option>
                        {games.map((game) => (
                          <option key={game.id} value={game.id}>
                            {game.game_name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-');
                          setSortBy(field);
                          setSortOrder(order);
                        }}
                        className="w-full px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
                      >
                        <option value="id-desc">Newest First</option>
                        <option value="id-asc">Oldest First</option>
                        <option value="dist_amt-desc">Prize Pool: High to Low</option>
                        <option value="dist_amt-asc">Prize Pool: Low to High</option>
                        <option value="entry_fee-desc">Entry Fee: High to Low</option>
                        <option value="entry_fee-asc">Entry Fee: Low to High</option>
                        <option value="no_spot-desc">Most Spots</option>
                        <option value="no_spot-asc">Least Spots</option>
                      </select>
                    </div>

                    {/* Clear Filters */}
                    {(searchTerm || filterCompany !== 'All' || filterGame !== 'All') && (
                      <div className="mt-4">
                        <button
                          onClick={clearFilters}
                          className="bg-white bg-opacity-20 text-white px-3 py-1 rounded text-sm hover:bg-opacity-30 transition"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Statistics Cards */}
                  {filteredAndSortedContests.length > 0 && (
                    <div className="p-6 border-b border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center">
                            <div className="bg-blue-500 rounded-full p-2 mr-3">
                              <span className="text-white text-lg">🏆</span>
                            </div>
                            <div>
                              <p className="text-sm text-blue-700">Total Contests</p>
                              <p className="text-xl font-bold text-blue-800">{statistics.totalContests}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center">
                            <div className="bg-green-500 rounded-full p-2 mr-3">
                              <span className="text-white text-lg">💰</span>
                            </div>
                            <div>
                              <p className="text-sm text-green-700">Total Prize Pool</p>
                              <p className="text-xl font-bold text-green-800">{formatCurrency(statistics.totalDistAmount)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center">
                            <div className="bg-purple-500 rounded-full p-2 mr-3">
                              <span className="text-white text-lg">👥</span>
                            </div>
                            <div>
                              <p className="text-sm text-purple-700">Total Spots</p>
                              <p className="text-xl font-bold text-purple-800">{statistics.totalSpots.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center">
                            <div className="bg-orange-500 rounded-full p-2 mr-3">
                              <span className="text-white text-lg">📊</span>
                            </div>
                            <div>
                              <p className="text-sm text-orange-700">Avg Entry Fee</p>
                              <p className="text-xl font-bold text-orange-800">{formatCurrency(statistics.avgEntryFee)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contest List */}
                  <div className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-600">Loading contests...</span>
                      </div>
                    ) : filteredAndSortedContests.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No contests found</h3>
                        <p className="text-gray-600">
                          {contests.length === 0
                            ? "Create your first contest to get started"
                            : "Try adjusting your search or filters"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        {filteredAndSortedContests.map(renderContestCard)}
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
                            🏆
                          </span>
                          {formData.id ? "Edit Contest" : "Create Contest"}
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

                    <div className="p-6 max-h-screen overflow-y-auto">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <input type="hidden" name="id" value={formData.id} />

                        {/* Basic Configuration */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <h4 className="text-md font-semibold text-purple-800 mb-3">🎯 Basic Configuration</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">Company</label>
                              <select
                                name="comp_id"
                                value={formData.comp_id}
                                onChange={handleInputChange}
                                className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                                required
                              >
                                <option value="">Select a Company</option>
                                {companies.map((company) => (
                                  <option key={company.id} value={company.id}>
                                    {company.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">Game</label>
                              <select
                                name="game_id"
                                value={formData.game_id}
                                onChange={handleInputChange}
                                className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition bg-white"
                                required
                              >
                                <option value="">Select a Game</option>
                                {games.map((game) => (
                                  <option key={game.id} value={game.id}>
                                    {game.game_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Financial Configuration */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                          <h4 className="text-md font-semibold text-green-800 mb-3">💰 Financial Configuration</h4>
                          
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-green-700 mb-2">Prize Pool Amount</label>
                              <input
                                name="dist_amt"
                                value={formData.dist_amt}
                                onChange={handleInputChange}
                                placeholder="Enter prize pool amount"
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-green-700 mb-2">Entry Fee</label>
                              <input
                                name="entry_fee"
                                value={formData.entry_fee}
                                onChange={handleInputChange}
                                placeholder="Enter entry fee"
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full p-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring focus:ring-green-200 transition bg-white"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Game Configuration */}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                          <h4 className="text-md font-semibold text-indigo-800 mb-3">🎮 Game Configuration</h4>
                          
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-indigo-700 mb-2">Number of Spots</label>
                              <input
                                name="no_spot"
                                value={formData.no_spot}
                                onChange={handleInputChange}
                                placeholder="Enter number of spots"
                                type="number"
                                min="2"
                                className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                                required
                              />
                              <p className="text-xs text-indigo-600 mt-1">Minimum 2 spots required</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-indigo-700 mb-2">Game Round</label>
                              <input
                                name="game_round"
                                value={formData.game_round}
                                onChange={handleInputChange}
                                placeholder="Enter game round"
                                type="text"
                                className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-indigo-700 mb-2">Game Time (minutes)</label>
                              <input
                                name="game_time"
                                value={formData.game_time}
                                onChange={handleInputChange}
                                placeholder="Enter game time in minutes"
                                type="number"
                                min="1"
                                className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-indigo-700 mb-2">Game Use Coin</label>
                              <input
                                name="game_use_coin"
                                value={formData.game_use_coin}
                                onChange={handleInputChange}
                                placeholder="Enter game use coin"
                                type="text"
                                className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition bg-white"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Pass Configuration */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                          <h4 className="text-md font-semibold text-orange-800 mb-3">🎫 Pass Configuration</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-orange-700 mb-2">Is Pass Required</label>
                              <select
                                name="is_pass"
                                value={formData.is_pass}
                                onChange={handleInputChange}
                                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                                required
                              >
                                <option value="">Select pass requirement</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-orange-700 mb-2">Pass Data</label>
                              <textarea
                                name="my_pass_data"
                                value={formData.my_pass_data}
                                onChange={handleInputChange}
                                placeholder="Enter pass data or requirements"
                                rows="3"
                                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 transition bg-white"
                                required
                              />
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
                                {formData.id ? "Update Contest" : "Create Contest"}
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

export default ContestList;