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

// Billing Reports Endpoint - MOVED TO TOP FOR PRIORITY
app.get("/api/billing/reports", authenticateToken, async (req, res) => {
  console.log("Backend: Request received for /api/billing/reports");
  const { period = 'monthly' } = req.query; // Set default period to 'monthly'
  console.log(`Backend: Period received: ${period}`);
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
    console.log(`Backend: Calculated startDate: ${startDate}`);
    if (startDate) {
      dateCondition = ` AND b.billing_date >= ?`;
      params.push(startDate);
    }

    // Total Patients
    console.log("Backend: Fetching Total Patients...");
    const [totalPatientsResult] = await db.query(
      `SELECT COUNT(DISTINCT v.patient_id) AS totalPatients FROM billings b JOIN visits v ON b.visit_id = v.visit_id WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalPatients = totalPatientsResult[0].totalPatients;
    console.log(`Backend: Total Patients Result: ${JSON.stringify(totalPatientsResult)}`);

    // Total Visits
    console.log("Backend: Fetching Total Visits...");
    const [totalVisitsResult] = await db.query(
      `SELECT COUNT(DISTINCT b.visit_id) AS totalVisits FROM billings b WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalVisits = totalVisitsResult[0].totalVisits;
    console.log(`Backend: Total Visits Result: ${JSON.stringify(totalVisitsResult)}`);

    // Total Bills
    console.log("Backend: Fetching Total Bills...");
    const [totalBillsResult] = await db.query(
      `SELECT COUNT(billing_id) AS totalBills FROM billings b WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalBills = totalBillsResult[0].totalBills;
    console.log(`Backend: Total Bills Result: ${JSON.stringify(totalBillsResult)}`);

    // Total Treatments
    console.log("Backend: Fetching Total Treatments...");
    const [totalTreatmentsResult] = await connection.query(
      `SELECT SUM(vt.quantity) AS totalTreatments 
       FROM billings b 
       JOIN visits v ON b.visit_id = v.visit_id
       JOIN visit_treatments vt ON v.visit_id = vt.visit_id
       JOIN treatments t ON vt.treatment_id = t.treatment_id
       WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalTreatments = totalTreatmentsResult[0].totalTreatments || 0;
    console.log(`Backend: Total Treatments Result: ${JSON.stringify(totalTreatmentsResult)}`);

    // Total Amount Collected
    console.log("Backend: Fetching Total Amount Collected...");
    const [totalAmountCollectedResult] = await connection.query(
      `SELECT SUM(b.final_amount) AS totalAmountCollected FROM billings b WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalAmountCollected = totalAmountCollectedResult[0].totalAmountCollected || 0;
    console.log(`Backend: Total Amount Collected Result: ${JSON.stringify(totalAmountCollectedResult)}`);

    // Average Bill Amount
    console.log("Backend: Fetching Average Bill Amount...");
    const [averageBillAmountResult] = await connection.query(
      `SELECT AVG(b.final_amount) AS averageBillAmount FROM billings b WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const averageBillAmount = averageBillAmountResult[0].averageBillAmount || 0;
    console.log(`Backend: Average Bill Amount Result: ${JSON.stringify(averageBillAmountResult)}`);

    // Most Common Treatments
    console.log("Backend: Fetching Most Common Treatments...");
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
    console.log(`Backend: Most Common Treatments Result: ${JSON.stringify(commonTreatmentsResult)}`);

    // Most Common Diagnoses
    console.log("Backend: Fetching Most Common Diagnoses...");
    const [commonDiagnosesResult] = await connection.query(
      `SELECT v.diagnosis AS name, COUNT(v.diagnosis) AS count
       FROM billings b
       JOIN visits v ON b.visit_id = v.visit_id
       WHERE b.is_paid = 1${dateCondition} AND v.diagnosis IS NOT NULL AND v.diagnosis != ''
       GROUP BY v.diagnosis
       ORDER BY count DESC
       LIMIT 3`,
      params
    );
    const commonDiagnoses = commonDiagnosesResult || [];
    console.log(`Backend: Most Common Diagnoses Result: ${JSON.stringify(commonDiagnosesResult)}`);

    res.json({
      totalPatients,
      totalVisits,
      totalBills,
      totalTreatments,
      totalAmountCollected,
      averageBillAmount,
      commonTreatments,
      commonDiagnoses,
    });
  } catch (err) {
    console.error("Backend: Error fetching billing reports:", err);
    return res.status(500).json({ message: "Error fetching billing reports" });
  } finally {
    if (connection) connection.release();
  }
});

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
      CONCAT(sp.sfirst_name, ' ', sp.slast_name) AS full_name, 
      sp.scontact_info AS contact_info,
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

  // Split full name into first and last name
  const nameParts = full_name.trim().split(' ');
  const sfirst_name = nameParts.slice(0, -1).join(' '); // All parts except last
  const slast_name = nameParts[nameParts.length - 1]; // Last part

  if (!sfirst_name || !slast_name) {
    return res.status(400).json({ message: "Please provide both first and last name" });
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
      "INSERT INTO staff_profiles (user_id, sfirst_name, slast_name, specialty, scontact_info) VALUES (?, ?, ?, ?, ?)",
      [userId, sfirst_name, slast_name, role === 'doctor' ? specialty : null, contact_info]
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
      "SELECT staff_id, sfirst_name, slast_name FROM staff_profiles WHERE specialty IS NOT NULL"
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

  console.log(`Backend - Received /api/patients request. Search term: '${search}', Filter: '${filter}'`);

  let sql = `
    SELECT 
      p.patient_id,
      CONCAT(p.pfirst_name, ' ', p.plast_name) AS full_name,
      p.dob,
      p.gender,
      p.pcontact_info,
      p.philhealth_id,
      p.guardian_name,
      p.guardian_contact,
      p.address,
      p.date_registered,
      TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age
    FROM patients p
  `;
  let params = [];
  let hasWhereClause = false;

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
      hasWhereClause = true;
    }
  }

  if (search) {
    const searchWords = search.trim().split(/\s+/);
    let nameSearchConditions = [];
    searchWords.forEach(word => {
      nameSearchConditions.push("p.pfirst_name LIKE ?");
      params.push(`%${word}%`);
      nameSearchConditions.push("p.plast_name LIKE ?");
      params.push(`%${word}%`);
    });
    
    let searchConditions = `(${nameSearchConditions.join(" OR ")})`;

    // Check if search term is a valid number for patient_id
    const isNumeric = /^[0-9]+$/.test(search.trim());
    if (isNumeric) {
      searchConditions += ` OR p.patient_id = ?`;
      params.push(search.trim());
    }

    sql += hasWhereClause ? " AND" : " WHERE";
    sql += ` (${searchConditions})`;
    hasWhereClause = true;
  }

  sql += " ORDER BY p.date_registered DESC";

  console.log(`Backend - Constructed SQL query: ${sql}`);
  console.log(`Backend - SQL parameters: ${JSON.stringify(params)}`);

  try {
    const [results] = await db.query(sql, params);
    console.log(`Backend - Search results from DB: ${JSON.stringify(results)}`);
    res.json(results);
  } catch (err) {
    console.error("Error fetching patients:", err);
    return res.status(500).json({ message: "Error fetching patients" });
  }
});

// Register new patient
app.post("/api/patients", async (req, res) => {
  const {
    pfirst_name, plast_name, dob, gender, pcontact_info, philhealth_id,
    guardian_name, guardian_contact, address
  } = req.body;
  const sql = `
    INSERT INTO patients
      (pfirst_name, plast_name, dob, gender, pcontact_info, philhealth_id, guardian_name, guardian_contact, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(
      sql,
      [pfirst_name, plast_name, dob, gender, pcontact_info, philhealth_id, guardian_name, guardian_contact, address]
    );
    res.status(201).json({ message: "Patient registered successfully", patient_id: result.insertId });
  } catch (err) {
    console.error("Error registering patient:", err);
    return res.status(500).json({ message: "Error registering patient" });
  }
});

// Update patient info
app.put("/api/patients/:id", async (req, res) => {
  const patientId = req.params.id;
  const {
    pfirst_name, plast_name, dob, gender, pcontact_info, philhealth_id,
    guardian_name, guardian_contact, address
  } = req.body;

  const sql = `
    UPDATE patients
    SET
      pfirst_name = ?, plast_name = ?, dob = ?, gender = ?, pcontact_info = ?,
      philhealth_id = ?, guardian_name = ?, guardian_contact = ?, address = ?
    WHERE patient_id = ?
  `;

  try {
    const [result] = await db.query(
      sql,
      [pfirst_name, plast_name, dob, gender, pcontact_info, philhealth_id, guardian_name, guardian_contact, address, patientId]
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
    INSERT INTO visits (patient_id, doctor_id, registered_by, visit_purpose, visit_status)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(
      sql,
      [patient_id, doctor_id, registered_by, visit_purpose, 'Pending Treatment']
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
    SELECT 
      v.visit_id, 
      v.visit_date, 
      v.visit_purpose, 
      v.visit_status, 
      v.diagnosis, 
      CONCAT(d.sfirst_name, ' ', d.slast_name) AS doctor_name,
      CONCAT(n.sfirst_name, ' ', n.slast_name) AS registered_by_full_name
    FROM visits v
    LEFT JOIN staff_profiles d ON v.doctor_id = d.staff_id
    LEFT JOIN staff_profiles n ON v.registered_by = n.staff_id
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
      CONCAT(p.pfirst_name, ' ', p.plast_name) AS full_name,
      TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
      p.gender,
      GROUP_CONCAT(DISTINCT v.diagnosis) AS diagnoses,
      GROUP_CONCAT(
        DISTINCT CONCAT(
          t.treatment_id, ' | ',
          t.treatment_name, ' | ',
          t.cost, ' | ',
          t.treatment_description, ' | ',
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
    GROUP BY p.patient_id, p.pfirst_name, p.plast_name, p.dob, p.gender
    ORDER BY last_visit_date DESC;
  `;

  try {
    const [results] = await db.query(sql, [doctorId]);

    const patientsWithTreatments = results.map(patient => {
      let treatments = [];
      if (patient.treatments) {
        treatments = patient.treatments.split(',').map(treatment => {
          const [treatment_id, treatment_name, cost, purpose, date] = treatment.split(' | ');
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
        CONCAT(p.pfirst_name, ' ', p.plast_name) AS full_name,
        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
        p.gender,
        p.dob,
        p.pcontact_info AS contact_info,
        p.philhealth_id,
        p.guardian_name,
        p.guardian_contact,
        p.address,
        p.date_registered,
        GROUP_CONCAT(DISTINCT v.diagnosis) AS diagnoses_raw,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            t.treatment_id, ' | ',
            t.treatment_name, ' | ',
            t.cost, ' | ',
            t.treatment_description, ' | ',
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
        const [treatment_id, treatment_name, cost, purpose, date] = treatment.split(' | ');
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
        b.is_paid,
        b.billing_id
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

    console.log("Backend - Final visits data being sent to frontend:", visitsWithTreatments); // Debug log

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

// New endpoint for doctors to get visits that need treatments logged
app.get("/api/doctor/pending-treatments-visits", authenticateToken, async (req, res) => {
  const doctorId = req.user.staffId;
  console.log("Fetching pending treatments for doctorId:", doctorId); // Debug log
  const sql = `
    SELECT
        p.patient_id,
        CONCAT(p.pfirst_name, ' ', p.plast_name) AS patient_name,
        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
        p.gender,
        v.visit_id,
        v.visit_date,
        v.visit_purpose,
        CONCAT(sp.sfirst_name, ' ', sp.slast_name) AS registered_by_doctor_name
    FROM
        visits v
    JOIN
        patients p ON v.patient_id = p.patient_id
    LEFT JOIN
        staff_profiles sp ON v.registered_by = sp.staff_id
    WHERE
        v.doctor_id = ? AND v.visit_status = 'Pending Treatment'
    GROUP BY v.visit_id
    ORDER BY v.visit_date DESC;
  `;
  console.log("SQL Query for pending treatments:", sql); // Debug log
  console.log("SQL Params for pending treatments:", [doctorId]); // Debug log

  try {
    const [results] = await db.query(sql, [doctorId]);
    console.log("Pending Treatment Visits Results:", results); // Debug log
    res.json(results);
  } catch (err) {
    console.error("Error fetching pending treatment visits:", err);
    return res.status(500).json({ message: "Error fetching pending treatment visits", error: err.message });
  }
});

// New endpoint to fetch unpaid bills
app.get("/api/billing/unpaid-bills", authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT 
        b.billing_id,
        b.visit_id,
        CONCAT(p.pfirst_name, ' ', p.plast_name) AS patient_name,
        p.philhealth_id,
        b.total_amount,
        b.discount_amount,
        b.final_amount,
        b.is_paid,
        b.billing_date,
        b.last_updated
      FROM billings b
      JOIN patients p ON b.patient_id = p.patient_id
      WHERE b.is_paid = 0
      ORDER BY b.billing_date DESC`
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching unpaid bills:", err);
    return res.status(500).json({ message: "Error fetching unpaid bills" });
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
        CONCAT(p.pfirst_name, ' ', p.plast_name) AS patient_name,
        v.visit_date,
        b.total_amount,
        b.discount_amount,
        b.final_amount,
        b.payment_method,
        sp.sfirst_name AS billing_staff_name,
        b.receipt_number,
        p.patient_id,
        v.visit_id
      FROM billings b
      JOIN visits v ON b.visit_id = v.visit_id
      JOIN patients p ON v.patient_id = p.patient_id
      LEFT JOIN staff_profiles sp ON b.staff_id = sp.staff_id
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

// New endpoint to fetch medical abstract by patient ID
app.get("/api/medical-abstracts/:patientId", authenticateToken, async (req, res) => {
  const { patientId } = req.params;
  const sql = `
    SELECT
      ma.abstract_id,
      CONCAT(p.pfirst_name, ' ', p.plast_name) AS patient_name,
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
        CONCAT(pfirst_name, ' ', plast_name) AS full_name,
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

// New endpoint to generate billing
app.post("/api/billing/generate", authenticateToken, async (req, res) => {
  const { visit_id, patient_id } = req.body;
  console.log(`Generating/Updating Billing for Visit ID: ${visit_id}, Patient ID: ${patient_id}`);
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Check if a billing record already exists for this visit
    let [existingBilling] = await connection.query(
      "SELECT billing_id FROM billings WHERE visit_id = ?",
      [visit_id]
    );

    let billingId;
    if (existingBilling.length === 0) {
      // Create a new billing record if none exists, explicitly including patient_id
      const [insertResult] = await connection.query(
        "INSERT INTO billings (visit_id, patient_id, total_amount, discount_amount, final_amount) VALUES (?, ?, 0, 0, 0)",
        [visit_id, patient_id]
      );
      billingId = insertResult.insertId;
    } else {
      billingId = existingBilling[0].billing_id;
      // If billing record exists, ensure patient_id is set if it's currently null
      await connection.query(
        "UPDATE billings SET patient_id = ? WHERE billing_id = ? AND patient_id IS NULL",
        [patient_id, billingId]
      );
    }

    // After treatments have been logged (by the previous API call), calculate the total amount from visit_treatments
    const [totalResult] = await connection.query(
      "SELECT COALESCE(SUM(subtotal), 0) AS calculated_total FROM visit_treatments WHERE visit_id = ?",
      [visit_id]
    );
    const calculatedTotalAmount = totalResult[0].calculated_total;

    // Update the total_amount in the billings table, which will then trigger recalculate_billing_amounts
    await connection.query(
      "UPDATE billings SET total_amount = ? WHERE visit_id = ?",
      [calculatedTotalAmount, visit_id]
    );

    await connection.commit();
    res.status(201).json({ message: "Billing generated/updated successfully" });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error generating billing:", err);
    return res.status(500).json({ message: "Failed to generate billing" });
  } finally {
    if (connection) connection.release();
  }
});

// New endpoint to update billing status to paid
app.put("/api/billing/pay", authenticateToken, async (req, res) => {
  const { billing_id, payment_method, billing_staff_id } = req.body;

  if (!billing_id || !payment_method || !billing_staff_id) {
    return res.status(400).json({ message: "Billing ID, Payment Method, and Billing Staff ID are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    console.log('Executing UPDATE billings query with params:', [payment_method, billing_staff_id, billing_id]);

    const [result] = await connection.query(
      `UPDATE billings
       SET is_paid = 1, payment_method = ?, payment_date = NOW(), staff_id = ?
       WHERE billing_id = ?`,
      [payment_method, billing_staff_id, billing_id]
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
        CONCAT(p.pfirst_name, ' ', p.plast_name) AS patient_name,
        p.philhealth_id,
        v.visit_id,
        v.visit_date,
        CONCAT(s.sfirst_name, ' ', s.slast_name) AS doctor_name,
        CONCAT(sp.sfirst_name, ' ', sp.slast_name) AS billing_staff_name,
        GROUP_CONCAT(DISTINCT CONCAT(
          t.treatment_id, ' | ',
          t.treatment_name, ' | ',
          t.cost, ' | ',
          vt.quantity
        )) AS treatments_raw
      FROM billings b
      LEFT JOIN patients p ON b.patient_id = p.patient_id
      JOIN visits v ON b.visit_id = v.visit_id
      LEFT JOIN staff_profiles s ON v.doctor_id = s.staff_id
      LEFT JOIN staff_profiles sp ON b.staff_id = sp.staff_id
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
        const [treatment_id, treatment_name, cost, quantity] = t.split(' | ');
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
      is_paid: bill.is_paid === 1, // Convert tinyint(1) to boolean
      total_amount: parseFloat(bill.total_amount) || 0,
      discount_amount: parseFloat(bill.discount_amount) || 0,
      final_amount: parseFloat(bill.final_amount) || 0,
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
  const { billing_id, payment_method, receipt_number, staff_id } = req.body;

  if (!billing_id || !payment_method || !staff_id) {
    return res.status(400).json({ message: "Billing ID, Payment Method, and Billing Staff ID are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    console.log('Executing UPDATE billings query with params:', [payment_method, receipt_number, staff_id, billing_id]);

    const [result] = await connection.query(
      `UPDATE billings
       SET is_paid = 1, payment_method = ?, receipt_number = ?, payment_date = NOW(), staff_id = ?
       WHERE billing_id = ?`,
      [payment_method, receipt_number, staff_id, billing_id]
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

// New endpoint for Doctor Patient Reports
app.get("/api/doctor/reports", authenticateToken, async (req, res) => {
  const { period } = req.query;

  console.log(`Received request for /api/doctor/reports with period: ${period}`);

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
  console.log(`Calculated startDateISO: ${startDateISO} for period: ${period}`);

  try {
    // Total Patients (all doctors)
    const totalPatientsQuery = `SELECT COUNT(DISTINCT v.patient_id) AS count
       FROM visits v
       WHERE v.visit_date >= ?`;
    console.log(`Executing Total Patients Query: ${totalPatientsQuery} with param: ${startDateISO}`);
    const [totalPatientsResult] = await db.query(
      totalPatientsQuery,
      [startDateISO]
    );
    const totalPatients = totalPatientsResult[0].count || 0;
    console.log(`Total Patients Result: ${totalPatients}`);

    // Used Treatments (all doctors)
    const treatmentsQuery = `SELECT t.treatment_name AS name, COUNT(vt.treatment_id) AS count
       FROM visit_treatments vt
       JOIN treatments t ON vt.treatment_id = t.treatment_id
       JOIN visits v ON vt.visit_id = v.visit_id
       WHERE v.visit_date >= ?
       GROUP BY t.treatment_name
       ORDER BY count DESC
       LIMIT 5`;
    console.log(`Executing Treatments Query: ${treatmentsQuery} with param: ${startDateISO}`);
    const [treatmentsResult] = await db.query(
      treatmentsQuery,
      [startDateISO]
    );
    console.log(`Treatments Result: ${JSON.stringify(treatmentsResult)}`);

    // Common Diagnoses (all doctors)
    const diagnosesQuery = `SELECT v.diagnosis AS name, COUNT(v.diagnosis) AS count
       FROM visits v
       WHERE v.visit_date >= ? AND v.diagnosis IS NOT NULL AND v.diagnosis != ''
       GROUP BY v.diagnosis
       ORDER BY count DESC
       LIMIT 5`;
    console.log(`Executing Diagnoses Query: ${diagnosesQuery} with param: ${startDateISO}`);
    const [diagnosesResult] = await db.query(
      diagnosesQuery,
      [startDateISO]
    );
    console.log(`Diagnoses Result: ${JSON.stringify(diagnosesResult)}`);

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

// Endpoint for doctors to log treatments and diagnosis for a visit
app.post("/api/doctor/log-treatment-diagnosis", authenticateToken, async (req, res) => {
  const { patient_id, visit_id, treatments, diagnosis } = req.body;

  if (!visit_id || !diagnosis || !treatments || !Array.isArray(treatments) || treatments.length === 0) {
    return res.status(400).json({ message: "Visit ID, diagnosis, and at least one treatment are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Update diagnosis and status in the visits table
    await connection.query(
      "UPDATE visits SET diagnosis = ?, visit_status = 'Completed' WHERE visit_id = ?",
      [diagnosis, visit_id]
    );

    // 2. Insert multiple treatments into visit_treatments table
    for (const treatment of treatments) {
      if (!treatment.treatment_id || !treatment.quantity) {
        throw new Error("Each treatment must have a treatment_id and quantity.");
      }
      await connection.query(
        "INSERT INTO visit_treatments (visit_id, treatment_id, quantity) VALUES (?, ?, ?)",
        [visit_id, treatment.treatment_id, treatment.quantity]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Treatments and diagnosis logged successfully" });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error logging treatment and diagnosis:", err);
    return res.status(500).json({ message: "Failed to log treatment and diagnosis" });
  } finally {
    if (connection) connection.release();
  }
});

// New endpoint for Admin System Reports
app.get("/api/admin/system-reports", authenticateToken, async (req, res) => {
  console.log("Backend: Request received for /api/admin/system-reports");
  const { period = 'monthly' } = req.query; // Set default period to 'monthly'
  console.log(`Backend: Period received: ${period}`);
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
    console.log(`Backend: Calculated startDate: ${startDate}`);
    if (startDate) {
      dateCondition = ` AND v.visit_date >= ?`;
      params.push(startDate);
    }

    // Total Patients (distinct patients who had visits within the period)
    console.log("Backend: Fetching Total Patients for System Reports...");
    const [totalPatientsResult] = await connection.query(
      `SELECT COUNT(DISTINCT patient_id) AS totalPatients FROM visits v WHERE 1=1${dateCondition}`,
      params
    );
    const totalPatients = totalPatientsResult[0].totalPatients || 0;
    console.log(`Backend: Total Patients Result: ${JSON.stringify(totalPatientsResult)}`);

    // Total Visits
    console.log("Backend: Fetching Total Visits for System Reports...");
    const [totalVisitsResult] = await connection.query(
      `SELECT COUNT(visit_id) AS totalVisits FROM visits v WHERE 1=1${dateCondition}`,
      params
    );
    const totalVisits = totalVisitsResult[0].totalVisits || 0;
    console.log(`Backend: Total Visits Result: ${JSON.stringify(totalVisitsResult)}`);

    // Total Treatments (sum of quantities of all treatments across all visits)
    console.log("Backend: Fetching Total Treatments for System Reports...");
    const [totalTreatmentsResult] = await connection.query(
      `SELECT COALESCE(SUM(vt.quantity), 0) AS totalTreatments 
       FROM visit_treatments vt
       JOIN visits v ON vt.visit_id = v.visit_id
       WHERE 1=1${dateCondition}`,
      params
    );
    const totalTreatments = totalTreatmentsResult[0].totalTreatments || 0;
    console.log(`Backend: Total Treatments Result: ${JSON.stringify(totalTreatmentsResult)}`);

    // Total Amount Collected (from all paid bills)
    console.log("Backend: Fetching Total Amount Collected for System Reports...");
    const [totalAmountCollectedResult] = await connection.query(
      `SELECT COALESCE(SUM(b.final_amount), 0) AS totalAmountCollected 
       FROM billings b 
       JOIN visits v ON b.visit_id = v.visit_id
       WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const totalAmountCollected = totalAmountCollectedResult[0].totalAmountCollected || 0;
    console.log(`Backend: Total Amount Collected Result: ${JSON.stringify(totalAmountCollectedResult)}`);

    // Average Bill Amount (from all paid bills)
    console.log("Backend: Fetching Average Bill Amount for System Reports...");
    const [averageBillAmountResult] = await connection.query(
      `SELECT COALESCE(AVG(b.final_amount), 0) AS averageBillAmount 
       FROM billings b 
       JOIN visits v ON b.visit_id = v.visit_id
       WHERE b.is_paid = 1${dateCondition}`,
      params
    );
    const averageBillAmount = averageBillAmountResult[0].averageBillAmount || 0;
    console.log(`Backend: Average Bill Amount Result: ${JSON.stringify(averageBillAmountResult)}`);

    // Most Common Treatments (across all visits)
    console.log("Backend: Fetching Most Common Treatments for System Reports...");
    const [commonTreatmentsResult] = await connection.query(
      `SELECT t.treatment_name AS name, COUNT(vt.treatment_id) AS count
       FROM visit_treatments vt
       JOIN visits v ON vt.visit_id = v.visit_id
       JOIN treatments t ON vt.treatment_id = t.treatment_id
       WHERE 1=1${dateCondition}
       GROUP BY t.treatment_name
       ORDER BY count DESC
       LIMIT 5`,
      params
    );
    const commonTreatments = commonTreatmentsResult || [];
    console.log(`Backend: Most Common Treatments Result: ${JSON.stringify(commonTreatmentsResult)}`);

    // Most Common Diagnoses (across all visits)
    console.log("Backend: Fetching Most Common Diagnoses for System Reports...");
    const [commonDiagnosesResult] = await connection.query(
      `SELECT diagnosis AS name, COUNT(diagnosis) AS count
       FROM visits v
       WHERE v.diagnosis IS NOT NULL AND v.diagnosis != ''${dateCondition}
       GROUP BY diagnosis
       ORDER BY count DESC
       LIMIT 5`,
      params
    );
    const commonDiagnoses = commonDiagnosesResult || [];
    console.log(`Backend: Most Common Diagnoses Result: ${JSON.stringify(commonDiagnosesResult)}`);

    res.json({
      totalPatients,
      totalVisits,
      totalTreatments,
      totalAmountCollected,
      averageBillAmount,
      commonTreatments,
      commonDiagnoses,
    });

  } catch (err) {
    console.error("Backend: Error fetching system reports:", err);
    return res.status(500).json({ message: "Error fetching system reports", error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Add more endpoints as needed for your app...

// Fallback 404 handler - MUST BE LAST ROUTE/MIDDLEWARE
app.use((req, res, next) => {
  console.log(`Fallback 404: Unmatched request to: ${req.originalUrl}`);
  res.status(404).json({ message: `Route Not Found: ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Patient Billing Server is running on Port ${PORT}`);
});