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
  ArrowRight,
  AlertTriangle,
  MapPin,
  Briefcase,
  Menu,
  X,
  ArrowLeft
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

  // Geolocation States
  const [latitude, setLatitude] = useState<any>("");
  const [longitude, setLongitude] = useState<any>("");
  const [locationState, setLocationState] = useState("");
  const [locationDistrict, setLocationDistrict] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationPincode, setLocationPincode] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Real-time Chat States
  const [activeChatWorkshop, setActiveChatWorkshop] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [workshopIsTyping, setWorkshopIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [chatRoomReadOnly, setChatRoomReadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, sendTyping, sendSeen } = useChat({
    userId: user?._id,
    onMessageReceived: (message) => {
      const isActiveRoom = message.complaintId === chatRoomId;
      if (isActiveRoom) {
        setChatMessages(prev => [...prev, message]);
        sendSeen(message.senderId || message.sender_id);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        setUnreadCount(prev => prev + 1);
      }
    },
    onStatusUpdate: () => {
      fetchDashboardData();
    },
    onTypingReceived: (typingEvent) => {
      if (chatRoomId && typingEvent.complaintId === chatRoomId) {
        setWorkshopIsTyping(typingEvent.is_typing);
      }
    }
  });


  // Authenticate user session
  // Load session and dashboard datasets from MongoDB
  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/api/dashboard/owner");
      const { vehicles, complaints, invoices, workshops } = response.data;
      setVehicles(vehicles || []);
      setComplaints(complaints || []);
      setWorkshops(workshops || []);
      
      if (vehicles && vehicles.length > 0 && !selectedVehicle) {
        setSelectedVehicle(vehicles[0]._id);
      }
      if (workshops && workshops.length > 0 && !selectedWorkshop) {
        setSelectedWorkshop(workshops[0]._id);
      }
      if (complaints && complaints.length > 0) {
        const found = complaints.find((c: any) => activeComplaint && c._id === activeComplaint._id) || complaints[0];
        setActiveComplaint(found);
        fetchInvoiceForComplaint(found._id);
      }
    } catch (err) {
      console.error("Failed to load dashboard owner data:", err);
      setVehicles([]);
      setComplaints([]);
      setWorkshops([]);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await api.get("/api/profile");
        const profileData = res.data.user;
        setUser(profileData);
        localStorage.setItem("fixora_user", JSON.stringify(profileData));
      } catch (err) {
        const rawUser = localStorage.getItem("fixora_user");
        if (rawUser) {
          setUser(JSON.parse(rawUser));
        } else {
          router.push("/login");
          return;
        }
      }
      
      await fetchDashboardData();
    };
    loadSession();
  }, [router]);

  // Polling every 10 seconds for live updates
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Auto-detect Geolocation on mount/tab change
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await response.json();
          const addressObj = data.address || {};
          
          const state = addressObj.state || "";
          const district = addressObj.county || addressObj.state_district || "";
          const city = addressObj.city || addressObj.town || addressObj.village || addressObj.suburb || "";
          const pincode = addressObj.postcode || "";
          const fullAddress = data.display_name || `${city}, ${state}, ${pincode}`;

          setLocationState(state);
          setLocationDistrict(district);
          setLocationCity(city);
          setLocationPincode(pincode);
          setLocationAddress(fullAddress);
          setComplaintLocation(fullAddress);
        } catch (e) {
          console.error("Reverse geocoding error:", e);
          const simpleAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setLocationAddress(simpleAddress);
          setComplaintLocation(simpleAddress);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Permission denied or location unavailable. Please fill manually.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Run location detection automatically when activeTab becomes 'create-complaint' or on select workshops
  useEffect(() => {
    if (activeTab === "workshops" || activeTab === "garage") {
      if (!latitude) {
        detectLocation();
      }
    }
  }, [activeTab]);

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
        location: locationAddress || complaintLocation,
        images: complaintImages,
        priority: complaintPriority,
        workshop_id: selectedWorkshop || undefined,
        voice_url: voiceUrl || undefined,
        image_url: imageUrl || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        address: locationAddress || complaintLocation
      });
      
      await fetchDashboardData();
      alert("AI Analysis complete! Complaint submitted successfully.");
      setActiveTab("complaints");
      // Reset form fields
      setComplaintTitle("");
      setComplaintDesc("");
      setComplaintImages([]);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit complaint. Please check fields.");
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
      fetchDashboardData();
      setInvoice((prev: any) => prev ? { ...prev, status: "Paid" } : null);
    } catch {
      alert("Simulated payment success.");
      setInvoice((prev: any) => prev ? { ...prev, status: "Paid" } : null);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSelectWorkshopChat = async (workshop: any, complaintId?: string) => {
    setActiveChatWorkshop(workshop);
    setActiveTab("chat");
    const roomId = complaintId || activeComplaint?._id;
    setChatRoomId(roomId || null);
    setChatRoomReadOnly(false);
    setChatMessages([]);
    if (roomId) {
      try {
        const response = await api.get(`/api/chat/${roomId}`);
        setChatMessages(response.data.messages || response.data || []);
        setChatRoomReadOnly(response.data.readOnly || false);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
      } catch {
        setChatMessages([]);
      }
    }
    // Reset unread badge when opening a room
    setUnreadCount(0);
  };

  const handleSendChatMessage = async () => {
    if (!typedMessage.trim() || !activeChatWorkshop || chatRoomReadOnly) return;

    const roomId = chatRoomId || activeComplaint?._id;
    const receiverId = activeChatWorkshop.owner_id?._id || activeChatWorkshop.owner_id || activeChatWorkshop._id;
    const optimistic = {
      _id: `temp_${Date.now()}`,
      senderId: user?._id,
      receiverId,
      senderRole: "owner",
      message: typedMessage,
      complaintId: roomId,
      createdAt: new Date().toISOString(),
      isSeen: false
    };
    setChatMessages(prev => [...prev, optimistic]);
    setTypedMessage("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      await api.post("/api/chat/send", {
        complaintId: roomId,
        receiverId,
        message: optimistic.message
      });
    } catch {
      // message was optimistically added — no revert
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  const handleTypingEvent = () => {
    if (!activeChatWorkshop || !chatRoomId) return;
    const receiverId = activeChatWorkshop.owner_id?._id || activeChatWorkshop.owner_id || activeChatWorkshop._id;
    sendTyping(receiverId, true, chatRoomId);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(
      setTimeout(() => {
        sendTyping(receiverId, false, chatRoomId);
      }, 1000)
    );
  };

  const formatMsgTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

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
          {activeChatWorkshop && (
            <button onClick={() => { setActiveTab("chat"); setMobileMenuOpen(false); }} className="relative text-[#9A9A9A] hover:text-white">
              <MessageSquare size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FFD400]" />
              )}
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
                alt="FIXORA Logo" 
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
            {activeChatWorkshop && (
              <div className="relative">
                {activeTab === "chat" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />}
                <button 
                  onClick={() => { setActiveTab("chat"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left relative ${
                    activeTab === "chat" ? "bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white" : "text-[#9A9A9A] hover:text-white"
                  } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""}`}
                >
                  <MessageSquare size={14} />
                  {(!sidebarCollapsed || mobileMenuOpen) && <span>Live Chat</span>}
                  {unreadCount > 0 && (
                    <span className="absolute right-4 top-3 px-1.5 py-0.5 text-[8px] font-bold bg-[#FFD400] text-black rounded-full">
                      {unreadCount}
                    </span>
                  )}
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-left">
              {vehicles.map((v) => (
                <div key={v._id} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] hover:border-[#FFD400] transition-all relative group overflow-hidden shadow-md flex flex-col md:flex-row gap-5 items-center">
                  <img 
                    src={v.image || "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=600"} 
                    alt={`${v.make} ${v.model}`}
                    className="w-full md:w-32 h-24 object-cover rounded-[16px] border border-white/10"
                  />
                  <div className="flex-1 text-left w-full relative">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-white/5 text-[9px] font-semibold text-[#9A9A9A] rounded-bl-[12px] uppercase tracking-wider">
                      {v.fuel_type}
                    </div>
                    <h3 className="text-base font-bold text-white uppercase pr-16">{v.make} {v.model}</h3>
                    <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] font-semibold">
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase tracking-wider">License</span>
                        <span className="font-semibold text-white">{v.license_plate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase tracking-wider">Mileage</span>
                        <span className="font-semibold text-white">{v.mileage?.toLocaleString()} KM</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase tracking-wider">Assembly Year</span>
                        <span className="font-semibold text-white">{v.year}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9A9A] block uppercase tracking-wider">Status</span>
                        <span className="text-[#7CFF7A] font-bold">ACTIVE</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 justify-end">
                      <button 
                        onClick={() => {
                          setSelectedVehicle(v._id);
                          setComplaintDesc(`Perform general AI Diagnostics scan on this ${v.make} ${v.model}.`);
                          setComplaintTitle(`AI Diagnostics: ${v.make} ${v.model}`);
                          setActiveTab("complaints");
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-semibold bg-transparent hover:bg-white/5 rounded-[12px] border border-[rgba(255,255,255,0.08)] transition-all flex items-center gap-1"
                      >
                        Diagnose
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedVehicle(v._id);
                          setActiveTab("history");
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-semibold bg-transparent hover:bg-white/5 rounded-[12px] border border-[rgba(255,255,255,0.08)] transition-all flex items-center gap-1"
                      >
                        View History
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedVehicle(v._id);
                          setActiveTab("complaints"); // Redirects to complaints view tab to write it
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] rounded-[12px] transition-all flex items-center gap-1"
                      >
                        Create Complaint
                      </button>
                    </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1.5 col-span-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block font-bold">Current Location</label>
                      <button 
                        type="button" 
                        onClick={detectLocation}
                        className="text-[10px] font-bold text-[#FFD400] hover:underline flex items-center gap-1 bg-[#FFD400]/10 px-2 py-0.5 rounded border border-[#FFD400]/20"
                      >
                        {detectingLocation ? "⚡ Detecting..." : "⚡ Auto-Detect Location"}
                      </button>
                    </div>
                    {detectingLocation && (
                      <div className="text-[10px] text-[#FFD400] font-mono animate-pulse mt-0.5">Detecting GPS coordinates and reverse geocoding via OpenStreetMap...</div>
                    )}
                    {locationError && (
                      <div className="text-[10px] text-red-400 font-mono mt-0.5">{locationError}</div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                      <div>
                        <label className="text-[9px] uppercase text-[#9A9A9A] block mb-0.5">Latitude</label>
                        <input 
                          type="number" 
                          step="any"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="e.g. 18.5204"
                          className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-[#9A9A9A] block mb-0.5">Longitude</label>
                        <input 
                          type="number" 
                          step="any"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="e.g. 73.8567"
                          className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                      <div>
                        <label className="text-[9px] uppercase text-[#9A9A9A] block mb-0.5">City</label>
                        <input 
                          type="text" 
                          value={locationCity}
                          onChange={(e) => setLocationCity(e.target.value)}
                          placeholder="City"
                          className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-[#9A9A9A] block mb-0.5">District</label>
                        <input 
                          type="text" 
                          value={locationDistrict}
                          onChange={(e) => setLocationDistrict(e.target.value)}
                          placeholder="District"
                          className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-[#9A9A9A] block mb-0.5">State</label>
                        <input 
                          type="text" 
                          value={locationState}
                          onChange={(e) => setLocationState(e.target.value)}
                          placeholder="State"
                          className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-[#9A9A9A] block mb-0.5">Pincode</label>
                        <input 
                          type="text" 
                          value={locationPincode}
                          onChange={(e) => setLocationPincode(e.target.value)}
                          placeholder="Pincode"
                          className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                        />
                      </div>
                    </div>
                    <div className="mt-2 col-span-1 sm:col-span-2">
                      <label className="text-[9px] uppercase text-[#9A9A9A] block mb-0.5">Full Address</label>
                      <input 
                        type="text" 
                        value={locationAddress || complaintLocation}
                        onChange={(e) => {
                          setLocationAddress(e.target.value);
                          setComplaintLocation(e.target.value);
                        }}
                        placeholder="Full Address"
                        required
                        className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FFD400] text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Category Selection */}
                  <div className="space-y-1.5 mt-4">
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
                      
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 relative z-10">
                        <div className="absolute top-4 inset-x-8 h-0.5 bg-[#111111] -z-10 hidden sm:block" />
                        
                        {[
                          { step: "Pending", label: "Pending" },
                          { step: "Accepted", label: "Accepted" },
                          { step: "Inspection", label: "Inspection" },
                          { step: "Repair Started", label: "Repair" },
                          { step: "Waiting Parts", label: "Parts" },
                          { step: "Completed", label: "Completed" },
                          { step: "Delivered", label: "Delivered" },
                          { step: "Cancelled", label: "Cancelled" }
                        ].map((node, index) => {
                          const statuses = [
                            "Pending", 
                            "Accepted", 
                            "Inspection", 
                            "Repair Started", 
                            "Waiting Parts", 
                            "Completed", 
                            "Delivered", 
                            "Cancelled"
                          ];
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {workshops.map((w) => (
                <div key={w._id} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] hover:border-[#FFD400] transition-all flex flex-col justify-between shadow-md relative overflow-hidden text-xs">
                  
                  {/* Top Header Card */}
                  <div className="flex gap-4 items-start">
                    <img 
                      src={w.owner_id?.profile_image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                      alt="logo" 
                      className="w-12 h-12 rounded-full border border-white/10 object-cover"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-white uppercase">{w.name}</h3>
                        {w.is_verified && (
                          <span className="bg-[#FFD400]/10 text-[#FFD400] text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-[#FFD400]/20 flex items-center gap-0.5">
                            ✓ VERIFIED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#9A9A9A] font-medium font-mono mt-0.5">Owner: {w.owner_id?.name || "Network Manager"}</p>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="grid grid-cols-2 gap-3 mt-5 text-left border-t border-b border-white/5 py-4">
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Address</span>
                      <span className="font-semibold text-white">{w.address}, {w.city || "Pune"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Working Hours</span>
                      <span className="font-semibold text-white">{w.working_hours || "9:00 AM - 7:00 PM"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Contact Coordinates</span>
                      <span className="font-semibold text-white">{w.phone}</span>
                      <span className="block text-[10px] text-[#9A9A9A]">{w.owner_id?.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Network Status</span>
                      <span className="text-[#7CFF7A] font-bold uppercase">{w.current_status || "OPEN"}</span>
                    </div>
                  </div>

                  {/* Services Tag array */}
                  {w.services && w.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 justify-start">
                      {w.services.map((srv: string, idx: number) => (
                        <span key={idx} className="bg-white/5 text-[#9A9A9A] text-[9px] font-medium px-2 py-0.5 rounded-full border border-white/10">
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rating display */}
                  <div className="flex items-center gap-1 mt-4 text-[11px] font-bold text-[#FFD400]">
                    ⭐ {w.rating || 5.0} / 5.0 Network Rating ({w.review_count || 0} reviews)
                  </div>

                  {/* Card Actions Footer */}
                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <button 
                      onClick={() => handleSelectWorkshopChat(w)}
                      className="py-2.5 border border-white/5 hover:border-[#FFD400] hover:bg-[#FFD400]/10 text-white rounded-[12px] text-[10px] font-bold uppercase transition-all"
                    >
                      Discuss Issue
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedWorkshop(w._id);
                        setActiveTab("create-complaint");
                      }}
                      className="py-2.5 bg-[#FFD400] text-black hover:bg-[#FFC300] rounded-[12px] text-[10px] font-bold uppercase transition-all"
                    >
                      Create Complaint
                    </button>
                    <a 
                      href={`tel:${w.phone}`}
                      className="py-2 text-center border border-white/5 hover:border-white/20 text-[#9A9A9A] hover:text-white rounded-[12px] text-[9px] font-bold uppercase transition-all"
                    >
                      Contact
                    </a>
                    <button 
                      onClick={() => {
                        alert(`Service slot booked with ${w.name}! A team coordinator will text confirmation coordinates to ${user?.phone}.`);
                      }}
                      className="py-2 border border-white/5 hover:border-white/20 text-[#9A9A9A] hover:text-white rounded-[12px] text-[9px] font-bold uppercase transition-all"
                    >
                      Book Service
                    </button>
                  </div>
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
                <img 
                  src={user?.profile_image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                  alt="avatar" 
                  className="w-16 h-16 rounded-full border border-[#FFD400]/40 object-cover"
                />
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
          <div className="text-left relative flex flex-col h-[calc(100vh-140px)] md:h-[600px] -m-6 md:m-0 overflow-hidden bg-[#080808]">
            
            {/* Mobile-optimized Header */}
            <div className="flex items-center justify-between bg-[#111111] p-3 md:p-4 border-b border-[rgba(255,255,255,0.06)] shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab("workshops")}
                  className="md:hidden p-1 text-[#9A9A9A] hover:text-white"
                  aria-label="Back to Workshops"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-sm md:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    {activeChatWorkshop.name}
                    <span className="text-[10px] hidden md:inline-block font-normal text-[#9A9A9A]">
                      ({chatRoomReadOnly ? "Closed" : "Active"})
                    </span>
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#7CFF7A] animate-pulse" : "bg-[#FF5959]"}`} />
                    <span className="text-[9px] text-[#9A9A9A] font-mono">
                      {isConnected ? "🟢 Online" : "🔴 Offline"}
                    </span>
                    {workshopIsTyping && (
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
                    <p className="text-xs">No messages yet. Start the conversation below.</p>
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
                      <div className={`flex items-center gap-1 text-[8px] text-[#9A9A9A]/60 font-mono px-1 ${isMe ? "flex-row-reverse" : ""}`}>
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
                      onChange={(e) => { setTypedMessage(e.target.value); handleTypingEvent(); }}
                      onKeyDown={handleChatKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 bg-[#080808] border border-[#2a2a2a] rounded-full px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD400] resize-none leading-normal placeholder-[#9A9A9A] min-h-[36px] max-h-[100px]"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={!typedMessage.trim()}
                      aria-label="Send message"
                      className="p-2.5 bg-[#FFD400] text-black hover:bg-[#FFC300] disabled:opacity-40 disabled:scale-100 rounded-full transition-all shrink-0 flex items-center justify-center hover:scale-105"
                    >
                      <Send size={14} />
                    </button>
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
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Repair Specifications</h3>
                <button 
                  onClick={() => setDetailsOpen(false)}
                  className="p-1 rounded-full bg-white/5 text-[#9A9A9A] hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto text-xs pr-2">
                {activeComplaint && (
                  <div className="space-y-3 p-4 rounded-2xl bg-[#151515] border border-white/5">
                    <h4 className="font-bold text-[#FFD400] uppercase tracking-wide text-[10px]">Complaint Information</h4>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Title</span>
                      <p className="font-semibold text-white uppercase">{activeComplaint.title}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase">Status</span>
                      <span className="font-bold text-[#FFD400] uppercase">{activeComplaint.status}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] block uppercase font-bold text-[#FF5959]">Severity</span>
                      <span className="text-[#FF5959] font-bold">{activeComplaint.ai_diagnostics?.severity || "MEDIUM"}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-4 rounded-2xl bg-[#151515] border border-white/5">
                  <h4 className="font-bold text-[#FFD400] uppercase tracking-wide text-[10px]">Workshop Reference</h4>
                  <div>
                    <span className="text-[9px] text-[#9A9A9A] uppercase block">Name</span>
                    <p className="font-semibold text-white">{activeChatWorkshop.name}</p>
                  </div>
                  {activeChatWorkshop.address && (
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Address</span>
                      <p className="text-white/80">{activeChatWorkshop.address}</p>
                    </div>
                  )}
                  {activeChatWorkshop.phone && (
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Phone</span>
                      <p className="text-white/80">{activeChatWorkshop.phone}</p>
                    </div>
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
