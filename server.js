const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const path = require("path");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// connect to MongoDB
// mongoose.connect("mongodb://127.0.0.1:27017/attendance", {
mongoose.connect("mongodb+srv://codeserve:codeserve%40776@cluster0.x3zycul.mongodb.net/attendance?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));



// serve public assets
app.use(express.static(path.join(__dirname, "public")));

// also expose view subfolders for direct GETs like /auth/student-login.html
app.use('/auth', express.static(path.join(__dirname, 'views', 'auth')));
app.use('/dashboards', express.static(path.join(__dirname, 'views', 'dashboards')));
app.use('/misc', express.static(path.join(__dirname, 'views', 'misc')));



// routes that render top-level views (clean URLs)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.get("/student", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "student-index.html"));
});
app.get("/teacher", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "teacher-index.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views","auth", "admin-login.html"));
});
app.get("/about-us", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about-us.html"));
});
app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "contact.html"));
});
app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "misc","forgot-password.html"));
});

// Route to generate QR code for a student
app.get("/generate-qr/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).send("Student not found");

    // ✅ Full URL to mark attendance
    const attendanceURL = `http://10.156.245.70/mark-attendance?studentId=${studentId}`;

    // Generate QR code
    const qrImage = await QRCode.toDataURL(attendanceURL);

    // Send as HTML image
    res.send(`<img src="${qrImage}" alt="QR Code for ${student.fullName}" />`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// ----------------- STUDENT -----------------
// Student model
const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  whatsapp: { type: String, required: true },
  password: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },

  // ✅ New attendance field
  attendance: [
    {
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ["present"], default: "present" }
    }
  ]
});

const Student = mongoose.model("Student", studentSchema);



app.post("/student-signup", async (req, res) => {
  try {
    const { fullName, studentId, dob, gender, whatsapp, password, confirmPassword } = req.body;

    // 1️⃣ Check all fields
    if (!fullName || !studentId || !dob || !gender || !whatsapp || !password || !confirmPassword) {
      return res.json({ success: false, message: "All fields are required" });
    }

    // 2️⃣ Password match
    if (password !== confirmPassword) {
      return res.json({ success: false, message: "Passwords do not match" });
    }

    // 3️⃣ Check if student exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.json({ success: false, message: "Student ID already registered" });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create student (auto pending)
    const newStudent = new Student({
      fullName,
      studentId,
      dob,
      gender,
      whatsapp,
      password: hashedPassword,
      status: "pending"
    });

    await newStudent.save();

    // 6️⃣ Success response
    res.json({ success: true, message: "Signup successful! Await approval." });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});




app.get("/student-login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "student-login.html"));
});




app.post("/student-login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // Find student by ID
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.json({ success: false, message: "Invalid Student ID or Password" });
    }

    // Check if approved
    if (student.status !== "approved") {
      return res.json({ success: false, message: "Your account is not approved yet. Please wait for teacher approval." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid Student ID or Password" });

    // ✅ Login successful → return JSON with studentId
    return res.json({ success: true, studentId: student.studentId });

  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
});

// Student Dashboard page
app.get("/student-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views","dashboards","student-dashboard.html"));
});




app.get("/student-signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "student-signup.html"));
});



// ----------------- TEACHER -----------------

const teacherSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  teacherId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true // optional
  },
  whatsapp: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

// Create Teacher model
const Teacher = mongoose.model("Teacher", teacherSchema);

// ----------------- TEACHER SIGNUP -----------------
app.post("/teacher-signup", async (req, res) => {
  try {
    const { fullName, teacherId, email, whatsapp, gender, password, confirmPassword } = req.body;

    // 1️⃣ Check all fields
    if (!fullName || !teacherId || !whatsapp || !gender || !password || !confirmPassword) {
      return res.json({ success: false, message: "All fields are required" });
    }

    // 2️⃣ Password match
    if (password !== confirmPassword) {
      return res.json({ success: false, message: "Passwords do not match" });
    }

    // 3️⃣ Check if teacher exists
    const existingTeacher = await Teacher.findOne({ teacherId });
    if (existingTeacher) {
      return res.json({ success: false, message: "Teacher ID already exists" });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create teacher
    const newTeacher = new Teacher({
      fullName,
      teacherId,
      email,
      whatsapp,
      gender,
      password: hashedPassword
    });

    await newTeacher.save();

    // 6️⃣ Success response
    res.json({ success: true, message: "Signup successful! Please login." });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ----------------- TEACHER LOGIN -----------------
app.get("/teacher-login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "teacher-login.html"));
});

app.post("/teacher-login", async (req, res) => {
  try {
    const { teacherId, password } = req.body;

    const teacher = await Teacher.findOne({ teacherId });
    if (!teacher) {
      return res.json({ success: false, message: "Invalid Teacher ID or Password" });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Teacher ID or Password" });
    }

    // Login successful → redirect to teacher dashboard
    res.json({ success: true, redirect: "/teacher-dashboard" });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ----------------- TEACHER DASHBOARD -----------------
app.get("/teacher-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboards","teacher-dashboard.html"));
});


app.get("/teacher-signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "teacher-signup.html"));
});
// API to get pending students for approval


// ----------------- TEACHER DASHBOARD API -----------------


// Fetch all students with status "pending"
app.get("/api/pending-students", async (req, res) => {
  try {
    const pendingStudents = await Student.find({ status: "pending" });
    res.json(pendingStudents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Approve a student

app.post("/api/approve-student/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    await Student.findByIdAndUpdate(studentId, { status: "approved" });
    res.json({ message: "Student approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// approve a student


app.post("/api/reject-student/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    await Student.findByIdAndUpdate(studentId, { status: "rejected" });
    res.json({ message: "Student rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ----------------- MARK ATTENDANCE -----------------
app.post("/mark-attendance", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Get today's date (ignoring time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked today
    const alreadyMarked = student.attendance.some(att => {
      const attDate = new Date(att.date);
      attDate.setHours(0, 0, 0, 0);
      return attDate.getTime() === today.getTime();
    });

    if (alreadyMarked) {
      return res.json({
        success: false,
        message: `${student.fullName} has already marked attendance today.`
      });
    }

    // Save attendance
    student.attendance.push({ date: today, status: "present" });

    await student.save();

    res.json({
      success: true,
      message: `Attendance marked for ${student.fullName}`,
      name: student.fullName
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// ----------------- ADMIN -----------------
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "admin-login.html"));
});

app.get("/admin-signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "admin-signup.html"));
});
// --------------------------------------------------------------



// auth POSTs (login / forgot-password)
// ... your existing logic here, but use env vars for credentials (see notes)
app.post("/login", (req, res) => {
  // ...
});
app.post("/forgot-password", (req, res) => {
  // ...
});

// start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});