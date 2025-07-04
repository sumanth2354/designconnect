# designconnect
DesignConnect is a full-stack platform where users can discover and book talented designers. It includes a designer registration system, personalized dashboards, editable profiles, client-side designer browsing with messaging, and secure backend integration using Node.js, Express, and MongoDB.

This project includes:
- ✨ **Frontend**: HTML, CSS, JavaScript (Multiple pages such as Home, Login, Designer Dashboard, Contact, etc.)
- 🚀 **Backend**: Node.js, Express.js, MongoDB (REST APIs for designer registration, login, profile management, and message booking)
- 📦 **Multer** for file uploads (Designer portfolio/images)
- 🔐 Environment variables managed via `.env` (for secure database connection)

---

## 📂 Project Structure:


- `designer/` → Frontend Files (HTML, CSS, JS)
  - `index.html`
  - `aboutpage.html`
  - `alldesginers.html`
  - `contact.html`
  - `ddashboard.html`
  - ... (other frontend files)
  
- `server/` → Backend (Node.js + Express + MongoDB)
  - `mainserver.js` → Main backend server
  - `uploads/` → Uploaded portfolio images
  - `.env` → MongoDB URL and secrets (excluded from Git)

- `package.json` → Node.js project configuration  
- `package-lock.json` → Dependency lock file  
- `.gitignore` → Files ignored by Git  
- `README.md` → Project Summary (this file)

---

## 🔑 Key Features:
- Designer Registration and Login
- Designer Dashboard (View Messages, Portfolio, etc.)
- Designer Profile Management (Edit, Upload Files)
- Public Page to Browse Designers & Book Them
- Secure API routes with Express.js & MongoDB
- File Uploads (Images/Portfolios) stored locally

---

## 🚀 Tech Stack:
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Others:** Multer (for file uploads), dotenv (for environment variables)

---

## 📦 How to Run Locally:
```bash
# 1. Clone this repository:
git clone https://github.com/sumanth2354/designconnect.git

# 2. Install dependencies:
cd designconnect
npm install

# 3. Set up environment variables:
Create a `.env` file inside `/server/` folder:
MONGO_URL=your_mongodb_connection_string_here

# 4. Run the server:
node server/mainserver.js