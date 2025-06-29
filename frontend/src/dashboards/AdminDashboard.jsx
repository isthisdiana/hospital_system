import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "http://localhost:5000/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState("system_reports");
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [reportPeriods] = useState(["weekly", "monthly", "yearly"]);
  const [reportData, setReportData] = useState({
    totalPatients: 0,
    totalVisits: 0,
    totalBills: 0,
    totalTreatments: 0,
    totalAmountCollected: 0,
    averageBillAmount: 0,
    commonTreatments: [],
    commonDiagnoses: [],
  });
  const [loadingReports, setLoadingReports] = useState(false);
  const [errorReports, setErrorReports] = useState(null);

  const [users, setUsers] = useState({
    admin: [],
    nurse: [],
    doctor: [],
    billing_staff: [],
  });
  const [userCategory, setUserCategory] = useState("admin");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState(null);

  const [createUserCategory, setCreateUserCategory] = useState("nurse");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    full_name: "",
    contact_info: "",
    specialty: "",
    role: "nurse",
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const roles = ["admin", "nurse", "doctor", "billing_staff"];

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setErrorUsers(null);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/users?role=${userCategory}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers((prevUsers) => ({ ...prevUsers, [userCategory]: response.data }));
      } catch (error) {
        console.error("Error fetching users:", error);
        setErrorUsers("Failed to load user accounts.");
      } finally {
        setLoadingUsers(false);
      }
    };

    if (mainTab === "user_accounts") {
      fetchUsers();
    }
  }, [userCategory, mainTab]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoadingReports(true);
      setErrorReports(null);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/admin/system-reports?period=${reportPeriod}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setReportData({
          totalPatients: response.data.totalPatients || 0,
          totalVisits: response.data.totalVisits || 0,
          totalBills: response.data.totalBills || 0,
          totalTreatments: response.data.totalTreatments || 0,
          totalAmountCollected: parseFloat(response.data.totalAmountCollected) || 0,
          averageBillAmount: parseFloat(response.data.averageBillAmount) || 0,
          commonTreatments: response.data.commonTreatments || [],
          commonDiagnoses: response.data.commonDiagnoses || [],
        });
      } catch (error) {
        console.error("Error fetching system reports:", error);
        setErrorReports("Failed to load system reports.");
      } finally {
        setLoadingReports(false);
      }
    };

    let intervalId;
    if (mainTab === "system_reports") {
      fetchReports();
      intervalId = setInterval(fetchReports, 60000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [reportPeriod, mainTab]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCreateUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.full_name || !newUser.contact_info || (newUser.role === "doctor" && !newUser.specialty)) {
      alert("Please fill in all fields");
      return;
    }

    setCreatingUser(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/register`,
        { ...newUser },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      alert("User created successfully!");
      setNewUser({ username: "", password: "", full_name: "", contact_info: "", specialty: "", role: createUserCategory });
      const tokenRefresh = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/users?role=${createUserCategory}`, {
        headers: {
          Authorization: `Bearer ${tokenRefresh}`,
        },
      });
      setUsers(prevUsers => ({ ...prevUsers, [createUserCategory]: response.data }));
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.response?.data?.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const navigationTabs = [
    { value: "system_reports", label: "System Reports" },
    { value: "user_accounts", label: "User Accounts" },
  ];

  const createButtonOptions = roles.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1).replace("_", " ") }));

  const handlePrintReport = () => {
    if (!reportData) {
      alert("No report data to print.");
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>System Report - ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1, h2, h3, h4 { color: #0056b3; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .section { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9; }
            .section-title { font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .data-item { margin-bottom: 8px; }
            .data-item b { display: inline-block; width: 180px; }
            .list-container { margin-left: 20px; }
            .list-container ul { list-style-type: disc; padding: 0; margin: 0; }
            .list-container li { margin-bottom: 5px; }
            .placeholder-text { font-style: italic; color: #777; margin-top: 10px; }
            @media print {
              button { display: none; }
              body { margin: 0; }
              .header { border-bottom: none; }
              .section { border: none; padding: 0; background-color: transparent; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hospital Management System</h1>
            <p>Comprehensive System Report</p>
            <p>Period: ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}</p>
            <p>Generated On: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <p class="placeholder-text">This section provides a high-level overview of the key findings and highlights from the system's performance over the selected period. It summarizes patient engagement, operational efficiency, and financial health, pointing out major successes and areas for improvement. This acts as a quick reference for administrators and stakeholders.</p>
          </div>

          <div class="section">
            <h2 class="section-title">Key Metrics Overview</h2>
            <div class="data-item"><b>Total Patients:</b> ${reportData.totalPatients}</div>
            <div class="data-item"><b>Total Visits:</b> ${reportData.totalVisits}</div>
            <div class="data-item"><b>Total Bills Generated:</b> ${reportData.totalBills}</div>
            <div class="data-item"><b>Total Treatments Provided:</b> ${reportData.totalTreatments}</div>
            <div class="data-item"><b>Total Amount Collected:</b> ${reportData.totalAmountCollected.toFixed(2)}</div>
            <div class="data-item"><b>Average Bill Amount:</b> ${reportData.averageBillAmount.toFixed(2)}</div>
          </div>

          <div class="section">
            <h2 class="section-title">Operational Highlights</h2>
            <p class="placeholder-text">Detailed insights into daily operations, including patient flow efficiency, staff workload, and resource utilization. This section could include data on average waiting times, doctor consultation durations, and administrative processing times, aiming to identify bottlenecks and optimize workflows.</p>
            <div class="list-container">
              <h3>Most Common Treatments:</h3>
              ${reportData.commonTreatments && reportData.commonTreatments.length > 0 ? `
                <ul>
                  ${reportData.commonTreatments.map(t => `<li>${t.name} (${t.count} times)</li>`).join('')}
                </ul>
              ` : '<p>No common treatments data.</p>'}
            </div>
            <div class="list-container" style="margin-top: 20px;">
              <h3>Most Common Diagnoses:</h3>
              ${reportData.commonDiagnoses && reportData.commonDiagnoses.length > 0 ? `
                <ul>
                  ${reportData.commonDiagnoses.map(d => `<li>${d.name} (${d.count} times)</li>`).join('')}
                </ul>
              ` : '<p>No common diagnoses data.</p>'}
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Financial Overview</h2>
            <p class="placeholder-text">An in-depth look at the financial performance of the hospital, covering revenue streams, expenditure analysis, and profitability. This might include details on outstanding payments, insurance claims processing, and budget adherence, providing a clear picture of the hospital's financial health.</p>
          </div>

          <div class="section">
            <h2 class="section-title">Recommendations and Future Outlook</h2>
            <p class="placeholder-text">Based on the analysis, this section outlines strategic recommendations for improving hospital services, operational efficiency, and financial stability. It also includes a forward-looking perspective on potential growth areas, technological adoptions, and patient care enhancements.</p>
          </div>

        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <DashboardLayout
      title="PATIENT BILLING MANAGEMENT SYSTEM"
      navigationTabs={navigationTabs}
      currentTab={mainTab}
      onTabChange={setMainTab}
      createButton="Create User"
      createButtonOptions={createButtonOptions}
      onCreateSelectValue={mainTab === "create_user" ? createUserCategory : ""}
      onCreateSelectChange={e => { setMainTab("create_user"); setCreateUserCategory(e.target.value); setNewUser(u => ({ ...u, role: e.target.value })); }}
      onLogout={handleLogout}
    >
      {loadingReports && <div className="loading">Loading reports...</div>}
      {errorReports && <div className="error">Error: {errorReports}</div>}

      {mainTab === "system_reports" && reportData && !loadingReports && !errorReports && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: "clamp(1.1rem, 2vw, 1.3rem)" }}>System Reports</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            {reportPeriods.map(period => (
              <button key={period} onClick={() => setReportPeriod(period)} style={{ flex: 1, minWidth: 120, padding: 12, background: reportPeriod === period ? "#5bb0e6" : "#b3d1e6", color: "#222", border: 0, borderRadius: 4, fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.1rem)" }}>{period.charAt(0).toUpperCase() + period.slice(1)}</button>
            ))}
          </div>
          <div style={{ minHeight: 200, padding: 24, background: "#f5fafd", borderRadius: 8, fontSize: 22, fontWeight: 600, color: "#222", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
            <div style={{ textAlign: "left", fontSize: 16 }}>
              <div style={{ marginBottom: 12 }}><b>Total Patients:</b> {reportData.totalPatients}</div>
              <div style={{ marginBottom: 12 }}><b>Total Visits:</b> {reportData.totalVisits}</div>
              {/* <div style={{ marginBottom: 12 }}><b>Total Bills:</b> {reportData.totalBills}</div> */}
              <div style={{ marginBottom: 12 }}><b>Total Treatments:</b> {reportData.totalTreatments}</div>
              <div style={{ marginBottom: 12 }}><b>Total Amount Collected:</b> {reportData.totalAmountCollected.toFixed(2)}</div>
              <div style={{ marginBottom: 12 }}><b>Average Bill Amount:</b> {reportData.averageBillAmount.toFixed(2)}</div>
              <div style={{ marginTop: 12 }}><b>Most Common Treatments:</b>
                {reportData.commonTreatments && reportData.commonTreatments.length > 0 ? (
                  <ul>{reportData.commonTreatments.map(t => <li key={t.name}>{t.name} ({t.count})</li>)}</ul>
                ) : (
                  <p>No common treatments found.</p>
                )}
              </div>
              <div style={{ marginTop: 12 }}><b>Most Common Diagnoses:</b>
                {reportData.commonDiagnoses && reportData.commonDiagnoses.length > 0 ? (
                  <ul>{reportData.commonDiagnoses.map(d => <li key={d.name}>{d.name} ({d.count})</li>)}</ul>
                ) : (
                  <p>No common diagnoses found.</p>
                )}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <button 
              onClick={handlePrintReport} 
              style={{ background: "#2196f3", color: "#fff", fontWeight: 600, padding: "8px 24px", border: 0, borderRadius: 4, fontSize: "clamp(1rem, 2vw, 1.1rem)" }}
            >
              PRINT
            </button>
          </div>
        </>
      )}
      {mainTab === "user_accounts" && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: "clamp(1.1rem, 2vw, 1.3rem)" }}>User Accounts</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            {roles.map(role => (
              <button key={role} onClick={() => setUserCategory(role)} style={{ flex: 1, minWidth: 120, padding: 12, background: userCategory === role ? "#5bb0e6" : "#b3d1e6", color: "#222", border: 0, borderRadius: 4, fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.1rem)" }}>{role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")}</button>
            ))}
          </div>
          <div style={{ minHeight: 200, padding: 24, background: "#f5fafd", borderRadius: 8, fontSize: 18, color: "#222", width: "100%", boxSizing: "border-box", overflowX: "auto" }}>
            {loadingUsers && <div>Loading users...</div>}
            {errorUsers && <div style={{ color: 'red' }}>{errorUsers}</div>}
            {!loadingUsers && !errorUsers && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#e3f0fa" }}>
                    <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>ID</th>
                    <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Username</th>
                    {userCategory !== "admin" && <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Full Name</th>}
                    {userCategory === "doctor" && <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Specialty</th>}
                    {userCategory !== "admin" && <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Contact Info</th>}
                    <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users[userCategory] && users[userCategory].length > 0 ? (
                    users[userCategory].map(user => (
                      <tr key={user.user_id || user.staff_id || user.username}>
                        <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.user_id || user.staff_id}</td>
                        <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.username}</td>
                        {userCategory !== "admin" && <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.full_name}</td>}
                        {userCategory === "doctor" && <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.specialty}</td>}
                        {userCategory !== "admin" && <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.contact_info}</td>}
                        <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{new Date(user.date_created).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={userCategory === "doctor" ? 6 : (userCategory === "admin" ? 3 : 5)} style={{ padding: 8, textAlign: "center" }}>No {userCategory} users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      {mainTab === "create_user" && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: "clamp(1.1rem, 2vw, 1.3rem)" }}>Create User</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            {roles.map(role => (
              <button key={role} onClick={() => { setCreateUserCategory(role); setNewUser(u => ({ ...u, role })); }} style={{ flex: 1, minWidth: 120, padding: 12, background: createUserCategory === role ? "#5bb0e6" : "#b3d1e6", color: "#222", border: 0, borderRadius: 4, fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.1rem)" }}>{role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")}</button>
            ))}
          </div>
          <form onSubmit={handleCreateUser} style={{ maxWidth: 500, margin: "0 auto" }}>
            <div style={{ marginBottom: 12 }}>
              <input type="text" name="username" value={newUser.username} onChange={handleCreateUserChange} placeholder="Username" required style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #b3d1e6", fontSize: "clamp(1rem, 2vw, 1.1rem)" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <input type="password" name="password" value={newUser.password} onChange={handleCreateUserChange} placeholder="Password" required style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #b3d1e6", fontSize: "clamp(1rem, 2vw, 1.1rem)" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <input type="text" name="full_name" value={newUser.full_name} onChange={handleCreateUserChange} placeholder="Full Name" required style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #b3d1e6", fontSize: "clamp(1rem, 2vw, 1.1rem)" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <input type="text" name="contact_info" value={newUser.contact_info} onChange={handleCreateUserChange} placeholder="Contact Info" required style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #b3d1e6", fontSize: "clamp(1rem, 2vw, 1.1rem)" }} />
            </div>
            {createUserCategory === "doctor" && (
              <div style={{ marginBottom: 12 }}>
                <input type="text" name="specialty" value={newUser.specialty} onChange={handleCreateUserChange} placeholder="Specialty" required style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #b3d1e6", fontSize: "clamp(1rem, 2vw, 1.1rem)" }} />
              </div>
            )}
            <button type="submit" disabled={creatingUser} style={{ background: "#2196f3", color: "#fff", fontWeight: 600, padding: "8px 24px", border: 0, borderRadius: 4, width: 120, float: "right", fontSize: "clamp(1rem, 2vw, 1.1rem)" }}>{creatingUser ? "REGISTERING..." : "REGISTER"}</button>
          </form>
        </>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;