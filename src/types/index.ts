export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: "owner" | "workshop" | "admin";
  profile_image?: string;
  created_at: string;
}

export interface Vehicle {
  _id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  mileage: number;
  fuel_type: "Electric" | "Hybrid" | "Petrol" | "Diesel";
  created_at: string;
}

export interface Workshop {
  _id: string;
  owner_id: string;
  name: string;
  address: string;
  phone: string;
  services: string[];
  capacity: number;
  is_verified: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface AIDiagnostics {
  category: string;
  detected_faults: string[];
  severity: "Low" | "Medium" | "High" | "Critical";
  recommended_action: string;
  estimated_cost_range: { min: number; max: number };
  estimated_time: string;
  confidence_score: number;
}

export interface Complaint {
  _id: string;
  owner_id: string;
  vehicle_id: string;
  title: string;
  description: string;
  voice_url?: string;
  image_url?: string;
  video_url?: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  status: "Pending" | "Accepted" | "In Progress" | "Completed" | "Cancelled";
  workshop_id?: string;
  assigned_mechanic_id?: string;
  estimated_cost?: number;
  estimated_completion?: string;
  technician_notes?: string;
  repair_images: string[];
  ai_diagnostics?: AIDiagnostics;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  _id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string;
  media_type?: "image" | "video" | "document" | "voice";
  seen: boolean;
  complaint_id?: string;
  ai_replies: string[];
  created_at: string;
}

export interface StatusEvent {
  type: "COMPLAINT_STATUS_UPDATE";
  complaint_id: string;
  status: string;
  message: string;
}

export interface TypingEvent {
  type: "TYPING";
  sender_id: string;
  is_typing: boolean;
  complaint_id?: string;
  receiver_id?: string;
}

export interface SeenEvent {
  type: "SEEN";
  sender_id: string;
  complaint_id?: string;
  receiver_id?: string;
}

export interface Notification {
  _id: string;
  recipient_id: string;
  type: "sms" | "email" | "in-app";
  content: string;
  sent_status: boolean;
  created_at: string;
}

export interface InvoiceItem {
  description: string;
  cost: number;
}

export interface Invoice {
  _id: string;
  complaint_id: string;
  workshop_id: string;
  owner_id: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: "Unpaid" | "Paid";
  created_at: string;
}

export interface Payment {
  _id: string;
  invoice_id: string;
  complaint_id: string;
  owner_id: string;
  amount: number;
  status: "Success" | "Failed";
  created_at: string;
}

export interface Mechanic {
  _id: string;
  workshop_id: string;
  name: string;
  specialty: string;
  phone: string;
  status: "Available" | "Busy" | "Leave";
  created_at: string;
}

export interface Review {
  _id: string;
  owner_id: string;
  workshop_id: string;
  complaint_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Rating {
  score: number;
  review_count: number;
}

export interface Analytics {
  total_users: number;
  owners_count: number;
  workshops_count: number;
  total_complaints: number;
  pending_complaints: number;
  active_complaints: number;
  completed_complaints: number;
  total_revenue: number;
}
