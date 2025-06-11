import { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!username || !password || !role || !fullName || !contactInfo || (role === "doctor" && !specialty)) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/register",
        { username, password, role, full_name: fullName, contact_info: contactInfo, specialty },
        { headers: { "Content-Type": "application/json" } }
      );
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout formTitle="Create User Form">
      <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
        <TextField
          label="USERNAME"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          variant="outlined"
          size="small"
        />
        <TextField
          label="PASSWORD"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="outlined"
          size="small"
        />
        <TextField
          label="FULL NAME"
          fullWidth
          margin="normal"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          variant="outlined"
          size="small"
        />
        <TextField
          label="CONTACT INFO"
          fullWidth
          margin="normal"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          variant="outlined"
          size="small"
        />
        <TextField
          select
          label="ROLE"
          fullWidth
          margin="normal"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          variant="outlined"
          size="small"
        >
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="doctor">Doctor</MenuItem>
          <MenuItem value="nurse">Nurse</MenuItem>
          <MenuItem value="billing_staff">Billing Staff</MenuItem>
        </TextField>
        {role === "doctor" && (
          <TextField
            label="SPECIALTY"
            fullWidth
            margin="normal"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            variant="outlined"
            size="small"
          />
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
        >
          {loading ? "REGISTERING..." : "REGISTER"}
        </Button>
      </Box>
      <Box textAlign="center" mt={2}>
        Already have an account? <Button onClick={() => navigate("/login")}>LOGIN HERE</Button>
      </Box>
    </AuthLayout>
  );
};

export default Register;