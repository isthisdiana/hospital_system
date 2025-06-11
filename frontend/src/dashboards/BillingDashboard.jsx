import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import "./BillingDashboard.css";
import DashboardLayout from "../components/DashboardLayout";
import {
  Typography, Button, Box, Paper, TextField, Grid, MenuItem, Select
} from "@mui/material";

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
  const [billingId, setBillingId] = useState("");
  const [currentBill, setCurrentBill] = useState(null);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [activeTab, setActiveTab] = useState("unpaidBills");
  const [mainSection, setMainSection] = useState("pendingBills");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSearch = () => {
    const bill = mockBillingData[billingId];
    if (bill) {
      setCurrentBill(bill);
      setDiscountApplied(false);
      setShowReceipt(false);
    } else {
      alert("Billing ID not found!");
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
    }

    setCurrentBill((prev) => ({
      ...prev,
      discount_amount: discount,
      final_amount: total_amount - discount,
    }));
    setDiscountApplied(true);
    alert("Discount applied successfully!");
  };

  const handlePayment = () => {
    if (!paymentMethod) {
      alert("Please select a payment method!");
      return;
    }

    setCurrentBill((prev) => ({
      ...prev,
      payment_status: "Paid",
      payment_method: paymentMethod,
    }));
    setShowReceipt(true);
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
          <Typography><strong>Date:</strong> {currentBill.date}</Typography>
          <Typography><strong>Doctor:</strong> {currentBill.doctor_name}</Typography>
          <Typography><strong>PhilHealth ID:</strong> {currentBill.philhealth_id}</Typography>
          
          <Typography variant="subtitle1" mt={2}>Treatments:</Typography>
          <Paper className="table-container">
            <Grid container spacing={2} className="table-header">
              <Grid item xs={4}><Typography variant="subtitle2">Treatment</Typography></Grid>
              <Grid item xs={4}><Typography variant="subtitle2">Quantity</Typography></Grid>
              <Grid item xs={4}><Typography variant="subtitle2">Price</Typography></Grid>
            </Grid>
            {currentBill.treatments.map((treatment) => (
              <Grid container spacing={2} key={treatment.id} className="table-row">
                <Grid item xs={4}><Typography>{treatment.name}</Typography></Grid>
                <Grid item xs={4}><Typography>{treatment.quantity}</Typography></Grid>
                <Grid item xs={4}><Typography>${treatment.price}</Typography></Grid>
              </Grid>
            ))}
          </Paper>

          <Box className="totals-section">
            <Typography><strong>Total Amount:</strong> ${currentBill.total_amount}</Typography>
            <Typography><strong>Discount Amount:</strong> ${currentBill.discount_amount}</Typography>
            <Typography><strong>Final Amount:</strong> ${currentBill.final_amount}</Typography>
            <Typography><strong>Payment Method:</strong> {currentBill.payment_method}</Typography>
            <Typography><strong>Payment Status:</strong> {currentBill.payment_status}</Typography>
            <Typography><strong>Billing Staff:</strong> John Billing</Typography>
          </Box>

          <Button onClick={() => window.print()} variant="contained" color="primary" sx={{ mt: 2 }}>Print Receipt</Button>
        </Box>
      </Box>
    );
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
      onSearch={handleSearch}
      searchPlaceholder="Search Billing ID Here"
      onLogout={handleLogout}
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
              <Paper className="table-container">
                <Grid container spacing={2} className="table-header">
                  <Grid item xs={3}><Typography variant="subtitle2">Billing ID</Typography></Grid>
                  <Grid item xs={3}><Typography variant="subtitle2">Patient Name</Typography></Grid>
                  <Grid item xs={2}><Typography variant="subtitle2">Visit ID</Typography></Grid>
                  <Grid item xs={2}><Typography variant="subtitle2">PhilHealth ID</Typography></Grid>
                  <Grid item xs={2}><Typography variant="subtitle2">Total Amount</Typography></Grid>
                </Grid>
                {mockUnpaidBills.map((bill) => (
                  <Grid container spacing={2} key={bill.billing_id} className="table-row">
                    <Grid item xs={3}><Typography>{bill.billing_id}</Typography></Grid>
                    <Grid item xs={3}><Typography>{bill.patient_name}</Typography></Grid>
                    <Grid item xs={2}><Typography>{bill.visit_id}</Typography></Grid>
                    <Grid item xs={2}><Typography>{bill.philhealth_id}</Typography></Grid>
                    <Grid item xs={2}><Typography>${bill.total_amount}</Typography></Grid>
                  </Grid>
                ))}
              </Paper>
            </Paper>
          )}

          {activeTab === "paymentTransaction" && (
            <Paper className="card">
              <Typography variant="h6" gutterBottom>💳 Payment Transaction</Typography>
              <Box component="form" className="form-container">
                <TextField
                  label="Billing ID"
                  value={billingId}
                  onChange={(e) => setBillingId(e.target.value)}
                  fullWidth
                  margin="normal"
                  required
                />
                <Button variant="contained" color="primary" onClick={handleSearch} sx={{ mt: 2 }}>Search Bill</Button>

                {currentBill && !showReceipt && (
                  <Box mt={3}>
                    <Typography variant="h6" gutterBottom>Bill Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Typography>Patient Name: {currentBill.patient_name}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography>Total Amount: ${currentBill.total_amount}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography>Discount: ${currentBill.discount_amount}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography>Final Amount: ${currentBill.final_amount}</Typography></Grid>
                      <Grid item xs={12}>
                        <Button variant="outlined" onClick={calculateDiscount} disabled={discountApplied || !currentBill.philhealth_id || currentBill.philhealth_id === "0"}>
                          Apply PhilHealth Discount
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          displayEmpty
                          fullWidth
                          margin="normal"
                        >
                          <MenuItem value="">Select Payment Method</MenuItem>
                          <MenuItem value="Cash">Cash</MenuItem>
                          <MenuItem value="Credit Card">Credit Card</MenuItem>
                          <MenuItem value="GCash">GCash</MenuItem>
                        </Select>
                      </Grid>
                      <Grid item xs={12}>
                        <Button variant="contained" color="primary" onClick={handlePayment} disabled={!paymentMethod}>
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
            <Typography variant="h6" gutterBottom>Available Treatments</Typography>
            <Typography>This section will list available treatments.</Typography>
          </Paper>
        </Box>
      )}

      {mainSection === "billingHistory" && (
        <Box className="dashboard-content">
          <Paper className="card">
            <Typography variant="h6" gutterBottom>Billing History</Typography>
            <Typography>This section will display billing history.</Typography>
          </Paper>
        </Box>
      )}

      {mainSection === "billingReports" && (
        <Box className="dashboard-content">
          <Paper className="card">
            <Typography variant="h6" gutterBottom>Billing Reports</Typography>
            <Typography>This section will generate billing reports.</Typography>
          </Paper>
        </Box>
      )}
    </DashboardLayout>
  );
}

export default BillingDashboard;