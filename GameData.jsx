import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../../axiosInstance";
import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import { StoreContext } from "../context/storeContext";
import { useTable } from "react-table";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const GameData = () => {
  const navigate = useNavigate();
  const { getCookie, baseUrl } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tableId, setTableId] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    // Initial empty table state
    setData([]);
  }, []);

  useEffect(() => {
    const isLogin = getCookie("isLoggedIn");
    if (!isLogin || isLogin === "false") {
      console.log("Session expired.");
      toast.error("Session expired. Please log in again.");
      setInterval(() => {
              navigate("/login");
            }, 1500);
    }
  }, []);

  const handleSearch = async () => {
    if (!tableId.trim()) {
      toast.error("Please enter a Table ID.");
      return;
    }

    try {
      const response = await axiosInstance.post(`${baseUrl}getWinningData`, {
        table_id: tableId,
      });
      if (
        response.data.status !== 200 ||
        !Array.isArray(response.data.data) ||
        response.data.data.length === 0
      ) {
        setData([]);
        return;
      }
      setData(response.data.data);
    } catch (error) {
      console.error("Error loading data:", error);
      setData([]);
    }
  };

  const columns = React.useMemo(
    () => [
      { Header: "ID", accessor: "id" },
      { Header: "Table ID", accessor: "table_id" },
      { Header: "User ID", accessor: "user_id" },
      { Header: "Contest ID", accessor: "con_id" },
      {
        Header: "Entry Fee",
        accessor: "entry_fee",
        Cell: ({ value }) => `₹${Number(value).toFixed(2)}`,
      },
      {
        Header: "Win Balance",
        accessor: "win_bal",
        Cell: ({ value }) => `₹${Number(value).toFixed(2)}`,
      },
      {
        Header: "Game Status",
        accessor: "game_status",
        Cell: ({ value }) => (
          <span
            className={`px-2 py-1 rounded text-white ${
              value === "Completed" ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            {value}
          </span>
        ),
      },
      { Header: "Game Type", accessor: "game_type" },
      {
        Header: "Game Started At",
        accessor: "game_started_at",
        Cell: ({ value }) => (value ? new Date(value).toLocaleString() : "-"),
      },
      {
        Header: "Game Ended At",
        accessor: "game_ended_at",
        Cell: ({ value }) => (value ? new Date(value).toLocaleString() : "-"),
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto pt-4 pb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Game Data
              </h2>
              <div className="mb-4 flex items-center space-x-2">
                <input
                  type="text"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  placeholder="Enter Table ID"
                  className="w-1/5 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Search
                </button>
              </div>
              <div className="overflow-x-auto">
                <table
                  {...getTableProps()}
                  className="w-full text-center border-collapse"
                >
                  <thead className="bg-gray-100">
                    {headerGroups.map((headerGroup) => (
                      <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                          <th
                            {...column.getHeaderProps()}
                            className="p-3 text-sm font-semibold text-gray-700 border-b"
                          >
                            {column.render("Header")}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody {...getTableBodyProps()}>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="p-4 text-gray-500"
                        >
                          No data
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        prepareRow(row);
                        return (
                          <tr
                            {...row.getRowProps()}
                            className="hover:bg-gray-50 transition border-b"
                          >
                            {row.cells.map((cell) => (
                              <td
                                {...cell.getCellProps()}
                                className="p-3 text-sm text-gray-700"
                              >
                                {cell.render("Cell")}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GameData;
