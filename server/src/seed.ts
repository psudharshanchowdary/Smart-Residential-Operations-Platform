import bcrypt from "bcryptjs";
import { User } from "./models/User";
import { MaintenanceRequest } from "./models/MaintenanceRequest";
import { Payment } from "./models/Payment";
import { Notice } from "./models/Notice";

export const seedDatabase = async (): Promise<void> => {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log("🌱 Database already seeded — skipping.");
    return;
  }

  console.log("🌱 Seeding database with default data...");

  const salt = await bcrypt.genSalt(10);

  // Create admin user
  const admin = await User.create({
    name: "Admin",
    email: "admin@apt.com",
    passwordHash: await bcrypt.hash("admin123", salt),
    role: "admin",
    unit: "-",
    building: "Skyline Towers",
  });

  // Create resident user
  const resident = await User.create({
    name: "John Doe",
    email: "resident@apt.com",
    passwordHash: await bcrypt.hash("resident123", salt),
    role: "resident",
    unit: "402",
    building: "Green Valley Apartments",
  });

  const residentId = resident._id.toString();

  // Seed maintenance requests
  await MaintenanceRequest.insertMany([
    {
      userId: residentId,
      userName: "John Doe",
      unit: "Apt 402 - Wing B",
      title: "AC Not Cooling Correctly",
      category: "HVAC",
      priority: "High",
      description: "The AC unit is not cooling properly.",
      status: "In Progress",
    },
    {
      userId: residentId,
      userName: "John Doe",
      unit: "Apt 402 - Wing B",
      title: "Leaking Kitchen Faucet",
      category: "Plumbing",
      priority: "Medium",
      description: "Kitchen faucet is leaking.",
      status: "Pending",
    },
    {
      userId: residentId,
      userName: "John Doe",
      unit: "Apt 402 - Wing B",
      title: "Bedroom Light Switch Faulty",
      category: "Electrical",
      priority: "Low",
      description: "Light switch not working.",
      status: "Completed",
    },
  ]);

  // Seed payment
  await Payment.create({
    userId: residentId,
    userName: "John Doe",
    unit: "Unit 402, Green Valley Apartments",
    amount: 1250,
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "Monthly Maintenance Fee",
    status: "Pending",
  });

  // Seed notices
  await Notice.insertMany([
    {
      title: "Annual Garden Party",
      description:
        "Join us this Saturday for our annual community social event at the rooftop terrace. Refreshments will be provided.",
      date: new Date().toISOString().split("T")[0],
      postedBy: "Management",
    },
    {
      title: "Water Supply Maintenance",
      description:
        "Water supply will be interrupted on the 28th from 10 AM to 2 PM for scheduled maintenance.",
      date: new Date().toISOString().split("T")[0],
      postedBy: "Management",
    },
  ]);

  console.log(`✅ Seeded: admin (${admin.email}), resident (${resident.email}), 3 requests, 1 payment, 2 notices`);
};
