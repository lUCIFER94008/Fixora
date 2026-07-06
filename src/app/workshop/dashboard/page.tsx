"use client";

import React, { useState, useEffect } from "react";
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
  FolderOpen
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

  useEffect(() => {
    const rawUser = localStorage.getItem("fixora_user");
    if (!rawUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(rawUser);
    setUser(parsedUser);
    
    fetchWorkshopProfile();
  }, [router]);

  const fetchWorkshopProfile = async () => {
    try {
      const response = await api.get("/api/workshops/profile");
      setWorkshop(response.data);
      
      // Load workshop details
      fetchComplaintsQueue(response.data._id);
      fetchMechanics();
      fetchReviews(response.data._id);
    } catch {
      // Mocks
      const mockW = {
        _id: "w1",
        name: "NEON HYPERGARAGE",
        address: "77 Cyberpunk Boulevard",
        phone: "+1444444444",
        rating: 4.9,
        review_count: 12,
        is_verified: true
      };
      setWorkshop(mockW);
      fetchComplaintsQueue("w1");
      fetchMechanics();
      fetchReviews("w1");
    }
  };

  // Websocket hook
  const { isConnected, sendTyping, sendSeen } = useChat({
    userId: user?._id,
    onMessageReceived: (message) => {
      if (activeChatOwner && message.sender_id === activeChatOwner._id) {
        setChatMessages(prev => [...prev, message]);
        sendSeen(message.sender_id);
        if (message.ai_replies) {
          setSmartReplies(message.ai_replies);
        }
      }
    },
    onStatusUpdate: () => {
      if (workshop) {
        fetchComplaintsQueue(workshop._id);
      }
    },
    onTypingReceived: (typingEvent) => {
      if (activeChatOwner && typingEvent.sender_id === activeChatOwner._id) {
        setOwnerIsTyping(typingEvent.is_typing);
      }
    }
  });

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
      const response = await api.put(`/api/complaints/${complaintId}/status`, {
        status: statusStr,
        technician_notes: techNotes || undefined,
        estimated_cost: repairCost || undefined,
        estimated_completion: repairCompletion || undefined,
        repair_image: repairImage || undefined
      });
      alert(`Job status updated to ${statusStr}`);
      if (workshop) {
        fetchComplaintsQueue(workshop._id);
      }
    } catch {
      // Mock update
      setComplaints(prev => prev.map(c => {
        if (c._id === complaintId) {
          const updated = {
            ...c,
            status: statusStr,
            workshop_id: user?._id,
            technician_notes: techNotes || c.technician_notes,
            estimated_cost: repairCost || c.estimated_cost,
            estimated_completion: repairCompletion || c.estimated_completion,
            repair_images: repairImage ? [...(c.repair_images || []), repairImage] : (c.repair_images || [])
          };
          if (activeComplaint?._id === complaintId) {
            setActiveComplaint(updated);
          }
          return updated;
        }
        return c;
      }));
      alert(`Simulated job status updated to ${statusStr}`);
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
      alert("Billing Invoice created and dispatched to customer.");
      setActiveTab("repairs");
    } catch {
      alert("Simulated Invoice generated successfully.");
      setActiveTab("repairs");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleSelectCustomerChat = async (ownerId: string) => {
    try {
      const responseUser = await api.get("/api/chat/contacts");
      const ownerObj = responseUser.data.find((c: any) => c._id === ownerId) || { _id: ownerId, name: "Customer Node" };
      setActiveChatOwner(ownerObj);
      setActiveTab("chat");
      
      const responseChat = await api.get(`/api/chat/history/${ownerId}`);
      setChatMessages(responseChat.data);
      if (responseChat.data.length > 0) {
        const last = responseChat.data[responseChat.data.length - 1];
        if (last.sender_id === ownerId && last.ai_replies) {
          setSmartReplies(last.ai_replies);
        }
      }
    } catch {
      setActiveChatOwner({ _id: ownerId, name: "Rohan Sharma" });
      setActiveTab("chat");
      setChatMessages([
        { sender_id: ownerId, content: "Hi, when is the drivetrains diagnostic scheduled?", created_at: new Date() }
      ]);
      setSmartReplies(["The drivetrain is next in the bay.", "We expect results in 1 hour.", "We have ordered the bearings."]);
    }
  };

  const handleSendChatMessage = async (msgText: string) => {
    if (!msgText.trim() || !activeChatOwner) return;
    const payload = {
      receiver_id: activeChatOwner._id,
      content: msgText,
      complaint_id: activeComplaint?._id
    };
    try {
      const response = await api.post("/api/chat/messages", payload);
      setChatMessages(prev => [...prev, response.data]);
      setTypedMessage("");
    } catch {
      const mock = {
        _id: Math.random().toString(),
        sender_id: user._id,
        receiver_id: payload.receiver_id,
        content: msgText,
        created_at: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, mock]);
      setTypedMessage("");
    }
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
    <div className="min-h-screen bg-[#080808] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Collapsible Sidebar */}
      <aside className={`bg-[#111111] border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-between shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? "w-full md:w-20" : "w-full md:w-64"
      }`}>
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
              {!sidebarCollapsed && <span className="font-bold text-base text-white tracking-tight">FIXORA</span>}
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:block p-1 rounded-md border border-[rgba(255,255,255,0.04)] bg-[#151515] text-[#9A9A9A] hover:text-white"
            >
              {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                    activeTab === tab.id ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  {tab.icon}
                  {!sidebarCollapsed && <span>{tab.label}</span>}
                </button>
              </div>
            ))}
            {activeChatOwner && (
              <div className="relative">
                {activeTab === "chat" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
                <button 
                  onClick={() => setActiveTab("chat")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                    activeTab === "chat" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <MessageSquare size={14} />
                  {!sidebarCollapsed && <span>Live Chat</span>}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Complaints", value: totalComplaints, color: "text-white" },
                { label: "Pending", value: pendingCount, color: "text-[#FF9F43]" },
                { label: "Accepted", value: acceptedCount, color: "text-[#00CFDD]" },
                { label: "Completed", value: completedCount, color: "text-[#28C76F]" },
                { label: "Revenue", value: `₹${calculatedRevenue.toLocaleString()}`, color: "text-[#FFD400]" },
                { label: "Customers", value: uniqueCustomers, color: "text-white" }
              ].map((card, i) => (
                <div key={i} className="p-4 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[18px] shadow-sm">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#9A9A9A] block">{card.label}</span>
                  <div className={`text-xl font-bold mt-2 ${card.color}`}>{card.value}</div>
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
                      <th className="py-3 px-4">Issue</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#9A9A9A]">No active complaints in grid database.</td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-semibold text-white">{c.owner_id?.name || "Rohan Sharma"}</td>
                          <td className="py-4 px-4 font-mono text-[#9A9A9A]">{c.vehicle_id?.make} {c.vehicle_id?.model}</td>
                          <td className="py-4 px-4 text-white truncate max-w-[200px]">{c.title}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              c.priority === "High" || c.priority === "Urgent" ? "bg-red-500/10 text-red-400" : "bg-[#9A9A9A]/10 text-[#9A9A9A]"
                            }`}>{c.priority}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              c.status === "Pending" ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-blue-500/10 text-blue-400"
                            }`}>{c.status}</span>
                          </td>
                          <td className="py-4 px-4 text-[#9A9A9A]">{new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
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
                    <div className="flex justify-between items-start border-b border-[rgba(255,255,255,0.06)] pb-4">
                      <div>
                        <h3 className="text-lg font-bold uppercase">{activeComplaint.title}</h3>
                        <p className="text-xs text-[#9A9A9A] mt-1 leading-relaxed">{activeComplaint.description}</p>
                      </div>
                      <button 
                        onClick={() => handleSelectCustomerChat(activeComplaint.owner_id?._id || activeComplaint.owner_id)}
                        className="px-4 py-2 bg-transparent hover:bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-[12px] text-xs font-semibold transition-colors"
                      >
                        Message Driver
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Estimate Cost Override (₹)</label>
                          <input type="number" value={repairCost} onChange={(e) => setRepairCost(parseFloat(e.target.value))} placeholder="e.g. 1500" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Duration Estimate</label>
                          <input type="text" value={repairCompletion} onChange={(e) => setRepairCompletion(e.target.value)} placeholder="e.g. 2 Days" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Technician Notes & Progress Updates</label>
                        <textarea value={techNotes} onChange={(e) => setTechNotes(e.target.value)} rows={3} placeholder="Provide status update on parts shipping, assembly..." className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white leading-relaxed" />
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button 
                          onClick={() => handleUpdateStatus(activeComplaint._id, "In Progress")}
                          className="flex-1 py-3 border border-[rgba(255,255,255,0.06)] text-xs font-semibold rounded-[12px] uppercase tracking-wider hover:bg-white/5 transition-colors"
                        >
                          Update Bay Logs
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(activeComplaint._id, "Completed")}
                          className="px-6 py-3 bg-[#FFD400] hover:bg-[#FFC300] text-black text-xs font-bold rounded-[12px] uppercase tracking-wider"
                        >
                          Mark Completed
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
                    {complaints.map(c => c.owner_id).filter((v, i, self) => self.findIndex(t => t?._id === v?._id) === i).map((owner) => (
                      <tr key={owner?._id || "1"} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-bold text-white uppercase">{owner?.name || "Rohan Sharma"}</td>
                        <td className="py-4 px-4 font-mono text-[#9A9A9A]">{owner?.email || "rohan@gmail.com"}</td>
                        <td className="py-4 px-4 font-semibold text-white">Tesla Model S, Nexon EV</td>
                        <td className="py-4 px-4">
                          <button 
                            onClick={() => handleSelectCustomerChat(owner?._id || owner)}
                            className="px-3 py-1.5 bg-[#FFD400] text-black text-[10px] font-bold rounded-lg uppercase tracking-wider"
                          >
                            Open Chat
                          </button>
                        </td>
                      </tr>
                    ))}
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
                <div className="w-16 h-16 rounded-full border border-[#FFD400] flex items-center justify-center bg-[#111111] relative text-xl font-black text-[#FFD400]">
                  W
                </div>
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
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Channel: {activeChatOwner.name}</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Active customer communication room.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[480px]">
              <div className="lg:col-span-8 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] overflow-hidden flex flex-col h-full shadow-md">
                <div className="p-4 bg-[#111111] border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[10px] text-[#9A9A9A] font-semibold">
                  <span>Websocket Channel Status: {isConnected ? "ONLINE" : "OFFLINE"}</span>
                  {ownerIsTyping && <span className="text-[#FFD400] animate-pulse">Client typing...</span>}
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.sender_id === user?._id ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-[18px] ${
                        msg.sender_id === user?._id 
                          ? "bg-[#FFD400] text-black font-semibold rounded-tr-none" 
                          : "bg-[#111111] border border-[rgba(255,255,255,0.04)] text-white rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage(typedMessage);
                  }}
                  className="p-4 bg-[#111111] border-t border-[rgba(255,255,255,0.04)] flex gap-2"
                >
                  <input 
                    type="text" 
                    value={typedMessage}
                    onChange={(e) => {
                      setTypedMessage(e.target.value);
                      sendTyping(activeChatOwner._id, true, activeComplaint?._id);
                    }}
                    placeholder="Enter chat reply coordinates..." 
                    className="flex-1 bg-[#080808] border border-[#2A2A2A] rounded-[12px] px-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400]"
                  />
                  <button type="submit" aria-label="Send Message" className="p-3 bg-[#FFD400] text-black hover:bg-[#FFC300] rounded-[12px] transition-colors">
                    <Send size={14} />
                  </button>
                </form>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] text-xs">
                  <h3 className="font-bold text-[#FFD400] flex items-center gap-2 mb-3 border-b border-white/5 pb-2 uppercase">
                    <Sparkles size={14} /> AI Smart Suggestions
                  </h3>
                  {smartReplies.map((reply, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSendChatMessage(reply)}
                      className="w-full p-3 mb-2 bg-[#111111] hover:bg-white/5 border border-white/5 hover:border-[#FFD400] text-left text-white rounded-xl transition-all"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
