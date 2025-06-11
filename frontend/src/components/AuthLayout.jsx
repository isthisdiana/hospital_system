import { Box, Paper, Typography } from "@mui/material";
import HospitalIcon from "../assets/hospital.svg"; // Corrected path to hospital.svg

const AuthLayout = ({ children, formTitle }) => {
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f7fa" }}>
      <Paper elevation={3} sx={{
        display: "flex",
        width: '100%',
        maxWidth: 1000, // Increased max-width to make the form larger
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        {/* Left Section - Image and System Title */}
        <Box sx={{
          width: '50%',
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e0f2f7', // Light blue background for the left section
          color: '#333'
        }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            PATIENT BILLING MANAGEMENT SYSTEM
          </Typography>
          <Box
            component="img"
            src={HospitalIcon}
            alt="Hospital Icon"
            sx={{
              width: 200,
              height: 200,
              objectFit: 'contain',
              mb: 3
            }}
          />
        </Box>

        {/* Right Section - Form */}
        <Box sx={{
          width: '50%',
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#fff'
        }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            {formTitle}
          </Typography>
          {children}
        </Box>
      </Paper>
    </div>
  );
};

export default AuthLayout; 