import { useEffect, useState } from "react";
import axios from "axios";
import {
  Typography, Button, Box, Paper, TextField, Grid, MenuItem, IconButton, Select, TableCell, TableRow, TableContainer, Table, TableBody, TableHead
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
    pfirst_name: "",
    plast_name: "",
    dob: "",
    gender: "",
    pcontact_info: "",
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
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/doctors", getAuthHeaders());
      setDoctors(res.data);
      console.log("Fetched doctors:", res.data); // Log fetched doctors
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  const applyFilter = (type) => {
    setFilterType(type);
    let currentFilteredPatients = patients;

    if (search.trim()) {
      // If there's a search term, filter by name/ID on ALL patients
      currentFilteredPatients = currentFilteredPatients.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.patient_id?.toString().includes(search.toLowerCase())
      );
    } else {
      // If no search term, apply date filter
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
      if (startDate) {
        currentFilteredPatients = currentFilteredPatients.filter(p => new Date(p.date_registered) >= startDate);
      }
    }
    setFilteredPatients(currentFilteredPatients);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/patients", {
        pfirst_name: formData.pfirst_name,
        plast_name: formData.plast_name,
        dob: formData.dob,
        gender: formData.gender,
        pcontact_info: formData.pcontact_info,
        philhealth_id: formData.philhealth_id,
        guardian_name: formData.guardian_name,
        guardian_contact: formData.guardian_contact,
        address: formData.address,
      }, getAuthHeaders());
      alert("Patient registered successfully!");
      // Assuming the backend returns full_name, first_name, and last_name for the newly created patient
      setSelectedPatient({ ...res.data, full_name: `${formData.pfirst_name} ${formData.plast_name}`.trim() });
      setFormData({
        pfirst_name: "",
        plast_name: "",
        dob: "",
        gender: "",
        pcontact_info: "",
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
      console.log("Nurse ID (registered_by) from localStorage:", nurseId); // Debug log

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
    } finally {
      setVisitLogLoading(false);
    }
  };

  const fetchPatientVisits = async (patientId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/visits/${patientId}`, getAuthHeaders());
      console.log("Fetched patient visits:", res.data);
      setPatientVisits(res.data);
    } catch (error) {
      setPatientVisits([]);
      console.error("Error fetching patient visits:", error);
    }
  };

  const handleEditPatient = () => {
    setIsEditing(true);
    // Split the full name into first and last name for editing
    const nameParts = (selectedPatient.full_name || '').split(' ');
    const firstName = nameParts.slice(0, -1).join(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    setEditPatientData({
      ...selectedPatient,
      dob: formatDateForInput(selectedPatient.dob),
      first_name: firstName,
      last_name: lastName,
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditPatientData((prev) => ({
      ...prev, [name]: value,
    }));
  };

  const handleSavePatient = async () => {
    if (!editPatientData) return;
    try {
      const patientId = editPatientData.patient_id;
      await axios.put(
        `http://localhost:5000/api/patients/${patientId}`,
        {
          pfirst_name: editPatientData.first_name,
          plast_name: editPatientData.last_name,
          dob: editPatientData.dob,
          gender: editPatientData.gender,
          pcontact_info: editPatientData.pcontact_info,
          philhealth_id: editPatientData.philhealth_id,
          guardian_name: editPatientData.guardian_name,
          guardian_contact: editPatientData.guardian_contact,
          address: editPatientData.address,
        },
        getAuthHeaders()
      );
      alert("Patient updated successfully!");
      setIsEditing(false);
      setSelectedPatient({ ...editPatientData, full_name: `${editPatientData.first_name} ${editPatientData.last_name}`.trim() });
      fetchPatients();
    } catch (error) {
      alert("Error updating patient: " + (error.response?.data?.message || error.message));
    }
  };

  const getDisplayedPatients = () => {
    return filteredPatients;
  };

  const navigationTabs = [
    { value: "viewPatients", label: "View Patients" },
    { value: "addPatient", label: "Add Patient" },
  ];

  const createButtonOptions = [
    { value: "logVisit", label: "Log Visit" },
    { value: "editPatient", label: "Edit Patient" },
    { value: "viewVisitHistory", label: "View Visit History" },
  ];

  const handleNavAddPatient = () => {
    setActiveTab('addPatient');
    setSelectedPatient(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("relatedId");
    navigate("/login");
  };

  const renderPatientDetails = () => (
    <Box sx={{ p: 3 }}>
      {selectedPatient ? (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Patient Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Patient ID:</strong> {selectedPatient.patient_id}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Full Name:</strong> {selectedPatient.full_name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Date of Birth:</strong> {formatDateDisplay(selectedPatient.dob)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Gender:</strong> {selectedPatient.gender}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Contact Info:</strong> {selectedPatient.pcontact_info}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>PhilHealth ID:</strong> {selectedPatient.philhealth_id || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Guardian Name:</strong> {selectedPatient.guardian_name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Guardian Contact:</strong> {selectedPatient.guardian_contact || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={12}>
              <Typography variant="body1"><strong>Address:</strong> {selectedPatient.address || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleEditPatient} sx={{ mr: 2 }}>
                Edit Patient
              </Button>
              <Button variant="contained" onClick={() => setActiveTab('record')}>
                Log Visit/View Medical History
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Typography>Select a patient to view details.</Typography>
      )}

      {isEditing && selectedPatient && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Edit Patient Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="first_name"
                value={editPatientData?.first_name || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                name="last_name"
                value={editPatientData?.last_name || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of Birth"
                name="dob"
                type="date"
                value={editPatientData?.dob || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Gender"
                name="gender"
                value={editPatientData?.gender || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact No."
                name="pcontact_info"
                value={editPatientData?.pcontact_info || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="PhilHealth ID"
                name="philhealth_id"
                value={editPatientData?.philhealth_id || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Guardian Name"
                name="guardian_name"
                value={editPatientData?.guardian_name || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Guardian Contact"
                name="guardian_contact"
                value={editPatientData?.guardian_contact || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <TextField
                label="Address"
                name="address"
                value={editPatientData?.address || ''}
                onChange={handleEditInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleSavePatient} sx={{ mr: 2 }}>
                Save Changes
              </Button>
              <Button variant="outlined" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );

  const renderAddPatient = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Register New Patient</Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleAddPatient}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="pfirst_name"
                value={formData.pfirst_name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                name="plast_name"
                value={formData.plast_name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact No."
                name="pcontact_info"
                value={formData.pcontact_info}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="PhilHealth ID (Optional)"
                name="philhealth_id"
                value={formData.philhealth_id}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Guardian Name (Optional)"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Guardian Contact (Optional)"
                name="guardian_contact"
                value={formData.guardian_contact}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Register Patient
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );

  const renderPatientTable = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Patient List</Typography>
        <Box>
          <Button
            variant={filterType === 'weekly' ? 'contained' : 'outlined'}
            onClick={() => applyFilter('weekly')}
            sx={{ mr: 1 }}
          >
            Weekly
          </Button>
          <Button
            variant={filterType === 'monthly' ? 'contained' : 'outlined'}
            onClick={() => applyFilter('monthly')}
            sx={{ mr: 1 }}
          >
            Monthly
          </Button>
          <Button
            variant={filterType === 'yearly' ? 'contained' : 'outlined'}
            onClick={() => applyFilter('yearly')}
          >
            Yearly
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Typography>Loading patients...</Typography>
      ) : (
        <Paper elevation={3} sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Patient ID</th>
                <th style={tableHeaderStyle}>Full Name</th>
                <th style={tableHeaderStyle}>Date of Birth</th>
                <th style={tableHeaderStyle}>Gender</th>
                <th style={tableHeaderStyle}>Registered On</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getDisplayedPatients().length > 0 ? (
                getDisplayedPatients().map((patient) => (
                  <TableRow key={patient.patient_id}>
                    <TableCell sx={tableCellStyle}>{patient.patient_id}</TableCell>
                    <TableCell sx={tableCellStyle}>{patient.full_name}</TableCell>
                    <TableCell sx={tableCellStyle}>{patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell sx={tableCellStyle}>{patient.gender}</TableCell>
                    <TableCell sx={tableCellStyle}>{formatDateDisplay(patient.date_registered)}</TableCell>
                    <TableCell sx={tableCellStyle}>
                      <Button
                        variant="contained"
                        onClick={() => handlePatientSelect(patient)}
                        size="small"
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    No patients found.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </table>
        </Paper>
      )}
    </Box>
  );

  const renderRecordTab = () => (
    <Box sx={{ p: 3 }}>
      <Button variant="outlined" onClick={() => setActiveTab('viewPatients')} sx={{ mb: 2 }}>
        Back to Patient List
      </Button>
      {selectedPatient ? (
        <>
          <Typography variant="h6" gutterBottom>
            Medical History for {selectedPatient.full_name} (ID: {selectedPatient.patient_id})
          </Typography>
          {renderVisitLogging()}
          {renderVisitHistory()}
        </>
      ) : (
        <Typography>Please select a patient to view/log medical history.</Typography>
      )}
    </Box>
  );

  const tableHeaderStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    background: '#f2f2f2',
    textAlign: 'left',
  };

  const tableCellStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
  };

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
                {`Dr. ${doctor.sfirst_name || ''} ${doctor.slast_name || ''}`.trim()}
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
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Visit History
      </Typography>
      {patientVisits.length > 0 ? (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeaderStyle}>Visit ID</TableCell>
                <TableCell sx={tableHeaderStyle}>Date</TableCell>
                <TableCell sx={tableHeaderStyle}>Purpose</TableCell>
                <TableCell sx={tableHeaderStyle}>Attending Doctor</TableCell>
                <TableCell sx={tableHeaderStyle}>Registered By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patientVisits.map((visit) => (
                <TableRow key={visit.visit_id}>
                  <TableCell sx={tableCellStyle}>{visit.visit_id}</TableCell>
                  <TableCell sx={tableCellStyle}>{new Date(visit.visit_date).toLocaleDateString()}</TableCell>
                  <TableCell sx={tableCellStyle}>{visit.visit_purpose}</TableCell>
                  <TableCell sx={tableCellStyle}>{visit.doctor_name}</TableCell>
                  <TableCell sx={tableCellStyle}>{visit.registered_by_full_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No visit history found for this patient.</Typography>
      )}
    </Box>
  );

  return (
    <DashboardLayout
      title="Nurse Dashboard"
      username={localStorage.getItem("username")}
      role={localStorage.getItem("role")}
      onLogout={handleLogout}
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box>
            <Button
              variant={activeTab === 'viewPatients' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('viewPatients')}
              sx={{ mr: 1 }}
            >
              View Patients
            </Button>
            <Button
              variant={activeTab === 'addPatient' ? 'contained' : 'outlined'}
              onClick={handleNavAddPatient}
            >
              Add Patient
            </Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Search patients by name or ID"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mr: 1 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <IconButton onClick={handleSearch} color="primary">
              <SearchIcon />
            </IconButton>
          </Box>
        </Box>

        {
          activeTab === 'viewPatients' ? renderPatientTable() :
            activeTab === 'addPatient' ? renderAddPatient() :
              activeTab === 'record' ? renderRecordTab() : null
        }
      </Box>
    </DashboardLayout>
  );
};

export default NurseDashboard;

