import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

const roles = ["admin", "nurse", "doctor", "billing_staff"];
const reportPeriods = ["weekly", "monthly", "yearly"];

function AdminDashboard() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState("system_reports");
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [userCategory, setUserCategory] = useState("nurse");
  const [createUserCategory, setCreateUserCategory] = useState("nurse");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    full_name: "",
    contact_info: "",
    specialty: "",
    role: "nurse",
  });
  const [users, setUsers] = useState({
    admin: [],
    nurse: [],
    doctor: [],
    billing_staff: [],
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setErrorUsers(null);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/users?role=${userCategory}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(prevUsers => ({ ...prevUsers, [userCategory]: response.data }));
      } catch (error) {
        console.error(`Error fetching ${userCategory} users:`, error);
        setErrorUsers(`Failed to load ${userCategory} users.`);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (mainTab === "user_accounts") {
      fetchUsers();
    }
  }, [userCategory, mainTab]);

  const analytics = {
    weekly: { totalPatients: 10, treatments: [{ name: "X-Ray", count: 3 }], diagnoses: [{ name: "Flu", count: 2 }] },
    monthly: { totalPatients: 40, treatments: [{ name: "X-Ray", count: 12 }], diagnoses: [{ name: "Flu", count: 8 }] },
    yearly: { totalPatients: 500, treatments: [{ name: "X-Ray", count: 120 }], diagnoses: [{ name: "Flu", count: 80 }] },
  };

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
        "http://localhost:5000/api/register",
        { ...newUser },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      alert("User created successfully!");
      setNewUser({ username: "", password: "", full_name: "", contact_info: "", specialty: "", role: createUserCategory });
      const tokenRefresh = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/users?role=${createUserCategory}`, {
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
    { id: "system_reports", name: "System Reports" },
    { id: "user_accounts", name: "User Accounts" },
  ];

  const createButtonOptions = roles.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1).replace("_", " ") }));

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
      {mainTab === "system_reports" && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: "clamp(1.1rem, 2vw, 1.3rem)" }}>System Reports</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            {reportPeriods.map(period => (
              <button key={period} onClick={() => setReportPeriod(period)} style={{ flex: 1, minWidth: 120, padding: 12, background: reportPeriod === period ? "#5bb0e6" : "#b3d1e6", color: "#222", border: 0, borderRadius: 4, fontWeight: 600, fontSize: "clamp(1rem, 2vw, 1.1rem)" }}>{period.charAt(0).toUpperCase() + period.slice(1)}</button>
            ))}
          </div>
          <div style={{ minHeight: 200, padding: 24, background: "#f5fafd", borderRadius: 8, fontSize: 22, fontWeight: 600, color: "#222", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
            <div style={{ fontSize: 28, marginBottom: 16 }}>Display Reports Here</div>
            <div style={{ textAlign: "left", fontSize: 16 }}>
              <div><b>Total Patients:</b> {analytics[reportPeriod].totalPatients}</div>
              <div style={{ marginTop: 12 }}><b>Most Common Treatments:</b>
                <ul>{analytics[reportPeriod].treatments.map(t => <li key={t.name}>{t.name} ({t.count})</li>)}</ul>
              </div>
              <div style={{ marginTop: 12 }}><b>Most Common Diagnoses:</b>
                <ul>{analytics[reportPeriod].diagnoses.map(d => <li key={d.name}>{d.name} ({d.count})</li>)}</ul>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <button style={{ background: "#2196f3", color: "#fff", fontWeight: 600, padding: "8px 24px", border: 0, borderRadius: 4, fontSize: "clamp(1rem, 2vw, 1.1rem)" }}>PRINT</button>
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
                    <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Full Name</th>
                    {userCategory === "doctor" && <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Specialty</th>}
                    <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Contact Info</th>
                    <th style={{ padding: 8, border: "1px solid #b3d1e6" }}>Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users[userCategory] && users[userCategory].length > 0 ? (
                    users[userCategory].map(user => (
                      <tr key={user.staff_id || user.username}>
                        <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.staff_id}</td>
                        <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.username}</td>
                        <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.full_name}</td>
                        {userCategory === "doctor" && <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.specialty}</td>}
                        <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{user.contact_info}</td>
                        <td style={{ padding: 8, border: "1px solid #b3d1e6" }}>{new Date(user.date_created).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={userCategory === "doctor" ? 6 : 5} style={{ padding: 8, textAlign: "center" }}>No {userCategory} users found.</td>
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