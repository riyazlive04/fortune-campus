import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

// Routes
import setupRouter from "./modules/setup/setup.routes";
import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/users/user.routes";
import profileRouter from "./modules/profile/profile.routes";
import branchRouter from "./modules/branches/branch.routes";
import leadRouter from "./modules/leads/lead.routes";
import admissionRouter from "./modules/admissions/admission.routes";
import studentRouter from "./modules/students/student.routes";
import trainerRouter from "./modules/trainers/trainer.routes";
import courseRouter from "./modules/courses/course.routes";
import attendanceRouter from "./modules/attendance/attendance.routes";
import portfolioRouter from "./modules/portfolio/portfolio.routes";
import placementRouter from "./modules/placements/placement.routes";
import companyRouter from "./modules/placements/company.routes";
import incentiveRouter from "./modules/incentives/incentive.routes";
import reportRouter from "./modules/reports/report.routes";
import dashboardRouter from "./modules/dashboard/dashboard.routes";
import notificationRouter from "./modules/notifications/notification.routes";

const app: Application = express();

// ... existing code ...

// --------------------
// Security & Performance
// --------------------
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// --------------------
// Logging
// --------------------
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// --------------------
// Body Parsers
// --------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --------------------
// Root (avoid noisy 404s)
// --------------------
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "FortuneCampus Backend Running",
  });
});

// ⚡ Fallback for non-prefixed routes (Fix for stale frontend cache)
app.use("/auth", authRouter);
app.use("/setup", setupRouter);
app.use("/health", (req, res) => res.redirect("/api/health"));

// --------------------
// Health Check
// --------------------
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "FortuneCampus API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// --------------------
// API Routes
// --------------------
// Setup routes (NO AUTH) - must be first
app.use("/api/setup", setupRouter);

// Authenticated routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/users", userRouter);
app.use("/api/branches", branchRouter);
app.use("/api/leads", leadRouter);
app.use("/api/admissions", admissionRouter);
app.use("/api/students", studentRouter);
app.use("/api/trainers", trainerRouter);
app.use("/api/courses", courseRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/portfolios", portfolioRouter);
app.use("/api/placements", placementRouter);
app.use("/api/companies", companyRouter);
app.use("/api/incentives", incentiveRouter);
app.use("/api/reports", reportRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationRouter);

// --------------------
// Error Handling
// --------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;