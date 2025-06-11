import { useState } from "react";
import axios from "axios";
import { TextField, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/login",
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );
      
      console.log("Login Response Data:", response.data);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("role", response.data.role);
      
      // Ensure staffId is stored correctly if present
      const staffIdFromResponse = response.data.staffId;
      if (staffIdFromResponse) {
        localStorage.setItem("relatedId", staffIdFromResponse);
      } else {
        localStorage.removeItem("relatedId"); // Clear if not a staff role
      }
      
      alert("Login successful!");
      const role = response.data.role;
      console.log("User Role after login:", role);
      if (role === "admin") navigate("/admin");
      else if (role === "doctor") navigate("/doctor");
      else if (role === "nurse") navigate("/nurse");
      else if (role === "billing_staff") navigate("/billing");
      else navigate("/");
    } catch (error) {
      // Enhanced error handling for troubleshooting
      let errorMsg = "Unknown error occurred.";
      if (error.response) {
        errorMsg = `Server responded with status ${error.response.status}: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMsg = "No response received from server. Check if backend is running.";
      } else if (error.message) {
        errorMsg = error.message;
      }
      alert("Login failed: " + errorMsg);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout formTitle="USER LOG IN FORM">
      <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
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
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
        >
          {loading ? "LOGGING IN..." : "LOGIN"}
        </Button>
      </Box>
      <Box textAlign="center" mt={2}>
        Don't have an account yet? <Button onClick={() => navigate("/register")}>REGISTER HERE</Button>
      </Box>
    </AuthLayout>
  );
};

export default Login;