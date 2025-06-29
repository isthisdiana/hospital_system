import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  Paper,
  Typography,
  TextField,
  Box,
  Button,
  Grid,
  MenuItem,
  IconButton,
  Select,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
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
  const [currentTreatmentInput, setCurrentTreatmentInput] = useState({
    name: "",
    cost: 0,
    description: "",
    quantity: 1,
    subtotal: 0,
  });
  const [addedTreatments, setAddedTreatments] = useState([]);
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editPatientData, setEditPatientData] = useState(null);
  const [patientPaymentStatus, setPatientPaymentStatus] = useState(null);
  const [showBillingSlip, setShowBillingSlip] = useState(false);
  const [showMedicalAbstract, setShowMedicalAbstract] = useState(false);
  const [medicalAbstractData, setMedicalAbstractData] = useState(null);
  const [showVisitHistory, setShowVisitHistory] = useState(false);
  const [showEditVisitForm, setShowEditVisitForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [reportPeriods] = useState(["weekly", "monthly", "yearly"]);
  const [patientReports, setPatientReports] = useState({
    totalPatients: 0,
    periodVisits: 0,
    treatments: [],
    diagnoses: [],
  });
  const [billingSlipData, setBillingSlipData] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:5000/api";

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log("Token from localStorage in getAuthHeaders:", token);
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
        await fetchAllTreatments(); // Always fetch all treatments on component mount
        if (activeView === 'assignedPatients') {
          await fetchPendingTreatmentVisits();
        } else if (activeView === 'availableTreatments') {
          // fetchAllTreatments is already called above, so no need to call again here
        } else if (activeView === 'patientReports') {
          await fetchPatientReports(reportPeriod);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch initial data.");
      } finally {
        setLoading(false);
      }
    };

    let intervalId;
    if (activeView === 'patientReports') {
      fetchPatientReports(reportPeriod); // Initial fetch
      intervalId = setInterval(() => fetchPatientReports(reportPeriod), 60000); // Auto-update every 60 seconds
    } else {
      fetchInitialData(); // For other views, retain original fetch behavior
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
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
    console.log("Attempting to fetch all treatments...");
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      console.log("Headers being sent with treatments request:", headers);
      const res = await axios.get(`${API_BASE_URL}/treatments`, { headers: headers });
      setAllTreatments(res.data);
      console.log("Fetched all treatments:", res.data);
    } catch (error) {
      console.error("Error fetching treatments:", error);
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
      console.log('Frontend - Fetched patient reports RAW data:', data); // Debug log to see raw data
      
      setPatientReports({
        totalPatients: data.totalPatients || 0,
        periodVisits: data.periodVisits || 0,
        treatments: data.treatments || [],
        diagnoses: data.diagnoses || []
      });
    } catch (err) {
      console.error("Error fetching patient reports:", err);
      setError(err.message || "Error fetching patient reports.");
      setPatientReports({
        totalPatients: 0,
        periodVisits: 0,
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
    setBillingSlipData(null);

    console.log("Navigated to:", view, "Selected Visit ID:", currentVisitId);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = async () => {
    setAllPatients([]);
    if (!searchTerm.trim()) {
      handleNavigation('assignedPatients');
      return;
    }
    setLoading(true);
    setError(null);
    console.log("Searching for:", searchTerm);
    try {
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const staffId = decodedToken.staffId;
      
      const response = await fetch(
        `${API_BASE_URL}/patients?search=${encodeURIComponent(searchTerm.trim())}`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Search results:", data);
      if (data.length === 0) {
        setError("No patients found matching your search.");
        setAllPatients([]);
      } else {
        // Map over the data to ensure each patient object has a 'full_name' property
        const formattedPatients = data.map(patient => ({
          ...patient,
          full_name: patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        }));
        setAllPatients(formattedPatients);
        handleNavigation('allPatientsSearch');
      }
    } catch (err) {
      console.error("Error searching patients:", err);
      setError("Error searching patients. Please try again.");
      setAllPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient, visitId = null) => {
    console.log("handleSelectPatient called with:", { initialPatient: patient, initialVisitId: visitId });
    
    setLoading(true);
    setError(null);
    setCurrentTreatmentInput({ name: "", cost: 0, description: "", quantity: 1, subtotal: 0 });
    setAddedTreatments([]);
    setNewDiagnosis("");
    setShowBillingSlip(false);
    setShowMedicalAbstract(false);
    setShowVisitHistory(false);
    setShowAddTreatmentForm(false);
    setShowEditTreatmentForm(false);
    setIsEditingPatient(false);
    setBillingSlipData(null);

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
          full_name: data.full_name || '', // Keep for display
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

      // Log the visits data specifically
      console.log("Frontend - Formatted visits data for selected patient:", formattedData.visits);

      // For editing, split full_name into first and last name
      const nameParts = (formattedData.full_name || '').split(' ');
      const firstNameForEdit = nameParts.slice(0, -1).join(' ');
      const lastNameForEdit = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      console.log("Formatted patient data for selectedPatient:", formattedData); // New debug log
      console.log("Frontend - Visits array in formattedData:", formattedData.visits); // Detailed log for visits
      
      setSelectedPatient(formattedData);
      setEditPatientData({
        ...formattedData,
        full_name: undefined, // Remove full_name from edit data
        first_name: firstNameForEdit,
        last_name: lastNameForEdit,
      });
      setSelectedVisitId(visitId);

      const paymentResponse = await fetch(`${API_BASE_URL}/patient/${patient.patient_id}/payment-status`, {
        headers: getAuthHeaders(),
      });
      if (!paymentResponse.ok) {
        throw new Error(`HTTP error! status: ${paymentResponse.status}`);
      }
      const paymentData = await paymentResponse.json();
      console.log("Fetched payment status:", paymentData);
      setPatientPaymentStatus(paymentData);

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
    console.log(`Input changed: ${name}, Value: '${value}'`); // Debug log, single quotes to show whitespace
    console.log("allTreatments array in handleTreatmentChange:", allTreatments); // Check if allTreatments is populated
    setCurrentTreatmentInput(prev => {
      const newState = { ...prev, [name]: value };

      if (name === "name" && value.trim() !== "") {
        const matchedTreatment = allTreatments.find(
          (t) => {
            console.log(`Comparing '${t.treatment_name.toLowerCase()}' with '${value.toLowerCase()}'`); // Detail comparison
            return t.treatment_name.toLowerCase() === value.toLowerCase();
          }
        );
        console.log("Matched treatment:", matchedTreatment); // Log the result of find
        if (matchedTreatment) {
          newState.cost = parseFloat(matchedTreatment.cost); // Ensure cost is a number
          newState.description = matchedTreatment.treatment_description;
          newState.treatment_id = matchedTreatment.treatment_id;
        } else {
          // If no match, clear cost and description and reset subtotal
          newState.cost = 0;
          newState.description = "";
          newState.treatment_id = null;
        }
      }

      // Always recalculate subtotal when relevant fields change or are autofilled
      const currentCost = parseFloat(newState.cost || 0);
      const currentQuantity = parseInt(newState.quantity || 0);
      newState.subtotal = currentCost * currentQuantity;
      
      console.log("New State after change:", newState); // Debug log for new state
      return newState;
    });
  };

  const handleDecrementQuantity = () => {
    setCurrentTreatmentInput((prev) => {
      const newQuantity = Math.max(1, (prev.quantity || 0) - 1);
      const newSubtotal = parseFloat(prev.cost || 0) * newQuantity;
      return {
        ...prev,
        quantity: newQuantity,
        subtotal: newSubtotal,
      };
    });
  };

  const handleIncrementQuantity = () => {
    setCurrentTreatmentInput((prev) => {
      const newQuantity = (prev.quantity || 0) + 1;
      const newSubtotal = parseFloat(prev.cost || 0) * newQuantity;
      return {
        ...prev,
        quantity: newQuantity,
        subtotal: newSubtotal,
      };
    });
  };

  const handleAddTreatmentToList = () => {
    if (!currentTreatmentInput.name || !currentTreatmentInput.cost || !currentTreatmentInput.quantity || !currentTreatmentInput.treatment_id) {
      alert("Please fill in all treatment details (Name, Cost, Quantity).");
      return;
    }

    setAddedTreatments(prev => [...prev, currentTreatmentInput]);
    setCurrentTreatmentInput({ name: "", cost: 0, description: "", quantity: 1, subtotal: 0, treatment_id: null });
  };

  const handleRemoveTreatment = (indexToRemove) => {
    setAddedTreatments(prev => prev.filter((_, index) => index !== indexToRemove));
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
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedPatient || !selectedVisitId) {
      setError("Please select a patient and a visit first.");
      setLoading(false);
      return;
    }

    if (addedTreatments.length === 0) {
      setError("Please add at least one treatment.");
      setLoading(false);
      return;
    }

    if (!newDiagnosis.trim()) {
      setError("Please provide a diagnosis.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/doctor/log-treatment-diagnosis`,
        {
          patient_id: selectedPatient.patient_id,
          visit_id: selectedVisitId,
          treatments: addedTreatments.map(t => ({ // Send the array of added treatments
            treatment_id: t.treatment_id,
            quantity: t.quantity,
          })),
          diagnosis: newDiagnosis,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        alert("Treatments and diagnosis logged successfully!");
        // After successfully logging treatments and diagnosis, generate the bill
        await generateBilling(selectedVisitId, selectedPatient.patient_id);
        fetchPendingTreatmentVisits();
        // Re-fetch patient details to update displayed billing information
        await handleSelectPatient(selectedPatient, selectedVisitId);
        // Also re-fetch patient reports to ensure they are up-to-date
        await fetchPatientReports(reportPeriod);
        setCurrentTreatmentInput({ name: "", cost: 0, description: "", quantity: 1, subtotal: 0, treatment_id: null }); // Clear current input
        setAddedTreatments([]); // Clear added treatments list
        setNewDiagnosis(""); // Clear diagnosis form
      } else {
        setError(response.data.message || "Failed to log treatment and diagnosis.");
      }
    } catch (err) {
      console.error("Error logging treatment and diagnosis:", err);
      setError(err.response?.data?.message || err.message || "Failed to log treatment and diagnosis.");
    } finally {
      setLoading(false);
    }
  };

  const generateBilling = async (visitId, patientId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/billing/generate`,
        {
          visit_id: visitId,
          patient_id: patientId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        console.log("Billing generated successfully!");
      } else {
        console.error("Failed to generate billing:", response.data.message);
      }
    } catch (error) {
      console.error("Error generating billing:", error);
    }
  };

  const handleEditPatient = () => {
    // Ensure we are in the patientRecord view before showing the edit form
    handleNavigation('patientRecord');
    // Prepare editPatientData with first and last names for the form
    const nameParts = (selectedPatient.full_name || '').split(' ');
    const firstName = nameParts.slice(0, -1).join(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    setEditPatientData({
      ...selectedPatient,
      first_name: firstName,
      last_name: lastName,
    });
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
          pfirst_name: editPatientData.first_name,
          plast_name: editPatientData.last_name,
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

  const generateBillingSlip = async (visitIdToGenerate) => {
    console.log("generateBillingSlip called.");
    console.log("selectedPatient:", selectedPatient);
    console.log("visitIdToGenerate:", visitIdToGenerate);

    if (selectedPatient && visitIdToGenerate) {
      const visit = selectedPatient.visits.find(v => v.visit_id === visitIdToGenerate);
      console.log("Found visit in selectedPatient.visits:", visit);
      if (visit && visit.billing_id) {
        setLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${API_BASE_URL}/billing/${visit.billing_id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.status === 200) {
            setBillingSlipData(response.data);
            setShowBillingSlip(true);
          } else {
            setError(response.data.message || "Failed to generate billing slip.");
          }
        } catch (err) {
          console.error("Error generating billing slip:", err);
          setError(err.response?.data?.message || err.message || "Failed to generate billing slip.");
        } finally {
          setLoading(false);
        }
      } else {
        alert("Visit details or Billing ID not found for the selected visit ID. Please ensure the visit is billed.");
      }
    } else {
      alert("Please select a patient and a visit to generate a billing slip.");
    }
  };

  const generateMedicalAbstract = async (patientId, visitId) => {
    if (!patientId || !visitId) {
      alert("Please select a patient and a visit to generate abstract.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/medical-abstracts/generate-for-visit`,
        {
          patient_id: patientId,
          visit_id: visitId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setMedicalAbstractData(response.data.abstract);
        setShowMedicalAbstract(true);
      } else {
        setError(response.data.message || "Failed to generate medical abstract.");
      }
    } catch (err) {
      console.error("Error generating medical abstract:", err);
      setError(err.response?.data?.message || err.message || "Failed to generate medical abstract.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (treatment) => {
    // Ensure all fields are present and not undefined
    setEditingTreatment({
      treatment_id: treatment.treatment_id,
      treatment_name: treatment.treatment_name || "",
      cost: treatment.cost !== undefined && treatment.cost !== null ? treatment.cost : "",
      treatment_description: treatment.treatment_description || "",
    });
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
          treatment_name: editingTreatment.treatment_name || "",
          cost: editingTreatment.cost || 0,
          treatment_description: editingTreatment.treatment_description || ""
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
    // Ensure the edit form has the correct fields and is always controlled
    setEditingVisit({
      ...visit,
      diagnosis: visit.diagnosis || visit.visit_diagnosis || "",
      visit_purpose: visit.visit_purpose || "",
    });
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
      // Map diagnosis to visit_diagnosis for backend
      const payload = {
        ...editingVisit,
        visit_diagnosis: editingVisit.diagnosis || "",
      };
      delete payload.diagnosis;
      const response = await fetch(`${API_BASE_URL}/visits/${editingVisit.visit_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert("Visit updated successfully!");
      setShowEditVisitForm(false);
      setEditingVisit(null);
      fetchPendingTreatmentVisits(); // Refresh list
    } catch (err) {
      setError("Error updating visit.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    handleNavigation('assignedPatients');
  };

  const handlePrintSlip = () => {
    const printContent = document.querySelector('.medical-abstract-preview');
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=1200');
      printWindow.document.write('<html><head><title>Medical Abstract</title>');
      printWindow.document.write(`
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; background-color: #ffffff; color: #333; }
          .medical-abstract-preview {
            font-size: 1em;
            padding: 30px;
            border: 1px solid #ccc;
            text-align: left;
            margin: 0 auto;
            max-width: 800px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            background-color: #ffffff;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #0056b3; /* Blue border for a professional look */
          }
          .logo {
            width: 80px;
            height: 80px;
            border: 2px solid #0056b3;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8em;
            font-weight: bold;
            color: #0056b3;
            margin-right: 20px;
            flex-shrink: 0;
            text-align: center;
            line-height: 1.2;
            overflow: hidden; /* Ensure text doesn't overflow */
            white-space: pre-wrap; /* Allow line breaks */
          }
          .header-info {
            flex-grow: 1;
          }
          .header-info h1 {
            font-size: 1.8em;
            color: #0056b3;
            margin: 0;
            margin-bottom: 5px;
          }
          .header-info p {
            font-size: 0.8em;
            margin: 0;
            color: #555;
          }
          .abstract-title {
            font-size: 1.6em;
            text-align: center;
            color: #0056b3;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 1.2em;
            color: #0056b3;
            margin-top: 25px;
            margin-bottom: 15px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .abstract-content p {
            display: flex;
            margin: 10px 0;
            line-height: 1.5;
            font-size: 0.95em;
            border-bottom: 1px dashed #eee;
            padding-bottom: 5px;
          }
          .abstract-content p:last-child { border-bottom: none; }
          .abstract-content strong {
            font-size: 0.95em;
            color: #222;
            display: inline-block;
            min-width: 150px;
            font-weight: bold;
            margin-right: 10px;
            flex-shrink: 0;
          }
          .medical-history {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
          }
          .medical-history h4 { font-size: 1.3em; color: #0056b3; margin-bottom: 15px; }
          .visit-summary {
            border: 1px solid #eee;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .visit-summary h5 { font-size: 1.1em; color: #444; margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 5px; }
          .visit-summary p { margin: 5px 0; font-size: 0.9em; }
          .visit-summary strong { font-size: 0.9em; min-width: 100px; }
          .treatments-list { margin-top: 10px; padding-left: 20px; }
          .treatment-item { margin-bottom: 5px; border-left: 2px solid #a7d9f7; padding-left: 8px; }
          .abstract-actions { display: none !important; }
          .signature-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .signature-section div {
            width: 45%;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            margin-top: 50px;
            padding-bottom: 5px;
            text-align: center;
            font-size: 0.9em;
          }
          .date-line {
            border-bottom: 1px solid #000;
            margin-top: 50px;
            padding-bottom: 5px;
            text-align: center;
            font-size: 0.9em;
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(
        `<div class="medical-abstract-preview">
          <div class="header">
            <div class="logo">GS<br/>HMC</div>
            <div class="header-info">
              <h1>Philippine General Hospital Memorial Center</h1>
              <p>123 Medical Drive, Health City, CA 90210</p>
              <p>Phone: (555) 123-4567 | Fax: (555) 123-4568</p>
              <p>Email: info@greysloan.com | Web: www.greysloan.com</p>
            </div>
          </div>
          <h2 class="abstract-title">Medical Abstract</h2>
          <div class="abstract-content">
            <p><strong>Patient Name:</strong> ${medicalAbstractData.patient_name}</p>
            <p><strong>Patient ID:</strong> ${medicalAbstractData.patient_id}</p>
            <p><strong>Date of Birth:</strong> ${medicalAbstractData.date_of_birth ? new Date(medicalAbstractData.date_of_birth).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Gender:</strong> ${medicalAbstractData.gender}</p>
            <p><strong>Contact Info:</strong> ${medicalAbstractData.contact_info || 'N/A'}</p>
            <p><strong>Address:</strong> 123 Main St, Anytown, USA 12345</p>
            <p><strong>PhilHealth ID:</strong> ${medicalAbstractData.philhealth_id || 'PH12-34567890'}</p>
            <p><strong>Admission Date:</strong> ${medicalAbstractData.admission_date ? new Date(medicalAbstractData.admission_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Discharge Date:</strong> ${medicalAbstractData.discharge_date ? new Date(medicalAbstractData.discharge_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Admitting Diagnosis:</strong> Placeholder admitting diagnosis details here. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p><strong>Final Diagnosis:</strong> Placeholder final diagnosis details here. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p><strong>Chief Complaint:</strong> Placeholder chief complaint details here. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          </div>
          <div class="medical-history">
            <h3 class="section-title">Medical History & Course of Treatment</h3>
            ${medicalAbstractData.visit_history && medicalAbstractData.visit_history.length > 0 ? (
              medicalAbstractData.visit_history.map(visit => `
                <div class="visit-summary">
                  <h5>Visit Date: ${new Date(visit.visit_date).toLocaleDateString()} (Visit ID: ${visit.visit_id})</h5>
                  <p><strong>Doctor:</strong> ${visit.doctor_name || 'N/A'}</p>
                  <p><strong>Purpose:</strong> ${visit.visit_purpose || 'N/A'}</p>
                  <p><strong>Diagnosis:</strong> ${visit.diagnosis || 'No diagnosis recorded'}</p>
                  <p><strong>Treatment Notes:</strong> ${visit.treatment_notes || 'No treatment notes'}</p>
                  <p><strong>Total Amount:</strong> ${visit.total_amount ? visit.total_amount.toFixed(2) : '0.00'}</p>
                  <p><strong>Payment Status:</strong> ${visit.is_paid ? 'Paid' : 'Unpaid'}</p>
                  ${visit.treatments && visit.treatments.length > 0 ? (
                    `<h5 style="margin-top: 15px;">Treatments Provided:</h5>
                    <ul class="treatments-list">
                      ${visit.treatments.map(treatment => `
                        <li class="treatment-item">${treatment.name} (Qty: ${treatment.quantity}, Price: ${treatment.price.toFixed(2)})</li>
                      `).join('')}
                    </ul>`
                  ) : ''}
                </div>
              `).join('')
            ) : (
              '<p>No visit history available.</p>'
            )}
          </div>
          <div class="signature-section">
            <div>
              <p class="signature-line"></p>
              <p style="text-align: center;">Attending Physician's Signature over Printed Name</p>
            </div>
            <div>
              <p class="date-line">${new Date().toLocaleDateString()}</p>
              <p style="text-align: center;">Date</p>
            </div>
          </div>
          <p style="font-size: 0.7em; text-align: center; margin-top: 30px; color: #777;">
            This abstract is for informational purposes only and does not constitute a medical recommendation.
          </p>
        </div>`
      );
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      alert("Medical abstract content not found for printing.");
    }
  };

  const handlePrintBillingSlip = () => {
    const printContent = document.querySelector('.billing-slip-preview');
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Billing Slip</title>');
      printWindow.document.write(`
        <style>
          body { font-family: 'Consolas', 'Courier New', monospace; margin: 10px; font-size: 0.9em; }
          .billing-slip-preview {
            border: 1px dashed #aaa; /* Dashed border for a receipt feel */
            padding: 10px; /* Reduced padding */
            max-width: 280px; /* Narrower slip */
            margin: 10px auto; /* Centered with a small margin */
            font-size: 0.9em; /* Slightly smaller font for compactness */
            background-color: #fffbf0; /* Off-white, paper-like background */
            box-shadow: 0 0 5px rgba(0,0,0,0.1); /* Subtle shadow */
          }
          .billing-slip-preview h3 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
            font-size: 1.1em; /* Smaller heading */
            text-transform: uppercase;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .billing-slip-preview p {
            margin-bottom: 5px; /* Reduced margin between lines */
            line-height: 1.3;
          }
          .billing-slip-preview strong {
            display: inline-block;
            width: 80px; /* Adjust width for key labels */
            font-weight: normal; /* Less bold */
            margin-right: 5px;
          }
          .abstract-actions, .billing-slip-preview button { display: none !important; } /* Hide buttons in print */
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent.outerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      alert("Billing slip content not found for printing.");
    }
  };

  const handleGenerateBillingSlipForVisit = (visitId) => {
    // No need to set setSelectedVisitId here, pass directly to generateBillingSlip
    generateBillingSlip(visitId);
  };

  const navigationTabs = [
    { value: "assignedPatients", label: "Assigned Patients" },
    { value: "availableTreatments", label: "Available Treatments" },
    { value: "patientReports", label: "Patient Reports" },
  ];

  const createButtonOptions = [
    { value: "add_treatment", label: "Add Treatment" },
    { value: "edit_patient", label: "Edit Patient" },
    { value: "view_visit_history", label: "Visit History" },
    { value: "generate_medical_abstract", label: "Medical Abstract" },
    { value: "generate_billing_slip", label: "Billing Slip" },
    { value: "edit_visit", label: "Edit Visit" },
  ];

  return (
    <DashboardLayout
      title="DOCTOR DASHBOARD"
      navigationTabs={navigationTabs}
      currentTab={activeView}
      onTabChange={handleNavigation}
      showSearchBar={true}
      onSearch={handleSearchChange}
      searchPlaceholder="Search by patient name or ID"
      onSearchButtonClick={handleSearchSubmit}
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

      {activeView === 'allPatientsSearch' && (
        <div className="dashboard-section">
          <h2 className="section-title">Search Results</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allPatients.length > 0 ? (
                  allPatients.map((patient) => (
                    <tr key={patient.patient_id}>
                      <td>{patient.patient_id}</td>
                      <td>{patient.full_name}</td>
                      <td>{patient.age !== null ? patient.age : 'N/A'}</td>
                      <td>{patient.gender}</td>
                      <td className="actions-column">
                        <button onClick={() => handleSelectPatient(patient)}>View Record</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No patients found matching your search.</td>
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
              <b>Payment Status:</b> {patientPaymentStatus !== null ? (patientPaymentStatus.is_paid ? "Paid" : "Unpaid") : 'N/A'}
            </div>
          </div>

          <div className="button-group">
            <button onClick={handleEditPatient}>Edit Patient</button>
            <button onClick={handleViewVisitHistory}>View Visit History</button>
          </div>

          {isEditingPatient && (
            <div className="form-container">
              <h3>Edit Patient Information</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleSavePatient(); }}>
                <label>First Name:</label>
                <input type="text" name="first_name" value={editPatientData.first_name || ''} onChange={handleEditPatientChange} required />
                <label>Last Name:</label>
                <input type="text" name="last_name" value={editPatientData.last_name || ''} onChange={handleEditPatientChange} required />
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
                      selectedPatient.visits.map((visit, index) => {
                        console.log(`Visit ID: ${visit.visit_id}, Index: ${index}`); // Keep for debugging keys
                        return (
                        <tr key={`${visit.visit_id}-${index}`}>
                          <td>{visit.visit_id}</td>
                          <td>{new Date(visit.visit_date).toLocaleDateString()}</td>
                          <td>{visit.visit_purpose}</td>
                          <td>{visit.treatments.map(t => t.treatment_name).join(", ")}</td>
                          <td>{visit.visit_diagnosis}</td>
                          <td className="actions-column">
                            <button onClick={() => handleEditVisitClick(visit)}>Edit Visit</button>
                            {visit.is_paid ? (
                              <button onClick={() => {
                                console.log("Generate Abstract clicked for Patient ID:", selectedPatient.patient_id, "Visit ID:", visit.visit_id);
                                generateMedicalAbstract(selectedPatient.patient_id, visit.visit_id);
                              }}>Generate Abstract</button>
                            ) : (
                              <button disabled title="Payment not completed">Generate Abstract</button>
                            )}
                            {visit.billing_id ? (
                              <button onClick={() => {
                                console.log("Generate Billing Slip clicked for Visit ID:", visit.visit_id, "Billing ID:", visit.billing_id);
                                handleGenerateBillingSlipForVisit(visit.visit_id);
                              }}>Generate Billing Slip</button>
                            ) : (
                              <button disabled title="Billing not generated">Generate Billing Slip</button>
                            )}
                          </td>
                        </tr>
                        );
                      })
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
                <input type="text" name="visit_purpose" value={editingVisit.visit_purpose || ""} onChange={handleEditVisitChange} required />
                <label>Diagnosis:</label>
                <input type="text" name="diagnosis" value={editingVisit.diagnosis || ""} onChange={handleEditVisitChange} required />
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
                <Grid container columns={12} columnSpacing={2} alignItems="center">
                  <Grid gridColumn={{ xs: 'span 12', sm: 'span 2' }}>
                    <TextField
                      label="Treatment Name"
                      name="name"
                      value={currentTreatmentInput.name || ''}
                      onChange={handleTreatmentChange}
                      fullWidth
                      margin="normal"
                      size ="small"
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { border: 'none' },
                        },
                        backgroundColor: '#fff',
                      }}
                    />
                  </Grid>
                  <Grid gridColumn={{ xs: 'span 12', sm: 'span 1' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, width: 'fit-content' }}>
                      <IconButton onClick={handleDecrementQuantity} size="small" sx={{ p: 0.5 }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <TextField
                        label="Quantity"
                        name="quantity"
                        type="number"
                        value={currentTreatmentInput.quantity}
                        onChange={handleTreatmentChange}
                        size="small"
                        variant="standard"
                        InputProps={{
                          inputProps: { min: 1, style: { textAlign: 'center', padding: '8px 0' } },
                        }}
                        sx={{ mx: 0.5, width: '40px' }}
                      />
                      <IconButton onClick={handleIncrementQuantity} size="small" sx={{ p: 0.5 }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid gridColumn={{ xs: 'span 12', sm: 'span 2' }}>
                    <TextField
                      label="Cost"
                      name="cost"
                      type="number"
                      value={currentTreatmentInput.cost}
                      onChange={handleTreatmentChange}
                      fullWidth
                      margin="normal"
                      size="small"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  </Grid>
                  <Grid gridColumn={{ xs: 'span 12', sm: 'span 2' }}>
                    <TextField
                      label="Subtotal"
                      name="subtotal"
                      type="number"
                      value={currentTreatmentInput.subtotal}
                      fullWidth
                      margin="normal"
                      size="small"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  </Grid>
                  <Grid gridColumn={{ xs: 'span 12', sm: 'span 2' }}>
                    <TextField
                      label="Description"
                      name="description"
                      value={currentTreatmentInput.description}
                      onChange={handleTreatmentChange}
                      fullWidth
                      margin="normal"
                      multiline
                      rows={2}
                      size="small"
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { border: 'none' },
                        },
                        backgroundColor: '#fff',
                      }}
                    />
                  </Grid>
                  <Grid gridColumn={{ xs: 'span 12', sm: 'span 2' }}>
                    <TextField
                      label="Diagnosis"
                      name="diagnosis"
                      value={newDiagnosis}
                      onChange={(e) => setNewDiagnosis(e.target.value)}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { border: 'none' },
                        },
                        backgroundColor: '#fff',
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleAddTreatmentToList}
                      sx={{ mr: 1 }}
                      type="button"
                    >
                      Add to List
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
                      Add Treatment & Diagnosis
                    </Button>
                  </Grid>
                </Grid>
              </form>

              {addedTreatments.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <h3>Treatments to be logged:</h3>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Cost</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Subtotal</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {addedTreatments.map((treatment, index) => (
                          <TableRow key={index}>
                            <TableCell>{treatment.name}</TableCell>
                            <TableCell>{treatment.cost}</TableCell>
                            <TableCell>{treatment.quantity}</TableCell>
                            <TableCell>{treatment.subtotal}</TableCell>
                            <TableCell>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleRemoveTreatment(index)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </div>
          )}

          {showBillingSlip && selectedPatient && (
            <div className="billing-slip-preview">
              <h3>Billing Slip</h3>
              {billingSlipData ? (
                <div className="abstract-content">
                  <p><strong>Billing ID:</strong> {billingSlipData.billing_id}</p>
                  <p><strong>Patient ID:</strong> {billingSlipData.patient_id}</p>
                  <p><strong>Patient Name:</strong> {billingSlipData.patient_name}</p>
                  <p><strong>Visit ID:</strong> {billingSlipData.visit_id}</p>
                  <p><strong>Doctor:</strong> {billingSlipData.doctor_name || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(billingSlipData.visit_date).toLocaleDateString()}</p>
                </div>
              ) : (
                <p>No billing slip data available. Please generate one.</p>
              )}
              <div className="abstract-actions">
                <button onClick={handlePrintBillingSlip}>Print Slip</button>
                <button onClick={() => setShowBillingSlip(false)}>Close Preview</button>
              </div>
            </div>
          )}

          {showMedicalAbstract && selectedPatient && (
            <div className="medical-abstract-preview">
              <h3>Medical Abstract for {selectedPatient.full_name}</h3>
              {medicalAbstractData ? (
                <div className="abstract-content">
                  <p><strong>Patient Name:</strong> {medicalAbstractData.patient_name}</p>
                  <p><strong>Patient ID:</strong> {medicalAbstractData.patient_id}</p>
                  <p><strong>Date of Birth:</strong> {medicalAbstractData.date_of_birth ? new Date(medicalAbstractData.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Gender:</strong> {medicalAbstractData.gender}</p>
                  <p><strong>Visit Date:</strong> {new Date(medicalAbstractData.visit_date).toLocaleDateString()}</p>
                  <p><strong>Visit Purpose:</strong> {medicalAbstractData.visit_purpose}</p>
                  <p><strong>Diagnosis:</strong> {medicalAbstractData.diagnosis}</p>
                  <p><strong>Treatments Summary:</strong> {medicalAbstractData.treatments_summary}</p>
                  <p><strong>Payment Status:</strong> {medicalAbstractData.payment_status}</p>
                  <p><strong>Generated Date:</strong> {medicalAbstractData.generated_date}</p>
                </div>
              ) : (
                <p>No medical abstract data available.</p>
              )}
              <div className="abstract-actions">
                <button onClick={() => setShowMedicalAbstract(false)}>Close Abstract</button>
                {medicalAbstractData && <button onClick={handlePrintSlip}>Print Abstract</button>}
              </div>
            </div>
          )}
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
                      <td>{treatment.cost}</td>
                      <td>{treatment.treatment_description}</td>
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
                <input type="text" name="treatment_name" value={editingTreatment.treatment_name || ""} onChange={handleEditTreatmentChange} required />
                <label>Price:</label>
                <input type="number" name="cost" value={editingTreatment.cost || ""} onChange={handleEditTreatmentChange} required />
                <label>Purpose:</label>
                <input type="text" name="treatment_description" value={editingTreatment.treatment_description || ""} onChange={handleEditTreatmentChange} />
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
                              <p>Cost: {treatment.cost}</p>
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
                    {patientReports.treatments.map((treatment) => (
                      <li key={treatment.name}>
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
                    {patientReports.diagnoses.map((diagnosis) => (
                      <li key={diagnosis.name}>
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