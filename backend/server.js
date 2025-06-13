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
  const jwtSecret = process.env.JWT_SECRET || 'hospital_secret_key';
  console.log("Using JWT_SECRET:", jwtSecret);
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res.sendStatus(403);
    }
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
  let { filter, search, doctor_id } = req.query;
  let sql = `
    SELECT 
      p.*,
      TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
      CASE WHEN v.doctor_id = ? THEN 1 ELSE 0 END as is_assigned_to_doctor
    FROM patients p
    LEFT JOIN visits v ON p.patient_id = v.patient_id AND v.doctor_id = ?
  `;
  let params = [doctor_id, doctor_id];

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
    sql += params.length > 2 ? " AND" : " WHERE";
    sql += " (p.full_name LIKE ? OR p.patient_id = ?)";
    params.push(`%${search}%`, search);
  }
  sql += " GROUP BY p.patient_id ORDER BY p.date_registered DESC";

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

// Endpoint for doctors to log treatments and diagnosis for a visit
app.post("/api/doctor/log-treatment-diagnosis", authenticateToken, async (req, res) => {
  const { patient_id, visit_id, treatments, diagnosis } = req.body;
  const doctorId = req.user.staffId;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    if (treatments && treatments.length > 0) {
      for (const treatment of treatments) {
        console.log("Attempting to insert treatment:", treatment.name, treatment.cost, treatment.description);
        let [treatmentRows] = await connection.query(
          "SELECT treatment_id FROM treatments WHERE treatment_name = ? AND cost = ? AND treatment_description = ?",
          [treatment.name, treatment.cost, treatment.description]
        );

        let treatmentId;
        if (treatmentRows.length > 0) {
          treatmentId = treatmentRows[0].treatment_id;
        } else {
          const [newTreatmentResult] = await connection.query(
            "INSERT INTO treatments (treatment_name, cost, treatment_description) VALUES (?, ?, ?)",
            [treatment.name, treatment.cost, treatment.description]
          );
          treatmentId = newTreatmentResult.insertId;
        }

        await connection.query(
          "INSERT INTO visit_treatments (visit_id, treatment_id, quantity) VALUES (?, ?, 1)",
          [visit_id, treatmentId]
        );
      }
    }

    if (diagnosis) {
      await connection.query(
        "UPDATE visits SET diagnosis = ? WHERE visit_id = ?",
        [diagnosis, visit_id]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Treatment and diagnosis logged successfully" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Transaction error:", error);
    res.status(500).json({ message: "Failed to log treatment and diagnosis", error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
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
      `SELECT COUNT(DISTINCT v.patient_id) AS count
       FROM billings b
       JOIN visits v ON b.visit_id = v.visit_id
       WHERE b.is_paid = TRUE AND b.billing_date >= ?`,
      [startDateISO]
    );
    const totalPatients = totalPatientsResult[0].count || 0;

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

// New endpoint to fetch unpaid bills
app.get("/api/billing/unpaid-bills", authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT
        b.billing_id,
        p.full_name AS patient_name,
        v.visit_id,
        p.philhealth_id,
        b.total_amount
      FROM billings b
      JOIN visits v ON b.visit_id = v.visit_id
      JOIN patients p ON v.patient_id = p.patient_id
      WHERE b.is_paid = 0
    `);
    res.json(results);
  } catch (err) {
    console.error("Error fetching unpaid bills:", err);
    return res.status(500).json({ message: "Error fetching unpaid bills" });
  }
});

// New endpoint to generate billing
app.post("/api/billing/generate", authenticateToken, async (req, res) => {
  const { visit_id, patient_id } = req.body;

  if (!visit_id || !patient_id) {
    return res.status(400).json({ message: "Visit ID and Patient ID are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Calculate total amount for all treatments associated with the visit
    const [treatmentResults] = await connection.query(
      `SELECT SUM(t.cost) AS total_treatment_cost
       FROM visit_treatments vt
       JOIN treatments t ON vt.treatment_id = t.treatment_id
       WHERE vt.visit_id = ?`,
      [visit_id]
    );
    const totalAmount = treatmentResults[0].total_treatment_cost || 0;

    // 2. Fetch philhealth_id for the patient
    const [patientResults] = await connection.query(
      `SELECT philhealth_id FROM patients WHERE patient_id = ?`,
      [patient_id]
    );
    const philhealthId = patientResults.length > 0 ? patientResults[0].philhealth_id : null;

    // 3. Determine discount based on philhealth_id and total_amount
    let discountAmount = 0;
    if (philhealthId && philhealthId !== "0") {
      if (totalAmount < 5000) {
        discountAmount = totalAmount; // 100% discount
      } else if (totalAmount >= 5000) {
        discountAmount = totalAmount * 0.5; // 50% discount
      }
    }

    const finalAmount = totalAmount - discountAmount;

    // 4. Insert a new record into the billings table
    const [billingInsertResult] = await connection.query(
      `INSERT INTO billings (
        visit_id, 
        total_amount, 
        philhealth_id, 
        discount_amount, 
        final_amount, 
        is_paid
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [visit_id, totalAmount, philhealthId, discountAmount, finalAmount, 0]
    );

    await connection.commit();
    res.status(201).json({ message: "Billing generated successfully", billing_id: billingInsertResult.insertId });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error generating billing:", err);
    return res.status(500).json({ message: "Error generating billing", error: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// New endpoint to update billing status to paid
app.put("/api/billing/pay", authenticateToken, async (req, res) => {
  const { billing_id, payment_method, receipt_number, billing_staff_id } = req.body;

  if (!billing_id || !payment_method || !billing_staff_id) {
    return res.status(400).json({ message: "Billing ID, Payment Method, and Billing Staff ID are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    console.log('Executing UPDATE billings query with params:', [payment_method, receipt_number, billing_staff_id, billing_id]);

    const [result] = await connection.query(
      `UPDATE billings
       SET is_paid = 1, payment_method = ?, receipt_number = ?, payment_date = NOW(), billing_staff_id = ?
       WHERE billing_id = ?`,
      [payment_method, receipt_number, billing_staff_id, billing_id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Billing record not found or already paid." });
    }

    await connection.commit();
    res.json({ message: "Billing status updated to paid successfully." });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error updating billing status:", err);
    return res.status(500).json({ message: "Failed to update billing status", error: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Billing History Endpoint
app.get("/api/billing/history", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const [results] = await connection.query(`
      SELECT
        b.billing_id,
        p.full_name AS patient_name,
        v.visit_date,
        b.total_amount,
        b.discount_amount,
        b.final_amount,
        b.payment_method,
        sp.full_name AS billing_staff_name,
        b.receipt_number,
        p.patient_id,
        v.visit_id
      FROM billings b
      JOIN visits v ON b.visit_id = v.visit_id
      JOIN patients p ON v.patient_id = p.patient_id
      LEFT JOIN staff_profiles sp ON b.billing_staff_id = sp.staff_id
      WHERE b.is_paid = 1
      ORDER BY b.billing_date DESC
    `);
    res.json(results);
  } catch (err) {
    console.error("Error fetching billing history:", err);
    return res.status(500).json({ message: "Error fetching billing history" });
  } finally {
    if (connection) connection.release();
  }
});

// Billing Reports Endpoint
app.get("/api/billing/reports", authenticateToken, async (req, res) => {
  const { period = 'monthly' } = req.query; // Set default period to 'monthly'
  let connection;
  try {
    connection = await db.getConnection();

    let dateCondition = "";
    const params = [];
    const now = new Date();

    const getStartDate = (p) => {
      let startDate;
      if (p === "weekly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      } else if (p === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      } else if (p === "yearly") {
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      }
      return startDate ? startDate.toISOString().slice(0, 10) : null;
    };

    const startDate = getStartDate(period);
    if (startDate) {
      dateCondition = ` AND b.billing_date >= ?`;
      params.push(startDate);
    }

    // Total Patients
    const [totalPatientsResult] = await connection.query(
      `SELECT COUNT(DISTINCT v.patient_id) AS totalPatients FROM billings b JOIN visits v ON b.visit_id = v.visit_id WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalPatients = totalPatientsResult[0].totalPatients;

    // Total Visits
    const [totalVisitsResult] = await connection.query(
      `SELECT COUNT(DISTINCT b.visit_id) AS totalVisits FROM billings b WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalVisits = totalVisitsResult[0].totalVisits;

    // Total Bills
    const [totalBillsResult] = await connection.query(
      `SELECT COUNT(billing_id) AS totalBills FROM billings b WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalBills = totalBillsResult[0].totalBills;

    // Total Treatments
    const [totalTreatmentsResult] = await connection.query(
      `SELECT SUM(vt.quantity) AS totalTreatments 
       FROM billings b 
       JOIN visits v ON b.visit_id = v.visit_id
       JOIN visit_treatments vt ON v.visit_id = vt.visit_id
       WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalTreatments = totalTreatmentsResult[0].totalTreatments || 0;

    // Total Amount Collected
    const [totalAmountCollectedResult] = await connection.query(
      `SELECT SUM(b.final_amount) AS totalAmountCollected FROM billings b WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalAmountCollected = totalAmountCollectedResult[0].totalAmountCollected || 0;

    // Average Bill Amount
    const [averageBillAmountResult] = await connection.query(
      `SELECT AVG(b.final_amount) AS averageBillAmount FROM billings b WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const averageBillAmount = averageBillAmountResult[0].averageBillAmount || 0;

    // Most Common Treatments
    const [commonTreatmentsResult] = await connection.query(
      `SELECT t.treatment_name AS name, COUNT(vt.treatment_id) AS count
       FROM billings b
       JOIN visits v ON b.visit_id = v.visit_id
       JOIN visit_treatments vt ON v.visit_id = vt.visit_id
       JOIN treatments t ON vt.treatment_id = t.treatment_id
       WHERE b.is_paid = 1${dateCondition}
       GROUP BY t.treatment_name
       ORDER BY count DESC
       LIMIT 3`,
      params
    );
    const commonTreatments = commonTreatmentsResult || [];

    res.json({
      totalPatients,
      totalVisits,
      totalBills,
      totalTreatments,
      totalAmountCollected,
      averageBillAmount,
      commonTreatments,
    });
  } catch (err) {
    console.error("Error fetching billing reports:", err);
    return res.status(500).json({ message: "Error fetching billing reports" });
  } finally {
    if (connection) connection.release();
  }
});

// New endpoint to get a single detailed bill by ID
app.get("/api/billing/:billingId", authenticateToken, async (req, res) => {
  const { billingId } = req.params;
  let connection;
  try {
    connection = await db.getConnection();
    const [results] = await connection.query(
      `SELECT
        b.billing_id,
        b.receipt_number,
        b.payment_date,
        b.total_amount,
        b.discount_amount,
        b.final_amount,
        b.payment_method,
        b.is_paid,
        p.patient_id,
        p.full_name AS patient_name,
        p.philhealth_id,
        v.visit_id,
        v.visit_date,
        s.full_name AS doctor_name, -- Assuming doctor_id in visits links to staff_profiles
        sp.full_name AS billing_staff_name,
        GROUP_CONCAT(DISTINCT CONCAT(
          t.treatment_id, '|',
          t.treatment_name, '|',
          t.cost, '|',
          vt.quantity
        )) AS treatments_raw
      FROM billings b
      LEFT JOIN patients p ON b.patient_id = p.patient_id
      JOIN visits v ON b.visit_id = v.visit_id
      LEFT JOIN staff_profiles s ON v.doctor_id = s.staff_id
      LEFT JOIN staff_profiles sp ON b.billing_staff_id = sp.staff_id
      LEFT JOIN visit_treatments vt ON v.visit_id = vt.visit_id
      LEFT JOIN treatments t ON vt.treatment_id = t.treatment_id
      WHERE b.billing_id = ?
      GROUP BY b.billing_id
      LIMIT 1`,
      [billingId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Bill not found." });
    }

    const bill = results[0];

    let treatments = [];
    if (bill.treatments_raw) {
      treatments = bill.treatments_raw.split(',').map(t => {
        const [treatment_id, treatment_name, cost, quantity] = t.split('|');
        return {
          id: treatment_id,
          name: treatment_name,
          price: parseFloat(cost),
          quantity: parseInt(quantity)
        };
      });
    }

    res.json({
      ...bill,
      treatments,
      is_paid: bill.is_paid === 1 // Convert tinyint(1) to boolean
    });

  } catch (err) {
    console.error("Error fetching detailed bill:", err);
    return res.status(500).json({ message: "Error fetching detailed bill", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// New endpoint to process payment for a bill
app.post("/api/billing/process-payment", authenticateToken, async (req, res) => {
  const { billing_id, payment_method } = req.body;
  const billingStaffId = req.user.staffId; // Get billing staff ID from authenticated token

  console.log('Processing payment for billing_id:', billing_id);
  console.log('Payment method:', payment_method);
  console.log('Billing Staff ID from token:', billingStaffId);

  if (!billing_id || !payment_method || !billingStaffId) {
    return res.status(400).json({ message: "Missing required payment details." });
  }

  try {
    const [result] = await db.query(
      `UPDATE billings SET
        payment_method = ?,
        billing_staff_id = ?,
        is_paid = 1,
        receipt_number = CONCAT('RCP-', DATE_FORMAT(CURRENT_TIMESTAMP(), '%Y%m%d'), '-', ?)
      WHERE billing_id = ?`,
      [payment_method, billingStaffId, billing_id, billing_id] // Re-use billing_id for receipt number generation
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bill not found or already paid." });
    }
    res.status(200).json({ message: "Payment processed successfully" });
  } catch (err) {
    console.error("Error processing payment:", err);
    return res.status(500).json({ message: "Error processing payment", error: err.message });
  }
});

// New endpoint to generate medical abstract for a specific paid visit
app.post("/api/medical-abstracts/generate-for-visit", authenticateToken, async (req, res) => {
  const { patient_id, visit_id } = req.body;

  if (!patient_id || !visit_id) {
    return res.status(400).json({ message: "Patient ID and Visit ID are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // 1. Verify the visit exists and is for the given patient
    const [visitRows] = await connection.query(
      `SELECT
        v.visit_id,
        v.visit_date,
        v.visit_purpose,
        v.diagnosis,
        b.is_paid
      FROM visits v
      LEFT JOIN billings b ON v.visit_id = b.visit_id
      WHERE v.visit_id = ? AND v.patient_id = ?`,
      [visit_id, patient_id]
    );

    if (visitRows.length === 0) {
      return res.status(404).json({ message: "Visit not found for this patient." });
    }

    const visit = visitRows[0];

    // 2. Check if the visit is paid
    if (!visit.is_paid) {
      return res.status(402).json({ message: "Billing for this visit is not yet paid." });
    }

    // 3. Fetch patient details
    const [patientRows] = await connection.query(
      `SELECT
        full_name,
        TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age,
        gender
      FROM patients
      WHERE patient_id = ?`,
      [patient_id]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ message: "Patient details not found." });
    }

    const patient = patientRows[0];

    // 4. Fetch treatments for this visit
    const [treatmentsResults] = await connection.query(
      `SELECT
        t.treatment_name,
        t.cost,
        t.treatment_description
      FROM visit_treatments vt
      JOIN treatments t ON vt.treatment_id = t.treatment_id
      WHERE vt.visit_id = ?`,
      [visit_id]
    );

    // 5. Construct the medical abstract content
    const treatmentsSummary = treatmentsResults.map(t => 
      `${t.treatment_name} (Cost: ${t.cost}, Purpose: ${t.treatment_description})`
    ).join("; ") || "No treatments recorded.";

    const medicalAbstract = {
      patient_name: patient.full_name,
      patient_id: patient_id,
      age: patient.age,
      gender: patient.gender,
      visit_date: visit.visit_date,
      visit_purpose: visit.visit_purpose,
      diagnosis: visit.diagnosis || "No diagnosis recorded.",
      treatments_summary: treatmentsSummary,
      payment_status: visit.is_paid ? "Paid" : "Unpaid",
      generated_date: new Date().toISOString().slice(0, 10),
    };

    res.json({ message: "Medical abstract generated successfully", abstract: medicalAbstract });

  } catch (err) {
    console.error("Error generating medical abstract for visit:", err);
    return res.status(500).json({ message: "Error generating medical abstract", error: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Add more endpoints as needed for your app...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Patient Billing Server is running on Port ${PORT}`);
});