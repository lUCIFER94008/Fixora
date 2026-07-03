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
  ChevronRight
} from "lucide-react";
import api from "@/services/api";
import { useChat } from "@/hooks/useChat";

export default function WorkshopDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workshop, setWorkshop] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("queue"); // queue, billing, mechanics, reviews, chat
  
  // Datasets
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<any>(null);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ revenue: 14500, jobsCount: 12, rating: 4.9 });

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
      fetchComplaintsQueue();
      fetchMechanics();
      fetchReviews(response.data._id);
    } catch {
      // Mocks
      setWorkshop({
        _id: "w1",
        name: "NEON HYPERGARAGE",
        address: "77 Cyberpunk Boulevard",
        phone: "+1444444444",
        rating: 4.9,
        review_count: 12,
        is_verified: true
      });
      fetchComplaintsQueue();
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
    onStatusUpdate: () => {},
    onTypingReceived: (typingEvent) => {
      if (activeChatOwner && typingEvent.sender_id === activeChatOwner._id) {
        setOwnerIsTyping(typingEvent.is_typing);
      }
    }
  });

  const fetchComplaintsQueue = async () => {
    try {
      const response = await api.get("/api/complaints");
      setComplaints(response.data);
      if (response.data.length > 0) {
        setActiveComplaint(response.data[0]);
        setTechNotes(response.data[0].technician_notes || "");
      }
    } catch {
      setComplaints([
        {
          _id: "c1",
          owner_id: "owner_mock_id",
          title: "EV Drivetrain High-Frequency Whine",
          description: "Accelerating past 80 km/h triggers rear unit squealing.",
          status: "In Progress",
          priority: "High",
          estimated_cost: 4200,
          estimated_completion: "3 days",
          technician_notes: "Rear differentials ordered from warehouse.",
          repair_images: [],
          ai_diagnostics: {
            category: "Engine",
            severity: "High",
            recommended_action: "Rear Unit audit suggested."
          },
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const fetchMechanics = async () => {
    try {
      const response = await api.get("/api/workshops/mechanics");
      setMechanics(response.data);
    } catch {
      setMechanics([
        { _id: "m1", name: "Marcus Vance", specialty: "EV Gearing", phone: "+1444111222", status: "Available" }
      ]);
    }
  };

  const fetchReviews = async (wsId: string) => {
    try {
      const response = await api.get(`/api/workshops/${wsId}/reviews`);
      setReviews(response.data);
    } catch {
      setReviews([
        { _id: "r1", rating: 5, comment: "Exceptional speed diagnostics and cool lounge!", created_at: new Date().toISOString() }
      ]);
    }
  };

  const handleUpdateStatus = async (statusStr: string) => {
    if (!activeComplaint) return;
    try {
      const response = await api.put(`/api/complaints/${activeComplaint._id}/status`, {
        status: statusStr,
        technician_notes: techNotes || undefined,
        estimated_cost: repairCost || undefined,
        estimated_completion: repairCompletion || undefined,
        repair_image: repairImage || undefined
      });
      alert(`Job status updated to ${statusStr}`);
      fetchComplaintsQueue();
      setActiveComplaint(response.data);
    } catch {
      // Mock update
      const mockUpdated = { 
        ...activeComplaint, 
        status: statusStr,
        technician_notes: techNotes,
        estimated_cost: repairCost || activeComplaint.estimated_cost,
        estimated_completion: repairCompletion || activeComplaint.estimated_completion,
        repair_images: repairImage ? [...(activeComplaint.repair_images || []), repairImage] : (activeComplaint.repair_images || [])
      };
      setActiveComplaint(mockUpdated);
      setComplaints(prev => prev.map(c => c._id === activeComplaint._id ? mockUpdated : c));
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
      setActiveTab("queue");
    } catch {
      alert("Simulated Invoice generated successfully.");
      setActiveTab("queue");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleSelectCustomerChat = async (ownerId: string) => {
    try {
      // Find user name
      const responseUser = await api.get("/api/chat/contacts");
      const ownerObj = responseUser.data.find((c: any) => c._id === ownerId) || { _id: ownerId, name: "Customer Node" };
      setActiveChatOwner(ownerObj);
      setActiveTab("chat");
      
      const responseChat = await api.get(`/api/chat/history/${ownerId}`);
      setChatMessages(responseChat.data);
      // Auto-extract AI suggestions from last message
      if (responseChat.data.length > 0) {
        const last = responseChat.data[responseChat.data.length - 1];
        if (last.sender_id === ownerId && last.ai_replies) {
          setSmartReplies(last.ai_replies);
        }
      }
    } catch {
      setActiveChatOwner({ _id: ownerId, name: "Jane Doe" });
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

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Collapsible Sidebar */}
      <aside className={`bg-[#111111] border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-between shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? "w-full md:w-20" : "w-full md:w-64"
      }`}>
        <div>
          {/* Logo & Collapse button */}
          <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png" 
                alt="FIXORA" 
                width={25} 
                height={25} 
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

          {/* User profile badge */}
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
                <span className="text-[9px] font-bold text-[#FFD400] tracking-wide block">GARAGE CORE</span>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="px-4 py-2 space-y-1 text-xs font-semibold">
            <div className="relative">
              {activeTab === "queue" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
              <button 
                onClick={() => setActiveTab("queue")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                  activeTab === "queue" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Wrench size={14} />
                {!sidebarCollapsed && <span>Service Queue</span>}
              </button>
            </div>
            <div className="relative">
              {activeTab === "billing" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
              <button 
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                  activeTab === "billing" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <FileText size={14} />
                {!sidebarCollapsed && <span>Billing Invoices</span>}
              </button>
            </div>
            <div className="relative">
              {activeTab === "mechanics" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
              <button 
                onClick={() => setActiveTab("mechanics")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                  activeTab === "mechanics" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Users size={14} />
                {!sidebarCollapsed && <span>Mechanics</span>}
              </button>
            </div>
            <div className="relative">
              {activeTab === "reviews" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
              <button 
                onClick={() => setActiveTab("reviews")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                  activeTab === "reviews" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Award size={14} />
                {!sidebarCollapsed && <span>Ratings & Reviews</span>}
              </button>
            </div>
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
        
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Total Revenue</span>
              <div className="text-2xl font-bold text-[#FFD400]">₹{stats.revenue.toLocaleString()}</div>
            </div>
            <TrendingUp className="text-[#FFD400]" size={20} />
          </div>
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Completed Jobs</span>
              <div className="text-2xl font-bold text-white">{stats.jobsCount}</div>
            </div>
            <Activity className="text-white" size={20} />
          </div>
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Garage Rating</span>
              <div className="text-2xl font-bold text-[#7CFF7A]">{stats.rating} / 5.0</div>
            </div>
            <Award className="text-[#7CFF7A]" size={20} />
          </div>
        </div>

        {/* TAB: QUEUE */}
        {activeTab === "queue" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Repairs Queue & Active Jobs</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Accept tickets and log active mechanic workloads.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* List */}
              <div className="lg:col-span-4 space-y-4">
                {complaints.length === 0 ? (
                  <p className="text-[#9A9A9A] text-xs">No active repairs in grid.</p>
                ) : (
                  complaints.map(c => (
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
                        <span className={`px-2 py-0.5 rounded uppercase font-bold ${
                          c.status === "Pending" ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-blue-500/10 text-blue-400"
                        }`}>{c.status}</span>
                        <span className={`font-semibold uppercase ${c.priority === "High" ? "text-[#FF5959]" : "text-[#9A9A9A]"}`}>{c.priority} Priority</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate uppercase">{c.title}</h4>
                    </button>
                  ))
                )}
              </div>

              {/* Action Board */}
              <div className="lg:col-span-8">
                {activeComplaint ? (
                  <div className="p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6 shadow-md">
                    <div className="flex justify-between items-start border-b border-[rgba(255,255,255,0.06)] pb-4">
                      <div>
                        <h3 className="text-lg font-bold uppercase">{activeComplaint.title}</h3>
                        <p className="text-xs text-[#9A9A9A] mt-1 leading-relaxed">{activeComplaint.description}</p>
                      </div>
                      
                      {/* Customer chat trigger */}
                      <button 
                        onClick={() => handleSelectCustomerChat(activeComplaint.owner_id)}
                        className="px-4 py-2 bg-transparent hover:bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-[12px] text-xs font-semibold transition-colors"
                      >
                        Message Driver
                      </button>
                    </div>

                    {/* AI Diagnostics details references */}
                    {activeComplaint.ai_diagnostics && (
                      <div className="p-4 bg-[#111111] rounded-[18px] border border-[rgba(255,255,255,0.04)] text-xs space-y-1">
                        <h4 className="font-bold text-[#FFD400] flex items-center gap-2 mb-2 uppercase">
                          <Sparkles size={14} /> AI Diagnostic Suggestion
                        </h4>
                        <p className="text-[#9A9A9A] leading-relaxed"><strong className="text-white">Detected Faults:</strong> {activeComplaint.ai_diagnostics.detected_faults?.join(", ") || "General Inspection"}</p>
                        <p className="text-[#9A9A9A]"><strong className="text-white">Suggested Action:</strong> {activeComplaint.ai_diagnostics.recommended_action || "Standard checkup"}</p>
                      </div>
                    )}

                    {/* Actions Form depending on status */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-wider text-[#9A9A9A] font-bold">Technician Control Console</h4>
                      
                      {activeComplaint.status === "Pending" ? (
                        <div className="flex gap-4">
                          <button 
                            onClick={() => handleUpdateStatus("Accepted")}
                            className="flex-1 py-3 bg-[#FFD400] hover:bg-[#FFC300] text-black text-xs font-bold rounded-[12px] uppercase tracking-wider transition-all"
                          >
                            Accept Repair Job
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus("Cancelled")}
                            className="px-6 py-3 border border-[rgba(255,255,255,0.06)] text-xs font-semibold rounded-[12px] uppercase tracking-wider text-[#9A9A9A] hover:text-white"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 text-left">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Estimate Cost Override ($)</label>
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

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Bay Photo URL</label>
                            <input type="text" value={repairImage} onChange={(e) => setRepairImage(e.target.value)} placeholder="e.g. https://images.unsplash.com/bay-photo.jpg" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                          </div>

                          <div className="flex gap-4 pt-2">
                            <button 
                              onClick={() => handleUpdateStatus("In Progress")}
                              className="flex-1 py-3 border border-[rgba(255,255,255,0.06)] text-xs font-semibold rounded-[12px] uppercase tracking-wider hover:bg-white/5 transition-colors"
                            >
                              Update Bay Logs
                            </button>
                            
                            <button 
                              onClick={() => {
                                handleUpdateStatus("In Progress");
                                setActiveTab("billing");
                              }}
                              className="px-6 py-3 bg-[#FFD400] hover:bg-[#FFC300] text-black text-xs font-bold rounded-[12px] uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                            >
                              Issue Invoice <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <p className="text-[#9A9A9A] text-xs">Select repair ticket queue to load details.</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB: BILLING INVOICES */}
        {activeTab === "billing" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Generate Invoices</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Issue itemized invoices for accepted repair logs.</p>
            </div>

            {activeComplaint ? (
              <form onSubmit={handleCreateInvoice} className="p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6 max-w-2xl mx-auto shadow-md">
                <div className="border-b border-[rgba(255,255,255,0.06)] pb-4 mb-4">
                  <span className="text-[9px] uppercase tracking-wider text-[#9A9A9A] block">Ticket Context</span>
                  <h3 className="text-base font-bold text-white uppercase">{activeComplaint.title}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-bold text-[#9A9A9A]">Line Items Coordinates</span>
                    <button 
                      type="button" 
                      onClick={() => setInvoiceItems(prev => [...prev, { description: "", cost: 0 }])}
                      className="px-3 py-1 border border-[rgba(255,255,255,0.08)] rounded-[12px] text-[10px] font-bold flex items-center gap-1 hover:bg-white/5"
                    >
                      <Plus size={10} /> Add Item
                    </button>
                  </div>

                  {invoiceItems.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <input 
                        type="text" 
                        required
                        value={item.description} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setInvoiceItems(prev => prev.map((it, i) => i === index ? { ...it, description: val } : it));
                        }}
                        placeholder="Description, e.g. Rear disc brake rotor" 
                        className="flex-1 bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD400]"
                      />
                      <input 
                        type="number" 
                        required
                        value={item.cost || ""} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setInvoiceItems(prev => prev.map((it, i) => i === index ? { ...it, cost: val } : it));
                        }}
                        placeholder="Cost" 
                        className="w-24 bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD400]"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Discount Apply ($)</label>
                  <input type="number" value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="e.g. 50" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                </div>

                <button 
                  type="submit" 
                  disabled={invoiceLoading}
                  className="w-full py-3.5 bg-[#FFD400] hover:bg-[#FFC300] text-black rounded-[12px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  {invoiceLoading ? "Compiling invoice..." : "Authorize & Dispatch Billing"} <CheckCircle2 size={14} />
                </button>
              </form>
            ) : (
              <p className="text-[#9A9A9A] text-xs text-center">Select active jobs in Queue tab to generate billings.</p>
            )}
          </div>
        )}

        {/* TAB: MECHANICS */}
        {activeTab === "mechanics" && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Mechanics Team</h2>
                <p className="text-xs text-[#9A9A9A] mt-1">Manage active mechanic queues and duty statuses.</p>
              </div>
              <button 
                onClick={() => setShowAddMech(!showAddMech)}
                className="px-4 py-2.5 rounded-[12px] bg-[#FFD400] hover:bg-[#FFC300] text-black text-xs font-bold flex items-center gap-2 hover:scale-[1.02] transition-all"
              >
                <Plus size={14} /> Add Mechanic
              </button>
            </div>

            {showAddMech && (
              <form onSubmit={handleAddMechanic} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-4 max-w-lg shadow-md text-xs font-semibold">
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">Create Mechanic Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Name</label>
                    <input type="text" value={mechName} onChange={(e) => setMechName(e.target.value)} required placeholder="e.g. Diana Prince" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white font-normal" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Specialty</label>
                    <input type="text" value={mechSpecialty} onChange={(e) => setMechSpecialty(e.target.value)} required placeholder="e.g. Brakes & Calipers" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white font-normal" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Phone</label>
                    <input type="text" value={mechPhone} onChange={(e) => setMechPhone(e.target.value)} required placeholder="+1444111222" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white font-normal" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs font-semibold">
                  <button type="button" onClick={() => setShowAddMech(false)} className="px-4 py-2 border border-[rgba(255,255,255,0.06)] rounded-[12px] hover:bg-white/5">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#FFD400] hover:bg-[#FFC300] text-black rounded-[12px] font-bold">Register Mechanic</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mechanics.map(m => (
                <div key={m._id} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] hover:border-[#FFD400] transition-all text-left relative group shadow-md">
                  <div className="absolute top-4 right-4 text-[#9A9A9A] hover:text-[#FF5959] cursor-pointer" onClick={() => handleDeleteMechanic(m._id)}>
                    <Trash2 size={14} />
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-[#7CFF7A] uppercase font-bold">{m.status}</span>
                  <h4 className="text-base font-bold mt-3 uppercase tracking-wide text-white">{m.name}</h4>
                  <p className="text-xs text-[#9A9A9A] mt-1">Specialty: {m.specialty}</p>
                  <p className="text-xs text-[#9A9A9A] mt-1">Phone: {m.phone}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Customer Reviews</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Monitor overall driver feedback score averages.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {reviews.map(r => (
                <div key={r._id} className="p-6 rounded-[18px] bg-[#151515] border border-[rgba(255,255,255,0.06)] text-xs shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#FFD400] font-bold">⭐ {r.rating} / 5.0 Rating</span>
                    <span className="text-[#9A9A9A] text-[10px]">{new Date(r.created_at || new Date()).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: REAL-TIME CHAT */}
        {activeTab === "chat" && activeChatOwner && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Chat Window: {activeChatOwner.name}</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Direct live websocket channel with the vehicle owner.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
              
              {/* Messages */}
              <div className="lg:col-span-8 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] overflow-hidden flex flex-col h-full shadow-md">
                <div className="p-4 bg-[#111111] border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between text-xs text-[#9A9A9A]">
                  <span>WebSocket Connection: {isConnected ? "Active" : "Offline"}</span>
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

                {/* Form Input */}
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

              {/* AI Auto suggestions replies */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] text-xs text-left shadow-md">
                  <h3 className="font-bold text-[#FFD400] flex items-center gap-2 mb-3 border-b border-[rgba(255,255,255,0.06)] pb-2 uppercase">
                    <Sparkles size={14} /> AI Smart Replies
                  </h3>
                  
                  {smartReplies.length > 0 ? (
                    <div className="space-y-2">
                      {smartReplies.map((reply, i) => (
                        <button 
                          key={i}
                          onClick={() => handleSendChatMessage(reply)}
                          className="w-full p-3 bg-[#111111] hover:bg-[#111111]/80 border border-[rgba(255,255,255,0.04)] hover:border-[#FFD400] text-[11px] text-left text-white rounded-[12px] transition-all font-semibold"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#9A9A9A] text-[10px]">No suggestion cues loaded. AI analyzes incoming messages context.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
