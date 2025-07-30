import React, { useState, useEffect, useContext, useMemo } from "react";
import axiosInstance from "../../axiosInstance";
import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import { StoreContext } from "../context/storeContext";
import DataTable from "react-data-table-component";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Trans = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTransType, setFilterTransType] = useState("All");
  const [filterActionType, setFilterActionType] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    checkRoleAccess(["admin", "agent", "accountant"]);
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

  // Get unique values for filters
  const uniqueTransTypes = useMemo(() => {
    const types = [...new Set(transactions.map(t => t.trans_name).filter(Boolean))];
    return types;
  }, [transactions]);

  const uniqueActionTypes = useMemo(() => {
    const types = [...new Set(transactions.map(t => t.action_type).filter(Boolean))];
    return types;
  }, [transactions]);

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.trans_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.trans_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.action_type?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTransType = filterTransType === "All" || transaction.trans_name === filterTransType;
      const matchesActionType = filterActionType === "All" || transaction.action_type === filterActionType;

      return matchesSearch && matchesTransType && matchesActionType;
    });
  }, [transactions, searchTerm, filterTransType, filterActionType]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalTransactions: filteredTransactions.length,
      totalAmount: 0,
      totalDeposit: 0,
      totalWinning: 0,
      totalRealCash: 0,
      creditTransactions: 0,
      debitTransactions: 0,
    };

    filteredTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.total_amount) || 0;
      const deposit = parseFloat(transaction.deposit_bal) || 0;
      const winning = parseFloat(transaction.win_bal) || 0;
      const realCash = parseFloat(transaction.trans_bal) || 0;

      stats.totalAmount += amount;
      stats.totalDeposit += deposit;
      stats.totalWinning += winning;
      stats.totalRealCash += realCash;

      if (transaction.action_type === 'credit') {
        stats.creditTransactions++;
      } else if (transaction.action_type === 'debit') {
        stats.debitTransactions++;
      }
    });

    return stats;
  }, [filteredTransactions]);

  const getTransactionTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'credit': return 'bg-green-100 text-green-800 border-green-200';
      case 'debit': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'credit': return '💰';
      case 'debit': return '💸';
      default: return '💳';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      name: "Select",
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedTransactions.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedTransactions([...selectedTransactions, row.id]);
            } else {
              setSelectedTransactions(selectedTransactions.filter(id => id !== row.id));
            }
          }}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      ),
      width: "60px",
      ignoreRowClick: true,
    },
    {
      name: "Transaction ID",
      selector: (row) => row.trans_id,
      sortable: true,
      width: "140px",
      cell: (row) => (
        <div className="font-mono text-sm font-semibold text-indigo-600">
          #{row.trans_id}
        </div>
      ),
    },
    {
      name: "User",
      selector: (row) => row.user_id,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            👤 {row.user_id}
          </span>
        </div>
      ),
    },
    {
      name: "Transaction Name",
      selector: (row) => row.trans_name,
      sortable: true,
      width: "160px",
      cell: (row) => (
        <div className="font-medium text-gray-900">
          {row.trans_name}
        </div>
      ),
    },
    {
      name: "Type",
      selector: (row) => row.action_type,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTransactionTypeColor(row.action_type)}`}>
          {getTransactionTypeIcon(row.action_type)} {row.action_type?.toUpperCase() || 'N/A'}
        </span>
      ),
    },
    {
      name: "Total Amount",
      selector: (row) => row.total_amount,
      sortable: true,
      width: "140px",
      cell: (row) => (
        <div className="text-right font-semibold text-gray-900">
          {formatCurrency(row.total_amount)}
        </div>
      ),
    },
    {
      name: "Deposit",
      selector: (row) => row.deposit_bal,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <div className="text-right font-medium text-blue-600">
          {formatCurrency(row.deposit_bal)}
        </div>
      ),
    },
    {
      name: "Winning",
      selector: (row) => row.win_bal,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <div className="text-right font-medium text-green-600">
          {formatCurrency(row.win_bal)}
        </div>
      ),
    },
    {
      name: "Real Cash",
      selector: (row) => row.trans_bal,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <div className="text-right font-medium text-purple-600">
          {formatCurrency(row.trans_bal)}
        </div>
      ),
    },
    {
      name: "Date & Time",
      selector: (row) => row.created_at,
      sortable: true,
      width: "160px",
      cell: (row) => (
        <div className="text-sm text-gray-600">
          {formatDate(row.created_at)}
        </div>
      ),
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#4F46E5",
        color: "#ffffff",
        fontWeight: "700",
        fontSize: "13px",
        padding: "16px 8px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      },
    },
    cells: {
      style: {
        padding: "12px 8px",
        fontSize: "14px",
        borderBottom: "1px solid #E5E7EB",
      },
    },
    rows: {
      style: {
        "&:hover": {
          backgroundColor: "#F9FAFB",
          cursor: "pointer",
        },
        "&:nth-child(even)": {
          backgroundColor: "#FAFAFA",
        },
      },
    },
    pagination: {
      style: {
        border: "none",
        padding: "16px",
        fontSize: "14px",
        backgroundColor: "#F9FAFB",
      },
    },
  };

  const fetchUserDetails = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date.");
      toast.error("Please select both From Date and To Date.");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be later than To Date.");
      toast.error("From Date cannot be later than To Date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(
        `${baseUrl}getUserTransDataByAccountant`,
        {
          from_date: fromDate,
          to_date: toDate,
        }
      );

      if (response.data.status === 200 && response.data.data) {
        setTransactions(response.data.data);
        toast.success(`Found ${response.data.data.length} transactions`);
      } else {
        setTransactions([]);
        setError("No transactions found for the selected date range");
        toast.info("No transactions found for the selected date range");
      }
    } catch (err) {
      console.error("Fetch user error:", err);
      const errorMsg = err.response?.data?.message || "Failed to fetch transactions";
      setError(errorMsg);
      setTransactions([]);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    setExportLoading(true);
    
    try {
      const csvContent = [
        // Header
        ['ID', 'Transaction ID', 'User ID', 'Transaction Name', 'Type', 'Total Amount', 'Deposit', 'Winning', 'Real Cash', 'Created At'].join(','),
        // Data
        ...filteredTransactions.map(row => [
          row.id,
          row.trans_id,
          row.user_id,
          row.trans_name,
          row.action_type,
          row.total_amount,
          row.deposit_bal,
          row.win_bal,
          row.trans_bal,
          row.created_at
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${fromDate}_to_${toDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Transactions exported successfully!');
    } catch (error) {
      toast.error('Failed to export transactions');
    } finally {
      setExportLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterTransType("All");
    setFilterActionType("All");
    setSelectedTransactions([]);
  };

  const selectAllFiltered = () => {
    const allIds = filteredTransactions.map(t => t.id);
    setSelectedTransactions(allIds);
  };

  const deselectAll = () => {
    setSelectedTransactions([]);
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Analytics</h1>
              <p className="text-gray-600">Monitor and analyze transaction data with advanced filtering</p>
            </div>

            {/* Date Filter Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <span className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                    📊
                  </span>
                  Date Range Filter
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchUserDetails}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center font-semibold shadow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                          </svg>
                          Filter Data
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full border-2 border-indigo-600 text-indigo-600 p-3 rounded-lg hover:bg-indigo-50 transition flex items-center justify-center font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      {showFilters ? 'Hide Filters' : 'More Filters'}
                    </button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition"
                          />
                          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Name</label>
                        <select
                          value={filterTransType}
                          onChange={(e) => setFilterTransType(e.target.value)}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition"
                        >
                          <option value="All">All Transaction Types</option>
                          {uniqueTransTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                        <select
                          value={filterActionType}
                          onChange={(e) => setFilterActionType(e.target.value)}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition"
                        >
                          <option value="All">All Action Types</option>
                          {uniqueActionTypes.map((type) => (
                            <option key={type} value={type}>
                              {type?.charAt(0).toUpperCase() + type?.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            {transactions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.totalTransactions.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-green-100 rounded-full p-3 mr-4">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(statistics.totalAmount)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <span className="text-2xl">🏦</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Deposits</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.totalDeposit)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-purple-100 rounded-full p-3 mr-4">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Winnings</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(statistics.totalWinning)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Table Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                      📋
                    </span>
                    Transaction Details ({filteredTransactions.length} records)
                  </h2>
                  <div className="flex gap-2">
                    {selectedTransactions.length > 0 && (
                      <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-lg text-sm">
                        {selectedTransactions.length} selected
                      </span>
                    )}
                    <button
                      onClick={exportToCSV}
                      disabled={exportLoading || filteredTransactions.length === 0}
                      className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {exportLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export CSV
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Selection Controls */}
                {filteredTransactions.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={selectAllFiltered}
                      className="bg-white bg-opacity-20 text-white px-3 py-1 rounded text-sm hover:bg-opacity-30 transition"
                    >
                      Select All Visible
                    </button>
                    <button
                      onClick={deselectAll}
                      className="bg-white bg-opacity-20 text-white px-3 py-1 rounded text-sm hover:bg-opacity-30 transition"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>

              {/* Table Content */}
              <div className="overflow-hidden">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6 flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                <DataTable
                  columns={columns}
                  data={filteredTransactions}
                  customStyles={customStyles}
                  pagination
                  paginationPerPage={25}
                  paginationRowsPerPageOptions={[10, 25, 50, 100]}
                  progressPending={loading}
                  noDataComponent={
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                      <p className="text-gray-600">
                        {transactions.length === 0
                          ? "Select a date range and click 'Filter Data' to view transactions"
                          : "Try adjusting your search criteria or filters"}
                      </p>
                    </div>
                  }
                  highlightOnHover
                  striped
                  responsive
                  dense
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Trans;