const express = require("express");
const mysql2 = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const db = mysql2.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "billing_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection()
  .then(() => {
    console.log("Connected to MySQL database");
  })
  .catch((err) => {
    console.log("Database connection failed", err);
  });

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET || 'hospital_secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Get all users with optional role filter
app.get("/api/users", authenticateToken, async (req, res) => {
  const { role } = req.query;
  let sql = `
    SELECT 
      u.user_id, 
      u.username, 
      u.role,
      u.date_created, 
      sp.staff_id, 
      sp.full_name, 
      sp.contact_info,
      sp.specialty
    FROM users u
    LEFT JOIN staff_profiles sp ON u.user_id = sp.user_id
  `;
  let params = [];

  if (role) {
    sql += " WHERE u.role = ?";
    params.push(role);
  }

  try {
    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Error fetching users" });
  }
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  const { username, password, role, full_name, specialty, contact_info } = req.body;
  if (!username || !password || !role || !full_name || !contact_info || (role === 'doctor' && !specialty)) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [userCheckResults] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (userCheckResults.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const [userInsertResult] = await db.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, role]);
    const userId = userInsertResult.insertId;

    if (role === 'admin') {
      return res.status(201).json({ message: "Admin registered successfully" });
    }

    // Insert staff profile
    await db.query(
      "INSERT INTO staff_profiles (user_id, full_name, specialty, contact_info) VALUES (?, ?, ?, ?)",
      [userId, full_name, role === 'doctor' ? specialty : null, contact_info]
    );
    res.status(201).json({ message: "User and profile registered successfully" });
  } catch (err) {
    console.error("Registration failed:", err);
    return res.status(500).json({ message: "Registration Failed" });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const [userResults] = await connection.query("SELECT * FROM users WHERE username = ?", [username]);
    if (userResults.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const user = userResults[0];

    if (!user.password) {
      return res.status(400).json({ message: "User has no password set" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    let staffId = null;
    if (user.role !== 'admin') {
      const [staffResults] = await connection.query("SELECT staff_id FROM staff_profiles WHERE user_id = ?", [user.user_id]);
      if (staffResults.length > 0) staffId = staffResults[0].staff_id;
    }

    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role, staffId },
      process.env.JWT_SECRET || 'hospital_secret_key',
      { expiresIn: "8h" }
    );
    res.json({
      message: "Login successful",
      token,
      username: user.username,
      role: user.role,
      staffId,
    });

  } catch (err) {
    console.error("Login failed:", err);
    return res.status(500).json({ message: "Login Failed" });
  } finally {
    if (connection) connection.release();
  }
});

// Get all doctors for dropdown
app.get("/api/doctors", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT staff_id, full_name FROM staff_profiles WHERE specialty IS NOT NULL"
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching doctors:", err);
    return res.status(500).json({ message: "Error fetching doctors" });
  }
});

// Get all patients with optional filter and search
app.get("/api/patients", authenticateToken, async (req, res) => {
  let { filter, search } = req.query;
  let sql = `
    SELECT 
      p.*,
      TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age
    FROM patients p
  `;
  let params = [];

  if (filter) {
    let dateField = "date_registered";
    let now = new Date();
    let startDate;
    if (filter === "weekly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (filter === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (filter === "yearly") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    if (startDate) {
      sql += " WHERE " + dateField + " >= ?";
      params.push(startDate.toISOString().slice(0, 10));
    }
  }

  if (search) {
    sql += params.length ? " AND" : " WHERE";
    sql += " (p.full_name LIKE ? OR p.patient_id = ?)";
    params.push(`%${search}%`, search);
  }
  sql += " ORDER BY p.date_registered DESC";

  try {
    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error("Error fetching patients:", err);
    return res.status(500).json({ message: "Error fetching patients" });
  }
});

// Register new patient
app.post("/api/patients", async (req, res) => {
  const {
    full_name, dob, gender, contact_info, philhealth_id,
    guardian_name, guardian_contact, address
  } = req.body;
  const sql = `
    INSERT INTO patients
      (full_name, dob, gender, contact_info, philhealth_id, guardian_name, guardian_contact, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(
      sql,
      [full_name, dob, gender, contact_info, philhealth_id, guardian_name, guardian_contact, address]
    );
    res.status(201).json({ message: "Patient registered successfully", patient_id: result.insertId });
  } catch (err) {
    console.error("Error registering patient:", err);
    return res.status(500).json({ message: "Error registering patient" });
  }
});

// Update patient info
app.put("/api/patients/:id", async (req, res) => {
  const {
    full_name, dob, gender, contact_info, philhealth_id,
    guardian_name, guardian_contact, address
  } = req.body;
  const sql = `
    UPDATE patients SET
      full_name = ?, dob = ?, gender = ?, contact_info = ?, philhealth_id = ?,
      guardian_name = ?, guardian_contact = ?, address = ?
    WHERE patient_id = ?
  `;

  try {
    const [result] = await db.query(
      sql,
      [full_name, dob, gender, contact_info, philhealth_id, guardian_name, guardian_contact, address, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json({ message: "Patient updated successfully" });
  } catch (err) {
    console.error("Error updating patient:", err);
    return res.status(500).json({ message: "Error updating patient" });
  }
});

// Log a new visit
app.post("/api/visits", async (req, res) => {
  const { patient_id, registered_by, doctor_id, visit_purpose } = req.body;
  if (!patient_id || !registered_by || !doctor_id || !visit_purpose) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const sql = `
    INSERT INTO visits (patient_id, doctor_id, registered_by, visit_purpose)
    VALUES (?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(
      sql,
      [patient_id, doctor_id, registered_by, visit_purpose]
    );
    res.status(201).json({ message: "Visit logged successfully", visit_id: result.insertId });
  } catch (err) {
    console.error("Error logging visit:", err);
    return res.status(500).json({ message: "Error logging visit" });
  }
});

// Get all visits for a patient
app.get("/api/visits/:patientId", async (req, res) => {
  const sql = `
    SELECT v.visit_id, v.visit_date, v.visit_purpose, v.visit_status, s.full_name AS doctor_name
    FROM visits v
    LEFT JOIN staff_profiles s ON v.doctor_id = s.staff_id
    WHERE v.patient_id = ?
    ORDER BY v.visit_date DESC
  `;

  try {
    const [results] = await db.query(sql, [req.params.patientId]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching visits:", err);
    return res.status(500).json({ message: "Error fetching visits" });
  }
});

// Get all doctors' patients
app.get("/api/doctor/patients", authenticateToken, async (req, res) => {
  const doctorId = req.user.staffId;
  const sql = `
    SELECT 
      p.patient_id,
      p.full_name AS full_name,
      TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
      p.gender,
      GROUP_CONCAT(DISTINCT v.diagnosis) AS diagnoses,
      GROUP_CONCAT(
        DISTINCT CONCAT(
          t.treatment_id, '|',
          t.treatment_name, '|',
          t.cost, '|',
          t.treatment_description, '|',
          v.visit_date
        )
      ) AS treatments,
      MAX(b.is_paid) AS is_paid,
      MAX(v.visit_date) AS last_visit_date
    FROM patients p
    JOIN visits v ON p.patient_id = v.patient_id
    JOIN staff_profiles s ON v.doctor_id = s.staff_id
    LEFT JOIN billings b ON v.visit_id = b.visit_id
    LEFT JOIN visit_treatments vt ON v.visit_id = vt.visit_id
    LEFT JOIN treatments t ON vt.treatment_id = t.treatment_id
    WHERE s.staff_id = ? 
    GROUP BY p.patient_id, p.full_name, p.dob, p.gender
    ORDER BY last_visit_date DESC;
  `;

  try {
    const [results] = await db.query(sql, [doctorId]);

    const patientsWithTreatments = results.map(patient => {
      let treatments = [];
      if (patient.treatments) {
        treatments = patient.treatments.split(',').map(treatment => {
          const [treatment_id, treatment_name, cost, purpose, date] = treatment.split('|');
          return {
            treatment_id,
            treatment_name,
            price: cost,
            purpose,
            date
          };
        });
      }

      const diagnoses = patient.diagnoses ? patient.diagnoses.split(',') : [];

      return {
        ...patient,
        treatments,
        diagnoses,
        is_paid: patient.is_paid === 1
      };
    });

    res.json(patientsWithTreatments);
  } catch (err) {
    console.error("Error fetching assigned patients:", err);
    return res.status(500).json({ message: "Error fetching assigned patients", error: err.message });
  }
});

// New endpoint to get a single patient's detailed information for a doctor
app.get("/api/doctor/patients/:patientId", authenticateToken, async (req, res) => {
  const { patientId } = req.params;
  const doctorId = req.user.staffId;

  try {
    const [patientRows] = await db.query(
      `SELECT
        p.patient_id,
        p.full_name,
        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
        p.gender,
        p.dob,
        p.contact_info,
        p.philhealth_id,
        p.guardian_name,
        p.guardian_contact,
        p.address,
        p.date_registered,
        GROUP_CONCAT(DISTINCT v.diagnosis) AS diagnoses_raw,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            t.treatment_id, '|',
            t.treatment_name, '|',
            t.cost, '|',
            t.treatment_description, '|',
            v.visit_date
          )
        ) AS treatments_raw
      FROM patients p
      LEFT JOIN visits v ON p.patient_id = v.patient_id AND v.doctor_id = ?
      LEFT JOIN visit_treatments vt ON v.visit_id = vt.visit_id
      LEFT JOIN treatments t ON vt.treatment_id = t.treatment_id
      WHERE p.patient_id = ?
      GROUP BY p.patient_id
      `,
      [doctorId, patientId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const patient = patientRows[0];

    let treatments = [];
    if (patient.treatments_raw) {
      treatments = patient.treatments_raw.split(',').map(treatment => {
        const [treatment_id, treatment_name, cost, purpose, date] = treatment.split('|');
        return {
          treatment_id,
          treatment_name,
          price: cost,
          purpose,
          date
        };
      });
    }

    const diagnoses = patient.diagnoses_raw ? patient.diagnoses_raw.split(',') : [];

    const [visitsResult] = await db.query(
      `SELECT
        v.visit_id,
        v.visit_date,
        v.visit_purpose,
        v.diagnosis AS visit_diagnosis,
        v.visit_status,
        b.is_paid
      FROM visits v
      LEFT JOIN billings b ON v.visit_id = b.visit_id
      WHERE v.patient_id = ? AND v.doctor_id = ?
      ORDER BY v.visit_date DESC`,
      [patientId, doctorId]
    );

    // Fetch treatments for each visit
    const visitsWithTreatments = await Promise.all(visitsResult.map(async (visit) => {
      const [visitTreatments] = await db.query(
        `SELECT
          t.treatment_id,
          t.treatment_name,
          t.cost AS price,
          t.treatment_description AS purpose
        FROM visit_treatments vt
        JOIN treatments t ON vt.treatment_id = t.treatment_id
        WHERE vt.visit_id = ?`,
        [visit.visit_id]
      );
      return { ...visit, treatments: visitTreatments };
    }));

    res.json({
      ...patient,
      diagnoses,
      treatments,
      visits: visitsWithTreatments,
    });

  } catch (err) {
    console.error("Error fetching single patient details for doctor:", err);
    res.status(500).json({ message: "Error fetching patient details" });
  }
});

// New endpoint to get a single patient's payment status
app.get("/api/patient/:patientId/payment-status", authenticateToken, async (req, res) => {
  const { patientId } = req.params;
  const sql = `
    SELECT is_paid
    FROM patient_visit_history
    WHERE patient_id = ?
    ORDER BY visit_date DESC
    LIMIT 1;
  `;

  try {
    const [results] = await db.query(sql, [patientId]);
    if (results.length > 0) {
      res.json({ is_paid: results[0].is_paid === 1 });
    } else {
      res.json({ is_paid: false });
    }
  } catch (err) {
    console.error("Error fetching patient payment status:", err);
    return res.status(500).json({ message: "Error fetching payment status" });
  }
});

// Get all treatments
app.get("/api/treatments", authenticateToken, async (req, res) => {
  const sql = "SELECT * FROM treatments";
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error("Error fetching treatments:", err);
    return res.status(500).json({ message: "Error fetching treatments" });
  }
});

// Add a new treatment (Doctor can add)
app.post("/api/treatments", authenticateToken, async (req, res) => {
  const { treatment_name, cost, treatment_description } = req.body;
  if (!treatment_name || !cost || !treatment_description) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const sql = "INSERT INTO treatments (treatment_name, cost, treatment_description) VALUES (?, ?, ?)";

  try {
    const [result] = await db.query(sql, [treatment_name, cost, treatment_description]);
    res.status(201).json({ message: "Treatment added successfully", treatment_id: result.insertId });
  } catch (err) {
    console.error("Error adding treatment:", err);
    return res.status(500).json({ message: "Error adding treatment" });
  }
});

// Update a treatment (Doctor can edit)
app.put("/api/treatments/:id", authenticateToken, async (req, res) => {
  const { treatment_name, cost, treatment_description } = req.body;
  const { id } = req.params;
  if (!treatment_name || !cost || !treatment_description) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const sql = "UPDATE treatments SET treatment_name = ?, cost = ?, treatment_description = ? WHERE treatment_id = ?";

  console.log(`Attempting to update treatment ID: ${id}`);
  console.log(`New data: Name=${treatment_name}, Cost=${cost}, Description=${treatment_description}`);

  try {
    const [result] = await db.query(sql, [treatment_name, cost, treatment_description, id]);
    console.log("Update result affectedRows:", result.affectedRows);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Treatment not found" });
    }
    res.json({ message: "Treatment updated successfully" });
  } catch (err) {
    console.error("Error updating treatment:", err);
    return res.status(500).json({ message: "Error updating treatment" });
  }
});

// Log a new treatment for a patient (Doctor can add)
app.post("/api/doctor/treatments", authenticateToken, async (req, res) => {
  const { patientId, name, cost, treatment_description, diagnosis, visitId: frontendVisitId } = req.body;
  const doctorId = req.user.staffId;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let visitIdToUse = frontendVisitId;

    if (!visitIdToUse) {
      const [visits] = await connection.query(
        "SELECT visit_id FROM visits WHERE patient_id = ? AND doctor_id = ? ORDER BY visit_date DESC LIMIT 1",
        [patientId, doctorId]
      );

      if (visits.length > 0) {
        visitIdToUse = visits[0].visit_id;
      } else {
        const [newVisitResult] = await connection.query(
          "INSERT INTO visits (patient_id, doctor_id, registered_by, visit_purpose) VALUES (?, ?, ?, ?)",
          [patientId, doctorId, doctorId, `Treatment for ${name}`]
        );
        visitIdToUse = newVisitResult.insertId;
      }
    }

    if (!visitIdToUse) {
      throw new Error("Invalid or no visit ID provided.");
    }

    let [treatmentRows] = await connection.query(
      "SELECT treatment_id FROM treatments WHERE treatment_name = ? AND cost = ? AND treatment_description = ?",
      [name, cost, treatment_description]
    );

    let treatmentId;
    if (treatmentRows.length > 0) {
      treatmentId = treatmentRows[0].treatment_id;
    } else {
      const [newTreatmentResult] = await connection.query(
        "INSERT INTO treatments (treatment_name, cost, treatment_description) VALUES (?, ?, ?)",
        [name, cost, treatment_description]
      );
      treatmentId = newTreatmentResult.insertId;
    }

    await connection.query(
      "INSERT INTO visit_treatments (visit_id, treatment_id, quantity) VALUES (?, ?, 1)",
      [visitIdToUse, treatmentId]
    );

    if (diagnosis) {
      await connection.query(
        "UPDATE visits SET diagnosis = ? WHERE visit_id = ?",
        [diagnosis, visitIdToUse]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Treatment logged successfully" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Transaction error:", error);
    res.status(500).json({ message: "Failed to log treatment", error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// New endpoint to fetch medical abstract by patient ID
app.get("/api/medical-abstracts/:patientId", authenticateToken, async (req, res) => {
  const { patientId } = req.params;
  const sql = `
    SELECT
      ma.abstract_id,
      p.full_name AS patient_name,
      TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
      p.gender,
      ma.diagnosis,
      ma.treatments_summary,
      ma.payment_status,
      ma.created_at AS generated_date
    FROM medical_abstracts ma
    JOIN patients p ON ma.patient_id = p.patient_id
    WHERE ma.patient_id = ?
    ORDER BY ma.created_at DESC
    LIMIT 1;
  `;

  try {
    const [results] = await db.query(sql, [patientId]);
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: "Medical abstract not found for this patient." });
    }
  } catch (err) {
    console.error("Error fetching medical abstract:", err);
    return res.status(500).json({ message: "Error fetching medical abstract" });
  }
});

// New endpoint for Doctor Patient Reports
app.get("/api/doctor/reports", authenticateToken, async (req, res) => {
  const { period } = req.query;
  const doctorId = req.user.staffId; // Assuming doctorId is available in req.user after authentication

  let startDate;
  const now = new Date();

  switch (period) {
    case "weekly":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case "yearly":
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      return res.status(400).json({ message: "Invalid report period specified." });
  }

  const startDateISO = startDate.toISOString().slice(0, 10);

  try {
    // Total Patients
    const [totalPatientsResult] = await db.query(
      `SELECT COUNT(DISTINCT p.patient_id) AS total_patients
       FROM patients p
       JOIN visits v ON p.patient_id = v.patient_id
       WHERE v.doctor_id = ? AND v.visit_date >= ?`,
      [doctorId, startDateISO]
    );
    const totalPatients = totalPatientsResult[0].total_patients;

    // Used Treatments
    const [treatmentsResult] = await db.query(
      `SELECT t.treatment_name AS name, COUNT(vt.treatment_id) AS count
       FROM visit_treatments vt
       JOIN treatments t ON vt.treatment_id = t.treatment_id
       JOIN visits v ON vt.visit_id = v.visit_id
       WHERE v.doctor_id = ? AND v.visit_date >= ?
       GROUP BY t.treatment_name
       ORDER BY count DESC
       LIMIT 5`,
      [doctorId, startDateISO]
    );

    // Common Diagnoses
    const [diagnosesResult] = await db.query(
      `SELECT v.diagnosis AS name, COUNT(v.diagnosis) AS count
       FROM visits v
       WHERE v.doctor_id = ? AND v.visit_date >= ? AND v.diagnosis IS NOT NULL AND v.diagnosis != ''
       GROUP BY v.diagnosis
       ORDER BY count DESC
       LIMIT 5`,
      [doctorId, startDateISO]
    );

    res.json({
      totalPatients,
      treatments: treatmentsResult,
      diagnoses: diagnosesResult,
    });

  } catch (err) {
    console.error("Error fetching doctor reports:", err);
    res.status(500).json({ message: "Error fetching reports" });
  }
});

// New endpoint for doctors to get visits that need treatments logged
app.get("/api/doctor/pending-treatments-visits", authenticateToken, async (req, res) => {
  const doctorId = req.user.staffId;
  const sql = `
    SELECT
        p.patient_id,
        p.full_name AS patient_name,
        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
        p.gender,
        v.visit_id,
        v.visit_date,
        v.visit_purpose,
        sp.full_name AS registered_by_doctor_name
    FROM
        visits v
    JOIN
        patients p ON v.patient_id = p.patient_id
    JOIN
        staff_profiles sp ON v.registered_by = sp.staff_id
    LEFT JOIN
        visit_treatments vt ON v.visit_id = vt.visit_id
    WHERE
        v.doctor_id = ? AND vt.visit_id IS NULL
    ORDER BY
        v.visit_date DESC;
  `;

  try {
    const [results] = await db.query(sql, [doctorId]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching pending treatment visits:", err);
    return res.status(500).json({ message: "Error fetching pending treatment visits", error: err.message });
  }
});

// Add more endpoints as needed for your app...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Patient Billing Server is running on Port ${PORT}`);
});