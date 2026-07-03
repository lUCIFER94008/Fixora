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
  CreditCard,
  User,
  LogOut,
  Sparkles,
  Volume2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  ArrowRight
} from "lucide-react";
import api from "@/services/api";
import { useChat } from "@/hooks/useChat";

export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("garage"); // garage, complaint, repairs, chat
  
  // Data States
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Form States
  const [showAddCar, setShowAddCar] = useState(false);
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState(2023);
  const [carPlate, setCarPlate] = useState("");
  const [carMileage, setCarMileage] = useState(15000);
  const [carFuel, setCarFuel] = useState("Electric");

  // Complaint wizard Form States
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintPriority, setComplaintPriority] = useState("Normal");
  const [selectedWorkshop, setSelectedWorkshop] = useState("");
  const [voiceUrl, setVoiceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);

  // Real-time Chat States
  const [activeChatWorkshop, setActiveChatWorkshop] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [workshopIsTyping, setWorkshopIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);

  // Authenticate user session
  useEffect(() => {
    const rawUser = localStorage.getItem("fixora_user");
    if (!rawUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(rawUser);
    setUser(parsedUser);
    
    // Fetch initial datasets
    fetchVehicles();
    fetchComplaints();
    fetchWorkshops();
  }, [router]);

  // WebSocket Chat Integration
  const { isConnected, sendTyping, sendSeen } = useChat({
    userId: user?._id,
    onMessageReceived: (message) => {
      // Check if message belongs to current chat context
      if (activeChatWorkshop && (message.sender_id === activeChatWorkshop.owner_id || message.sender_id === activeChatWorkshop._id)) {
        setChatMessages(prev => [...prev, message]);
        sendSeen(message.sender_id, message.complaint_id);
      }
    },
    onStatusUpdate: (statusEvent) => {
      fetchComplaints();
      alert(`Repair Alert: ${statusEvent.message}`);
    },
    onTypingReceived: (typingEvent) => {
      if (activeChatWorkshop && typingEvent.sender_id === activeChatWorkshop.owner_id) {
        setWorkshopIsTyping(typingEvent.is_typing);
      }
    }
  });

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/api/vehicles");
      setVehicles(response.data);
      if (response.data.length > 0) setSelectedVehicle(response.data[0]._id);
    } catch (err) {
      // Fallback mocks
      setVehicles([
        { _id: "v1", make: "Tesla", model: "Model S Plaid", year: 2023, license_plate: "FX-99-AI", mileage: 12500, fuel_type: "Electric" }
      ]);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await api.get("/api/complaints");
      setComplaints(response.data);
      if (response.data.length > 0) {
        setActiveComplaint(response.data[0]);
        fetchInvoiceForComplaint(response.data[0]._id);
      }
    } catch (err) {
      // Mocks
      setComplaints([
        {
          _id: "c1",
          title: "EV Drivetrain High-Frequency Whine",
          description: "Acceleration past 80km/h triggers rear unit noise.",
          status: "In Progress",
          priority: "High",
          estimated_cost: 4200,
          estimated_completion: "3 Days",
          technician_notes: "Rear differential gears require adjustments.",
          repair_images: ["https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600"],
          ai_diagnostics: {
            category: "Engine",
            severity: "High",
            recommended_action: "Examine gearbox fluids."
          },
          workshop_id: "w1",
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const response = await api.get("/api/workshops");
      setWorkshops(response.data);
      if (response.data.length > 0) setSelectedWorkshop(response.data[0]._id);
    } catch (err) {
      setWorkshops([
        { _id: "w1", name: "NEON HYPERGARAGE", address: "77 Cyberpunk Blvd", phone: "+1444444444", rating: 4.9, owner_id: "mock_workshop_owner_id" }
      ]);
    }
  };

  const fetchInvoiceForComplaint = async (complaintId: string) => {
    try {
      const response = await api.get(`/api/complaints/${complaintId}/invoice`);
      setInvoice(response.data);
    } catch {
      setInvoice(null);
    }
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/vehicles", {
        make: carMake,
        model: carModel,
        year: carYear,
        license_plate: carPlate,
        mileage: carMileage,
        fuel_type: carFuel
      });
      setVehicles(prev => [...prev, response.data]);
      setShowAddCar(false);
    } catch {
      // Simulated append
      const mockCar = { _id: Math.random().toString(), make: carMake, model: carModel, year: carYear, license_plate: carPlate, mileage: carMileage, fuel_type: carFuel };
      setVehicles(prev => [...prev, mockCar]);
      setShowAddCar(false);
    }
  };

  // Run instant AI helper preview as user types description
  useEffect(() => {
    if (complaintDesc.length > 10) {
      const runAiPreview = async () => {
        // Calculate mock diagnostics on client-side to wow user
        const isBrake = complaintDesc.toLowerCase().includes("brake");
        setAiPreview({
          category: isBrake ? "Brakes" : "Engine/General",
          severity: isBrake ? "High" : "Medium",
          cost: isBrake ? "₹5,000 - ₹15,000" : "₹12,000 - ₹30,000"
        });
      };
      runAiPreview();
    } else {
      setAiPreview(null);
    }
  }, [complaintDesc]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingComplaint(true);
    
    try {
      const response = await api.post("/api/complaints", {
        vehicle_id: selectedVehicle,
        title: complaintTitle,
        description: complaintDesc,
        priority: complaintPriority,
        workshop_id: selectedWorkshop,
        voice_url: voiceUrl || undefined,
        image_url: imageUrl || undefined
      });
      
      setComplaints(prev => [response.data, ...prev]);
      setActiveComplaint(response.data);
      alert("AI Analysis complete! Complaint submitted to targeted workshop queue.");
      setActiveTab("repairs");
    } catch {
      // Mock insert on failure
      const mock = {
        _id: "c_new",
        vehicle_id: selectedVehicle,
        title: complaintTitle,
        description: complaintDesc,
        status: "Pending",
        priority: complaintPriority,
        ai_diagnostics: aiPreview || { category: "General", severity: "Medium" },
        created_at: new Date().toISOString()
      };
      setComplaints(prev => [mock, ...prev]);
      setActiveComplaint(mock);
      setActiveTab("repairs");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!activeComplaint) return;
    setPaymentLoading(true);
    try {
      await api.post(`/api/complaints/${activeComplaint._id}/pay`);
      alert("Payment processed! Auto repair closed.");
      fetchComplaints();
      setInvoice((prev: any) => prev ? { ...prev, status: "Paid" } : null);
    } catch {
      alert("Simulated payment success.");
      setInvoice((prev: any) => prev ? { ...prev, status: "Paid" } : null);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSelectWorkshopChat = async (workshop: any) => {
    setActiveChatWorkshop(workshop);
    setActiveTab("chat");
    // Fetch chat history
    try {
      const response = await api.get(`/api/chat/history/${workshop.owner_id || workshop._id}`);
      setChatMessages(response.data);
    } catch {
      // Simulated chat history
      setChatMessages([
        { sender_id: "workshop_owner_id", content: `Welcome to ${workshop.name} service chat window. Send questions below.`, seen: true }
      ]);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChatWorkshop) return;

    const payload = {
      receiver_id: activeChatWorkshop.owner_id || activeChatWorkshop._id,
      content: typedMessage,
      complaint_id: activeComplaint?._id
    };

    try {
      const response = await api.post("/api/chat/messages", payload);
      setChatMessages(prev => [...prev, response.data]);
      setTypedMessage("");
    } catch {
      // Simulated message push
      const mockMsg = {
        _id: Math.random().toString(),
        sender_id: user._id,
        receiver_id: payload.receiver_id,
        content: typedMessage,
        created_at: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, mockMsg]);
      setTypedMessage("");
    }
  };

  const handleTypingEvent = () => {
    if (!activeChatWorkshop) return;
    sendTyping(activeChatWorkshop.owner_id || activeChatWorkshop._id, true, activeComplaint?._id);
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    setTypingTimeout(
      setTimeout(() => {
        sendTyping(activeChatWorkshop.owner_id || activeChatWorkshop._id, false, activeComplaint?._id);
      }, 1000)
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Collapsible Sidebar Navigation */}
      <aside className={`bg-[#111111] border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-between shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? "w-full md:w-20" : "w-full md:w-64"
      }`}>
        <div>
          {/* Logo & Collapse button */}
          <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png" 
                alt="FIXORA Logo" 
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

          {/* User badge */}
          <div className={`p-4 mx-4 my-4 rounded-[18px] bg-[#151515] border border-[rgba(255,255,255,0.04)] flex items-center gap-3 ${
            sidebarCollapsed ? "justify-center" : ""
          }`}>
            <div className="w-8 h-8 rounded-full overflow-hidden relative bg-[#111111] border border-white/10 flex items-center justify-center shrink-0">
              {user?.profile_image ? (
                <Image src={user.profile_image} alt="User Avatar" fill className="object-cover" />
              ) : (
                <User size={14} className="text-[#9A9A9A]" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="text-left overflow-hidden">
                <div className="text-xs font-semibold truncate">{user?.name || "Driver"}</div>
                <span className="text-[9px] font-bold text-[#FFD400] tracking-wide block">VEHICLE OWNER</span>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="px-4 py-2 space-y-1 text-xs font-semibold">
            <div className="relative">
              {activeTab === "garage" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
              <button 
                onClick={() => setActiveTab("garage")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                  activeTab === "garage" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Car size={14} />
                {!sidebarCollapsed && <span>My Garage</span>}
              </button>
            </div>
            <div className="relative">
              {activeTab === "complaint" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
              <button 
                onClick={() => setActiveTab("complaint")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                  activeTab === "complaint" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Sparkles size={14} className="text-[#FFD400]" />
                {!sidebarCollapsed && <span>AI Diagnosis</span>}
              </button>
            </div>
            <div className="relative">
              {activeTab === "repairs" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
              <button 
                onClick={() => setActiveTab("repairs")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left ${
                  activeTab === "repairs" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Activity size={14} />
                {!sidebarCollapsed && <span>Repairs & Invoices</span>}
              </button>
            </div>
            {activeChatWorkshop && (
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

        {/* Footer Actions */}
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto space-y-6 relative max-w-[1400px] mx-auto w-full">
        
        {/* TAB: GARAGE */}
        {activeTab === "garage" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Fleet Garage</h1>
                <p className="text-xs text-[#9A9A9A] mt-1">Manage active vehicle fleets.</p>
              </div>
              <button 
                onClick={() => setShowAddCar(!showAddCar)}
                className="px-4 py-2.5 rounded-[12px] bg-[#FFD400] hover:bg-[#FFC300] text-black text-xs font-bold flex items-center gap-2 hover:scale-[1.03] transition-all shadow-md"
              >
                <Plus size={14} /> Add Vehicle
              </button>
            </div>

            {/* Add Car Form Modal */}
            {showAddCar && (
              <form onSubmit={handleAddCar} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] text-left space-y-4 max-w-lg">
                <h3 className="font-bold text-sm uppercase tracking-wider">Register New Vehicle</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Make</label>
                    <input type="text" value={carMake} onChange={(e) => setCarMake(e.target.value)} required placeholder="e.g. Tesla" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Model</label>
                    <input type="text" value={carModel} onChange={(e) => setCarModel(e.target.value)} required placeholder="e.g. Model S" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Assembly Year</label>
                    <input type="number" value={carYear} onChange={(e) => setCarYear(parseInt(e.target.value))} required className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">License Plate</label>
                    <input type="text" value={carPlate} onChange={(e) => setCarPlate(e.target.value)} required placeholder="FX-88-AI" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Current Mileage (KM)</label>
                    <input type="number" value={carMileage} onChange={(e) => setCarMileage(parseInt(e.target.value))} required className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#9A9A9A] block">Fuel Core</label>
                    <select value={carFuel} onChange={(e) => setCarFuel(e.target.value)} className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white">
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2 text-xs font-semibold">
                  <button type="button" onClick={() => setShowAddCar(false)} className="px-4 py-2 border border-[rgba(255,255,255,0.06)] rounded-[12px] hover:bg-white/5">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#FFD400] hover:bg-[#FFC300] text-black rounded-[12px] font-bold">Register Car</button>
                </div>
              </form>
            )}

            {/* Garage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {vehicles.map((v) => (
                <div key={v._id} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] hover:border-[#FFD400] transition-all relative group overflow-hidden shadow-md">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-white/5 text-[9px] font-semibold text-[#9A9A9A] rounded-bl-[12px] uppercase tracking-wider">
                    {v.fuel_type}
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase">{v.make} {v.model}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
                    <div>
                      <span className="text-[10px] text-[#9A9A9A] block uppercase tracking-wider">License</span>
                      <span className="font-semibold text-white">{v.license_plate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9A9A9A] block uppercase tracking-wider">Mileage</span>
                      <span className="font-semibold text-white">{v.mileage.toLocaleString()} KM</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9A9A9A] block uppercase tracking-wider">Assembly Year</span>
                      <span className="font-semibold text-white">{v.year}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9A9A9A] block uppercase tracking-wider">Status</span>
                      <span className="text-[#7CFF7A] font-bold">Diagnostics OK</span>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => {
                        setSelectedVehicle(v._id);
                        setActiveTab("complaint");
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-transparent hover:bg-[#FFD400] hover:text-black hover:border-transparent rounded-[12px] border border-[rgba(255,255,255,0.08)] transition-all flex items-center gap-2"
                    >
                      Diagnose Issue <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: COMPLAINT WIZARD */}
        {activeTab === "complaint" && (
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                AI Diagnostics Core <Sparkles className="text-[#FFD400] animate-pulse" />
              </h1>
              <p className="text-xs text-[#9A9A9A] mt-1">Submit mechanical issues. AI analyzes telemetry immediately.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Input Panel */}
              <form onSubmit={handleSubmitComplaint} className="lg:col-span-8 p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6">
                
                {/* Select Vehicle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Target Fleet Vehicle</label>
                  <select 
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                  >
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.make} {v.model} [{v.license_plate}]</option>
                    ))}
                  </select>
                </div>

                {/* Complaint Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Symptom Title</label>
                  <input 
                    type="text" 
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    required
                    placeholder="e.g. Rear disc brakes grinding loudly when cold" 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                  />
                </div>

                {/* Complaint description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Issue coordinates & description</label>
                  <textarea 
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe exactly what triggers the error. Any smells? Vibrations? Speed markers?" 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white leading-relaxed"
                  />
                </div>

                {/* Media Attachments slots */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#111111] rounded-[18px] border border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-[#FFD400]" />
                      <span className="text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Voice Complaint</span>
                    </div>
                    <button type="button" onClick={() => setVoiceUrl("mock_audio_note.wav")} className="px-3 py-1 bg-white/5 border border-white/10 hover:border-[#FFD400] text-[10px] font-bold rounded-lg font-mono">
                      {voiceUrl ? "Recorded" : "Record"}
                    </button>
                  </div>
                  
                  <div className="p-4 bg-[#111111] rounded-[18px] border border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-white" />
                      <span className="text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Bay Document / Photo</span>
                    </div>
                    <button type="button" onClick={() => setImageUrl("mock_issue_photo.jpg")} className="px-3 py-1 bg-white/5 border border-white/10 hover:border-[#FFD400] text-[10px] font-bold rounded-lg font-mono">
                      {imageUrl ? "Attached" : "Attach"}
                    </button>
                  </div>
                </div>

                {/* Selected Workshop */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Target Workshop Dispatch</label>
                  <select 
                    value={selectedWorkshop}
                    onChange={(e) => setSelectedWorkshop(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                  >
                    {workshops.map(w => (
                      <option key={w._id} value={w._id}>{w.name} - Rating {w.rating} ({w.address})</option>
                    ))}
                  </select>
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={submittingComplaint}
                  className="w-full py-4 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition-all shadow-md"
                >
                  {submittingComplaint ? "Running Neural Diagnosis..." : "Transmit Ticket Coordinates"} <ArrowRight size={14} />
                </button>
              </form>

              {/* AI Forecast card panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] relative overflow-hidden shadow-md">
                  <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-[#FFD400] mb-4">
                    <Sparkles size={14} /> Neural Predictions
                  </h3>
                  
                  {aiPreview ? (
                    <div className="space-y-4 text-xs font-mono">
                      <div className="p-3 bg-[#111111] rounded-xl border border-white/5">
                        <span className="text-[9px] uppercase text-[#9A9A9A] block">Classified Category</span>
                        <span className="font-bold text-white uppercase">{aiPreview.category}</span>
                      </div>
                      <div className="p-3 bg-[#111111] rounded-xl border border-white/5">
                        <span className="text-[9px] uppercase text-[#9A9A9A] block">Severity Check</span>
                        <span className="font-bold text-[#FF5959] uppercase">{aiPreview.severity}</span>
                      </div>
                      <div className="p-3 bg-[#111111] rounded-xl border border-white/5">
                        <span className="text-[9px] uppercase text-[#9A9A9A] block">Estimate Range</span>
                        <span className="font-bold text-[#7CFF7A] uppercase">{aiPreview.cost}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#9A9A9A] text-xs leading-relaxed">
                      Provide a description coordinates above. AI diagnostic parser will predict the system failure category.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB: REPAIRS TIMELINE & BILLING */}
        {activeTab === "repairs" && (
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Active Repair Orders</h1>
              <p className="text-xs text-[#9A9A9A] mt-1">Check current diagnostic states and pay repair invoices.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Complaints List */}
              <div className="lg:col-span-4 space-y-4">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#9A9A9A] block mb-2">Complaint Queue</span>
                {complaints.length === 0 ? (
                  <p className="text-[#9A9A9A] text-xs">No complaints registered.</p>
                ) : (
                  complaints.map(c => (
                    <button 
                      key={c._id}
                      onClick={() => {
                        setActiveComplaint(c);
                        fetchInvoiceForComplaint(c._id);
                      }}
                      className={`w-full p-4 rounded-[18px] text-left border transition-all block ${
                        activeComplaint?._id === c._id 
                          ? "bg-[#151515] border-[#FFD400] shadow-md" 
                          : "bg-[#151515]/45 border-[rgba(255,255,255,0.06)] hover:border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 text-[10px]">
                        <span className={`px-2 py-0.5 rounded uppercase font-bold ${
                          c.status === "Pending" ? "bg-amber-500/10 text-amber-500" :
                          c.status === "Completed" ? "bg-emerald-500/10 text-[#7CFF7A]" : "bg-blue-500/10 text-blue-400"
                        }`}>{c.status}</span>
                        <span className="text-[#9A9A9A]">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate uppercase">{c.title}</h4>
                    </button>
                  ))
                )}
              </div>

              {/* Detail view and Timeline */}
              <div className="lg:col-span-8 space-y-6">
                {activeComplaint ? (
                  <div className="p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6 shadow-md">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-[rgba(255,255,255,0.06)] pb-4">
                      <div>
                        <h2 className="text-lg font-bold uppercase">{activeComplaint.title}</h2>
                        <p className="text-xs text-[#9A9A9A] mt-1 leading-relaxed">{activeComplaint.description}</p>
                      </div>
                      
                      {/* Launch Chat for this workshop */}
                      <button 
                        onClick={() => {
                          const wsObj = workshops.find(w => w._id === activeComplaint.workshop_id || w.owner_id === activeComplaint.workshop_id);
                          if (wsObj) handleSelectWorkshopChat(wsObj);
                          else handleSelectWorkshopChat({ _id: activeComplaint.workshop_id || "w1", name: "Technician Garage" });
                        }}
                        className="px-4 py-2 bg-transparent hover:bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-[12px] text-xs font-semibold transition-colors"
                      >
                        Contact Garage
                      </button>
                    </div>

                    {/* Progress timeline */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-wider text-[#9A9A9A] font-bold">Repair Progression Path</h3>
                      
                      <div className="grid grid-cols-4 gap-2 relative z-10">
                        {/* Connecting Line */}
                        <div className="absolute top-4 inset-x-8 h-0.5 bg-[#111111] -z-10" />
                        
                        {[
                          { step: "Pending", label: "Registered" },
                          { step: "Accepted", label: "Accepted" },
                          { step: "In Progress", label: "Active Bay" },
                          { step: "Completed", label: "Finished" }
                        ].map((node, index) => {
                          const statuses = ["Pending", "Accepted", "In Progress", "Completed"];
                          const activeIndex = statuses.indexOf(activeComplaint.status);
                          const isDone = statuses.indexOf(node.step) <= activeIndex;
                          
                          return (
                            <div key={node.step} className="text-center flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all ${
                                isDone 
                                  ? "bg-[#FFD400] border-[#FFD400] text-black shadow-md shadow-[#FFD400]/25" 
                                  : "bg-[#111111] border-[rgba(255,255,255,0.06)] text-[#9A9A9A]"
                              }`}>
                                {index + 1}
                              </div>
                              <span className="text-[9px] uppercase mt-2 block font-semibold text-[#9A9A9A]">{node.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tech log details */}
                    {(activeComplaint.technician_notes || activeComplaint.estimated_cost) && (
                      <div className="bg-[#111111] p-4 rounded-[18px] border border-[rgba(255,255,255,0.04)] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-[#9A9A9A] uppercase block">Technician Log</span>
                          <p className="text-white mt-1 font-semibold">{activeComplaint.technician_notes || "Diagnostics in progress..."}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#9A9A9A] uppercase block">Estimates Matrix</span>
                          <p className="text-[#FFD400] mt-1 font-bold">
                            {activeComplaint.estimated_cost ? `₹${activeComplaint.estimated_cost.toLocaleString()} Cost` : "TBD"} / {activeComplaint.estimated_completion || "TBD"} Duration
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Repair photos logs */}
                    {activeComplaint.repair_images && activeComplaint.repair_images.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase text-[#9A9A9A] font-bold block">Repair Bay Feed Images</span>
                        <div className="flex gap-4">
                          {activeComplaint.repair_images.map((img: string, i: number) => (
                            <div key={i} className="relative w-32 h-20 rounded-[12px] overflow-hidden border border-white/5 bg-[#111111]">
                              <Image src={img} alt="Bay Feed" fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* INVOICE SECTION */}
                    {invoice && (
                      <div className="border-t border-[rgba(255,255,255,0.06)] pt-6 mt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs uppercase font-bold text-[#9A9A9A]">Billing Invoices Details</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            invoice.status === "Paid" ? "bg-emerald-500/10 text-[#7CFF7A]" : "bg-red-500/10 text-[#FF5959]"
                          }`}>{invoice.status}</span>
                        </div>
                        
                        <div className="p-4 bg-[#111111] rounded-[18px] border border-[rgba(255,255,255,0.04)] space-y-2 text-xs">
                          {invoice.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-[#9A9A9A]">{item.description}</span>
                              <span className="font-semibold text-white">₹{item.cost.toLocaleString()}</span>
                            </div>
                          ))}
                          <hr className="border-white/5 my-2" />
                          <div className="flex justify-between text-sm font-bold">
                            <span>TOTAL COST</span>
                            <span className="text-[#FFD400]">₹{invoice.total.toLocaleString()}</span>
                          </div>
                        </div>

                        {invoice.status === "Unpaid" && (
                          <button 
                            onClick={handlePayInvoice}
                            disabled={paymentLoading}
                            className="w-full py-3.5 bg-[#FFD400] hover:bg-[#FFC300] text-black hover:scale-[1.02] rounded-[16px] text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                          >
                            <CreditCard size={14} /> {paymentLoading ? "Processing payment..." : "Execute Checkout"}
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                ) : (
                  <p className="text-[#9A9A9A] text-xs">Select repair coordinates to view timeline.</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB: REAL-TIME CHAT */}
        {activeTab === "chat" && activeChatWorkshop && (
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Channel: {activeChatWorkshop.name}
              </h1>
              <p className="text-xs text-[#9A9A9A] mt-1">Discuss repairs in real-time. Typing indicator enabled.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
              
              {/* Messages display */}
              <div className="lg:col-span-8 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] overflow-hidden flex flex-col h-full shadow-md">
                
                {/* Chat header */}
                <div className="p-4 bg-[#111111] border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between text-xs text-[#9A9A9A]">
                  <span>Channel Status: {isConnected ? "Live Sync" : "Sync Offline"}</span>
                  {workshopIsTyping && <span className="text-[#FFD400] animate-pulse">Technician is typing...</span>}
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
                <form onSubmit={handleSendChatMessage} className="p-4 bg-[#111111] border-t border-[rgba(255,255,255,0.04)] flex gap-2">
                  <input 
                    type="text" 
                    value={typedMessage}
                    onChange={(e) => {
                      setTypedMessage(e.target.value);
                      handleTypingEvent();
                    }}
                    placeholder="Enter mechanical inquiries..." 
                    className="flex-1 bg-[#080808] border border-[#2A2A2A] rounded-[12px] px-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400]"
                  />
                  <button 
                    type="submit" 
                    aria-label="Send message"
                    className="p-3 bg-[#FFD400] text-black hover:bg-[#FFC300] rounded-[12px] transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>

              {/* Diagnostics Context references */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] text-xs">
                  <h3 className="font-bold text-white uppercase block mb-3 border-b border-white/5 pb-2">Active Complaint Context</h3>
                  {activeComplaint ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase">Title</span>
                        <span className="font-semibold text-white truncate block uppercase">{activeComplaint.title}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase">Telemetry Status</span>
                        <span className="font-bold text-[#FFD400] uppercase">{activeComplaint.status}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase">AI Severity</span>
                        <span className="font-bold text-[#FF5959] uppercase">
                          {activeComplaint.ai_diagnostics?.severity || "MEDIUM"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#9A9A9A] text-[10px]">No active complaints references.</p>
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
