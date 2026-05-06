import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./src/config/db.js";

// ROUTES
import noteroutes from "./src/routes/noteroutes.js"
import authRoutes from "./src/routes/authroutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import quizRoutes from "./src/routes/quizRoutes.js";
import studentRoutes from "./src/routes/studentRoutes.js";
import assignmentRoutes from "./src/routes/assignmentRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import videoRoutes from "./src/routes/videoRoutes.js";
import diagramRoutes from "./src/routes/diagramRoutes.js";

dotenv.config();

const app = express();

// ================= ALLOWED ORIGINS =================
const allowedOrigins = [
  // ✅ Your Vercel deployments
  "https://esdmvirtuallabfrontend.vercel.app",
  "https://esdmvirtuallabfrontend-git-master-tanayraundales-projects.vercel.app",

  // ✅ Local development
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:19006",
  "http://localhost:3000",

  // ✅ Expo Go app on device
  "exp://localhost:8081",
];

// ================= MIDDLEWARE =================
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    // Allow any vercel.app subdomain for preview deployments
    if (origin.endsWith(".vercel.app")) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.warn("Blocked by CORS:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ✅ Handle preflight OPTIONS requests
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));

// ================= DB =================
connectDB();

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notes", noteroutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/diagrams", diagramRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});