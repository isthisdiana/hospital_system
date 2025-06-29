import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./BillingDashboard.css";
import DashboardLayout from "../components/DashboardLayout";
import {
  Typography, Button, Box, Paper, TextField, Grid, MenuItem, Select, Divider
} from "@mui/material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "http://localhost:5000/api";


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
      const response = await axios.get("http://localhost:5000/api/billing/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        }
      });
      setBillingReports(response.data);
    } catch (error) {
      setError("Failed to load billing reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidBills();
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    fetchBillingReports();

    // Set up interval for auto-refresh
    const intervalId = setInterval(() => {
      fetchBillingReports();
    }, 60000); // 60 seconds

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

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

        // Fetch the logged-in billing staff's name
        const staffResponse = await axios.get(`${API_BASE_URL}/users?staff_id=${billingStaffId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const loggedInStaffName = staffResponse.data.find(staff => staff.staff_id === billingStaffId)?.full_name || 'N/A';

        setCurrentBill((prev) => ({ 
          ...prev,
          is_paid: 1, 
          payment_method: paymentMethod,
          billing_staff_name: loggedInStaffName, // Update with the logged-in staff's name
        }));
        setShowReceipt(true);
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

  const handleSearchSubmit = () => {
    if (searchQuery) {
      handleSelectUnpaidBill(searchQuery);
    }
  };

  const renderReceiptContent = () => {
    if (!currentBill) return null;

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    return (
      <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: '8px', maxWidth: '800px', margin: '20px auto', backgroundColor: '#fff' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Philippine General Hospital Memorial Center 
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manila, Philippines | Contact: (02) 8554-8400
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
            Official Payment Receipt
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Billing ID:</strong> {currentBill.billing_id}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Date:</strong> {new Date().toLocaleDateString()}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Patient Name:</strong> {currentBill.patient_name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Patient ID:</strong> {currentBill.patient_id}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Doctor:</strong> {currentBill.doctor_name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>PhilHealth ID:</strong> {currentBill.philhealth_id || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2"><strong>Billing Staff:</strong> {currentBill.billing_staff_name || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Treatments/Services:</Typography>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Treatment</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {currentBill.treatments.map((treatment, index) => (
                <tr key={`${treatment.id}-${index}`}>
                  <td>{treatment.name}</td>
                  <td>{treatment.quantity}</td>
                  <td>{formatCurrency(treatment.price)}</td>
                  <td>{formatCurrency(treatment.quantity * treatment.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Divider sx={{ my: 2 }} />

        <Box className="totals-section" sx={{ textAlign: 'right' }}>
          <Typography variant="h6"><strong>Total Amount:</strong> {formatCurrency(currentBill.total_amount)}</Typography>
          <Typography variant="h6"><strong>Discount:</strong> {formatCurrency(currentBill.discount_amount)}</Typography>
          <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: '#d32f2f' }}>
            <strong>Amount Due:</strong> {formatCurrency(currentBill.final_amount)}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}><strong>Payment Method:</strong> {currentBill.payment_method || 'N/A'}</Typography>
          <Typography variant="body1"><strong>Payment Status:</strong> {currentBill.is_paid ? 'Paid' : 'Unpaid'}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Thank you for your payment.
          </Typography>
          <Button onClick={handlePrintReceipt} variant="contained" color="primary" sx={{ mt: 2 }}>
            Print Receipt
          </Button>
        </Box>
      </Box>
    );
  };

  const handlePrintReceipt = () => {
    if (!currentBill) return;

    const receiptDisplayArea = document.getElementById('receipt-display-area');
    if (!receiptDisplayArea) {
      console.error("Receipt display area not found in DOM.");
      return;
    }
    const receiptHtml = receiptDisplayArea.innerHTML;

    console.log("Captured Receipt HTML:", receiptHtml); // DEBUG: Log the captured HTML

    if (!receiptHtml || receiptHtml.trim() === '') {
      console.warn("Receipt HTML is empty or invalid.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow pop-ups for printing.");
        return;
    }

    printWindow.document.write('<html><head><title>Payment Receipt</title>');

    // Copy all link tags (CSS) and style tags from the main document to the print window
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(tag => {
      if (tag.tagName === 'LINK') {
        printWindow.document.write(`<link rel="stylesheet" href="${tag.href}">`);
      } else if (tag.tagName === 'STYLE') {
        printWindow.document.write(`<style>${tag.innerHTML}</style>`);
      }
    });

    // Add some basic print styles directly to the iframe head
    printWindow.document.write(`
      <style>
        body { margin: 0; padding: 0; }
        .receipt-container { margin: 20px auto; max-width: 800px; border: none; box-shadow: none; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { border: 1px solid #eee; padding: 8px; text-align: left; color: #000; }
        .totals-section { text-align: right; }
        button { display: none; } /* Hide print button in printout */
      </style>
    `);

    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptHtml);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus(); // Focus on the new window
      printWindow.print(); // Open print dialog
      printWindow.close(); // Close the new window after printing
    };
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
                      <Grid item xs={12}>
                        <Button variant="contained" color="primary" onClick={handlePayment} disabled={!paymentMethod} sx={{ fontSize: '1.1rem' }}>
                          Process Payment
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                {showReceipt && currentBill && (
                  <Box id="receipt-display-area" sx={{ display: 'block' }}>
                    {renderReceiptContent()}
                  </Box>
                )}
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
                    {/* <th>Actions</th> */}
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
                      {/* <td>
                        {bill.is_paid && (
                          <button onClick={() => generateMedicalAbstract(bill.patient_id, bill.visit_id)}>
                            Generate Abstract
                          </button>
                        )}
                      </td> */}
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