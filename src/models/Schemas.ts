import mongoose, { Schema, Model } from "mongoose";

// --- User Schema ---
export interface IUser {
  name: string;
  email: string;
  phone: string;
  role: "admin" | "owner" | "workshop";
  password_hash?: string;
  profile_image?: string;
  created_at?: Date;
  
  // New aligned fields
  password?: string;
  provider?: string;
  profileImage?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ["admin", "owner", "workshop"], default: "owner" },
  password_hash: { type: String },
  profile_image: { type: String },
  created_at: { type: Date, default: Date.now },
  
  // New aligned fields
  password: { type: String },
  provider: { type: String, default: "credentials" },
  profileImage: { type: String },
  phoneVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// --- Vehicle Schema ---
export interface IVehicle {
  owner_id: mongoose.Types.ObjectId;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  mileage: number;
  fuel_type: "Electric" | "Hybrid" | "Petrol" | "Diesel";
  created_at?: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  license_plate: { type: String, required: true, unique: true },
  mileage: { type: Number, required: true },
  fuel_type: { type: String, enum: ["Electric", "Hybrid", "Petrol", "Diesel"], required: true },
  created_at: { type: Date, default: Date.now }
});

export const Vehicle: Model<IVehicle> = mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);

// --- Workshop Schema ---
export interface IWorkshop {
  owner_id: mongoose.Types.ObjectId;
  name: string;
  address: string;
  phone: string;
  services: string[];
  capacity: number;
  is_verified: boolean;
  rating: number;
  review_count: number;
  created_at?: Date;
}

const WorkshopSchema = new Schema<IWorkshop>({
  owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  services: [{ type: String }],
  capacity: { type: Number, default: 5 },
  is_verified: { type: Boolean, default: false },
  rating: { type: Number, default: 5.0 },
  review_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

export const Workshop: Model<IWorkshop> = mongoose.models.Workshop || mongoose.model<IWorkshop>("Workshop", WorkshopSchema);

// --- Mechanic Schema ---
export interface IMechanic {
  workshop_id: mongoose.Types.ObjectId;
  name: string;
  specialty: string;
  phone: string;
  status: "Available" | "Busy" | "Leave";
  created_at?: Date;
}

const MechanicSchema = new Schema<IMechanic>({
  workshop_id: { type: Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ["Available", "Busy", "Leave"], default: "Available" },
  created_at: { type: Date, default: Date.now }
});

export const Mechanic: Model<IMechanic> = mongoose.models.Mechanic || mongoose.model<IMechanic>("Mechanic", MechanicSchema);

// --- Complaint Schema ---
export interface IAIDiagnostics {
  category: string;
  detected_faults: string[];
  severity: "Low" | "Medium" | "High" | "Critical";
  recommended_action: string;
  estimated_cost_range: { min: number; max: number };
  estimated_time: string;
  confidence_score: number;
}

export interface IComplaint {
  owner_id: mongoose.Types.ObjectId;
  vehicle_id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  voice_url?: string;
  image_url?: string;
  video_url?: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  status: "Pending" | "Accepted" | "In Progress" | "Completed" | "Cancelled";
  workshop_id?: mongoose.Types.ObjectId;
  assigned_mechanic_id?: mongoose.Types.ObjectId;
  estimated_cost?: number;
  estimated_completion?: string;
  technician_notes?: string;
  repair_images: string[];
  ai_diagnostics?: IAIDiagnostics;
  created_at?: Date;
  updated_at?: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  vehicle_id: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  voice_url: { type: String },
  image_url: { type: String },
  video_url: { type: String },
  priority: { type: String, enum: ["Low", "Normal", "High", "Urgent"], default: "Normal" },
  status: { type: String, enum: ["Pending", "Accepted", "In Progress", "Completed", "Cancelled"], default: "Pending" },
  workshop_id: { type: Schema.Types.ObjectId, ref: "User" }, // Assigned Workshop Owner User
  assigned_mechanic_id: { type: Schema.Types.ObjectId, ref: "Mechanic" },
  estimated_cost: { type: Number },
  estimated_completion: { type: String },
  technician_notes: { type: String },
  repair_images: [{ type: String }],
  ai_diagnostics: {
    category: { type: String },
    detected_faults: [{ type: String }],
    severity: { type: String, enum: ["Low", "Medium", "High", "Critical"] },
    recommended_action: { type: String },
    estimated_cost_range: {
      min: { type: Number },
      max: { type: Number }
    },
    estimated_time: { type: String },
    confidence_score: { type: Number }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const Complaint: Model<IComplaint> = mongoose.models.Complaint || mongoose.model<IComplaint>("Complaint", ComplaintSchema);

// --- ChatMessage Schema ---
export interface IChatMessage {
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string;
  media_type?: "image" | "video" | "document" | "voice";
  seen: boolean;
  complaint_id?: string;
  ai_replies: string[];
  created_at?: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sender_id: { type: String, required: true, index: true },
  receiver_id: { type: String, required: true, index: true },
  content: { type: String, required: true },
  media_url: { type: String },
  media_type: { type: String, enum: ["image", "video", "document", "voice"] },
  seen: { type: Boolean, default: false },
  complaint_id: { type: String },
  ai_replies: [{ type: String }],
  created_at: { type: Date, default: Date.now }
});

export const ChatMessage: Model<IChatMessage> = mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

// --- Review Schema ---
export interface IReview {
  owner_id: mongoose.Types.ObjectId;
  workshop_id: mongoose.Types.ObjectId;
  complaint_id?: string;
  rating: number;
  comment: string;
  created_at?: Date;
}

const ReviewSchema = new Schema<IReview>({
  owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  workshop_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  complaint_id: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

// --- Invoice Schema ---
export interface IInvoiceItem {
  description: string;
  cost: number;
}

export interface IInvoice {
  complaint_id: string;
  workshop_id: string;
  owner_id: string;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: "Unpaid" | "Paid";
  created_at?: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  complaint_id: { type: String, required: true, index: true },
  workshop_id: { type: String, required: true },
  owner_id: { type: String, required: true },
  items: [{
    description: { type: String, required: true },
    cost: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
  created_at: { type: Date, default: Date.now }
});

export const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);

// --- OtpVerification Schema ---
export interface IOtpVerification {
  email: string;
  phone: string;
  emailOTP: string;
  smsOTP: string;
  expiresAt: Date;
  verifiedEmail: boolean;
  verifiedPhone: boolean;
}

const OtpVerificationSchema = new Schema<IOtpVerification>({
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  emailOTP: { type: String, required: true },
  smsOTP: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  verifiedEmail: { type: Boolean, default: false },
  verifiedPhone: { type: Boolean, default: false }
});

// TTL Index for automatically removing expired OTPs after 5 minutes (calculated in expiresAt)
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpVerification: Model<IOtpVerification> = 
  mongoose.models.OtpVerification || 
  mongoose.model<IOtpVerification>("OtpVerification", OtpVerificationSchema);
