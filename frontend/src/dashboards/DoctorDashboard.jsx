import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  Paper,
  Typography,
  TextField,
  Box,
  Button,
} from "@mui/material";
// import "./DoctorDashboard.css"; // Commented out as styles are now in DashboardLayout.css

function DoctorDashboard() {
  const [activeView, setActiveView] = useState('assignedPatients');
  const [patients, setPatients] = useState([]);
  const [pendingTreatmentVisits, setPendingTreatmentVisits] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allTreatments, setAllTreatments] = useState([]);
  const [showAddTreatmentForm, setShowAddTreatmentForm] = useState(false);
  const [showEditTreatmentForm, setShowEditTreatmentForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [newTreatmentDetails, setNewTreatmentDetails] = useState({
    treatment_name: "",
    cost: "",
    treatment_description: "",
  });
  const [logTreatmentDetails, setLogTreatmentDetails] = useState({
    name: "",
    cost: "",
    description: "",
  });
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editPatientData, setEditPatientData] = useState(null);
  const [patientPaymentStatus, setPatientPaymentStatus] = useState(null);
  const [showBillingSlip, setShowBillingSlip] = useState(false);
  const [showMedicalAbstract, setShowMedicalAbstract] = useState(false);
  const [showVisitHistory, setShowVisitHistory] = useState(false);
  const [showEditVisitForm, setShowEditVisitForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [reportPeriods] = useState(["weekly", "monthly", "yearly"]);
  const [patientReports, setPatientReports] = useState({
    totalPatients: 0,
    treatments: [],
    diagnoses: [],
  });
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:5000/api";

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeView === 'assignedPatients') {
          await fetchPendingTreatmentVisits();
        } else if (activeView === 'availableTreatments') {
          await fetchAllTreatments();
        } else if (activeView === 'patientReports') {
          await fetchPatientReports(reportPeriod);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch initial data.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [activeView, reportPeriod]);

  const fetchPendingTreatmentVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/pending-treatments-visits`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPendingTreatmentVisits(data);
    } catch (err) {
      console.error("Error fetching pending treatment visits:", err);
      setError("Error fetching assigned visits for treatment.");
      setPendingTreatmentVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTreatments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/treatments`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const formattedTreatments = data.map(treatment => ({
        ...treatment,
        price: treatment.cost,
        purpose: treatment.treatment_description,
      }));
      setAllTreatments(formattedTreatments);
    } catch (err) {
      console.error("Error fetching treatments:", err);
      setError("Error fetching available treatments.");
      setAllTreatments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientReports = async (period) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/reports?period=${period}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched patient reports:', data); // Debug log
      
      setPatientReports({
        totalPatients: data.totalPatients || 0,
        treatments: data.treatments || [],
        diagnoses: data.diagnoses || []
      });
    } catch (err) {
      console.error("Error fetching patient reports:", err);
      setError(err.message || "Error fetching patient reports.");
      setPatientReports({
        totalPatients: 0,
        treatments: [],
        diagnoses: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (view, patientDetails = null, currentVisitId = null) => {
    setActiveView(view);
    setSearchTerm("");
    setPatients([]);
    setAllPatients([]);
    setShowBillingSlip(false);
    setShowMedicalAbstract(false);
    setShowVisitHistory(false);
    setShowAddTreatmentForm(false);
    setShowEditTreatmentForm(false);
    setIsEditingPatient(false);
    setNewTreatmentDetails({
      treatment_name: "",
      cost: "",
      treatment_description: "",
    });
    setNewDiagnosis("");

    console.log("Navigated to:", view, "Selected Visit ID:", currentVisitId);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      handleNavigation('assignedPatients');
      return;
    }
    setLoading(true);
    setError(null);
    console.log("Searching for:", searchTerm);
    try {
      const response = await fetch(`${API_BASE_URL}/patients?search=${encodeURIComponent(searchTerm)}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Search results:", data);
      setAllPatients(data);
      handleNavigation('allPatientsSearch');
    } catch (err) {
      console.error("Error searching patients:", err);
      setError("Error searching patients.");
      setAllPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient, visitId = null) => {
    console.log("handleSelectPatient called with:", { initialPatient: patient, initialVisitId: visitId });
    
    setLoading(true);
    setError(null);
    setLogTreatmentDetails({ name: "", cost: "", description: "" });
    setNewDiagnosis("");
    setShowBillingSlip(false);
    setShowMedicalAbstract(false);
    setShowVisitHistory(false);
    setShowAddTreatmentForm(false);
    setShowEditTreatmentForm(false);
    setIsEditingPatient(false);

    try {
      const response = await fetch(`${API_BASE_URL}/doctor/patients/${patient.patient_id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Backend raw patient details:", data); // New debug log

      const formattedData = {
          ...data,
          // Ensure date_of_birth is in YYYY-MM-DD format for input type="date"
          date_of_birth: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
          // Ensure all fields have a fallback empty string to prevent uncontrolled input warnings
          full_name: data.full_name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          gender: data.gender || '',
          contact_no: data.contact_info || '',
          philhealth_no: data.philhealth_id || '',
          guardian: data.guardian_name || '',
          guardian_contact: data.guardian_contact || '',
          home_address: data.address || '',
          date_registered: data.date_registered || '',
          // Directly use the visits array from the backend, which now includes treatments
          visits: data.visits || []
      };
      
      console.log("Formatted patient data for selectedPatient:", formattedData); // New debug log
      
      setSelectedPatient(formattedData);
      setEditPatientData(formattedData);
      setSelectedVisitId(visitId);

      const paymentResponse = await fetch(`${API_BASE_URL}/patient/${patient.patient_id}/payment-status`, {
        headers: getAuthHeaders(),
      });
      if (!paymentResponse.ok) {
        throw new Error(`HTTP error! status: ${paymentResponse.status}`);
      }
      const paymentData = await paymentResponse.json();
      console.log("Fetched payment status:", paymentData);
      setPatientPaymentStatus(paymentData.is_paid ? "Paid" : "Unpaid");

      setActiveView('patientRecord');

    } catch (err) {
      console.error("Error selecting patient:", err);
      setError("Error selecting patient or fetching details.");
    } finally {
      setLoading(false);
    }
  };

  const handleTreatmentChange = (e) => {
    const { name, value } = e.target;
    setLogTreatmentDetails(prev => {
      const newState = { ...prev, [name]: value };
      if (name === "name" && value.trim() !== "") {
        const matchedTreatment = allTreatments.find(
          (t) => t.treatment_name.toLowerCase() === value.toLowerCase()
        );
        if (matchedTreatment) {
          newState.cost = matchedTreatment.price;
          newState.description = matchedTreatment.purpose;
        }
      }
      return newState;
    });
  };

  const handleAddAvailableTreatment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/treatments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          treatment_name: newTreatmentDetails.treatment_name,
          cost: parseFloat(newTreatmentDetails.cost),
          treatment_description: newTreatmentDetails.treatment_description,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      alert("New treatment added successfully!");
      setNewTreatmentDetails({ treatment_name: "", cost: "", treatment_description: "" });
      fetchAllTreatments();
    } catch (err) {
      console.error("Error adding new treatment:", err);
      setError(`Error adding new treatment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogTreatmentAndDiagnosis = async (e) => {
    e.preventDefault(); // Prevent page refresh
    if (!selectedPatient || !selectedVisitId || !logTreatmentDetails.name || !logTreatmentDetails.cost || !newDiagnosis) {
      alert("Please fill in all fields for treatment and diagnosis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/doctor/treatments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patientId: selectedPatient.patient_id,
          visitId: selectedVisitId,
          name: logTreatmentDetails.name,
          cost: parseFloat(logTreatmentDetails.cost),
          treatment_description: logTreatmentDetails.description,
          diagnosis: newDiagnosis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error response:", errorData);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }

      alert("Treatment and diagnosis logged successfully!");
      // Clear form fields after successful submission
      setLogTreatmentDetails({ name: "", cost: "", description: "" });
      setNewDiagnosis("");
      // Refresh patient data to show updated visits
      await handleSelectPatient(selectedPatient, selectedVisitId);
      // Refresh the pending treatment visits list
      await fetchPendingTreatmentVisits();
    } catch (err) {
      console.error("Error logging treatment and diagnosis:", err);
      setError(`Error logging treatment and diagnosis: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = () => {
    // Ensure we are in the patientRecord view before showing the edit form
    handleNavigation('patientRecord');
    setEditPatientData({ ...selectedPatient });
    setIsEditingPatient(true);
  };

  const handleEditPatientChange = (e) => {
    const { name, value } = e.target;
    setEditPatientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePatient = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${selectedPatient.patient_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: editPatientData.full_name,
          dob: editPatientData.date_of_birth,
          gender: editPatientData.gender,
          contact_info: editPatientData.contact_no,
          philhealth_id: editPatientData.philhealth_no,
          guardian_name: editPatientData.guardian,
          guardian_contact: editPatientData.guardian_contact,
          address: editPatientData.home_address,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedPatient = await response.json();
      setSelectedPatient(updatedPatient);
      setIsEditingPatient(false);
      alert("Patient information updated successfully.");
    } catch (err) {
      console.error("Error updating patient info:", err);
      setError("Error updating patient information.");
    } finally {
      setLoading(false);
    }
  };

  // New function to handle viewing visit history
  const handleViewVisitHistory = () => {
    // Ensure we are in the patientRecord view before showing visit history
    handleNavigation('patientRecord');
    setShowVisitHistory(true);
  };

  const generateBillingSlip = () => {
    // This is a placeholder for actual billing slip generation logic
    if (selectedPatient) {
      alert(`Generating billing slip for ${selectedPatient.full_name}`);
      setShowBillingSlip(true);
    } else {
      alert("Please select a patient first.");
    }
  };

  const generateMedicalAbstract = async () => {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/medical-abstract/${selectedPatient.patient_id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // For now, just display the data in an alert or console
      alert("Medical Abstract: " + JSON.stringify(data, null, 2));
      setShowMedicalAbstract(true);
    } catch (err) {
      console.error("Error generating medical abstract:", err);
      setError("Error generating medical abstract.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (treatment) => {
    setEditingTreatment(treatment);
    setShowEditTreatmentForm(true);
  };

  const handleEditTreatmentChange = (e) => {
    const { name, value } = e.target;
    setEditingTreatment(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateTreatment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/treatments/${editingTreatment.treatment_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          treatment_name: editingTreatment.treatment_name,
          cost: editingTreatment.price,
          treatment_description: editingTreatment.purpose
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert("Treatment updated successfully!");
      setShowEditTreatmentForm(false);
      setEditingTreatment(null);
      fetchAllTreatments(); // Refresh the list of treatments
    } catch (err) {
      console.error("Error updating treatment:", err);
      setError("Error updating treatment.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewTreatmentDetailsChange = (e) => {
    const { name, value } = e.target;
    setNewTreatmentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditVisitClick = (visit) => {
    setEditingVisit(visit);
    setShowEditVisitForm(true);
  };

  const handleEditVisitChange = (e) => {
    const { name, value } = e.target;
    setEditingVisit(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateVisit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/visits/${editingVisit.visit_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingVisit),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert("Visit updated successfully!");
      setShowEditVisitForm(false);
      setEditingVisit(null);
      fetchPendingTreatmentVisits(); // Refresh list
    } catch (err) {
      console.error("Error updating visit:", err);
      setError("Error updating visit.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    handleNavigation('assignedPatients');
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const navigationTabs = [
    { id: "assignedPatients", name: "Assigned Patients" },
    { id: "availableTreatments", name: "Available Treatments" },
    { id: "medicalAbstract", name: "Medical Abstract" },
    { id: "patientReports", name: "Patient Reports" },
  ];

  return (
    <DashboardLayout
      title="PATIENT BILLING MANAGEMENT SYSTEM"
      navigationTabs={navigationTabs}
      currentTab={activeView}
      onTabChange={handleNavigation}
      showSearchBar={true}
      onSearch={(value) => setSearchTerm(value)}
      searchPlaceholder="Search Patient Here"
      onLogout={() => {
        localStorage.removeItem("token");
        navigate("/login");
      }}
    >
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">Error: {error}</div>}

      {activeView === 'assignedPatients' && (
        <div className="dashboard-section">
          <h2 className="section-title">Assigned Patients (Visits Needing Treatment)</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visit ID</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Registered by</th>
                  <th>Visit Date</th>
                  <th>Visit Purpose</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTreatmentVisits.length > 0 ? (
                  pendingTreatmentVisits.map((visit) => (
                    <tr key={visit.visit_id}>
                      <td>{visit.visit_id}</td>
                      <td>{visit.patient_name}</td>
                      <td>{visit.age !== null ? visit.age : 'N/A'}</td>
                      <td>{visit.gender}</td>
                      <td>{visit.registered_by_doctor_name}</td>
                      <td>{new Date(visit.visit_date).toLocaleDateString()}</td>
                      <td>{visit.visit_purpose}</td>
                      <td className="actions-column">
                        <button onClick={() => handleSelectPatient(visit, visit.visit_id)}>Input Treatment & Diagnosis</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No assigned patients needing treatment found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'patientRecord' && selectedPatient && (
        <div className="dashboard-section">
          <h2 className="section-title">Patient Record: {selectedPatient.full_name}</h2>
          <div className="patient-details-grid">
            <div className="detail-item">
              <b>Patient ID:</b> {selectedPatient.patient_id}
            </div>
            <div className="detail-item">
              <b>Date of Birth:</b> {selectedPatient.date_of_birth && new Date(selectedPatient.date_of_birth).toString() !== 'Invalid Date' ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : 'N/A'}
            </div>
            <div className="detail-item">
              <b>Gender:</b> {selectedPatient.gender}
            </div>
            <div className="detail-item">
              <b>Date Registered:</b> {new Date(selectedPatient.date_registered).toLocaleDateString()}
            </div>
            <div className="detail-item">
              <b>Contact No:</b> {selectedPatient.contact_no}
            </div>
            <div className="detail-item">
              <b>PhilHealth No:</b> {selectedPatient.philhealth_no || 'N/A'}
            </div>
            <div className="detail-item">
              <b>Guardian:</b> {selectedPatient.guardian || 'N/A'}
            </div>
            <div className="detail-item">
              <b>Guardian's Contact:</b> {selectedPatient.guardian_contact || 'N/A'}
            </div>
            <div className="detail-item full-width">
              <b>Home Address:</b> {selectedPatient.home_address || 'N/A'}
            </div>
            <div className="detail-item full-width">
              <b>Payment Status:</b> {patientPaymentStatus ? patientPaymentStatus.status : 'N/A'}
            </div>
          </div>

          <div className="button-group">
            <button onClick={handleEditPatient}>Edit Patient</button>
            <button onClick={handleViewVisitHistory}>View Visit History</button>
            <button onClick={generateMedicalAbstract}>Generate Medical Abstract</button>
            <button onClick={generateBillingSlip}>Generate Billing Slip</button>
          </div>

          {isEditingPatient && (
            <div className="form-container">
              <h3>Edit Patient Information</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleSavePatient(); }}>
                <label>Full Name:</label>
                <input type="text" name="full_name" value={editPatientData.full_name} onChange={handleEditPatientChange} required />
                <label>Date of Birth:</label>
                <input type="date" name="date_of_birth" value={editPatientData.date_of_birth} onChange={handleEditPatientChange} required />
                <label>Gender:</label>
                <input type="text" name="gender" value={editPatientData.gender} onChange={handleEditPatientChange} required />
                <label>Contact No:</label>
                <input type="text" name="contact_no" value={editPatientData.contact_no} onChange={handleEditPatientChange} required />
                <label>PhilHealth No:</label>
                <input type="text" name="philhealth_no" value={editPatientData.philhealth_no} onChange={handleEditPatientChange} />
                <label>Guardian:</label>
                <input type="text" name="guardian" value={editPatientData.guardian} onChange={handleEditPatientChange} />
                <label>Guardian's Contact:</label>
                <input type="text" name="guardian_contact" value={editPatientData.guardian_contact} onChange={handleEditPatientChange} />
                <label>Home Address:</label>
                <input type="text" name="home_address" value={editPatientData.home_address} onChange={handleEditPatientChange} required />
                <div className="form-actions">
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={() => setIsEditingPatient(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {showVisitHistory && (
            <div className="visit-history-container">
              <h3>Visit History for {selectedPatient.full_name}</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visit ID</th>
                      <th>Visit Date</th>
                      <th>Purpose</th>
                      <th>Treatments</th>
                      <th>Diagnosis</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPatient.visits && selectedPatient.visits.length > 0 ? (
                      selectedPatient.visits.map((visit) => (
                        <tr key={visit.visit_id}>
                          <td>{visit.visit_id}</td>
                          <td>{new Date(visit.visit_date).toLocaleDateString()}</td>
                          <td>{visit.visit_purpose}</td>
                          <td>{visit.treatments.map(t => t.treatment_name).join(", ")}</td>
                          <td>{visit.diagnosis}</td>
                          <td className="actions-column">
                            <button onClick={() => handleEditVisitClick(visit)}>Edit Visit</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">No visit history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setShowVisitHistory(false)}>Close History</button>
            </div>
          )}

          {showEditVisitForm && editingVisit && (
            <div className="form-container">
              <h3>Edit Visit Details</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateVisit(); }}>
                <label>Visit Purpose:</label>
                <input type="text" name="visit_purpose" value={editingVisit.visit_purpose} onChange={handleEditVisitChange} required />
                <label>Diagnosis:</label>
                <input type="text" name="diagnosis" value={editingVisit.diagnosis} onChange={handleEditVisitChange} required />
                <div className="form-actions">
                  <button type="submit">Save Visit Changes</button>
                  <button type="button" onClick={() => setShowEditVisitForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {selectedVisitId && (
            <div className="form-container">
              <h3>Input Treatment & Diagnosis for Visit ID: {selectedVisitId}</h3>
              <form onSubmit={handleLogTreatmentAndDiagnosis}>
                <label>Treatment Name:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={logTreatmentDetails.name || ''} 
                  onChange={handleTreatmentChange} 
                  required 
                />
                <label>Cost:</label>
                <input 
                  type="number" 
                  name="cost" 
                  value={logTreatmentDetails.cost || ''} 
                  onChange={handleTreatmentChange} 
                  required 
                />
                <label>Description:</label>
                <input 
                  type="text" 
                  name="description" 
                  value={logTreatmentDetails.description || ''} 
                  onChange={handleTreatmentChange} 
                />
                <label>Diagnosis:</label>
                <input 
                  type="text" 
                  name="diagnosis" 
                  value={newDiagnosis || ''} 
                  onChange={(e) => setNewDiagnosis(e.target.value)} 
                  required 
                />
                <div className="form-actions">
                  <button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Add Treatment & Diagnosis"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showBillingSlip && selectedPatient && (
            <div className="billing-slip-preview">
              <h3>Billing Slip Preview for {selectedPatient.full_name}</h3>
              {/* This is a placeholder for actual billing slip content */}
              <p>Billing ID: [Auto-generated]</p>
              <p>Patient Name: {selectedPatient.full_name}</p>
              <p>Total Amount: $XXXX.XX</p>
              <p>Treatments: ...</p>
              <p>Diagnoses: ...</p>
              <button onClick={handlePrintSlip}>Print Slip</button>
              <button onClick={() => setShowBillingSlip(false)}>Close Preview</button>
            </div>
          )}

          {showMedicalAbstract && selectedPatient && (
            <div className="medical-abstract-preview">
              <h3>Medical Abstract for {selectedPatient.full_name}</h3>
              <p>Abstract content will go here.</p>
              <button onClick={() => setShowMedicalAbstract(false)}>Close Abstract</button>
            </div>
          )}
        </div>
      )}

      {activeView === 'allPatientsSearch' && (
        <div className="dashboard-section">
          <h2 className="section-title">Search Results</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Full Name</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Contact No</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allPatients.length > 0 ? (
                  allPatients.map((patient) => (
                    <tr key={patient.patient_id}>
                      <td>{patient.patient_id}</td>
                      <td>{patient.full_name}</td>
                      <td>{new Date(patient.date_of_birth).toLocaleDateString()}</td>
                      <td>{patient.gender}</td>
                      <td>{patient.contact_no}</td>
                      <td className="actions-column">
                        <button onClick={() => handleSelectPatient(patient)}>View Record</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No patients found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button onClick={handleBackToDashboard}>Back to Dashboard</button>
        </div>
      )}

      {activeView === 'availableTreatments' && (
        <div className="dashboard-section">
          <h2 className="section-title">Available Treatments</h2>
          <button onClick={() => setShowAddTreatmentForm(true)} className="add-new-button">Add New Treatment</button>
          {showAddTreatmentForm && (
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>Add New Treatment</Typography>
              <TextField
                label="Treatment Name"
                fullWidth
                margin="normal"
                name="treatment_name"
                value={newTreatmentDetails.treatment_name}
                onChange={handleNewTreatmentDetailsChange}
              />
              <TextField
                label="Price"
                fullWidth
                margin="normal"
                name="cost"
                type="number"
                value={newTreatmentDetails.cost}
                onChange={handleNewTreatmentDetailsChange}
              />
              <TextField
                label="Purpose"
                fullWidth
                margin="normal"
                name="treatment_description"
                value={newTreatmentDetails.treatment_description}
                onChange={handleNewTreatmentDetailsChange}
              />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="primary" onClick={handleAddAvailableTreatment} sx={{ mr: 1 }}>Save Treatment</Button>
                <Button variant="outlined" onClick={() => setShowAddTreatmentForm(false)}>Cancel</Button>
              </Box>
            </Paper>
          )}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Treatment Name</th>
                  <th>Price</th>
                  <th>Purpose</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allTreatments.length > 0 ? (
                  allTreatments.map((treatment) => (
                    <tr key={treatment.treatment_id}>
                      <td>{treatment.treatment_id}</td>
                      <td>{treatment.treatment_name}</td>
                      <td>{treatment.price}</td>
                      <td>{treatment.purpose}</td>
                      <td className="actions-column">
                        <button onClick={() => handleEditClick(treatment)}>Edit</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No treatments available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showEditTreatmentForm && editingTreatment && (
            <div className="form-container">
              <h3>Edit Treatment: {editingTreatment.treatment_name}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateTreatment(); }}>
                <label>Treatment Name:</label>
                <input type="text" name="treatment_name" value={editingTreatment.treatment_name} onChange={handleEditTreatmentChange} required />
                <label>Price:</label>
                <input type="number" name="price" value={editingTreatment.price} onChange={handleEditTreatmentChange} required />
                <label>Purpose:</label>
                <input type="text" name="purpose" value={editingTreatment.purpose} onChange={handleEditTreatmentChange} />
                <div className="form-actions">
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={() => setShowEditTreatmentForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeView === 'medicalAbstract' && (
        <div className="dashboard-section">
          <h2 className="section-title">Medical Abstract</h2>
          {!selectedPatient ? (
            <div className="search-section">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!searchTerm.trim()) {
                  setError("Please enter a search term");
                  return;
                }
                setLoading(true);
                setError(null);
                try {
                  const response = await fetch(`${API_BASE_URL}/patients?search=${encodeURIComponent(searchTerm)}`, {
                    headers: getAuthHeaders(),
                  });
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  const data = await response.json();
                  if (data.length === 0) {
                    setError("No patients found matching your search.");
                    return;
                  }
                  // Select the first patient from search results
                  await handleSelectPatient(data[0]);
                } catch (err) {
                  console.error("Error searching patients:", err);
                  setError(err.message || "Error searching patients.");
                } finally {
                  setLoading(false);
                }
              }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient by name or ID..."
                  disabled={loading}
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </button>
              </form>
              {error && <p className="error-message">{error}</p>}
              {allPatients.length > 0 && (
                <div className="search-results">
                  <h3>Search Results</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Patient ID</th>
                          <th>Full Name</th>
                          <th>Date of Birth</th>
                          <th>Gender</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPatients.map((patient) => (
                          <tr key={patient.patient_id}>
                            <td>{patient.patient_id}</td>
                            <td>{patient.full_name}</td>
                            <td>{new Date(patient.date_of_birth).toLocaleDateString()}</td>
                            <td>{patient.gender}</td>
                            <td>
                              <button 
                                onClick={async () => {
                                  setLoading(true);
                                  try {
                                    await handleSelectPatient(patient);
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                disabled={loading}
                              >
                                View Abstract
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="medical-abstract-content">
              <h3>Medical Abstract for {selectedPatient.full_name}</h3>
              <div className="patient-info">
                <p><strong>Patient ID:</strong> {selectedPatient.patient_id}</p>
                <p><strong>Date of Birth:</strong> {new Date(selectedPatient.date_of_birth).toLocaleDateString()}</p>
                <p><strong>Age:</strong> {selectedPatient.age} years</p>
                <p><strong>Gender:</strong> {selectedPatient.gender}</p>
              </div>
              
              <div className="medical-history">
                <h4>Medical History</h4>
                {selectedPatient.visits && selectedPatient.visits.length > 0 ? (
                  selectedPatient.visits.map(visit => (
                    <div key={visit.visit_id} className="visit-summary">
                      <h5>Visit Date: {new Date(visit.visit_date).toLocaleDateString()}</h5>
                      <p><strong>Purpose:</strong> {visit.visit_purpose}</p>
                      <p><strong>Diagnosis:</strong> {visit.visit_diagnosis || 'No diagnosis recorded'}</p>
                      <div className="treatments-list">
                        <h6>Treatments:</h6>
                        {selectedPatient.treatments
                          .filter(t => t.date === visit.visit_date)
                          .map(treatment => (
                            <div key={treatment.treatment_id} className="treatment-item">
                              <p><strong>{treatment.treatment_name}</strong></p>
                              <p>Cost: ${treatment.price}</p>
                              <p>Purpose: {treatment.purpose}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No visit history available for this patient.</p>
                )}
              </div>
              
              <div className="abstract-actions">
                <button onClick={() => setSelectedPatient(null)}>Back to Search</button>
                <button onClick={handlePrintSlip}>Print Abstract</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'patientReports' && (
        <div className="dashboard-section">
          <h2 className="section-title">Patient Reports</h2>
          <div className="report-period-selector">
            {reportPeriods.map(period => (
              <button 
                key={period} 
                onClick={() => setReportPeriod(period)} 
                className={reportPeriod === period ? "active" : ""}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <p>Loading reports...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="report-summary-grid">
              <div className="report-summary-card">
                <h3>Total Patients</h3>
                <p className="report-number">{patientReports.totalPatients}</p>
              </div>

              <div className="report-summary-card">
                <h3>Most Used Treatments</h3>
                {patientReports.treatments && patientReports.treatments.length > 0 ? (
                  <ul className="report-list">
                    {patientReports.treatments.map((treatment, index) => (
                      <li key={index}>
                        <span className="treatment-name">{treatment.name}</span>
                        <span className="treatment-count">({treatment.count} times)</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No treatment data available</p>
                )}
              </div>

              <div className="report-summary-card">
                <h3>Common Diagnoses</h3>
                {patientReports.diagnoses && patientReports.diagnoses.length > 0 ? (
                  <ul className="report-list">
                    {patientReports.diagnoses.map((diagnosis, index) => (
                      <li key={index}>
                        <span className="diagnosis-name">{diagnosis.name}</span>
                        <span className="diagnosis-count">({diagnosis.count} times)</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No diagnosis data available</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default DoctorDashboard;