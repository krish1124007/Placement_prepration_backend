# InterPrep Backend 🚀

Welcome to the backend repository of **InterPrep** – a comprehensive placement preparation platform! This backend is built with modern, robust technologies to power user authentication, student profiles, achievements tracking, email systems, and AI-powered interview interactions.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js (v5)
- **Language:** TypeScript
- **Database:** MongoDB & Mongoose
- **Authentication:** JSON Web Tokens (JWT), Google Auth Library, GitHub OAuth
- **AI Integration:** Groq SDK (for AI panel interviews)
- **Email:** Nodemailer

---

## 📁 Project Structure

```text
backend/
├── src/
│   ├── controllers/  # Logic for handling requests (auth, student, AI panel)
│   ├── models/       # Mongoose database schemas (Student, etc.)
│   ├── routes/       # Express route definitions
│   ├── config/       # Database & environment configurations
│   └── index.ts      # Application entry point
├── .env.example      # Sample environment variables
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

---

## 💻 Local Development Setup (A to Z)

Follow these precise steps to get the backend running perfectly on your local machine.

### 1. Prerequisites
Make sure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally on port `27017` or use a MongoDB Atlas URI)

### 2. Clone and Navigate
If you haven't already, navigate into the backend folder:
```bash
cd placement-prep/backend
```

### 3. Install Dependencies
Install all the required npm packages:
```bash
npm install
```

### 4. Configure Environment Variables
You must set up your environment variables before starting the server.
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open the newly created `.env` file and fill in the required details:
   ```env
   # Server Configuration
   PORT=8000

   # Database
   MONGO_URL=mongodb://localhost:27017/interPrep

   # JWT Secret
   JWT_SECRET=your-secure-jwt-secret-key

   # OAuth Credentials
   G_CLIENT_ID=your-google-client-id
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   
   # App Password for sending emails
   mail_password=your_nodemailer_app_password
   ```

### 5. Run the Server
Start the development server using `tsx` which automatically watches for TypeScript file changes:
```bash
npm run dev
```

If everything is configured correctly, you should see the server running and connected to MongoDB:
```text
Server is running on port 8000
Connected to MongoDB Database
```

---

## 📜 Available Scripts

- **`npm run dev`**: Starts the server in development mode with live reloading (via `tsx watch`).
- **`npm run build`**: Compiles the TypeScript source code into plain JavaScript in the `/dist` folder.
- **`npm start`**: Runs the compiled production code (`node dist/index.js`).

---

## 🔗 Useful Links
- **Frontend Repository**: [Placement_prepration_frontend](https://github.com/krish1124007/Placement_prepration_frontend)
