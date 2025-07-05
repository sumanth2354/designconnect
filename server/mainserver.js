const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 6969;

// ✅ Middlewares
app.use(cors('*'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ✅ Connect to MongoDB Atlas
const mongoURL = process.env.MONGO_URL;
mongoose.connect(mongoURL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Multer setup
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

// ✅ Designer Schema
const DesignerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  photo: String,
  password: String,
  specialty: String,
  company: String,
  location: String,
  portfolio: String,
  gender: [String],
  phone: String,
  position: String,
  experience: String,
  linkedin: String
}, { timestamps: true });

const Designer = mongoose.model("Designer", DesignerSchema);

// ✅ Routes
app.post('/api/designers', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Photo is required" });

    const {
      name, email, password, specialty, company, location,
      portfolio, phone, position, experience, linkedin
    } = req.body;

    let gender = req.body.gender;
    if (!Array.isArray(gender)) gender = [gender];

    const hashedPassword = await bcrypt.hash(password, 10);
    // Use the correct base URL for Render deployment
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://designconnect.onrender.com' 
      : `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const newDesigner = new Designer({
      name, email, password: hashedPassword, specialty, company, location,
      portfolio, phone, position, experience, linkedin, gender, photo: photoUrl
    });

    await newDesigner.save();
    res.status(201).json({ message: "Designer registered successfully" });

  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("❌ Error saving designer:", err);
    res.status(500).json({ message: "Failed to register designer" });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const designer = await Designer.findOne({ email });
    if (!designer) return res.status(404).json({ message: "Designer not found" });

    const isMatch = await bcrypt.compare(password, designer.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({ message: "Login successful", designerId: designer._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

app.get('/api/designers', async (req, res) => {
  try {
    const designers = await Designer.find();
    
    // Fix photo URLs for existing designers if they have incorrect URLs
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://designconnect.onrender.com' 
      : 'http://localhost:6969';
    
    const updatedDesigners = designers.map(designer => {
      const designerObj = designer.toObject();
      // Fix URLs that point to localhost or don't have the correct base URL
      if (designerObj.photo) {
        if (designerObj.photo.includes('localhost:6969') || !designerObj.photo.startsWith('https://designconnect.onrender.com')) {
          const filename = designerObj.photo.split('/').pop();
          designerObj.photo = `${baseUrl}/uploads/${filename}`;
        }
      }
      return designerObj;
    });
    
    res.json(updatedDesigners);
  } catch (err) {
    res.status(500).json({ message: "Error fetching designers" });
  }
});

app.get('/api/designers/:id', async (req, res) => {
  try {
    const designer = await Designer.findById(req.params.id);
    if (!designer) return res.status(404).json({ message: "Designer not found" });
    res.json(designer);
  } catch (err) {
    res.status(500).json({ message: "Error fetching designer" });
  }
});

app.put('/api/designers/:id', async (req, res) => {
  try {
    const updatedDesigner = await Designer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDesigner) return res.status(404).json({ message: "Designer not found" });
    res.json(updatedDesigner);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put('/api/designers/:id/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const designer = await Designer.findById(req.params.id);
    if (!designer) return res.status(404).json({ message: "Designer not found" });

    const isMatch = await bcrypt.compare(currentPassword, designer.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    designer.password = await bcrypt.hash(newPassword, 10);
    await designer.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update password" });
  }
});

// ✅ Message Schema
const MessageSchema = new mongoose.Schema({
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer', required: true },
  message: { type: String, required: true },
  from: { type: String, default: "Anonymous" },
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);

app.get('/api/messages/:designerId', async (req, res) => {
  try {
    const messages = await Message.find({ designerId: req.params.designerId }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { designerId, message, from } = req.body;
  try {
    const newMsg = new Message({ designerId, message, from });
    await newMsg.save();
    res.status(201).json({ message: "Message sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// ✅ Check if email exists
app.get('/api/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    const designer = await Designer.findOne({ email });
    res.json({ exists: !!designer });
  } catch (err) {
    res.status(500).json({ message: "Error checking email" });
  }
});

// ✅ Fix existing designer photo URLs
app.post('/api/fix-photos', async (req, res) => {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://designconnect.onrender.com' 
      : 'http://localhost:6969';
    
    const designers = await Designer.find();
    let updatedCount = 0;
    
    for (const designer of designers) {
      if (designer.photo && (designer.photo.includes('localhost:6969') || !designer.photo.startsWith('https://designconnect.onrender.com'))) {
        const filename = designer.photo.split('/').pop();
        designer.photo = `${baseUrl}/uploads/${filename}`;
        await designer.save();
        updatedCount++;
      }
    }
    
    res.json({ message: `Fixed ${updatedCount} designer photo URLs` });
  } catch (err) {
    console.error("Error fixing photos:", err);
    res.status(500).json({ message: "Failed to fix photo URLs" });
  }
});

// ✅ Serve Frontend Files
app.use(express.static(path.join(__dirname, '../designer')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../designer/index.html'));
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
