import { useEffect, useState } from "react";
import axios from "axios";
import {
  Typography, Button, Box, Paper, TextField, Grid, MenuItem, IconButton, Select
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

// Helper function to format date
const formatDateDisplay = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { // Check for invalid date
      return "Invalid Date";
    }
    return date.toLocaleDateString(); // Format as 'MM/DD/YYYY' or similar
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Formats to YYYY-MM-DD
  } catch (e) {
    console.error("Error formatting date for input:", e);
    return "";
  }
};

const NurseDashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    gender: "",
    contact_no: "",
    philhealth_id: "",
    guardian_name: "",
    guardian_contact: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('weekly');
  const [activeTab, setActiveTab] = useState('viewPatients');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitPurpose, setVisitPurpose] = useState("");
  const [visitLogLoading, setVisitLogLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPatientData, setEditPatientData] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);
  const [visitDoctor, setVisitDoctor] = useState("");
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (activeTab === 'record' && selectedPatient) {
      fetchDoctors();
    }
  }, [activeTab, selectedPatient]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || (role !== "nurse" && role !== "receptionist")) {
      navigate("/login");
      return {};
    }
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const storedToken = localStorage.getItem("token");
      const storedRole = localStorage.getItem("role");
      if (!storedToken || (storedRole !== "nurse" && storedRole !== "receptionist")) {
        navigate("/login");
      } else {
        await fetchPatients();
      }
    };
    checkAuthAndFetch();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'viewPatients') {
      applyFilter(filterType);
    }
  }, [patients, filterType, search, activeTab]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/patients", getAuthHeaders());
      setPatients(res.data);
    } catch (error) {
      alert("Error fetching patients: " + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/doctors", getAuthHeaders());
      setDoctors(res.data);
    } catch {
      setDoctors([]);
    }
  };

  const applyFilter = (type) => {
    setFilterType(type);
    const now = new Date();
    let startDate;
    switch (type) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = null;
    }
    let filtered = patients;
    if (startDate) {
      filtered = filtered.filter(p => new Date(p.date_registered) >= startDate);
    }
    if (search.trim()) {
      filtered = filtered.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.patient_id?.toString().includes(search.toLowerCase())
      );
    }
    setFilteredPatients(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/patients", formData, getAuthHeaders());
      alert("Patient registered successfully!");
      setSelectedPatient({ ...formData, patient_id: res.data.patient_id });
      setFormData({
        full_name: "",
        dob: "",
        gender: "",
        contact_no: "",
        philhealth_id: "",
        guardian_name: "",
        guardian_contact: "",
        address: ""
      });
      setActiveTab("record");
      fetchPatients();
    } catch (error) {
      alert("Error registering patient: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSearch = () => {
    const searchTerm = search.trim().toLowerCase();
    if (activeTab === 'viewPatients') {
      applyFilter(filterType);
    } else {
      const found = patients.find(
        (p) =>
          p.full_name?.toLowerCase().includes(searchTerm) ||
          (p.patient_id && p.patient_id.toString() === searchTerm)
      );
      if (found) {
        setSelectedPatient(found);
        setActiveTab('record');
        fetchPatientVisits(found.patient_id);
        fetchDoctors();
      } else {
        alert('No patient found with that name or ID');
        setSelectedPatient(null);
      }
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('record');
    fetchPatientVisits(patient.patient_id);
    fetchDoctors();
  };

  const handleLogVisit = async () => {
    if (!selectedPatient || !visitPurpose || !visitDoctor) {
      alert("Please fill in all visit details.");
      return;
    }
    setVisitLogLoading(true);
    try {
      const nurseId = localStorage.getItem("relatedId");
      await axios.post("http://localhost:5000/api/visits", {
        patient_id: selectedPatient.patient_id,
        registered_by: nurseId,
        doctor_id: visitDoctor,
        visit_purpose: visitPurpose,
      }, getAuthHeaders());
      alert("Visit logged successfully!");
      setVisitPurpose("");
      setVisitDoctor("");
      fetchPatientVisits(selectedPatient.patient_id);
    } catch (error) {
      alert("Error logging visit: " + (error.response?.data?.message || error.message));
    }
    setVisitLogLoading(false);
  };

  const fetchPatientVisits = async (patientId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/visits/${patientId}`, getAuthHeaders());
      setPatientVisits(res.data);
    } catch (error) {
      setPatientVisits([]);
    }
  };

  const handleEditPatient = () => {
    setIsEditing(true);
    setEditPatientData({ ...selectedPatient, dob: formatDateForInput(selectedPatient.dob) });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditPatientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePatient = async () => {
    console.log("Saving patient data:", editPatientData);
    try {
      await axios.put(`http://localhost:5000/api/patients/${editPatientData.patient_id}`, editPatientData, getAuthHeaders());
      alert('Patient updated successfully!');
      setIsEditing(false);
      setSelectedPatient(editPatientData);
      fetchPatients();
    } catch (error) {
      alert('Error updating patient: ' + (error.response?.data?.message || error.message));
    }
  };

  const getDisplayedPatients = () => {
    let filtered = patients;
    const now = new Date();
    let startDate = null;
    switch (filterType) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = null;
    }
    if (startDate) {
      filtered = filtered.filter(p => new Date(p.date_registered) >= startDate);
    }
    if (search.trim()) {
      filtered = filtered.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.patient_id?.toString().includes(search.toLowerCase())
      );
    }
    return filtered;
  };

  const navigationTabs = [
    { id: 'viewPatients', name: 'View Patients' },
    { id: 'addPatient', name: 'Add Patient' },
    { id: 'record', name: 'Record Visit' }, // Assuming this will be used for specific patient's visit
  ];

  const handleNavAddPatient = () => {
    setActiveTab('addPatient');
    setSelectedPatient(null); // Clear selected patient when navigating to Add Patient
    setIsEditing(false); // Ensure not in edit mode
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("relatedId");
    navigate("/login");
  };

  const renderPatientDetails = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{selectedPatient?.full_name}</Typography>
      {isEditing ? (
        <Box component="form" onSubmit={handleSavePatient} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={editPatientData?.full_name || ""}
                onChange={handleEditInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dob"
                type="date"
                value={editPatientData?.dob || ""}
                onChange={handleEditInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Gender"
                name="gender"
                value={editPatientData?.gender || ""}
                onChange={handleEditInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact No."
                name="contact_no"
                value={editPatientData?.contact_no || ""}
                onChange={handleEditInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Philhealth ID"
                name="philhealth_id"
                value={editPatientData?.philhealth_id || ""}
                onChange={handleEditInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Guardian Name"
                name="guardian_name"
                value={editPatientData?.guardian_name || ""}
                onChange={handleEditInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Guardian Contact"
                name="guardian_contact"
                value={editPatientData?.guardian_contact || ""}
                onChange={handleEditInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={editPatientData?.address || ""}
                onChange={handleEditInputChange}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => setIsEditing(false)} variant="outlined" sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </Box>
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Patient ID: {selectedPatient?.patient_id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Date of Birth: {formatDateDisplay(selectedPatient?.dob)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Gender: {selectedPatient?.gender}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Contact No.: {selectedPatient?.contact_no}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Philhealth ID: {selectedPatient?.philhealth_id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Guardian Name: {selectedPatient?.guardian_name}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Guardian Contact: {selectedPatient?.guardian_contact}</Typography>
          </Grid>
          <Grid item xs={12} md={12}>
            <Typography variant="subtitle1">Address: {selectedPatient?.address}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Date Registered: {formatDateDisplay(selectedPatient?.date_registered)}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Button onClick={handleEditPatient} variant="contained" sx={{ mt: 2 }}>
              Edit Patient
            </Button>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderVisitLogging = () => (
    <Box sx={{ p: 3, background: "#fff", borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>Log New Visit</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Visit Purpose"
            value={visitPurpose}
            onChange={(e) => setVisitPurpose(e.target.value)}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Select
            label="Attending Doctor"
            value={visitDoctor}
            onChange={(e) => setVisitDoctor(e.target.value)}
            fullWidth
            margin="normal"
            displayEmpty
          >
            <MenuItem value="">Select Doctor</MenuItem>
            {doctors.map((doctor) => (
              <MenuItem key={doctor.staff_id} value={doctor.staff_id}>
                {doctor.full_name}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleLogVisit} disabled={visitLogLoading}>
            {visitLogLoading ? "Logging..." : "Log Visit"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const renderVisitHistory = () => (
    <Box sx={{ p: 3, background: "#fff", borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>Visit History</Typography>
      {patientVisits.length > 0 ? (
        <Box>
          <Grid container spacing={2} className="table-header">
            <Grid item xs={3}><Typography variant="subtitle2">Visit ID</Typography></Grid>
            <Grid item xs={3}><Typography variant="subtitle2">Date</Typography></Grid>
            <Grid item xs={3}><Typography variant="subtitle2">Purpose</Typography></Grid>
            <Grid item xs={3}><Typography variant="subtitle2">Attended by</Typography></Grid>
          </Grid>
          {patientVisits.map((visit) => (
            <Grid container spacing={2} key={visit.visit_id} className="table-row">
              <Grid item xs={3}><Typography>{visit.visit_id}</Typography></Grid>
              <Grid item xs={3}><Typography>{new Date(visit.visit_date).toLocaleDateString()}</Typography></Grid>
              <Grid item xs={3}><Typography>{visit.visit_purpose}</Typography></Grid>
              <Grid item xs={3}><Typography>{visit.registered_by_full_name}</Typography></Grid>
            </Grid>
          ))}
        </Box>
      ) : (
        <Typography>No visit history found.</Typography>
      )}
    </Box>
  );

  return (
    <DashboardLayout
      title="NURSE DASHBOARD"
      navigationTabs={navigationTabs}
      currentTab={activeTab}
      onTabChange={setActiveTab}
      showSearchBar={true}
      onSearch={setSearch}
      searchPlaceholder="Search patients by name or ID"
      onLogout={handleLogout}
      onSearchButtonClick={handleSearch}
    >
      {/* View Patients */}
      {activeTab === 'viewPatients' && (
        <Box sx={{ p: 3, background: "#fff", borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom>Patient List</Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button variant={filterType === 'weekly' ? 'contained' : 'outlined'} onClick={() => applyFilter('weekly')}>WEEKLY</Button>
            <Button variant={filterType === 'monthly' ? 'contained' : 'outlined'} onClick={() => applyFilter('monthly')}>MONTHLY</Button>
            <Button variant={filterType === 'yearly' ? 'contained' : 'outlined'} onClick={() => applyFilter('yearly')}>YEARLY</Button>
          </Box>
          {loading ? (
            <Typography>Loading patients...</Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left", width: "10%" }}>Patient ID</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left", width: "30%" }}>Full Name</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left", width: "20%" }}>Date of Birth</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left", width: "15%" }}>Gender</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left", width: "25%" }}>Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((p) => (
                      <tr key={p.patient_id} onClick={() => handlePatientSelect(p)} style={{ cursor: "pointer", '&:hover': { background: "#e0e0e0" } }}>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>{p.patient_id}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>{p.full_name}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>{formatDateDisplay(p.dob)}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>{p.gender}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>{formatDateDisplay(p.date_registered)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: "8px", textAlign: "center" }}>No patients found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Box>
          )}
        </Box>
      )}

      {/* Add Patient Form */}
      {activeTab === 'addPatient' && (
        <Box sx={{ p: 3, background: "#fff", borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom>Register New Patient</Typography>
          <Grid container spacing={2} component="form" onSubmit={handleAddPatient}>
            <Grid item xs={12} sm={6}>
              <TextField label="Full Name" name="full_name" value={formData.full_name} onChange={handleInputChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} fullWidth InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Gender" name="gender" value={formData.gender} onChange={handleInputChange} fullWidth required>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact No." name="contact_no" value={formData.contact_no} onChange={handleInputChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="PhilHealth ID" name="philhealth_id" value={formData.philhealth_id} onChange={handleInputChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" name="address" value={formData.address} onChange={handleInputChange} fullWidth multiline rows={2} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Guardian Name" name="guardian_name" value={formData.guardian_name} onChange={handleInputChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Guardian Contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleInputChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
                {loading ? "Registering..." : "Register Patient"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === "record" && selectedPatient && (
        <Box className="dashboard-content">
          {renderPatientDetails()}
          {renderVisitLogging()}
          {renderVisitHistory()}
        </Box>
      )}
    </DashboardLayout>
  );
};

export default NurseDashboard;

