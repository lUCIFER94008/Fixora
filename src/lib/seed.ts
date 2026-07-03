import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, Vehicle, Workshop, Mechanic, Complaint, Review, Invoice, ChatMessage } from "../models/Schemas";

export async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    // Already seeded
    return;
  }

  console.log("🌱 Database is empty. Seeding initial FIXORA mock datasets...");

  // 1. Create Default Users
  const saltRounds = 10;
  const adminPassword = bcrypt.hashSync("admin123", saltRounds);
  const ownerPassword = bcrypt.hashSync("owner123", saltRounds);
  const workshopPassword = bcrypt.hashSync("workshop123", saltRounds);

  const adminUser = await User.create({
    name: "Alex Mercer (Admin)",
    email: "admin@fixora.com",
    phone: "+1999999999",
    role: "admin",
    password_hash: adminPassword,
    profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
  });

  const ownerUser = await User.create({
    name: "Jane Doe (Owner)",
    email: "owner@fixora.com",
    phone: "+1555555555",
    role: "owner",
    password_hash: ownerPassword,
    profile_image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250"
  });

  const workshopUser = await User.create({
    name: "Mike Miller (Workshop Owner)",
    email: "workshop@fixora.com",
    phone: "+1444444444",
    role: "workshop",
    password_hash: workshopPassword,
    profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"
  });

  // 2. Create Workshops
  const mainWorkshop = await Workshop.create({
    owner_id: workshopUser._id,
    name: "NEON HYPERGARAGE",
    address: "77 Cyberpunk Boulevard, Techno City",
    phone: "+1444444444",
    services: ["EV Diagnostic", "Performance Tuning", "Battery Recalibration", "Suspension Overhaul", "Brake Overhaul"],
    capacity: 8,
    is_verified: true,
    rating: 4.9,
    review_count: 1
  });

  await Workshop.create({
    owner_id: new mongoose.Types.ObjectId(),
    name: "RUSTY BOLTS REPAIR",
    address: "404 Industrial Lane, Sector 9",
    phone: "+1234567890",
    services: ["Oil Change", "Rust Treatment", "General Repair"],
    capacity: 3,
    is_verified: false,
    rating: 3.8,
    review_count: 0
  });

  // 3. Create Vehicles
  const teslaCar = await Vehicle.create({
    owner_id: ownerUser._id,
    make: "Tesla",
    model: "Model S Plaid",
    year: 2023,
    license_plate: "FX-99-AI",
    mileage: 12500,
    fuel_type: "Electric"
  });

  const bmwCar = await Vehicle.create({
    owner_id: ownerUser._id,
    make: "BMW",
    model: "M4 Competition",
    year: 2022,
    license_plate: "BM-88-M4",
    mileage: 34000,
    fuel_type: "Petrol"
  });

  // 4. Create Mechanics
  const marcusMech = await Mechanic.create({
    workshop_id: mainWorkshop._id,
    name: "Marcus Vance",
    specialty: "EV Drivetrains",
    phone: "+1444111222",
    status: "Available"
  });

  await Mechanic.create({
    workshop_id: mainWorkshop._id,
    name: "Diana Prince",
    specialty: "Friction & Brakes",
    phone: "+1444333444",
    status: "Busy"
  });

  // 5. Create Complaints
  const c1 = await Complaint.create({
    owner_id: ownerUser._id,
    vehicle_id: teslaCar._id,
    title: "EV Drivetrain High-Frequency Whine",
    description: "When accelerating past 80 km/h, a high-frequency high-pitched whine comes from the rear axle. Also steering wheel vibrates slightly.",
    priority: "High",
    status: "In Progress",
    workshop_id: workshopUser._id, // Assign to workshop owner user id for dashboard query
    assigned_mechanic_id: marcusMech._id,
    estimated_cost: 4200.0,
    estimated_completion: "3 days",
    technician_notes: "We analyzed the noise using diagnostic headsets. The rear drive unit bearing shows minor wear. Parts ordered.",
    repair_images: [
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600"
    ],
    ai_diagnostics: {
      category: "Engine",
      detected_faults: ["Rear Drive Unit Bearing Wear", "Differential Backlash Out of Spec"],
      severity: "High",
      recommended_action: "Avoid hard launch control accelerations. Inspect gearing oil.",
      estimated_cost_range: { min: 3500.0, max: 5000.0 },
      estimated_time: "3 days",
      confidence_score: 0.88
    }
  });

  await Complaint.create({
    owner_id: ownerUser._id,
    vehicle_id: bmwCar._id,
    title: "Brake Rotor Vibration",
    description: "Steering wheel shakes heavily when braking down from highway speeds. Braking feels less responsive.",
    priority: "Normal",
    status: "Pending",
    ai_diagnostics: {
      category: "Brakes",
      detected_faults: ["Warped Front Brake Rotors", "Uneven Pad Deposits"],
      severity: "Medium",
      recommended_action: "Brake disc skimming or replacement required.",
      estimated_cost_range: { min: 800.0, max: 1500.0 },
      estimated_time: "4 hours",
      confidence_score: 0.95
    }
  });

  // 6. Create Reviews
  await Review.create({
    owner_id: ownerUser._id,
    workshop_id: workshopUser._id,
    complaint_id: c1._id.toString(),
    rating: 5,
    comment: "Incredible hyper-futuristic garage! Marcus Vance diagnosed my electric drivetrain in minutes."
  });

  // 7. Create Invoices
  await Invoice.create({
    complaint_id: c1._id.toString(),
    workshop_id: workshopUser._id.toString(),
    owner_id: ownerUser._id.toString(),
    items: [
      { description: "Rear Unit Drive Bearings", cost: 3200 },
      { description: "Specialist EV Alignment Labor", cost: 1000 }
    ],
    subtotal: 4200,
    tax: 210,
    discount: 0,
    total: 4410,
    status: "Unpaid"
  });

  // 8. Create ChatMessages
  await ChatMessage.create({
    sender_id: ownerUser._id.toString(),
    receiver_id: workshopUser._id.toString(),
    content: "Hi, I just submitted my Model S for the rear whine diagnostic. Do you have parts in stock?",
    seen: true,
    complaint_id: c1._id.toString(),
    ai_replies: []
  });

  await ChatMessage.create({
    sender_id: workshopUser._id.toString(),
    receiver_id: ownerUser._id.toString(),
    content: "Hi Jane! We saw the complaint. We have the rear motor bearings in stock. We will inspect it as soon as the vehicle arrives tomorrow.",
    seen: true,
    complaint_id: c1._id.toString(),
    ai_replies: [
      "Awesome! See you tomorrow.",
      "Thank you. Should I bring it in early?",
      "Perfect, let me know if you need anything else."
    ]
  });

  console.log("🌱 Seeding successfully completed!");
}
