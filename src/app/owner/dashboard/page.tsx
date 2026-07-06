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
  ArrowRight,
  AlertTriangle,
  MapPin,
  Briefcase
} from "lucide-react";
import api from "@/services/api";
import { useChat } from "@/hooks/useChat";

export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("garage"); // garage, complaints, history, diagnostics, invoices, workshops, profile
  
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
  const [carYear, setCarYear] = useState(2025);
  const [carPlate, setCarPlate] = useState("");
  const [carMileage, setCarMileage] = useState(15000);
  const [carFuel, setCarFuel] = useState("Electric");

  // Complaint wizard Form States
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintCategory, setComplaintCategory] = useState("Engine");
  const [complaintPriority, setComplaintPriority] = useState("Normal");
  const [complaintLocation, setComplaintLocation] = useState("Pune, Maharashtra");
  const [complaintImages, setComplaintImages] = useState<string[]>([]);
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
      setVehicles([
        { _id: "v1", make: "Tesla", model: "Model S Plaid", year: 2025, license_plate: "MH-12-FX-9999", mileage: 12500, fuel_type: "Electric" }
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
      setComplaints([
        {
          _id: "c1",
          title: "EV Drivetrain High-Frequency Whine",
          description: "Acceleration past 80km/h triggers rear unit noise.",
          status: "In Progress",
          priority: "High",
          category: "Engine",
          location: "Pune, Maharashtra",
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
        { _id: "w1", name: "NEON HYPERGARAGE", address: "77 Cyberpunk Blvd", phone: "+91144444444", rating: 4.9, owner_id: "mock_workshop_owner_id" },
        { _id: "w2", name: "APEX EV LABS", address: "102 Industrial Sector", phone: "+91234567890", rating: 4.8, owner_id: "mock_workshop_2" }
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
      setCarMake("");
      setCarModel("");
      setCarPlate("");
    } catch {
      const mockCar = { _id: Math.random().toString(), make: carMake, model: carModel, year: carYear, license_plate: carPlate, mileage: carMileage, fuel_type: carFuel };
      setVehicles(prev => [...prev, mockCar]);
      setShowAddCar(false);
    }
  };

  // Run instant AI helper preview as user types description
  useEffect(() => {
    if (complaintDesc.length > 10) {
      const runAiPreview = () => {
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
        category: complaintCategory,
        location: complaintLocation,
        images: complaintImages,
        priority: complaintPriority,
        workshop_id: selectedWorkshop || undefined,
        voice_url: voiceUrl || undefined,
        image_url: imageUrl || undefined
      });
      
      setComplaints(prev => [response.data, ...prev]);
      setActiveComplaint(response.data);
      alert("AI Analysis complete! Complaint submitted successfully.");
      setActiveTab("complaints");
    } catch {
      const mock = {
        _id: "c_" + Math.random().toString(),
        vehicle_id: selectedVehicle,
        title: complaintTitle,
        description: complaintDesc,
        category: complaintCategory,
        location: complaintLocation,
        status: "Pending",
        priority: complaintPriority,
        ai_diagnostics: aiPreview || { category: "General", severity: "Medium" },
        created_at: new Date().toISOString()
      };
      setComplaints(prev => [mock, ...prev]);
      setActiveComplaint(mock);
      setActiveTab("complaints");
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
    try {
      const response = await api.get(`/api/chat/history/${workshop.owner_id || workshop._id}`);
      setChatMessages(response.data);
    } catch {
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
                alt="FIXORA Logo" 
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
            {[
              { id: "garage", label: "My Vehicles", icon: <Car size={14} /> },
              { id: "complaints", label: "Vehicle Complaints", icon: <AlertTriangle size={14} /> },
              { id: "history", label: "Repair History", icon: <Activity size={14} /> },
              { id: "diagnostics", label: "AI Diagnosis", icon: <Sparkles size={14} className="text-[#FFD400]" /> },
              { id: "invoices", label: "Invoices", icon: <CreditCard size={14} /> },
              { id: "workshops", label: "Nearby Workshops", icon: <Briefcase size={14} /> },
              { id: "profile", label: "Profile", icon: <User size={14} /> }
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
        
        {/* TAB: MY VEHICLES */}
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

            {/* Add Car Form */}
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
                    <input type="text" value={carPlate} onChange={(e) => setCarPlate(e.target.value)} required placeholder="MH-12-FX-9999" className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white" />
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
                  <div className="grid grid-cols-2 gap-4 mt-6 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-[#9A9A9A] block uppercase tracking-wider">License</span>
                      <span className="font-semibold text-white">{v.license_plate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9A9A9A] block uppercase tracking-wider">Mileage</span>
                      <span className="font-semibold text-white">{v.mileage?.toLocaleString()} KM</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9A9A9A] block uppercase tracking-wider">Assembly Year</span>
                      <span className="font-semibold text-white">{v.year}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9A9A9A] block uppercase tracking-wider">Status</span>
                      <span className="text-[#7CFF7A] font-bold">ACTIVE DEPLOYED</span>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => {
                        setSelectedVehicle(v._id);
                        setActiveTab("complaints");
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-transparent hover:bg-[#FFD400] hover:text-black hover:border-transparent rounded-[12px] border border-[rgba(255,255,255,0.08)] transition-all flex items-center gap-2"
                    >
                      File Complaint <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: VEHICLE COMPLAINTS */}
        {activeTab === "complaints" && (
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Create & File Complaints</h1>
              <p className="text-xs text-[#9A9A9A] mt-1">Submit mechanical diagnostic logs to the workshop network.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <form onSubmit={handleSubmitComplaint} className="lg:col-span-8 p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6 shadow-md text-xs font-semibold">
                
                {/* Vehicle Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block font-bold">Select Vehicle</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block font-bold">Category</label>
                    <select 
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                    >
                      <option value="Engine">Engine & Drivetrain</option>
                      <option value="Brakes">Brakes & Suspension</option>
                      <option value="Electrical">Electrical & Batteries</option>
                      <option value="Body">Bodywork & Trim</option>
                    </select>
                  </div>

                  {/* Location Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block font-bold">Current Location</label>
                    <input 
                      type="text"
                      value={complaintLocation}
                      onChange={(e) => setComplaintLocation(e.target.value)}
                      required
                      className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                    />
                  </div>
                </div>

                {/* Complaint Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block font-bold">Complaint Title</label>
                  <input 
                    type="text" 
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    required
                    placeholder="e.g. EV battery temperature warning triggers" 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block font-bold">Issue Description</label>
                  <textarea 
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    required
                    rows={4}
                    placeholder="Provide a brief description of the issue." 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white leading-relaxed"
                  />
                </div>

                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block font-bold">Priority Status</label>
                  <select 
                    value={complaintPriority}
                    onChange={(e) => setComplaintPriority(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>

                {/* Selected Workshop */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block font-bold">Target Workshop Dispatch (Optional)</label>
                  <select 
                    value={selectedWorkshop}
                    onChange={(e) => setSelectedWorkshop(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                  >
                    <option value="">Broadcast to All Workshops</option>
                    {workshops.map(w => (
                      <option key={w._id} value={w._id}>{w.name} (Rating {w.rating})</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={submittingComplaint}
                  className="w-full py-4 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition-all shadow-md"
                >
                  {submittingComplaint ? "Running Neural Diagnosis..." : "Transmit Ticket Coordinates"} <ArrowRight size={14} />
                </button>
              </form>

              {/* AI Forecast panel */}
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
                      Provide a description coordinates. AI diagnostic parser will predict the system failure category.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REPAIR HISTORY & TRACKER */}
        {activeTab === "history" && (
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Active Repair Progression</h1>
              <p className="text-xs text-[#9A9A9A] mt-1">Track mechanical repair states in real-time.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Complaints List */}
              <div className="lg:col-span-4 space-y-4">
                {complaints.length === 0 ? (
                  <p className="text-[#9A9A9A] text-xs">No active repair orders found.</p>
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

              {/* Status details */}
              <div className="lg:col-span-8">
                {activeComplaint ? (
                  <div className="p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6 shadow-md">
                    <div className="flex justify-between items-start border-b border-[rgba(255,255,255,0.06)] pb-4">
                      <div>
                        <h2 className="text-lg font-bold uppercase">{activeComplaint.title}</h2>
                        <p className="text-xs text-[#9A9A9A] mt-1 leading-relaxed">{activeComplaint.description}</p>
                      </div>
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
                      <h3 className="text-[10px] uppercase tracking-wider text-[#9A9A9A] font-bold">Repair Status Tracker</h3>
                      
                      <div className="grid grid-cols-5 gap-2 relative z-10">
                        <div className="absolute top-4 inset-x-8 h-0.5 bg-[#111111] -z-10" />
                        
                        {[
                          { step: "Pending", label: "Pending" },
                          { step: "Accepted", label: "Accepted" },
                          { step: "In Progress", label: "In Progress" },
                          { step: "Completed", label: "Completed" },
                          { step: "Cancelled", label: "Cancelled" }
                        ].map((node, index) => {
                          const statuses = ["Pending", "Accepted", "In Progress", "Completed", "Cancelled"];
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
                  </div>
                ) : (
                  <p className="text-[#9A9A9A] text-xs">Select repair order logs to view tracker.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: AI DIAGNOSIS */}
        {activeTab === "diagnostics" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">AI Diagnostics Center <Sparkles className="text-[#FFD400] animate-pulse" /></h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Review the historical neural predictions computed by the AI scanner core.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complaints.map((c) => (
                <div key={c._id} className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] space-y-4 shadow-md">
                  <h3 className="font-bold text-sm uppercase text-[#FFD400] flex items-center gap-1.5"><Sparkles size={14} /> Telemetry Analysis</h3>
                  <div className="text-xs space-y-2 font-mono">
                    <div><span className="text-[9px] text-[#9A9A9A] block uppercase">Vehicle Ref</span><span className="text-white font-bold">{c.vehicle_id?.make || "EV"} {c.vehicle_id?.model}</span></div>
                    <div><span className="text-[9px] text-[#9A9A9A] block uppercase">Telemetry Status</span><span className="text-white">{c.title}</span></div>
                    <div><span className="text-[9px] text-[#9A9A9A] block uppercase font-bold text-[#FF5959]">Severity Level</span><span className="text-[#FF5959] font-bold">{c.ai_diagnostics?.severity || "MEDIUM"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: INVOICES */}
        {activeTab === "invoices" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Settlements & Invoices</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Pay outstanding repair invoices using Fixora Checkout.</p>
            </div>

            {invoice ? (
              <div className="p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] max-w-xl mx-auto shadow-md space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-xs uppercase font-bold text-[#9A9A9A]">Invoice Details</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    invoice.status === "Paid" ? "bg-emerald-500/10 text-[#7CFF7A]" : "bg-red-500/10 text-[#FF5959]"
                  }`}>{invoice.status}</span>
                </div>
                
                <div className="space-y-2 text-xs font-mono">
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
            ) : (
              <p className="text-[#9A9A9A] text-xs text-center">No outstanding unpaid invoices found.</p>
            )}
          </div>
        )}

        {/* TAB: NEARBY WORKSHOPS */}
        {activeTab === "workshops" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Nearby Partner Garages</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Verified partner locations in the network grid.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workshops.map((w) => (
                <div key={w._id} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] hover:border-[#FFD400] transition-all flex flex-col justify-between shadow-md">
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">{w.name}</h3>
                    <p className="text-xs text-[#9A9A9A] mt-2">{w.address}</p>
                    <div className="text-xs text-[#FFD400] font-bold mt-4">⭐ {w.rating} / 5.0 Rating</div>
                  </div>
                  <button 
                    onClick={() => handleSelectWorkshopChat(w)}
                    className="mt-6 py-3 border border-white/5 hover:border-[#FFD400] hover:bg-[#FFD400] hover:text-black transition-all rounded-[12px] text-xs font-bold uppercase"
                  >
                    Discuss Issue
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6 text-left max-w-lg mx-auto">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">My Profile</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Manage private credentials and settings.</p>
            </div>

            <div className="p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-6 shadow-md text-xs font-semibold">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-16 h-16 rounded-full border border-[#FFD400] flex items-center justify-center bg-[#111111] relative text-xl font-black text-[#FFD400]">
                  O
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase">{user?.name}</h3>
                  <p className="text-[#9A9A9A] text-xs font-normal mt-0.5">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REAL-TIME CHAT */}
        {activeTab === "chat" && activeChatWorkshop && (
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Channel: {activeChatWorkshop.name}</h1>
              <p className="text-xs text-[#9A9A9A] mt-1">Discuss repairs in real-time. Typing indicator enabled.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[480px]">
              <div className="lg:col-span-8 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] overflow-hidden flex flex-col h-full shadow-md">
                <div className="p-4 bg-[#111111] border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[10px] text-[#9A9A9A] font-bold">
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
                  <button type="submit" aria-label="Send message" className="p-3 bg-[#FFD400] text-black hover:bg-[#FFC300] rounded-[12px] transition-colors">
                    <Send size={14} />
                  </button>
                </form>
              </div>

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
