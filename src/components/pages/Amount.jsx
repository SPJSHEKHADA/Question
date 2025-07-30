import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../../axiosInstance";
import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import { StoreContext } from "../context/storeContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Amount = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("credit");
  const [creditForm, setCreditForm] = useState({
    user_id: "",
    trans_name: "",
    trans_desc: "",
    deposit_bal: "0",
    win_bal: "0",
    trans_bal: "0",
  });
  const [debitForm, setDebitForm] = useState({
    user_id: "",
    trans_name: "",
    trans_desc: "",
    deposit_bal: "0",
    win_bal: "0",
    trans_bal: "0",
  });
  const [loading, setLoading] = useState({ credit: false, debit: false });
  const [error, setError] = useState({ credit: null, debit: null });
  const [userInfo, setUserInfo] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);

  const transOptions = [
    "Deposit",
    "Winning",
    "Withdraw",
    "Join Contest",
    "Real Cash",
    "Refer",
    "Refund",
    "Testing",
  ];

  const transactionIcons = {
    "Deposit": "💰",
    "Winning": "🏆",
    "Withdraw": "💸",
    "Join Contest": "🎯",
    "Real Cash": "💵",
    "Refer": "👥",
    "Refund": "↩️",
    "Testing": "🔧",
  };

  useEffect(() => {
    checkRoleAccess(["admin", "accountant"]);
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

  // Search user by ID
  const searchUser = async (userId) => {
    if (!userId) {
      setUserInfo(null);
      return;
    }
    
    setSearchingUser(true);
    try {
      // Simulated user search - replace with actual API call
      setTimeout(() => {
        setUserInfo({
          id: userId,
          name: `User ${userId}`,
          email: `user${userId}@example.com`,
          deposit_balance: 1250.50,
          winning_balance: 850.75,
          transaction_balance: 200.25,
        });
        setSearchingUser(false);
      }, 1000);
    } catch (error) {
      console.error("Error searching user:", error);
      setUserInfo(null);
      setSearchingUser(false);
    }
  };

  const handleCreditChange = (e) => {
    const { name, value } = e.target;
    setCreditForm((prev) => ({ ...prev, [name]: value }));
    
    if (name === "user_id") {
      searchUser(value);
    }
  };

  const handleDebitChange = (e) => {
    const { name, value } = e.target;
    setDebitForm((prev) => ({ ...prev, [name]: value }));
    
    if (name === "user_id") {
      searchUser(value);
    }
  };

  const getTotalAmount = (form) => {
    const deposit = parseFloat(form.deposit_bal) || 0;
    const win = parseFloat(form.win_bal) || 0;
    const trans = parseFloat(form.trans_bal) || 0;
    return deposit + win + trans;
  };

  const handleCreditSubmit = async (e) => {
    e.preventDefault();
    if (!creditForm.user_id || !creditForm.trans_name || !creditForm.trans_desc) {
      setError((prev) => ({
        ...prev,
        credit: "Please fill all required fields.",
      }));
      toast.error("Please fill all required fields.");
      return;
    }

    const totalAmount = getTotalAmount(creditForm);
    if (totalAmount <= 0) {
      setError((prev) => ({
        ...prev,
        credit: "Total amount must be greater than 0.",
      }));
      toast.error("Total amount must be greater than 0.");
      return;
    }

    setLoading((prev) => ({ ...prev, credit: true }));
    setError((prev) => ({ ...prev, credit: null }));

    try {
      const response = await axiosInstance.post(
        `${baseUrl}creditUserAmountByAdmin`,
        {
          user_id: creditForm.user_id,
          trans_name: creditForm.trans_name,
          trans_desc: creditForm.trans_desc,
          deposit_bal: creditForm.deposit_bal,
          win_bal: creditForm.win_bal,
          trans_bal: creditForm.trans_bal,
        }
      );

      if (response.data.status === 200) {
        toast.success(`₹${totalAmount.toFixed(2)} credited successfully to User ${creditForm.user_id}!`);
        setCreditForm({
          user_id: "",
          trans_name: "",
          trans_desc: "",
          deposit_bal: "0",
          win_bal: "0",
          trans_bal: "0",
        });
        setUserInfo(null);
      } else {
        setError((prev) => ({ ...prev, credit: response.data.msg }));
        toast.error(response.data.msg || "Credit operation failed");
      }
    } catch (error) {
      console.error("API error:", error);
      const errorMsg = "Something went wrong. Try again.";
      setError((prev) => ({ ...prev, credit: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setLoading((prev) => ({ ...prev, credit: false }));
    }
  };

  const handleDebitSubmit = async (e) => {
    e.preventDefault();
    if (!debitForm.user_id || !debitForm.trans_name || !debitForm.trans_desc) {
      setError((prev) => ({
        ...prev,
        debit: "Please fill all required fields.",
      }));
      toast.error("Please fill all required fields.");
      return;
    }

    const totalAmount = getTotalAmount(debitForm);
    if (totalAmount <= 0) {
      setError((prev) => ({
        ...prev,
        debit: "Total amount must be greater than 0.",
      }));
      toast.error("Total amount must be greater than 0.");
      return;
    }

    setLoading((prev) => ({ ...prev, debit: true }));
    setError((prev) => ({ ...prev, debit: null }));

    try {
      const response = await axiosInstance.post(
        `${baseUrl}debitUserAmountByAdmin`,
        {
          user_id: debitForm.user_id,
          trans_name: debitForm.trans_name,
          trans_desc: debitForm.trans_desc,
          deposit_bal: debitForm.deposit_bal,
          win_bal: debitForm.win_bal,
          trans_bal: debitForm.trans_bal,
        }
      );

      if (response.data.status === 200) {
        toast.success(`₹${totalAmount.toFixed(2)} debited successfully from User ${debitForm.user_id}!`);
        setDebitForm({
          user_id: "",
          trans_name: "",
          trans_desc: "",
          deposit_bal: "0",
          win_bal: "0",
          trans_bal: "0",
        });
        setUserInfo(null);
      } else {
        setError((prev) => ({ ...prev, debit: response.data.msg }));
        toast.error(response.data.msg || "Debit operation failed");
      }
    } catch (error) {
      console.error("API error:", error);
      const errorMsg = "Something went wrong. Try again.";
      setError((prev) => ({ ...prev, debit: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setLoading((prev) => ({ ...prev, debit: false }));
    }
  };

  const clearForm = (type) => {
    if (type === "credit") {
      setCreditForm({
        user_id: "",
        trans_name: "",
        trans_desc: "",
        deposit_bal: "0",
        win_bal: "0",
        trans_bal: "0",
      });
      setError((prev) => ({ ...prev, credit: null }));
    } else {
      setDebitForm({
        user_id: "",
        trans_name: "",
        trans_desc: "",
        deposit_bal: "0",
        win_bal: "0",
        trans_bal: "0",
      });
      setError((prev) => ({ ...prev, debit: null }));
    }
    setUserInfo(null);
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Amount Management</h1>
              <p className="text-gray-600">Credit or debit amounts from user accounts with secure transaction processing</p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl max-w-md">
                <button
                  onClick={() => setActiveTab("credit")}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === "credit"
                      ? "bg-green-500 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  💰 Credit Amount
                </button>
                <button
                  onClick={() => setActiveTab("debit")}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === "debit"
                      ? "bg-red-500 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  💸 Debit Amount
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className={`${
                    activeTab === "credit" 
                      ? "bg-gradient-to-r from-green-600 to-emerald-600" 
                      : "bg-gradient-to-r from-red-600 to-rose-600"
                  } p-6`}>
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {activeTab === "credit" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        )}
                      </svg>
                      {activeTab === "credit" ? "Credit Amount to User" : "Debit Amount from User"}
                    </h2>
                    <p className="text-white text-opacity-90 text-sm mt-1">
                      {activeTab === "credit" 
                        ? "Add funds to user account with transaction details"
                        : "Remove funds from user account with transaction details"
                      }
                    </p>
                  </div>

                  {/* Form Content */}
                  <div className="p-6">
                    <form onSubmit={activeTab === "credit" ? handleCreditSubmit : handleDebitSubmit} className="space-y-6">
                      {/* User Information Section */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <h6 className="text-sm font-bold text-blue-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          User Information
                          <span className="text-red-500 ml-1">*</span>
                        </h6>
                        <div className="space-y-4">
                          <div className="relative">
                            <label className="block text-sm font-medium text-blue-700 mb-2">User ID</label>
                            <input
                              type="text"
                              name="user_id"
                              value={activeTab === "credit" ? creditForm.user_id : debitForm.user_id}
                              onChange={activeTab === "credit" ? handleCreditChange : handleDebitChange}
                              className={`w-full p-3 border-2 ${
                                activeTab === "credit" ? "border-blue-200 focus:border-green-500" : "border-blue-200 focus:border-red-500"
                              } rounded-lg focus:ring focus:ring-opacity-50 transition bg-white`}
                              placeholder="Enter User ID to search"
                              required
                            />
                            {searchingUser && (
                              <div className="absolute right-3 top-11 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            )}
                          </div>
                          
                          {userInfo && (
                            <div className="bg-white p-4 rounded-lg border border-blue-200 animate-fade-in">
                              <div className="flex items-center mb-3">
                                <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
                                  {userInfo.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{userInfo.name}</p>
                                  <p className="text-sm text-gray-600">{userInfo.email}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <p className="text-xs text-green-600 font-medium">Deposit Balance</p>
                                  <p className="font-bold text-green-800">₹{userInfo.deposit_balance?.toFixed(2)}</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <p className="text-xs text-purple-600 font-medium">Winning Balance</p>
                                  <p className="font-bold text-purple-800">₹{userInfo.winning_balance?.toFixed(2)}</p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                  <p className="text-xs text-orange-600 font-medium">Transaction Balance</p>
                                  <p className="font-bold text-orange-800">₹{userInfo.transaction_balance?.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <h6 className="text-sm font-bold text-purple-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Transaction Details
                          <span className="text-red-500 ml-1">*</span>
                        </h6>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-2">Transaction Type</label>
                            <select
                              name="trans_name"
                              value={activeTab === "credit" ? creditForm.trans_name : debitForm.trans_name}
                              onChange={activeTab === "credit" ? handleCreditChange : handleDebitChange}
                              className={`w-full p-3 border-2 ${
                                activeTab === "credit" ? "border-purple-200 focus:border-green-500" : "border-purple-200 focus:border-red-500"
                              } rounded-lg focus:ring focus:ring-opacity-50 transition bg-white`}
                              required
                            >
                              <option value="">-- Select Transaction Type --</option>
                              {transOptions.map((option) => (
                                <option key={option} value={option}>
                                  {transactionIcons[option]} {option}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-2">Transaction Description</label>
                            <textarea
                              name="trans_desc"
                              value={activeTab === "credit" ? creditForm.trans_desc : debitForm.trans_desc}
                              onChange={activeTab === "credit" ? handleCreditChange : handleDebitChange}
                              className={`w-full p-3 border-2 ${
                                activeTab === "credit" ? "border-purple-200 focus:border-green-500" : "border-purple-200 focus:border-red-500"
                              } rounded-lg focus:ring focus:ring-opacity-50 transition bg-white`}
                              placeholder="Enter detailed description for this transaction"
                              rows="3"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Amount Details */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                        <h6 className="text-sm font-bold text-emerald-800 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          Amount Breakdown
                          <span className="text-red-500 ml-1">*</span>
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-emerald-700 mb-2">Deposit Balance</label>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-emerald-600 font-bold">₹</span>
                              <input
                                type="number"
                                name="deposit_bal"
                                value={activeTab === "credit" ? creditForm.deposit_bal : debitForm.deposit_bal}
                                onChange={activeTab === "credit" ? handleCreditChange : handleDebitChange}
                                className={`w-full pl-8 pr-3 py-3 border-2 ${
                                  activeTab === "credit" ? "border-emerald-200 focus:border-green-500" : "border-emerald-200 focus:border-red-500"
                                } rounded-lg focus:ring focus:ring-opacity-50 transition bg-white`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                onWheel={(e) => e.target.blur()}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-emerald-700 mb-2">Winning Balance</label>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-emerald-600 font-bold">₹</span>
                              <input
                                type="number"
                                name="win_bal"
                                value={activeTab === "credit" ? creditForm.win_bal : debitForm.win_bal}
                                onChange={activeTab === "credit" ? handleCreditChange : handleDebitChange}
                                className={`w-full pl-8 pr-3 py-3 border-2 ${
                                  activeTab === "credit" ? "border-emerald-200 focus:border-green-500" : "border-emerald-200 focus:border-red-500"
                                } rounded-lg focus:ring focus:ring-opacity-50 transition bg-white`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                onWheel={(e) => e.target.blur()}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-emerald-700 mb-2">Transaction Balance</label>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-emerald-600 font-bold">₹</span>
                              <input
                                type="number"
                                name="trans_bal"
                                value={activeTab === "credit" ? creditForm.trans_bal : debitForm.trans_bal}
                                onChange={activeTab === "credit" ? handleCreditChange : handleDebitChange}
                                className={`w-full pl-8 pr-3 py-3 border-2 ${
                                  activeTab === "credit" ? "border-emerald-200 focus:border-green-500" : "border-emerald-200 focus:border-red-500"
                                } rounded-lg focus:ring focus:ring-opacity-50 transition bg-white`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                onWheel={(e) => e.target.blur()}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Total Amount Display */}
                        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-emerald-300">
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-700 font-semibold">Total Amount:</span>
                            <span className={`text-2xl font-bold ${
                              activeTab === "credit" ? "text-green-600" : "text-red-600"
                            }`}>
                              ₹{getTotalAmount(activeTab === "credit" ? creditForm : debitForm).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Error Display */}
                      {error[activeTab] && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-red-700 font-medium">{error[activeTab]}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={loading[activeTab]}
                          className={`flex-1 ${
                            activeTab === "credit" 
                              ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                              : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                          } text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                        >
                          {loading[activeTab] ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {activeTab === "credit" ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" />
                                )}
                              </svg>
                              {activeTab === "credit" ? "CREDIT AMOUNT" : "DEBIT AMOUNT"}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => clearForm(activeTab)}
                          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center justify-center font-medium"
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

              {/* Info Panel */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-6">
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Transaction Guide
                    </h3>
                    <p className="text-indigo-100 text-sm">Important information and guidelines</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Transaction Types */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Transaction Types
                      </h4>
                      <div className="space-y-2">
                        {transOptions.slice(0, 4).map((option) => (
                          <div key={option} className="flex items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-lg mr-2">{transactionIcons[option]}</span>
                            <span className="text-sm text-gray-700">{option}</span>
                          </div>
                        ))}
                        <div className="text-xs text-gray-500 text-center pt-2">
                          + {transOptions.length - 4} more types available
                        </div>
                      </div>
                    </div>

                    {/* Security Guidelines */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Security Guidelines
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-600">Always verify user ID before processing</span>
                        </div>
                        <div className="flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-600">Use descriptive transaction descriptions</span>
                        </div>
                        <div className="flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-600">Double-check amounts before submission</span>
                        </div>
                        <div className="flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-600">All transactions are logged and auditable</span>
                        </div>
                      </div>
                    </div>

                    {/* Balance Types */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Balance Types
                      </h4>
                      <div className="space-y-2">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="font-medium text-green-800 text-sm">Deposit Balance</div>
                          <div className="text-xs text-green-600">User's deposited funds</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <div className="font-medium text-purple-800 text-sm">Winning Balance</div>
                          <div className="text-xs text-purple-600">Contest winnings</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <div className="font-medium text-orange-800 text-sm">Transaction Balance</div>
                          <div className="text-xs text-orange-600">General transaction funds</div>
                        </div>
                      </div>
                    </div>
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

export default Amount;