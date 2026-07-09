"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Car, 
  Wrench, 
  Layers, 
  MessageSquare, 
  Plus, 
  Activity, 
  Send,
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Menu,
  X,
  ArrowLeft
} from "lucide-react";
import api from "@/services/api";
import { useChat } from "@/hooks/useChat";

export default function WorkshopDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workshop, setWorkshop] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, complaints, repairs, customers, vehicles, diagnostics, analytics, profile, settings, chat
  
  // Datasets
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<any>(null);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any>(null);
  
  // Mechanic form
  const [mechName, setMechName] = useState("");
  const [mechSpecialty, setMechSpecialty] = useState("");
  const [mechPhone, setMechPhone] = useState("");
  const [showAddMech, setShowAddMech] = useState(false);

  // Invoicing Wizard Form
  const [invoiceItems, setInvoiceItems] = useState<any[]>([{ description: "", cost: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Active Job controls
  const [techNotes, setTechNotes] = useState("");
  const [repairCost, setRepairCost] = useState(0);
  const [repairCompletion, setRepairCompletion] = useState("1 Day");
  const [repairImage, setRepairImage] = useState("");

  // Chat window
  const [activeChatOwner, setActiveChatOwner] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [ownerIsTyping, setOwnerIsTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [chatRoomReadOnly, setChatRoomReadOnly] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<any>(null);

  // Real Booking States
  const [bookings, setBookings] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);

  const fetchWorkshopDashboardData = async () => {
    try {
      const response = await api.get("/api/dashboard/workshop");
      const { complaints: list, metrics: stats } = response.data;
      setComplaints(list || []);
      setMetrics(stats || null);
      
      const accepted = (list || []).filter((c: any) => c.status !== "Pending");
      if (accepted.length > 0) {
        const found = accepted.find((c: any) => activeComplaint && c._id === activeComplaint._id) || accepted[0];
        setActiveComplaint(found);
        setTechNotes(found.technician_notes || "");
        setRepairCost(found.estimated_cost || 0);
        setRepairCompletion(found.estimated_completion || "1 Day");
      }

      // Fetch bookings list
      try {
        const bookingsRes = await api.get("/api/bookings");
        setBookings(bookingsRes.data || []);
      } catch (e) {
        console.error("Failed to load bookings:", e);
      }
    } catch (err) {
      console.error("Failed to load workshop dashboard:", err);
      setComplaints([]);
      setMetrics(null);
    }
  };

  const fetchWorkshopProfile = async () => {
    try {
      const response = await api.get("/api/profile");
      setUser(response.data.user);
      setWorkshop(response.data.workshop);
      localStorage.setItem("fixora_user", JSON.stringify(response.data.user));
    } catch (err) {
      const rawUser = localStorage.getItem("fixora_user");
      if (rawUser) {
        setUser(JSON.parse(rawUser));
      } else {
        router.push("/login");
        return;
      }
    }
    await fetchWorkshopDashboardData();
  };

  useEffect(() => {
    fetchWorkshopProfile();
  }, [router]);

  // Polling every 10 seconds for live updates
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchWorkshopDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Websocket hook
  const { isConnected, sendTyping, sendSeen, joinRoom, leaveRoom, sendMessage, socket } = useChat({
    userId: user?._id,
    onMessageReceived: (message) => {
      const isActiveRoom = message.complaintId === chatRoomId;
      if (isActiveRoom) {
        setChatMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        sendSeen(message.senderId || message.sender_id);
        if (message.ai_replies) {
          setSmartReplies(message.ai_replies);
        }
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    },
    onStatusUpdate: () => {
      if (workshop) {
        fetchComplaintsQueue(workshop._id);
      }
    },
    onTypingReceived: (typingEvent) => {
      if (chatRoomId && typingEvent.complaintId === chatRoomId) {
        setOwnerIsTyping(typingEvent.is_typing);
      }
    },
    onSeenReceived: () => {
      setChatMessages(prev => prev.map(m => ({ ...m, isSeen: true })));
    }
  });

  useEffect(() => {
    if (chatRoomId) {
      joinRoom(chatRoomId);
      return () => {
        leaveRoom(chatRoomId);
      };
    }
  }, [chatRoomId, joinRoom, leaveRoom]);

  // Handle socket updates for bookings
  useEffect(() => {
    if (!socket) return;
    
    const handleNewBooking = (booking: any) => {
      setBookings(prev => {
        if (prev.some(b => b._id === booking._id)) return prev;
        return [booking, ...prev];
      });
      showToast("warning", `New Service Booking request ${booking.bookingId} received!`);
    };

    const handleBookingStatusUpdate = (updatedBooking: any) => {
      setBookings(prev => prev.map(b => b._id === updatedBooking._id ? updatedBooking : b));
      showToast("info", `Booking ${updatedBooking.bookingId} status updated to ${updatedBooking.status}!`);
    };

    socket.on("NEW_BOOKING", handleNewBooking);
    socket.on("BOOKING_STATUS_UPDATE", handleBookingStatusUpdate);
    
    return () => {
      socket.off("NEW_BOOKING", handleNewBooking);
      socket.off("BOOKING_STATUS_UPDATE", handleBookingStatusUpdate);
    };
  }, [socket]);

  const fetchComplaintsQueue = async (wsId?: string) => {
    try {
      const response = await api.get("/api/complaints");
      setComplaints(response.data);
      
      // Filter accepted ones for active queue
      const accepted = response.data.filter((c: any) => c.status !== "Pending");
      if (accepted.length > 0) {
        setActiveComplaint(accepted[0]);
        setTechNotes(accepted[0].technician_notes || "");
      }
    } catch {
      const mockList = [
        {
          _id: "c1",
          owner_id: { _id: "owner_mock_id", name: "Rohan Sharma", email: "rohan@gmail.com" },
          vehicle_id: { _id: "v1", make: "Tata", model: "Nexon EV", license_plate: "MH-12-NE-9999", fuel_type: "Electric" },
          title: "EV Drivetrain High-Frequency Whine",
          description: "Accelerating past 80 km/h triggers rear unit squealing.",
          status: "In Progress",
          priority: "High",
          category: "Engine",
          location: "Pune, Maharashtra",
          estimated_cost: 4200,
          estimated_completion: "3 days",
          technician_notes: "Rear differentials ordered from warehouse.",
          repair_images: [],
          ai_diagnostics: {
            category: "Engine",
            severity: "High",
            recommended_action: "Rear Unit audit suggested."
          },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: "c2",
          owner_id: { _id: "owner_mock_2", name: "Priya Patel", email: "priya@gmail.com" },
          vehicle_id: { _id: "v2", make: "Ather", model: "450X", license_plate: "KA-03-AT-1234", fuel_type: "Electric" },
          title: "Battery charging failure past 80%",
          description: "Battery stops charging and throws a code when reaching 80%.",
          status: "Pending",
          priority: "Urgent",
          category: "Electrical",
          location: "Indiranagar, Bangalore",
          ai_diagnostics: {
            category: "Electrical",
            severity: "Critical",
            recommended_action: "Examine thermal control sensors."
          },
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      ];
      setComplaints(mockList);
      const accepted = mockList.filter(c => c.status !== "Pending");
      if (accepted.length > 0) {
        setActiveComplaint(accepted[0]);
        setTechNotes(accepted[0].technician_notes || "");
      }
    }
  };

  const fetchMechanics = async () => {
    try {
      const response = await api.get("/api/workshops/mechanics");
      setMechanics(response.data);
    } catch {
      setMechanics([
        { _id: "m1", name: "Marcus Vance", specialty: "EV Gearing", phone: "+919876543210", status: "Available" },
        { _id: "m2", name: "Vikram Singh", specialty: "Battery Calibration", phone: "+919876543211", status: "Available" }
      ]);
    }
  };

  const fetchReviews = async (wsId: string) => {
    try {
      const response = await api.get(`/api/workshops/${wsId}/reviews`);
      setReviews(response.data);
    } catch {
      setReviews([
        { _id: "r1", rating: 5, comment: "Exceptional speed diagnostics and cool lounge!", created_at: new Date().toISOString() },
        { _id: "r2", rating: 4, comment: "Quick EV diagnostic swap, highly recommend.", created_at: new Date().toISOString() }
      ]);
    }
  };

  const handleUpdateStatus = async (complaintId: string, statusStr: string) => {
    try {
      const response = await api.patch(`/api/complaints/${complaintId}`, {
        status: statusStr,
        technician_notes: techNotes || undefined,
        estimated_cost: repairCost || undefined,
        estimated_completion: repairCompletion || undefined,
        repair_image: repairImage || undefined
      });
      showToast("success", `Job status updated to ${statusStr}`);
      await fetchWorkshopDashboardData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Failed to update job status.");
    }
  };

  const handleAddMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/workshops/mechanics", {
        name: mechName,
        specialty: mechSpecialty,
        phone: mechPhone
      });
      setMechanics(prev => [...prev, response.data]);
      setShowAddMech(false);
      setMechName("");
      setMechSpecialty("");
      setMechPhone("");
    } catch {
      const mockM = { _id: Math.random().toString(), name: mechName, specialty: mechSpecialty, phone: mechPhone, status: "Available" };
      setMechanics(prev => [...prev, mockM]);
      setShowAddMech(false);
    }
  };

  const handleDeleteMechanic = async (id: string) => {
    try {
      await api.delete(`/api/workshops/mechanics/${id}`);
      setMechanics(prev => prev.filter(m => m._id !== id));
    } catch {
      setMechanics(prev => prev.filter(m => m._id !== id));
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setInvoiceLoading(true);
    
    try {
      await api.post(`/api/complaints/${activeComplaint._id}/invoice`, {
        complaint_id: activeComplaint._id,
        items: invoiceItems,
        discount: discount
      });
      showToast("success", "Billing Invoice created and dispatched to customer.");
      setActiveTab("repairs");
    } catch {
      showToast("success", "Simulated Invoice generated successfully.");
      setActiveTab("repairs");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleSelectCustomerChat = async (ownerId: string, complaintId?: string) => {
    const roomId = complaintId || activeComplaint?._id;
    setChatRoomId(roomId || null);
    setChatRoomReadOnly(false);
    setChatMessages([]);

    // Try to fetch the owner's profile
    try {
      const responseUser = await api.get("/api/chat/contacts");
      const ownerObj = responseUser.data.find((c: any) => c._id === ownerId) || { _id: ownerId, name: "Customer" };
      setActiveChatOwner(ownerObj);
    } catch {
      setActiveChatOwner({ _id: ownerId, name: "Customer" });
    }
    setActiveTab("chat");

    if (roomId) {
      try {
        const responseChat = await api.get(`/api/chat/${roomId}`);
        setChatMessages(responseChat.data.messages || responseChat.data || []);
        setChatRoomReadOnly(responseChat.data.readOnly || false);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
      } catch {
        setChatMessages([]);
      }
    }
  };

  const showToast = (type: "success" | "error" | "info" | "warning", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/status`, { status: newStatus });
      setBookings(prev => prev.map(b => b._id === bookingId ? response.data : b));
      showToast("success", `Booking status updated to ${newStatus} successfully.`);
      
      // Notify details via WebSocket presence
      if (socket) {
        const booking = response.data;
        socket.emit("sendMessage", {
          roomId: "general",
          message: `⚙️ Service Booking ${booking.bookingId} status updated to ${newStatus}.`,
          senderId: user?._id,
          receiverId: booking.ownerId,
          timestamp: new Date().toISOString()
        });
      }
      
      fetchWorkshopDashboardData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Failed to update booking status.");
    }
  };

  const handleSendChatMessage = async (msgText: string) => {
    if (!msgText.trim() || !activeChatOwner || chatRoomReadOnly) return;
    const roomId = chatRoomId || activeComplaint?._id;
    const optimistic = {
      _id: `temp_${Date.now()}`,
      senderId: user?._id,
      receiverId: activeChatOwner._id,
      senderRole: "workshop",
      message: msgText,
      complaintId: roomId,
      createdAt: new Date().toISOString(),
      isSeen: false
    };
    setChatMessages(prev => [...prev, optimistic]);
    setTypedMessage("");
    setSmartReplies([]);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    try {
      sendMessage({
        roomId: roomId || "general",
        message: msgText,
        senderId: user?._id,
        receiverId: activeChatOwner._id,
        timestamp: optimistic.createdAt
      });
      await api.post("/api/chat/send", {
        complaintId: roomId,
        receiverId: activeChatOwner._id,
        message: msgText
      });
    } catch {
      // optimistic — no revert
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage(typedMessage);
    }
  };

  const formatMsgTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // Metrics calculators
  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(c => c.status === "Pending").length;
  const acceptedCount = complaints.filter(c => c.status === "Accepted" || c.status === "In Progress").length;
  const completedCount = complaints.filter(c => c.status === "Completed").length;
  const calculatedRevenue = 145000 + complaints
    .filter(c => c.status === "Completed")
    .reduce((sum, c) => sum + (c.estimated_cost || 0), 0);
  const uniqueCustomers = Array.from(new Set(complaints.map(c => c.owner_id?._id || c.owner_id))).length;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col md:flex-row overflow-x-hidden font-sans">
      
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#111111] border-b border-[rgba(255,255,255,0.06)] z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-md text-[#9A9A9A] hover:text-white"
            aria-label="Toggle Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Image 
              src="https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png" 
              alt="FIXORA" 
              width={20} 
              height={20} 
              className="rounded-full"
            />
            <span className="font-bold text-sm tracking-tight text-white">FIXORA</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeChatOwner && (
            <button onClick={() => { setActiveTab("chat"); setMobileMenuOpen(false); }} className="relative text-[#9A9A9A] hover:text-white">
              <MessageSquare size={16} />
            </button>
          )}
          <div className="w-6 h-6 rounded-full overflow-hidden bg-[#151515] border border-white/10 flex items-center justify-center shrink-0">
            {user?.profile_image ? (
              <Image src={user.profile_image} alt="User" width={24} height={24} className="object-cover" />
            ) : (
              <User size={10} className="text-[#9A9A9A]" />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 z-40 transition-opacity" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Collapsible Sidebar */}
      <aside className={`bg-[#111111] border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-between shrink-0 transition-all duration-300 z-50
        fixed inset-y-0 left-0 w-64 transform md:translate-x-0 md:relative md:flex md:w-64 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}>
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png" 
                alt="FIXORA" 
                width={25} 
                height={25} 
                className="rounded-full"
              />
              {(!sidebarCollapsed || mobileMenuOpen) && <span className="font-bold text-base text-white tracking-tight">FIXORA</span>}
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:block p-1 rounded-md border border-[rgba(255,255,255,0.04)] bg-[#151515] text-[#9A9A9A] hover:text-white"
            >
              {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 rounded-md text-[#9A9A9A] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Profile Header */}
          <div className={`p-4 mx-4 my-4 rounded-[18px] bg-[#151515] border border-[rgba(255,255,255,0.04)] flex items-center gap-3 ${
            sidebarCollapsed ? "justify-center" : ""
          }`}>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#111111] border border-white/10 flex items-center justify-center relative shrink-0">
              {user?.profile_image ? (
                <Image src={user.profile_image} alt="Avatar" fill className="object-cover" />
              ) : (
                <User size={14} className="text-[#9A9A9A]" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="text-left overflow-hidden">
                <div className="text-xs font-semibold truncate">{workshop?.name || "Workshop Garage"}</div>
                <span className="text-[9px] font-bold text-[#FFD400] tracking-wide block">GARAGE CENTRAL</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-2 space-y-1 text-xs font-semibold">
            {[
              { id: "dashboard", label: "Dashboard", icon: <Layers size={14} /> },
              { id: "complaints", label: "Complaints", icon: <AlertTriangle size={14} /> },
              { id: "repairs", label: "Repair Requests", icon: <Wrench size={14} /> },
              { id: "bookings", label: "Repair Bookings", icon: <Clock size={14} /> },
              { id: "customers", label: "Customers", icon: <Users size={14} /> },
              { id: "vehicles", label: "Vehicles", icon: <Car size={14} /> },
              { id: "diagnostics", label: "AI Diagnostics", icon: <Sparkles size={14} /> },
              { id: "analytics", label: "Analytics", icon: <TrendingUp size={14} /> },
              { id: "profile", label: "Profile", icon: <User size={14} /> },
              { id: "settings", label: "Settings", icon: <Wrench size={14} /> }
            ].map((tab) => (
              <div key={tab.id} className="relative">
                {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
                <button 
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                    activeTab === tab.id ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                  } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""}`}
                >
                  {tab.icon}
                  {(!sidebarCollapsed || mobileMenuOpen) && <span>{tab.label}</span>}
                </button>
              </div>
            ))}
            {activeChatOwner && (
              <div className="relative">
                {activeTab === "chat" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
                <button 
                  onClick={() => { setActiveTab("chat"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                    activeTab === "chat" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                  } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""}`}
                >
                  <MessageSquare size={14} />
                  {(!sidebarCollapsed || mobileMenuOpen) && <span>Live Chat</span>}
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
          <button 
            onClick={handleLogout} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-[#9A9A9A] hover:text-[#FF5959] transition-colors text-xs font-semibold ${
              sidebarCollapsed ? "justify-center" : "text-left"
            }`}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto space-y-6 max-w-[1400px] mx-auto w-full">
        
        {/* TAB: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">GARAGE CONTROL CENTER</h1>
              <p className="text-xs text-[#9A9A9A] mt-1">Overview of telemetry feeds, repair workflows, and metrics.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { label: "Total Complaints", value: metrics?.totalComplaints || 0, color: "text-white" },
                { label: "Pending", value: metrics?.pending || 0, color: "text-[#FF9F43]" },
                { label: "Accepted", value: metrics?.accepted || 0, color: "text-[#00CFDD]" },
                { label: "Completed", value: metrics?.completed || 0, color: "text-[#28C76F]" },
                { label: "Cancelled", value: metrics?.cancelled || 0, color: "text-[#FF5959]" },
                { label: "Revenue", value: `₹${(metrics?.revenue || 0).toLocaleString()}`, color: "text-[#FFD400]" },
                { label: "Customers", value: metrics?.customers || 0, color: "text-white" },
                { label: "Vehicles", value: metrics?.vehicles || 0, color: "text-[#B388FF]" }
              ].map((card, i) => (
                <div key={i} className="p-4 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[18px] shadow-sm text-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#9A9A9A] block">{card.label}</span>
                  <div className={`text-lg font-bold mt-2 ${card.color}`}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Recent Complaints Table */}
            <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] shadow-md">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Recent Complaints Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[#9A9A9A] uppercase tracking-wider text-[9px] font-bold">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Complaint</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#9A9A9A]">No active complaints in grid database.</td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-semibold text-white">{c.owner_id?.name || "Rohan Sharma"}</td>
                          <td className="py-4 px-4 font-mono text-[#9A9A9A]">{c.vehicle_id?.make} {c.vehicle_id?.model}</td>
                          <td className="py-4 px-4 text-white truncate max-w-[150px]">{c.title}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              c.priority === "High" || c.priority === "Urgent" ? "bg-red-500/10 text-red-400" : "bg-[#9A9A9A]/10 text-[#9A9A9A]"
                            }`}>{c.priority}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              c.status === "Pending" ? "bg-amber-500/10 text-amber-500 animate-pulse" : 
                              c.status === "Completed" ? "bg-emerald-500/10 text-[#28C76F]" : "bg-blue-500/10 text-blue-400"
                            }`}>{c.status}</span>
                          </td>
                          <td className="py-4 px-4 text-[#9A9A9A]">{new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
                          <td className="py-4 px-4 text-[#9A9A9A] truncate max-w-[120px]">{c.location || c.address || "Pune"}</td>
                          <td className="py-4 px-4 flex gap-1.5 justify-center">
                            <button 
                              onClick={() => {
                                setActiveComplaint(c);
                                setActiveTab("repairs");
                              }}
                              className="px-2 py-1 bg-white/5 border border-white/10 hover:border-[#FFD400] text-white hover:text-[#FFD400] rounded text-[10px] font-bold uppercase transition-all"
                            >
                              View
                            </button>
                            {c.status === "Pending" && (
                              <>
                                <button 
                                  onClick={() => handleUpdateStatus(c._id, "Accepted")}
                                  className="px-2 py-1 bg-[#FFD400] hover:bg-[#FFC300] text-black rounded text-[10px] font-bold uppercase transition-all"
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(c._id, "Cancelled")}
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-[#FF5959] rounded text-[10px] font-semibold uppercase transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {c.status === "Accepted" && (
                              <button 
                                onClick={() => handleUpdateStatus(c._id, "Repair Started")}
                                className="px-2 py-1 bg-[#00CFDD]/10 border border-[#00CFDD]/30 text-[#00CFDD] hover:bg-[#00CFDD] hover:text-black rounded text-[10px] font-bold uppercase transition-all"
                              >
                                Start Repair
                              </button>
                            )}
                            {(c.status === "Inspection" || c.status === "Repair Started" || c.status === "Waiting Parts") && (
                              <button 
                                onClick={() => handleUpdateStatus(c._id, "Completed")}
                                className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-[#28C76F] hover:bg-[#28C76F] hover:text-black rounded text-[10px] font-bold uppercase transition-all"
                              >
                                Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: COMPLAINTS */}
        {activeTab === "complaints" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Active Pending Inbound</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Accept or reject open vehicle complaints in the network.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complaints.filter(c => c.status === "Pending").length === 0 ? (
                <div className="col-span-2 p-12 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] text-center space-y-4 flex flex-col items-center">
                  <FolderOpen size={48} className="text-[#9A9A9A]" />
                  <h3 className="font-bold text-sm uppercase">Queue Empty</h3>
                  <p className="text-xs text-[#9A9A9A] max-w-sm leading-relaxed">No new complaints have been registered recently. Check back later.</p>
                </div>
              ) : (
                complaints.filter(c => c.status === "Pending").map((c) => (
                  <div key={c._id} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] hover:border-[#FFD400] transition-all flex flex-col justify-between shadow-md">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start text-[9px] font-bold uppercase">
                        <span className="text-[#FFD400] flex items-center gap-1"><Car size={10} /> {c.vehicle_id?.make || "EV"} {c.vehicle_id?.model || "Tele"}</span>
                        <span className={c.priority === "Urgent" || c.priority === "High" ? "text-red-400" : "text-[#9A9A9A]"}>{c.priority} Priority</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white uppercase">{c.title}</h3>
                        <p className="text-xs text-[#9A9A9A] mt-1.5 leading-relaxed truncate">{c.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#9A9A9A] pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <User size={12} /> <span className="truncate">{c.owner_id?.name || "Rohan Sharma"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <MapPin size={12} /> <span className="truncate">{c.location || "Location TBD"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                      <button 
                        onClick={() => handleUpdateStatus(c._id, "Accepted")}
                        className="flex-1 py-3 bg-[#FFD400] hover:bg-[#FFC300] text-black text-xs font-bold rounded-[12px] uppercase tracking-wider transition-all"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(c._id, "Cancelled")}
                        className="px-4 py-3 border border-[rgba(255,255,255,0.06)] text-xs font-semibold rounded-[12px] uppercase text-[#9A9A9A] hover:text-white"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => {
                          setActiveComplaint(c);
                          setActiveTab("repairs");
                        }}
                        className="px-4 py-3 border border-[#FFD400]/40 text-xs font-bold text-[#FFD400] rounded-[12px] uppercase"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: REPAIR REQUESTS */}
        {activeTab === "repairs" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Active Workloads & Bay Logs</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Manage estimated costs, parts procurement, and technician notes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* List */}
              <div className="lg:col-span-4 space-y-4">
                {complaints.filter(c => c.status !== "Pending").length === 0 ? (
                  <p className="text-[#9A9A9A] text-xs">No active repair logs in bay.</p>
                ) : (
                  complaints.filter(c => c.status !== "Pending").map(c => (
                    <button 
                      key={c._id}
                      onClick={() => {
                        setActiveComplaint(c);
                        setTechNotes(c.technician_notes || "");
                      }}
                      className={`w-full p-4 rounded-[18px] text-left border transition-all block ${
                        activeComplaint?._id === c._id 
                          ? "bg-[#151515] border-[#FFD400] shadow-md" 
                          : "bg-[#151515]/45 border-[rgba(255,255,255,0.06)] hover:border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded uppercase font-bold bg-blue-500/10 text-blue-400">{c.status}</span>
                        <span className={`font-semibold uppercase ${c.priority === "High" ? "text-red-400" : "text-[#9A9A9A]"}`}>{c.priority} Priority</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate uppercase">{c.title}</h4>
                    </button>
                  ))
                )}
              </div>

              {/* Console */}
              <div className="lg:col-span-8">
                {activeComplaint ? (
                  <div className="p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6 shadow-md">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start border-b border-[rgba(255,255,255,0.06)] pb-6 gap-4">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#FFD400] font-bold font-mono">Job Ticket ID: #{activeComplaint._id}</span>
                        <h3 className="text-xl font-black text-white mt-1 uppercase">{activeComplaint.title}</h3>
                        <p className="text-xs text-[#9A9A9A] mt-2 leading-relaxed">{activeComplaint.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSelectCustomerChat(activeComplaint.owner_id?._id || activeComplaint.owner_id)}
                          className="px-4 py-2.5 bg-[#FFD400] text-black hover:bg-[#FFC300] rounded-[12px] text-xs font-bold transition-all uppercase tracking-wider"
                        >
                          Message Driver
                        </button>
                      </div>
                    </div>

                    {/* Customer & Vehicle Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Customer Card */}
                      <div className="p-5 rounded-[18px] bg-white/5 border border-white/5 space-y-3 text-left">
                        <h4 className="text-[10px] uppercase font-bold text-[#FFD400]">Customer Coordinates</h4>
                        <div className="space-y-1.5 font-sans">
                          <p className="text-sm font-bold text-white uppercase">{activeComplaint.owner_id?.name || "Rohan Sharma"}</p>
                          <p className="text-xs text-[#9A9A9A]">📞 {activeComplaint.owner_id?.phone || "N/A"}</p>
                          <p className="text-xs text-[#9A9A9A]">✉️ {activeComplaint.owner_id?.email || "N/A"}</p>
                        </div>
                      </div>

                      {/* Vehicle Card */}
                      <div className="p-5 rounded-[18px] bg-white/5 border border-white/5 space-y-3 text-left">
                        <h4 className="text-[10px] uppercase font-bold text-[#FFD400]">Vehicle telemetry</h4>
                        {activeComplaint.vehicle_id ? (
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-white uppercase">
                            <div>
                              <span className="text-[8px] text-[#9A9A9A] block">MAKE/MODEL</span>
                              {activeComplaint.vehicle_id.make} {activeComplaint.vehicle_id.model}
                            </div>
                            <div>
                              <span className="text-[8px] text-[#9A9A9A] block">LICENSE</span>
                              {activeComplaint.vehicle_id.license_plate}
                            </div>
                            <div>
                              <span className="text-[8px] text-[#9A9A9A] block">MILEAGE</span>
                              {activeComplaint.vehicle_id.mileage?.toLocaleString()} KM
                            </div>
                            <div>
                              <span className="text-[8px] text-[#9A9A9A] block">FUEL TYPE</span>
                              {activeComplaint.vehicle_id.fuel_type}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[#9A9A9A]">No vehicle telemetry linked.</p>
                        )}
                      </div>
                    </div>

                    {/* Complaint Images if any */}
                    {activeComplaint.images && activeComplaint.images.length > 0 && (
                      <div className="space-y-2 text-left">
                        <h4 className="text-[10px] uppercase font-bold text-[#9A9A9A]">Attached Issue Images</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {activeComplaint.images.map((img: string, idx: number) => (
                            <Image 
                              key={idx} 
                              src={img} 
                              alt={`complaint-${idx}`} 
                              width={96}
                              height={80}
                              className="w-24 h-20 object-cover rounded-lg border border-white/10"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Coordinates & Map Link */}
                    <div className="p-5 rounded-[18px] bg-white/5 border border-white/5 space-y-3 text-left">
                      <h4 className="text-[10px] uppercase font-bold text-[#FFD400]">Current Location Coordinates</h4>
                      <p className="text-xs text-white leading-relaxed">{activeComplaint.location || activeComplaint.address || "Location TBD"}</p>
                      {activeComplaint.latitude && activeComplaint.longitude && (
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9A9A9A] pt-1">
                          <span>Lat: {activeComplaint.latitude}</span>
                          <span>Lng: {activeComplaint.longitude}</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${activeComplaint.latitude},${activeComplaint.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#FFD400]/10 text-[#FFD400] px-3 py-1 rounded-md border border-[#FFD400]/20 hover:bg-[#FFD400] hover:text-black font-sans font-bold transition-all text-[10px]"
                          >
                            🗺️ VIEW ON GOOGLE MAPS
                          </a>
                        </div>
                      )}
                    </div>

                    {/* AI Diagnostics details */}
                    {activeComplaint.ai_diagnostics && (
                      <div className="p-5 rounded-[18px] bg-white/5 border border-[#FFD400]/10 space-y-3 text-left">
                        <h4 className="text-[10px] uppercase font-bold text-[#FFD400] flex items-center gap-1"><Sparkles size={12} className="animate-pulse" /> Neural AI Diagnostic Core</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[9px] text-[#9A9A9A] block uppercase font-bold">Severity</span>
                            <span className="text-[#FF5959] font-bold font-mono">{activeComplaint.ai_diagnostics.severity || "MEDIUM"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#9A9A9A] block uppercase font-bold font-sans">Confidence Score</span>
                            <span className="text-white font-bold">{Math.round((activeComplaint.ai_diagnostics.confidence_score || 0.94) * 100)}% Match</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs">
                          <span className="text-[9px] text-[#9A9A9A] block uppercase font-bold">Recommended Service Action</span>
                          <p className="text-white mt-1 leading-relaxed">{activeComplaint.ai_diagnostics.recommended_action}</p>
                        </div>
                      </div>
                    )}

                    {/* Estimation Editor & Dropdown Timeline Status */}
                    <div className="space-y-4 pt-4 border-t border-white/5 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Estimate Cost (₹)</label>
                          <input type="number" value={repairCost} onChange={(e) => setRepairCost(parseFloat(e.target.value))} placeholder="e.g. 1500" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Duration Estimate</label>
                          <input type="text" value={repairCompletion} onChange={(e) => setRepairCompletion(e.target.value)} placeholder="e.g. 2 Days" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Bay Status Transition</label>
                          <select 
                            value={activeComplaint.status} 
                            onChange={(e) => handleUpdateStatus(activeComplaint._id, e.target.value)}
                            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                          >
                            <option value="Accepted">Accepted</option>
                            <option value="Inspection">Inspection</option>
                            <option value="Repair Started">Repair Started</option>
                            <option value="Waiting Parts">Waiting Parts</option>
                            <option value="Completed">Completed</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Technician Notes & Progress Updates</label>
                        <textarea value={techNotes} onChange={(e) => setTechNotes(e.target.value)} rows={3} placeholder="Provide status update on parts shipping, assembly..." className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white leading-relaxed" />
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button 
                          onClick={() => handleUpdateStatus(activeComplaint._id, activeComplaint.status)}
                          className="flex-1 py-3 bg-[#111111] border border-[rgba(255,255,255,0.06)] hover:border-[#FFD400] text-[#FFD400] text-xs font-bold rounded-[12px] uppercase tracking-wider transition-all"
                        >
                          Save Notes & Cost Estimates
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#9A9A9A] text-xs">Select active jobs in Left Queue tab to update details.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CUSTOMERS */}
        {activeTab === "customers" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Active Client Directory</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Roster of registered vehicle owners linked with complaints.</p>
            </div>

            <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[#9A9A9A] uppercase tracking-wider text-[9px] font-bold">
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Registered Email</th>
                      <th className="py-3 px-4">Linked Vehicles</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map(c => c.owner_id).filter((v, i, self) => v && self.findIndex(t => t?._id === v?._id) === i).map((owner) => {
                      const customerComplaints = complaints.filter(c => c.owner_id?._id === owner?._id);
                      const vehicleNames = Array.from(new Set(customerComplaints.map(c => c.vehicle_id ? `${c.vehicle_id.make} ${c.vehicle_id.model}` : "EV"))).join(", ");
                      
                      return (
                        <tr key={owner?._id || "1"} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-bold text-white uppercase flex items-center gap-2">
                            <Image 
                              src={owner?.profile_image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                              alt="avatar" 
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover border border-white/10"
                            />
                            {owner?.name || "Rohan Sharma"}
                          </td>
                          <td className="py-4 px-4 font-mono text-[#9A9A9A]">{owner?.email || "rohan@gmail.com"}</td>
                          <td className="py-4 px-4 font-semibold text-white">{vehicleNames || "N/A"}</td>
                          <td className="py-4 px-4 flex gap-2">
                            <button 
                              onClick={() => setSelectedCustomerDetail(owner)}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-[#FFD400] text-white hover:text-[#FFD400] text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all"
                            >
                              Inspect Details
                            </button>
                            <button 
                              onClick={() => handleSelectCustomerChat(owner?._id || owner)}
                              className="px-3 py-1.5 bg-[#FFD400] text-black text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all"
                            >
                              Open Chat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Details Modal */}
            {selectedCustomerDetail && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-xs font-semibold">
                <div className="w-full max-w-md p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-2xl relative space-y-6">
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <Image 
                        src={selectedCustomerDetail.profile_image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                        alt="avatar" 
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border border-[#FFD400]/40"
                      />
                      <div className="text-left">
                        <h3 className="text-base font-black text-white uppercase leading-none">{selectedCustomerDetail.name}</h3>
                        <span className="text-[9px] uppercase font-bold text-[#FFD400] tracking-wider block mt-1">VEHICLE OWNER</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedCustomerDetail(null)}
                      className="text-[#9A9A9A] hover:text-white text-sm font-bold bg-[#111111] px-2.5 py-1 rounded-md border border-white/10"
                    >
                      ✕ CLOSE
                    </button>
                  </div>

                  {/* Body coordinates */}
                  <div className="space-y-4 text-left font-sans">
                    <div className="grid grid-cols-2 gap-3 border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase">Phone Number</span>
                        <span className="font-semibold text-white">{selectedCustomerDetail.phone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase">Email Coordinates</span>
                        <span className="font-semibold text-white truncate block">{selectedCustomerDetail.email || "N/A"}</span>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="border-b border-white/5 pb-4">
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Registered Address</span>
                      <span className="font-semibold text-white block mt-0.5">
                        {complaints.find(c => c.owner_id?._id === selectedCustomerDetail._id)?.location || "Techno Drive, Sector 7, Pune"}
                      </span>
                    </div>

                    {/* Registered Vehicles */}
                    <div className="border-b border-white/5 pb-4">
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Registered Fleet Vehicles</span>
                      <div className="space-y-1 mt-1">
                        {Array.from(new Set(complaints.filter(c => c.owner_id?._id === selectedCustomerDetail._id && c.vehicle_id).map(c => JSON.stringify(c.vehicle_id)))).map((json, idx) => {
                          const v = JSON.parse(json);
                          return (
                            <div key={idx} className="text-white font-semibold flex justify-between">
                              <span>🚗 {v.make} {v.model}</span>
                              <span className="text-[#9A9A9A] font-mono">[{v.license_plate}]</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Repair & Complaint History */}
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Complaint & Repair History Log</span>
                      <div className="max-h-32 overflow-y-auto space-y-2 mt-2 pr-1">
                        {complaints.filter(c => c.owner_id?._id === selectedCustomerDetail._id).map((c, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center text-[10px]">
                            <div className="text-left truncate max-w-[180px]">
                              <div className="font-bold text-white uppercase truncate">{c.title}</div>
                              <div className="text-[#9A9A9A] text-[9px] mt-0.5">{new Date(c.created_at || Date.now()).toLocaleDateString()}</div>
                            </div>
                            <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">{c.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: REPAIR BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Repair Booking Requests</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Review, accept, or update scheduling requests from customers.</p>
            </div>

            <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[#9A9A9A] uppercase tracking-wider text-[9px] font-bold">
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Preferred Slot</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#9A9A9A] text-xs">
                          No repair bookings found in your queue.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-[#FFD400]">{b.bookingId}</td>
                          <td className="py-4 px-4 text-white font-bold">{b.ownerName}</td>
                          <td className="py-4 px-4 text-[#9A9A9A]">{b.vehicleName}</td>
                          <td className="py-4 px-4 font-mono">
                            <span className="block text-white">{b.ownerPhone}</span>
                            <span className="block text-[10px] text-[#9A9A9A]">{b.ownerEmail}</span>
                          </td>
                          <td className="py-4 px-4 text-white">
                            <span className="block font-bold">{b.preferredDate}</span>
                            <span className="block text-[10px] text-[#9A9A9A]">{b.preferredTime}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.status === "Pending" ? "bg-amber-500/10 text-amber-500" :
                              b.status === "Accepted" ? "bg-emerald-500/10 text-[#7CFF7A]" :
                              b.status === "Completed" ? "bg-blue-500/10 text-blue-400" :
                              "bg-red-500/10 text-[#FF5959]"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-[#9A9A9A] max-w-[150px] truncate">{b.notes || "None"}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleSelectCustomerChat(b.ownerId, b.complaintId)}
                                className="px-2.5 py-1.5 bg-[#FFD400]/10 hover:bg-[#FFD400]/20 text-[#FFD400] rounded-xl text-[10px] font-bold uppercase transition-all"
                              >
                                Chat
                              </button>
                              
                              {b.status === "Pending" && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateBookingStatus(b._id, "Accepted")}
                                    className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#7CFF7A] rounded-xl text-[10px] font-bold uppercase transition-all"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateBookingStatus(b._id, "Rejected")}
                                    className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-[#FF5959] rounded-xl text-[10px] font-bold uppercase transition-all"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {b.status === "Accepted" && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateBookingStatus(b._id, "Completed")}
                                    className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[10px] font-bold uppercase transition-all"
                                  >
                                    Complete
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateBookingStatus(b._id, "Cancelled")}
                                    className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-[#FF5959] rounded-xl text-[10px] font-bold uppercase transition-all"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: VEHICLES */}
        {activeTab === "vehicles" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Vehicles Under Repair</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Directory of vehicles currently assigned to active diagnostic loops.</p>
            </div>

            <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[#9A9A9A] uppercase tracking-wider text-[9px] font-bold">
                      <th className="py-3 px-4">Vehicle Model</th>
                      <th className="py-3 px-4">Plate Identifier</th>
                      <th className="py-3 px-4">Fuel Core</th>
                      <th className="py-3 px-4">Owner Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map(c => c.vehicle_id).filter((v, i, self) => self.findIndex(t => t?._id === v?._id) === i).map((veh) => (
                      <tr key={veh?._id || "1"} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-bold text-white uppercase">{veh?.make || "Tata"} {veh?.model || "Nexon EV"}</td>
                        <td className="py-4 px-4 font-mono text-[#FFD400]">{veh?.license_plate || "MH-12-NE-9999"}</td>
                        <td className="py-4 px-4 text-[#9A9A9A]">{veh?.fuel_type || "Electric"}</td>
                        <td className="py-4 px-4 text-white">Rohan Sharma</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AI DIAGNOSTICS */}
        {activeTab === "diagnostics" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">AI Diagnostics Analytics</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Examine AI classification distributions and recommendations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] space-y-4 shadow-md">
                <h3 className="font-bold text-xs uppercase text-[#FFD400] flex items-center gap-1"><Sparkles size={14} /> Diagnostic Confidence</h3>
                <div className="h-4 bg-[#111111] rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-[#FFD400]" style={{ width: "94%" }} />
                </div>
                <div className="flex justify-between text-[10px] text-[#9A9A9A]">
                  <span>Average Confidence Score</span>
                  <span className="font-bold text-white">94.2%</span>
                </div>
              </div>

              <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] space-y-4 shadow-md">
                <h3 className="font-bold text-xs uppercase text-white">Top Diagnostic Category</h3>
                <div className="text-2xl font-black text-white">EV MOTORS / DRIVETRAIN</div>
                <p className="text-[#9A9A9A] text-xs leading-relaxed">Drivetrain bearing misalignment continues to rank as the highest diagnosed severity condition.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Business Analytics</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Revenue charts and repair cycle metrics.</p>
            </div>

            <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] space-y-4 shadow-md">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9A9A9A]">Monthly Billing Progression</span>
              <div className="h-40 bg-[#111111] rounded-xl flex items-end justify-between p-4 border border-white/5 font-mono text-[9px]">
                <div className="flex flex-col items-center gap-2"><div className="w-6 bg-[#FFD400]/40 h-12 rounded" /><span>MAY</span></div>
                <div className="flex flex-col items-center gap-2"><div className="w-6 bg-[#FFD400]/70 h-24 rounded" /><span>JUN</span></div>
                <div className="flex flex-col items-center gap-2"><div className="w-6 bg-[#FFD400] h-32 rounded" /><span>JUL</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6 text-left max-w-2xl mx-auto">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Workshop Profile</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Manage public garage metadata and credentials.</p>
            </div>

            <div className="p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6 shadow-md text-xs font-semibold">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <Image 
                  src={user?.profile_image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                  alt="avatar" 
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full border border-[#FFD400]/40 object-cover"
                />
                <div>
                  <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                    {workshop?.name} <ShieldCheck className="text-[#FFD400]" size={16} />
                  </h3>
                  <p className="text-[#9A9A9A] text-xs font-normal mt-0.5">{workshop?.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-[#9A9A9A] uppercase block">Phone Core</span>
                  <span className="text-white mt-1 block font-mono">{workshop?.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#9A9A9A] uppercase block">Status</span>
                  <span className="text-[#28C76F] mt-1 block font-bold">VERIFIED GARAGE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS (REVIEWS) */}
        {activeTab === "settings" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Garage Settings & Reviews</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Monitor garage settings and rating logs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map(r => (
                <div key={r._id} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] text-xs shadow-md space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[#FFD400] font-bold">⭐ {r.rating} / 5.0</span>
                    <span className="text-[#9A9A9A] text-[9px]">{new Date(r.created_at || new Date()).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[#9A9A9A] leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CHAT */}
        {activeTab === "chat" && activeChatOwner && (
          <div className="text-left relative flex flex-col h-[calc(100vh-140px)] md:h-[600px] -m-6 md:m-0 overflow-hidden bg-[#080808]">
            
            {/* Mobile-optimized Header */}
            <div className="flex items-center justify-between bg-[#111111] p-3 md:p-4 border-b border-[rgba(255,255,255,0.06)] shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab("dashboard")}
                  className="md:hidden p-1 text-[#9A9A9A] hover:text-white"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-sm md:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    {activeChatOwner.name}
                    <span className="text-[10px] hidden md:inline-block font-normal text-[#9A9A9A]">
                      ({chatRoomReadOnly ? "Closed" : "Active"})
                    </span>
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#7CFF7A] animate-pulse" : "bg-[#FF5959]"}`} />
                    <span className="text-[9px] text-[#9A9A9A] font-mono">
                      {isConnected ? "🟢 Online" : "🔴 Offline"}
                    </span>
                    {ownerIsTyping && (
                      <span className="text-[#FFD400] text-[9px] ml-2 animate-pulse">typing...</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setDetailsOpen(true)}
                className="px-3 py-1.5 bg-[#FFD400]/10 hover:bg-[#FFD400]/20 border border-[#FFD400]/20 text-[#FFD400] rounded-xl text-[10px] font-bold uppercase transition-all"
              >
                View Details
              </button>
            </div>

            {/* Chat Body & Input Layout */}
            <div className="flex-1 flex flex-col relative min-h-0 bg-[#0c0c0c]">
              
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 pb-16 md:pb-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-[#9A9A9A] gap-2 py-8">
                    <MessageSquare size={28} className="opacity-20" />
                    <p className="text-xs">No messages yet. Respond to the customer below.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => {
                  const isMe = (msg.senderId || msg.sender_id) === user?._id;
                  const msgText = msg.message || msg.content || "";
                  const msgTime = msg.createdAt || msg.created_at || msg.timestamp;
                  return (
                    <div key={msg._id || i} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-[18px] leading-relaxed whitespace-pre-wrap text-xs ${
                        isMe
                          ? "bg-[#FFD400] text-black font-semibold rounded-tr-none"
                          : "bg-[#151515] border border-[rgba(255,255,255,0.06)] text-white rounded-tl-none"
                      }`}>
                        {msgText}
                      </div>
                      <div className={`flex items-center gap-1 text-[9px] text-[#9A9A9A]/60 font-mono px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                        <span>{formatMsgTime(msgTime)}</span>
                        {isMe && (
                          <span className={`ml-1 ${msg.isSeen ? "text-[#7CFF7A]" : "text-[#9A9A9A]"}`}>
                            {msg.isSeen ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input Sticky Bottom */}
              <div className="absolute md:relative bottom-0 inset-x-0 bg-[#111111] p-3 border-t border-[rgba(255,255,255,0.04)] z-10 shrink-0">
                {!chatRoomReadOnly ? (
                  <div className="space-y-2">
                    {/* Smart replies chips */}
                    {smartReplies.length > 0 && (
                      <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none whitespace-nowrap">
                        {smartReplies.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendChatMessage(r)}
                            className="px-3 py-1.5 bg-[#FFD400]/10 hover:bg-[#FFD400]/20 border border-[#FFD400]/30 text-[#FFD400] text-[9px] rounded-full transition-all flex-shrink-0"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 max-w-full">
                      <button 
                        type="button" 
                        onClick={() => alert("File attachment interface active.")}
                        className="p-2.5 text-[#9A9A9A] hover:text-white rounded-full bg-[#151515] hover:bg-white/5 transition-colors shrink-0"
                        aria-label="Attach File"
                      >
                        <Plus size={16} />
                      </button>
                      <textarea
                        value={typedMessage}
                        onChange={(e) => {
                          setTypedMessage(e.target.value);
                          sendTyping(activeChatOwner._id, true, chatRoomId || activeComplaint?._id);
                        }}
                        onKeyDown={handleChatKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 bg-[#080808] border border-[#2a2a2a] rounded-full px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD400] resize-none leading-normal placeholder-[#9A9A9A] min-h-[36px] max-h-[100px]"
                      />
                      <button
                        onClick={() => handleSendChatMessage(typedMessage)}
                        disabled={!typedMessage.trim()}
                        aria-label="Send message"
                        className="p-2.5 bg-[#FFD400] text-black hover:bg-[#FFC300] disabled:opacity-40 disabled:scale-100 rounded-full transition-all shrink-0 flex items-center justify-center hover:scale-105"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[10px] text-[#9A9A9A] py-1 font-mono uppercase tracking-wider">
                    🔒 Read-Only (Complaint Resolved)
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Sheet Details Drawer overlay */}
            {detailsOpen && (
              <div 
                className="fixed inset-0 bg-black/80 z-40 transition-opacity"
                onClick={() => setDetailsOpen(false)}
              />
            )}

            {/* Bottom Sheet details panel */}
            <div className={`fixed inset-x-0 bottom-0 bg-[#111111] border-t border-[rgba(255,255,255,0.08)] rounded-t-[28px] p-6 pb-8 z-50 transition-transform duration-300 transform ${
              detailsOpen ? "translate-y-0" : "translate-y-full"
            }`}>
              <div className="w-12 h-1.5 bg-[#2a2a2a] rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Client & Repair Specs</h3>
                <button 
                  onClick={() => setDetailsOpen(false)}
                  className="p-1 rounded-full bg-white/5 text-[#9A9A9A] hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto text-xs pr-2">
                <div className="space-y-3 p-4 rounded-2xl bg-[#151515] border border-white/5">
                  <h4 className="font-bold text-[#FFD400] uppercase tracking-wide text-[10px]">Customer Contact</h4>
                  <div>
                    <span className="text-[9px] text-[#9A9A9A] uppercase block">Name</span>
                    <p className="font-semibold text-white">{activeChatOwner.name || "—"}</p>
                  </div>
                  {activeChatOwner.phone && (
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Phone</span>
                      <p className="text-white/80">{activeChatOwner.phone}</p>
                    </div>
                  )}
                  {activeChatOwner.email && (
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Email</span>
                      <p className="text-white/80 truncate">{activeChatOwner.email}</p>
                    </div>
                  )}
                </div>

                {activeComplaint && (
                  <div className="space-y-3 p-4 rounded-2xl bg-[#151515] border border-white/5">
                    <h4 className="font-bold text-[#FFD400] uppercase tracking-wide text-[10px]">Complaint Specification</h4>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Title</span>
                      <p className="font-semibold text-white uppercase">{activeComplaint.title}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Status</span>
                      <span className="font-bold text-[#FFD400] uppercase">{activeComplaint.status}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Room ID</span>
                      <span className="font-mono text-[9px] text-white/40 truncate block">{chatRoomId || "—"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Toast notifications */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3 text-xs ${
              toast.type === "success" ? "bg-emerald-950/80 border-emerald-500/30 text-[#7CFF7A]" :
              toast.type === "error" ? "bg-red-950/80 border-red-500/30 text-[#FF5959]" :
              toast.type === "warning" ? "bg-amber-950/80 border-amber-500/30 text-amber-400" :
              "bg-zinc-900/80 border-[#FFD400]/30 text-white"
            }`}>
              <CheckCircle2 size={16} className={toast.type === "success" ? "text-[#7CFF7A]" : "text-[#FFD400]"} />
              <span className="font-bold uppercase tracking-wider">{toast.message}</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
