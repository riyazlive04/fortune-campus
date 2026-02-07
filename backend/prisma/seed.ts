/// <reference types="node" />
import {
  UserRole,
  LeadStatus,
  LeadSource,
  AdmissionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/config/database";

async function main() {
  console.log("🌱 Starting database seed...");

  // --------------------
  // Branches
  // --------------------
  console.log("📍 Creating branches...");

  const mainBranch = await prisma.branch.upsert({
    where: { code: "FC-MAIN" },
    update: {},
    create: {
      name: "Fortune Campus - Main",
      code: "FC-MAIN",
      address: "123 Tech Street",
      city: "Bangalore",
      state: "Karnataka",
      phone: "+91-9876543210",
      email: "main@fortunecampus.com",
    },
  });

  const secondBranch = await prisma.branch.upsert({
    where: { code: "FC-NORTH" },
    update: {},
    create: {
      name: "Fortune Campus - North",
      code: "FC-NORTH",
      address: "456 Innovation Road",
      city: "Delhi",
      state: "Delhi",
      phone: "+91-9876543211",
      email: "north@fortunecampus.com",
    },
  });

  console.log("✅ Branches ready");

  // --------------------
  // Users
  // --------------------
  console.log("👥 Creating users...");

  const adminPassword = await bcrypt.hash("Admin@123", 10);

  const ceo = await prisma.user.upsert({
    where: { email: "ceo@fortunecampus.com" },
    update: {},
    create: {
      email: "ceo@fortunecampus.com",
      password: adminPassword,
      firstName: "Rajesh",
      lastName: "Kumar",
      phone: "+91-9876543200",
      role: UserRole.CEO,
      isActive: true,
    },
  });

  const branchHead = await prisma.user.upsert({
    where: { email: "head.main@fortunecampus.com" },
    update: {},
    create: {
      email: "head.main@fortunecampus.com",
      password: adminPassword,
      firstName: "Priya",
      lastName: "Sharma",
      phone: "+91-9876543201",
      role: UserRole.BRANCH_HEAD,
      branchId: mainBranch.id,
      isActive: true,
    },
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: "trainer1@fortunecampus.com" },
    update: {},
    create: {
      email: "trainer1@fortunecampus.com",
      password: adminPassword,
      firstName: "Amit",
      lastName: "Verma",
      phone: "+91-9876543202",
      role: UserRole.TRAINER,
      branchId: mainBranch.id,
      isActive: true,
    },
  });

  console.log("✅ Core users ready");

  // --------------------
  // Trainer Profile
  // --------------------
  console.log("👨‍🏫 Creating trainer profile...");

  const trainerProfile = await prisma.trainer.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      userId: trainerUser.id,
      employeeId: "EMP001",
      specialization: "Full Stack Development",
      experience: 5,
      qualification: "B.Tech in Computer Science",
      branchId: mainBranch.id,
    },
  });

  // --------------------
  // Courses
  // --------------------
  console.log("📚 Creating courses...");

  const webDevCourse = await prisma.course.upsert({
    where: { code: "FSWD-101" },
    update: {},
    create: {
      name: "Full Stack Web Development",
      code: "FSWD-101",
      description: "Comprehensive frontend and backend course",
      duration: 6,
      fees: 50000,
      syllabus: JSON.stringify([
        "HTML, CSS, JavaScript",
        "React.js",
        "Node.js & Express",
        "MongoDB",
        "REST APIs",
        "Deployment",
      ]),
      prerequisites: "Basic programming knowledge",
      branchId: mainBranch.id,
    },
  });

  const dataScienceCourse = await prisma.course.upsert({
    where: { code: "DSML-101" },
    update: {},
    create: {
      name: "Data Science & Machine Learning",
      code: "DSML-101",
      description: "Data analysis and ML fundamentals",
      duration: 6,
      fees: 60000,
      syllabus: JSON.stringify([
        "Python",
        "NumPy & Pandas",
        "Data Visualization",
        "Machine Learning",
        "Deep Learning Basics",
      ]),
      prerequisites: "Math & statistics basics",
      branchId: mainBranch.id,
    },
  });

  console.log("✅ Courses ready");

  // --------------------
  // Trainer ↔ Course
  // --------------------
  await prisma.courseTrainer.upsert({
    where: {
      courseId_trainerId: {
        courseId: webDevCourse.id,
        trainerId: trainerProfile.id,
      },
    },
    update: {},
    create: {
      courseId: webDevCourse.id,
      trainerId: trainerProfile.id,
    },
  });

  // --------------------
  // Leads
  // --------------------
  console.log("🎯 Creating leads...");

  await prisma.lead.createMany({
    skipDuplicates: true,
    data: [
      {
        firstName: "Rahul",
        lastName: "Singh",
        email: "rahul.singh@example.com",
        phone: "+91-9876543300",
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        interestedCourse: "Full Stack Web Development",
        notes: "Interested in evening batch",
        branchId: mainBranch.id,
        createdById: branchHead.id,
        assignedToId: branchHead.id,
      },
      {
        firstName: "Sneha",
        lastName: "Patel",
        email: "sneha.patel@example.com",
        phone: "+91-9876543301",
        source: LeadSource.REFERRAL,
        status: LeadStatus.CONTACTED,
        interestedCourse: "Data Science & Machine Learning",
        notes: "Referred by alumni",
        branchId: mainBranch.id,
        createdById: branchHead.id,
        assignedToId: branchHead.id,
      },
    ],
  });

  // --------------------
  // Admission + Student
  // --------------------
  console.log("🎓 Creating admission & student...");

  const admission = await prisma.admission.create({
    data: {
      admissionNumber: "ADM2024MAIN0001",
      firstName: "Vikram",
      lastName: "Reddy",
      email: "vikram.reddy@example.com",
      phone: "+91-9876543400",
      dateOfBirth: new Date("2000-05-15"),
      gender: "Male",
      address: "Bangalore",
      courseId: webDevCourse.id,
      batchName: "Batch A1",
      feeAmount: 50000,
      feePaid: 25000,
      feeBalance: 25000,
      status: AdmissionStatus.APPROVED,
      branchId: mainBranch.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "vikram.reddy@student.fortunecampus.com" },
    update: {},
    create: {
      email: "vikram.reddy@student.fortunecampus.com",
      password: await bcrypt.hash("Student@123", 10),
      firstName: "Vikram",
      lastName: "Reddy",
      phone: "+91-9876543400",
      role: UserRole.STUDENT,
      branchId: mainBranch.id,
      isActive: true,
    },
  });

  await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionId: admission.id,
      enrollmentNumber: "ENR2024001",
      currentSemester: 1,
      cgpa: 0,
      branchId: mainBranch.id,
      courseId: webDevCourse.id,
    },
  });

  // --------------------
  // Portfolio
  // --------------------
  console.log("💼 Creating portfolio...");

  await prisma.portfolio.create({
    data: {
      studentId: admission.id,
      title: "E-commerce Website",
      description: "MERN stack e-commerce platform",
      projectUrl: "https://myproject.example.com",
      githubUrl: "https://github.com/vikram/ecommerce-project",
      technologies: ["React", "Node.js", "MongoDB"],
      completedAt: new Date(),
      isVerified: true,
    },
  });

  console.log("\n✅ Seed completed successfully!");
  console.log("\n🔐 Default Credentials");
  console.log("CEO → ceo@fortunecampus.com / Admin@123");
  console.log("Branch Head → head.main@fortunecampus.com / Admin@123");
  console.log("Trainer → trainer1@fortunecampus.com / Admin@123");
  console.log("Student → vikram.reddy@student.fortunecampus.com / Student@123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });