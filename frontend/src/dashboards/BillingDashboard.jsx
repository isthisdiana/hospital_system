import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./BillingDashboard.css";
import DashboardLayout from "../components/DashboardLayout";
import {
  Typography, Button, Box, Paper, TextField, Grid, MenuItem, Select
} from "@mui/material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "http://localhost:5000/api";

const mockBillingData = {
  "BILL-123456": {
    billing_id: "BILL-123456",
    patient_id: "P001",
    patient_name: "John Doe",
    date: "2024-03-20",
    doctor_id: "DOC-001",
    doctor_name: "Dr. Smith",
    philhealth_id: "PH123456",
    treatments: [
      { id: 1, name: "Blood Pressure Check", price: 50, quantity: 1 },
      { id: 2, name: "X-Ray", price: 200, quantity: 1 },
    ],
    total_amount: 250,
    discount_amount: 0,
    final_amount: 250,
    payment_status: "Unpaid",
    payment_method: "",
  },
};

const mockUnpaidBills = [
  {
    billing_id: "BILL-123456",
    patient_name: "John Doe",
    visit_id: "V001",
    philhealth_id: "PH123456",
    total_amount: 250,
  },
  {
    billing_id: "BILL-789012",
    patient_name: "Jane Smith",
    visit_id: "V002",
    philhealth_id: "0",
    total_amount: 1500,
  },
  {
    billing_id: "BILL-345678",
    patient_name: "Peter Jones",
    visit_id: "V003",
    philhealth_id: "PH987654",
    total_amount: 6000,
  },
];

function BillingDashboard() {
  const navigate = useNavigate();
  const [currentBill, setCurrentBill] = useState(null);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [activeTab, setActiveTab] = useState("unpaidBills");
  const [mainSection, setMainSection] = useState("pendingBills");
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [availableTreatments, setAvailableTreatments] = useState([]);
  const [billingReports, setBillingReports] = useState({
    totalPatients: 0,
    totalVisits: 0,
    totalBills: 0,
    totalTreatments: 0,
    totalAmountCollected: 0,
    averageBillAmount: 0,
    commonTreatments: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const fetchUnpaidBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/billing/unpaid-bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUnpaidBills(response.data);
    } catch (error) {
      console.error("Error fetching unpaid bills:", error);
      setError("Failed to load unpaid bills.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTreatments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/treatments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAvailableTreatments(response.data);
    } catch (error) {
      console.error("Error fetching available treatments:", error);
      setError("Failed to load available treatments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/billing/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBillingHistory(response.data);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      setError("Failed to load billing history.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/billing/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBillingReports({
        totalPatients: response.data.totalPatients || 0,
        totalVisits: response.data.totalVisits || 0,
        totalBills: response.data.totalBills || 0,
        totalTreatments: response.data.totalTreatments || 0,
        totalAmountCollected: response.data.totalAmountCollected || 0,
        averageBillAmount: response.data.averageBillAmount || 0,
        commonTreatments: response.data.commonTreatments || [],
      });
    } catch (error) {
      console.error("Error fetching billing reports:", error);
      setError("Failed to load billing reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidBills();
  }, []);

  useEffect(() => {
    if (mainSection === "billingHistory") {
      fetchBillingHistory();
    } else if (mainSection === "availableTreatments") {
      fetchAvailableTreatments();
    } else if (mainSection === "billingReports") {
      fetchBillingReports();
    }
  }, [mainSection]);

  const handleSelectUnpaidBill = async (billingId) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/billing/${billingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const detailedBill = response.data;
      setCurrentBill(detailedBill);
      setActiveTab("paymentTransaction");
      setDiscountApplied(false);
      setShowReceipt(false);
    } catch (error) {
      console.error("Error fetching detailed bill:", error);
      setError("Failed to load bill details.");
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (!currentBill || discountApplied) return;

    const { total_amount, philhealth_id } = currentBill;
    let discount = 0;

    if (philhealth_id && philhealth_id !== "0") {
      if (total_amount <= 5000) {
        discount = total_amount; // 100% discount
      } else {
        discount = total_amount * 0.5; // 50% discount
      }
    } else {
      alert("Discount is only available for PhilHealth members.");
      return;
    }

    setCurrentBill((prev) => ({
      ...prev,
      discount_amount: discount,
      final_amount: total_amount - discount,
    }));
    setDiscountApplied(true);
    alert("Discount applied successfully!");
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert("Please select a payment method!");
      return;
    }
    if (!currentBill) {
      alert("No bill selected for payment.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      const billingStaffId = decodedToken.staffId;

      if (!billingStaffId) {
        alert("Billing staff ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/billing/pay`,
        {
          billing_id: currentBill.billing_id,
          payment_method: paymentMethod,
          receipt_number: receiptNumber,
          billing_staff_id: billingStaffId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        alert("Payment processed successfully!");
        setCurrentBill((prev) => ({ ...prev, is_paid: 1, payment_method: paymentMethod, receipt_number: receiptNumber }));
        setShowReceipt(true);
        setReceiptNumber('');
        fetchUnpaidBills();
      } else {
        setError(response.data.message || "Failed to process payment.");
        alert("Payment failed: " + (response.data.message || "Unknown error."));
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setError(error.response?.data?.message || error.message || "Failed to process payment.");
      alert("Error processing payment: " + (error.response?.data?.message || error.message || "Unknown error."));
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = () => {
    if (!currentBill) return null;

    return (
      <Box className="receipt-container">
        <Typography variant="h6">💰 Payment Receipt</Typography>
        <Box className="receipt-content">
          <Typography><strong>Billing ID:</strong> {currentBill.billing_id}</Typography>
          <Typography><strong>Patient ID:</strong> {currentBill.patient_id}</Typography>
          <Typography><strong>Patient Name:</strong> {currentBill.patient_name}</Typography>
          <Typography><strong>Date:</strong> {new Date(currentBill.billing_date).toLocaleDateString()}</Typography>
          <Typography><strong>Doctor:</strong> {currentBill.doctor_name}</Typography>
          <Typography><strong>PhilHealth ID:</strong> {currentBill.philhealth_id}</Typography>
          <Typography><strong>Billing Staff:</strong> {currentBill.billing_staff_name}</Typography>
          
          <Typography variant="subtitle1" mt={2}>Treatments:</Typography>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {currentBill.treatments.map((treatment, index) => (
                  <tr key={`${treatment.id}-${index}`}>
                    <td>{treatment.name}</td>
                    <td>{treatment.quantity}</td>
                    <td>{treatment.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Box className="totals-section">
            <Typography variant="h6"><strong>Total Amount:</strong> {currentBill.total_amount}</Typography>
            <Typography variant="h6"><strong>Discount Amount:</strong> {currentBill.discount_amount}</Typography>
            <Typography variant="h6"><strong>Final Amount:</strong> {currentBill.final_amount}</Typography>
            <Typography sx={{ fontSize: '1.1rem' }}><strong>Payment Method:</strong> {currentBill.payment_method || 'N/A'}</Typography>
            <Typography sx={{ fontSize: '1.1rem' }}><strong>Payment Status:</strong> {currentBill.is_paid ? 'Paid' : 'Unpaid'}</Typography>
          </Box>

          <Button onClick={() => window.print()} variant="contained" color="primary" sx={{ mt: 2 }}>Print Receipt</Button>
        </Box>
      </Box>
    );
  };

  const handleSearchSubmit = () => {
    if (searchQuery) {
      handleSelectUnpaidBill(searchQuery);
    }
  };

  const generateMedicalAbstract = async (patientId, visitId) => {
    if (!patientId || !visitId) {
      alert("Missing patient or visit ID for abstract generation.");
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
        alert("Medical Abstract: " + JSON.stringify(response.data.abstract, null, 2));
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

  const navigationTabs = [
    { label: "Pending Bills", value: "pendingBills" },
    { label: "Available Treatments", value: "availableTreatments" },
    { label: "Billing History", value: "billingHistory" },
    { label: "Billing Reports", value: "billingReports" },
  ];

  return (
    <DashboardLayout
      title="Billing Dashboard"
      navigationTabs={navigationTabs}
      currentTab={mainSection}
      onTabChange={setMainSection}
      showSearchBar={true}
      onSearch={(value) => setSearchQuery(value)}
      searchPlaceholder="Search Billing ID Here"
      onLogout={handleLogout}
      onSearchButtonClick={handleSearchSubmit}
    >
      {mainSection === "pendingBills" && (
        <Box className="dashboard-content">
          <Box className="tab-navigation-buttons">
            <Button
              onClick={() => setActiveTab("unpaidBills")}
              variant={activeTab === "unpaidBills" ? "contained" : "outlined"}
            >
              Unpaid Bills 🧾
            </Button>
            <Button
              onClick={() => setActiveTab("paymentTransaction")}
              variant={activeTab === "paymentTransaction" ? "contained" : "outlined"}
            >
              Payment Transaction 💳
            </Button>
          </Box>

          {activeTab === "unpaidBills" && (
            <Paper className="card">
              <Typography variant="h6" gutterBottom>📊 Unpaid Bills</Typography>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Billing ID</th>
                      <th>Patient Name</th>
                      <th>Visit ID</th>
                      <th>PhilHealth ID</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="5">Loading unpaid bills...</td></tr>}
                    {error && <tr><td colSpan="5" style={{ color: 'red' }}>Error: {error}</td></tr>}
                    {!loading && !error && unpaidBills.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center' }}>No unpaid bills found.</td></tr>
                    )}
                    {!loading && !error && unpaidBills.length > 0 && unpaidBills.map((bill) => (
                      <tr key={bill.billing_id} className="clickable-row" onClick={() => handleSelectUnpaidBill(bill.billing_id)}>
                        <td>{bill.billing_id}</td>
                        <td>{bill.patient_name}</td>
                        <td>{bill.visit_id}</td>
                        <td>{bill.philhealth_id}</td>
                        <td>{bill.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Paper>
          )}

          {activeTab === "paymentTransaction" && (
            <Paper className="card">
              <Typography variant="h6" gutterBottom>💳 Payment Transaction</Typography>
              <Box component="form" className="form-container">
                {loading && <Typography sx={{ fontSize: '1rem' }}>Loading bill details...</Typography>}
                {error && <Typography color="error" sx={{ fontSize: '1rem' }}>Error: {error}</Typography>}

                {currentBill && !showReceipt && !loading && (
                  <Box mt={3}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.2rem' }}>Bill Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Typography sx={{ fontSize: '1.1rem' }}>Patient Name: {currentBill.patient_name}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography sx={{ fontSize: '1.1rem' }}>Total Amount: {currentBill.total_amount}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography sx={{ fontSize: '1.1rem' }}>Discount: {currentBill.discount_amount}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography sx={{ fontSize: '1.1rem' }}>Final Amount: {currentBill.final_amount}</Typography></Grid>
                      <Grid item xs={12} sm={6}>
                        <Select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          displayEmpty
                          fullWidth
                          margin="normal"
                          sx={{ fontSize: '1rem' }}
                        >
                          <MenuItem value="" sx={{ fontSize: '1rem' }}>Select Payment Method</MenuItem>
                          <MenuItem value="Cash" sx={{ fontSize: '1rem' }}>Cash</MenuItem>
                          <MenuItem value="Card" sx={{ fontSize: '1rem' }}>Credit Card</MenuItem>
                          <MenuItem value="Online" sx={{ fontSize: '1rem' }}>GCash</MenuItem>
                        </Select>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Receipt Number (Optional)"
                          variant="outlined"
                          fullWidth
                          value={receiptNumber}
                          onChange={(e) => setReceiptNumber(e.target.value)}
                          sx={{ fontSize: '1rem' }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button variant="contained" color="primary" onClick={handlePayment} disabled={!paymentMethod} sx={{ fontSize: '1.1rem' }}>
                          Process Payment
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                {showReceipt && generateReceipt()}
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {mainSection === "availableTreatments" && (
        <Box className="dashboard-content">
          <Paper className="card">
            <Typography variant="h6" gutterBottom> Available Treatments</Typography>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Treatment Name</th>
                    <th>Description</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan="4">Loading available treatments...</td></tr>}
                  {error && <tr><td colSpan="4" style={{ color: 'red' }}>Error: {error}</td></tr>}
                  {!loading && !error && availableTreatments.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>No treatments found.</td></tr>
                  )}
                  {!loading && !error && availableTreatments.length > 0 && availableTreatments.map((treatment) => (
                    <tr key={treatment.treatment_id}>
                      <td>{treatment.treatment_id}</td>
                      <td>{treatment.treatment_name}</td>
                      <td>{treatment.treatment_description}</td>
                      <td>{treatment.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Paper>
        </Box>
      )}

      {mainSection === "billingHistory" && (
        <Box className="dashboard-content">
          <Paper className="card">
            <Typography variant="h6" gutterBottom> Billing History</Typography>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Billing ID</th>
                    <th>Patient Name</th>
                    <th>Visit Date</th>
                    <th>Total Amount</th>
                    <th>Discount Amount</th>
                    <th>Final Amount</th>
                    <th>Payment Method</th>
                    <th>Billing Staff</th>
                    <th>Receipt Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan="10">Loading billing history...</td></tr>}
                  {error && <tr><td colSpan="10" style={{ color: 'red' }}>Error: {error}</td></tr>}
                  {!loading && !error && billingHistory.length === 0 && (
                    <tr><td colSpan="10" style={{ textAlign: 'center' }}>No billing history found.</td></tr>
                  )}
                  {!loading && !error && billingHistory.length > 0 && billingHistory.map((bill) => (
                    <tr key={bill.billing_id}>
                      <td>{bill.billing_id}</td>
                      <td>{bill.patient_name}</td>
                      <td>{new Date(bill.visit_date).toLocaleDateString()}</td>
                      <td>{bill.total_amount}</td>
                      <td>{bill.discount_amount}</td>
                      <td>{bill.final_amount}</td>
                      <td>{bill.payment_method || 'N/A'}</td>
                      <td>{bill.billing_staff_name || 'N/A'}</td>
                      <td>{bill.receipt_number || 'N/A'}</td>
                      <td>
                        {bill.is_paid && (
                          <button onClick={() => generateMedicalAbstract(bill.patient_id, bill.visit_id)}>
                            Generate Abstract
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Paper>
        </Box>
      )}

      {mainSection === "billingReports" && (
        <Box className="dashboard-content">
          <Paper className="card" sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3 }}> Billing Reports</Typography>

            {loading && <Typography sx={{ fontSize: '1rem' }}>Loading reports...</Typography>}
            {error && <Typography color="error" sx={{ fontSize: '1rem' }}>Error: {error}</Typography>}

            {!loading && !error && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={3} sx={{ p: 3, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>Total Patients</Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{billingReports.totalPatients}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={3} sx={{ p: 3, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>Total Visits</Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{billingReports.totalVisits}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={3} sx={{ p: 3, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>Total Bills</Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{billingReports.totalBills}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={3} sx={{ p: 3, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>Total Treatments</Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{billingReports.totalTreatments}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={3} sx={{ p: 3, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>Total Amount Collected</Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{billingReports.totalAmountCollected.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={3} sx={{ p: 3, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>Average Bill Amount</Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{billingReports.averageBillAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Most Common Treatments</Typography>
                    {billingReports.commonTreatments && billingReports.commonTreatments.length > 0 ? (
                      <Box>
                        {billingReports.commonTreatments.map((treatment, index) => (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: '8px' }}>
                            <Typography component="span" variant="body1" sx={{ fontWeight: 'bold' }}>{treatment.name}:</Typography>
                            <Typography component="span" variant="body1">{treatment.count} times</Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '1rem', color: 'text.secondary' }}>No common treatments found for this period.</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Box>
      )}
    </DashboardLayout>
  );
}

export default BillingDashboard;