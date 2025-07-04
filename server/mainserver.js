const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient } = require('mongodb');
const app = express();
const PORT = 6969;

// Middleware
app.use(cors('*')); // Allow all origins for development
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Public access to uploaded images

// ✅ Connect to MongoDB Atlas
const mongoURL = process.env.MONGO_URL;

 // Load environment variables from .env file
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Multer storage setup (to uploads/ folder)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ✅ Mongoose Schema for Designer
const DesignerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photo: { type: String, required: true }, // stores public image URL
  password: { type: String, required: true }, // hashed password
  specialty: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  portfolio: { type: String, required: true },
  gender: {
    type: [String],
    enum: ['male', 'female'],
    required: true
  },
    phone: { type: String },
  position: { type: String },
  experience: { type: String },
  linkedin: { type: String }
  
}, {
  timestamps: true // adds createdAt and updatedAt
});
const Designer = mongoose.model("Designer", DesignerSchema);

// ✅ POST /api/designers — register designer with photo
app.post('/api/designers', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Photo is required" });
    }

    const {
  name, email, password, specialty, company, location,
  portfolio, phone, position, experience, linkedin
} = req.body;

    // gender may come as single or array
    let gender = req.body.gender;
    if (!Array.isArray(gender)) {
      gender = [gender];
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create public photo URL
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const newDesigner = new Designer({
  name,
  email,
  password: hashedPassword,
  specialty,
  company,
  location,
  portfolio,
  phone,
  position,
  experience,
  linkedin,
  gender,
  photo: photoUrl
});

    
    await newDesigner.save();
    

    // ✅ RIGHT HERE: Return JSON response after saving
    return res.status(201).json({ message: "Designer registered successfully" });

  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists" });
    }

    console.error("❌ Error saving designer:", err);
    return res.status(500).json({ message: "Failed to register designer" });
  }
});
// ✅ Add this to your existing server code (below POST /api/designers)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const designer = await Designer.findOne({ email });
    if (!designer) return res.status(404).json({ message: "Designer not found" });

    const isMatch = await bcrypt.compare(password, designer.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({
      message: "Login successful",
      designerId: designer._id // send designer's unique ID
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});
app.get('/api/designers/:id', async (req, res) => {
  try {
    const designer = await Designer.findById(req.params.id);
    if (!designer) return res.status(404).json({ message: "Designer not found" });
    res.json(designer);
  } catch (err) {
    console.error("❌ Error fetching designer:", err);
    res.status(500).json({ message: "Error fetching designer" });
  }
});


// ✅ GET /api/designers — fetch all designers
app.get('/api/designers', async (req, res) => {
  try {
    const designers = await Designer.find();
    res.json(designers);
  } catch (err) {
    console.error("❌ Error fetching designers:", err);
    res.status(500).json({ message: "Error fetching designers" });
  }
});
// ✅ Check if email already exists
app.get('/api/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const existing = await Designer.findOne({ email });
    if (existing) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error("❌ Error checking email:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ PUT - Update designer profile

app.put('/api/designers/:id', async (req, res) => {
  try {
    const updatedDesigner = await Designer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDesigner) {
      return res.status(404).json({ message: "Designer not found" });
    }
    res.json(updatedDesigner);
  } catch (err) {
    console.error("Error updating designer:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// PUT /api/designers/:id/password
app.put('/api/designers/:id/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const designer = await Designer.findById(req.params.id);
    if (!designer) return res.status(404).json({ message: "Designer not found" });

    const isMatch = await bcrypt.compare(currentPassword, designer.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    designer.password = hashed;
    await designer.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ message: "Failed to update password" });
  }
});
const MessageSchema = new mongoose.Schema({
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer', required: true },
  message: { type: String, required: true },
  from: { type: String, default: "Anonymous" },
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
app.get('/api/messages/:designerId', async (req, res) => {
  try {
    const messages = await Message.find({ designerId: req.params.designerId }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});


// POST: Create new message
app.post("/api/messages", async (req, res) => {
  const { designerId, message, from } = req.body;
  try {
    const newMsg = new Message({ designerId, message, from });
    await newMsg.save();
    res.status(201).json({ message: "Message sent" });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// GET: Messages for designer
app.get("/api/messages/:designerId", async (req, res) => {
  try {
    const messages = await Message.find({ designerId: req.params.designerId }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// ✅ Serve static HTML files from "designer" folder
app.use(express.static(path.join(__dirname, '../designer')));

// ✅ Redirect root URL "/" to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../designer/index.html'));
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
