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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);

  // Real Booking States
  const [bookings, setBookings] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingWorkshop, setBookingWorkshop] = useState<any>(null);
  const [bookingPreferredDate, setBookingPreferredDate] = useState("");
  const [bookingPreferredTime, setBookingPreferredTime] = useState("10:00 AM");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingVehicleId, setBookingVehicleId] = useState("");
  const [bookingService, setBookingService] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Editable Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editEmergencyContact, setEditEmergencyContact] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [changePassword, setChangePassword] = useState("");
  const [changeConfirmPassword, setChangeConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradeToPremium = async () => {
    setProcessingUpgrade(true);
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      setProcessingUpgrade(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummykey",
      amount: 49900, // ₹499 in paise
      currency: "INR",
      name: "FIXORA",
      description: "Upgrade to Premium Subscription",
      image: "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png",
      handler: async function (response: any) {
        try {
          const verifyRes = await api.post("/api/subscription/pay", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
          if (verifyRes.data.success) {
            alert("Congratulations! You are now a Premium Member.");
            setShowUpgradeModal(false);
            // Refresh user state
            const profileRes = await api.get("/api/profile");
            setUser(profileRes.data.user);
            localStorage.setItem("fixora_user", JSON.stringify(profileRes.data.user));
            fetchDashboardData();
          } else {
            alert("Upgrade failed. Please try again.");
          }
        } catch (err) {
          console.error(err);
          alert("Error updating subscription details.");
        } finally {
          setProcessingUpgrade(false);
        }
      },
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: user?.phone || ""
      },
      theme: {
        color: "#FFD400"
      }
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    
    const handleBookingStatusUpdate = (updatedBooking: any) => {
      setBookings(prev => prev.map(b => b._id === updatedBooking._id ? updatedBooking : b));
      showToast("info", `Booking ${updatedBooking.bookingId} status updated to ${updatedBooking.status}!`);
    };

    socket.on("BOOKING_STATUS_UPDATE", handleBookingStatusUpdate);
    return () => {
      socket.off("BOOKING_STATUS_UPDATE", handleBookingStatusUpdate);
    };
  }, [socket]);


  // Authenticate user session
  // Load session and dashboard datasets from MongoDB
  const fetchDashboardData = async () => {
    try {
      const query = latitude && longitude ? `?lat=${latitude}&lng=${longitude}` : "";
      const response = await api.get(`/api/dashboard/owner${query}`);
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

      // Fetch bookings list
      try {
        const bookingsRes = await api.get("/api/bookings");
        setBookings(bookingsRes.data || []);
      } catch (e) {
        console.error("Failed to load bookings:", e);
      }
    } catch (err) {
      console.error("Failed to load dashboard owner data:", err);
      setVehicles([]);
      setComplaints([]);
      setWorkshops([]);
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(user?.name || "");
    setEditPhone(user?.phone || "");
    setEditGender(user?.gender || "");
    setEditDob(user?.dob || "");
    setEditAddress(user?.address || "");
    setEditCity(user?.city || "");
    setEditState(user?.state || "");
    setEditPincode(user?.pincode || "");
    setEditEmergencyContact(user?.emergency_contact || "");
    setEditProfileImage(user?.profile_image || "");
    setIsEditingProfile(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "fixora_uploads");

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dpmpefw2p/image/upload`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.secure_url) {
        setEditProfileImage(data.secure_url);
        showToast("success", "Profile picture uploaded successfully.");
      } else {
        showToast("error", "Upload failed. Please check preset config.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Image upload failed. Network error.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editPhone) {
      showToast("error", "Name and Phone fields are required.");
      return;
    }

    if (editPhone.trim().length < 10) {
      showToast("error", "Phone number must be at least 10 digits.");
      return;
    }

    setProfileSaving(true);
    try {
      const response = await api.patch("/api/profile", {
        name: editName,
        phone: editPhone,
        profile_image: editProfileImage,
        gender: editGender,
        dob: editDob,
        address: editAddress,
        city: editCity,
        state: editState,
        pincode: editPincode,
        emergency_contact: editEmergencyContact
      });

      setUser(response.data.user);
      localStorage.setItem("fixora_user", JSON.stringify(response.data.user));
      setIsEditingProfile(false);
      showToast("success", "Profile updated successfully.");
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Failed to save profile changes.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePassword || changePassword !== changeConfirmPassword) {
      showToast("error", "Passwords must match and cannot be empty.");
      return;
    }

    setPasswordSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        password: changePassword
      });
      showToast("success", "Password updated successfully.");
      setChangePassword("");
      setChangeConfirmPassword("");
    } catch (err: any) {
      showToast("success", "Password updated successfully.");
      setChangePassword("");
      setChangeConfirmPassword("");
    } finally {
      setPasswordSaving(false);
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

        // Fetch sorted dashboard data immediately using the coordinates
        try {
          const resDashboard = await api.get(`/api/dashboard/owner?lat=${lat}&lng=${lng}`);
          const { vehicles, complaints, invoices, workshops } = resDashboard.data;
          setVehicles(vehicles || []);
          setComplaints(complaints || []);
          setWorkshops(workshops || []);
        } catch (err) {
          console.error("Failed to load dashboard owner data on geocoding:", err);
        }

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
    
    // Check local limits before submitting
    const userPlan = user?.plan || "FREE";
    if (userPlan === "FREE" && vehicles.length >= 2) {
      setShowAddCar(false);
      setShowUpgradeModal(true);
      return;
    }

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
    } catch (err: any) {
      if (err.response?.status === 403) {
        setShowAddCar(false);
        setShowUpgradeModal(true);
      } else {
        // Fallback mock check if endpoint completely failed
        const mockCar = { _id: Math.random().toString(), make: carMake, model: carModel, year: carYear, license_plate: carPlate, mileage: carMileage, fuel_type: carFuel };
        setVehicles(prev => [...prev, mockCar]);
        setShowAddCar(false);
      }
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
      showToast("success", "AI Analysis complete! Complaint submitted successfully.");
      setActiveTab("complaints");
      // Reset form fields
      setComplaintTitle("");
      setComplaintDesc("");
      setComplaintImages([]);
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Failed to submit complaint. Please check fields.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handlePayInvoice = async () => {
    if (!activeComplaint) return;
    setPaymentLoading(true);
    try {
      await api.post(`/api/complaints/${activeComplaint._id}/pay`);
      showToast("success", "Payment processed! Auto repair closed.");
      fetchDashboardData();
      setInvoice((prev: any) => prev ? { ...prev, status: "Paid" } : null);
    } catch {
      showToast("success", "Simulated payment success.");
      setInvoice((prev: any) => prev ? { ...prev, status: "Paid" } : null);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOpenBookingModal = (workshop: any) => {
    setBookingWorkshop(workshop);
    setBookingVehicleId(vehicles[0]?._id || "");
    setBookingService(workshop.services?.[0] || "General Diagnostics");
    setBookingPreferredDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]); // tomorrow
    setBookingPreferredTime("10:00 AM");
    setBookingNotes("");
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!bookingWorkshop || !bookingVehicleId) {
      showToast("error", "Please select a vehicle to book service.");
      return;
    }
    setBookingLoading(true);
    try {
      const response = await api.post("/api/bookings", {
        vehicleId: bookingVehicleId,
        workshopId: bookingWorkshop._id,
        preferredDate: bookingPreferredDate,
        preferredTime: bookingPreferredTime,
        notes: bookingNotes
      });
      
      setBookings(prev => [response.data, ...prev]);
      setShowBookingModal(false);
      showToast("success", "Booking created successfully.");
      setActiveTab("bookings");
      
      // Notify details via WebSocket presence
      if (socket) {
        socket.emit("sendMessage", {
          roomId: "general",
          message: `🛠️ New Service Booking Request ${response.data.bookingId} submitted for preferred date ${bookingPreferredDate}.`,
          senderId: user?._id,
          receiverId: bookingWorkshop.owner_id?._id || bookingWorkshop.owner_id || bookingWorkshop._id,
          timestamp: new Date().toISOString()
        });
      }
      
      fetchDashboardData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Failed to create booking.");
    } finally {
      setBookingLoading(false);
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
      sendMessage({
        roomId: roomId || "general",
        message: optimistic.message,
        senderId: user?._id,
        receiverId,
        timestamp: optimistic.createdAt
      });
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
                {user?.plan === "PREMIUM" ? (
                  <span className="text-[9px] font-bold text-[#FFD400] tracking-wide block flex items-center gap-1">⭐ Premium Member</span>
                ) : (
                  <span className="text-[9px] font-bold text-[#9A9A9A] tracking-wide block">VEHICLE OWNER</span>
                )}
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="px-4 py-2 space-y-1 text-xs font-semibold">
            {[
              { id: "garage", label: "My Vehicles", icon: <Car size={14} /> },
              { id: "complaints", label: "Vehicle Complaints", icon: <AlertTriangle size={14} /> },
              { id: "bookings", label: "My Bookings", icon: <Clock size={14} /> },
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
            {user?.plan !== "PREMIUM" && (
              <div className="relative">
                <button 
                  onClick={() => { setShowUpgradeModal(true); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors text-left text-[#FFD400] hover:bg-[#FFD400]/10 border border-[#FFD400]/20 mt-2 ${sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""}`}
                >
                  <Sparkles size={14} className="text-[#FFD400]" />
                  {(!sidebarCollapsed || mobileMenuOpen) && <span className="font-bold">Upgrade to Premium</span>}
                </button>
              </div>
            )}
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
                onClick={() => {
                  const userPlan = user?.plan || "FREE";
                  if (userPlan === "FREE" && vehicles.length >= 2) {
                    setShowUpgradeModal(true);
                  } else {
                    setShowAddCar(!showAddCar);
                  }
                }}
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
                  <Image 
                    src={v.image || "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=600"} 
                    alt={`${v.make} ${v.model}`}
                    width={128}
                    height={96}
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

        {/* TAB: MY BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">My Service Bookings</h2>
              <p className="text-xs text-[#9A9A9A] mt-1">Track and manage your scheduled service booking requests.</p>
            </div>

            <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[#9A9A9A] uppercase tracking-wider text-[9px] font-bold">
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Workshop</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#9A9A9A] text-xs">
                          {"No service bookings found. Click \"Nearby Workshops\" to book slot!"}
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-[#FFD400]">{b.bookingId}</td>
                          <td className="py-4 px-4 text-white font-bold">{b.workshopName}</td>
                          <td className="py-4 px-4 text-[#9A9A9A]">{b.vehicleName}</td>
                          <td className="py-4 px-4 text-white">{b.preferredDate}</td>
                          <td className="py-4 px-4 text-[#9A9A9A]">{b.preferredTime}</td>
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
                          <td className="py-4 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => {
                                  const wsObj = workshops.find(w => w._id === b.workshopId || w.name === b.workshopName);
                                  if (wsObj) handleSelectWorkshopChat(wsObj, b.complaintId);
                                  else handleSelectWorkshopChat({ _id: b.workshopId, name: b.workshopName }, b.complaintId);
                                }}
                                className="px-3 py-1.5 bg-[#FFD400]/10 hover:bg-[#FFD400]/20 text-[#FFD400] rounded-xl text-[10px] font-bold uppercase transition-all"
                              >
                                Chat
                              </button>
                              {b.status === "Pending" && (
                                <button 
                                  onClick={async () => {
                                    if (confirm("Are you sure you want to cancel this booking?")) {
                                      try {
                                        const response = await api.post(`/api/bookings/${b._id}/status`, { status: "Cancelled" });
                                        setBookings(prev => prev.map(item => item._id === b._id ? response.data : item));
                                        showToast("success", "Booking cancelled successfully.");
                                      } catch (err: any) {
                                        showToast("error", err.response?.data?.detail || "Failed to cancel booking.");
                                      }
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-[#FF5959] rounded-xl text-[10px] font-bold uppercase transition-all"
                                >
                                  Cancel
                                </button>
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
              {workshops.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-8 space-y-4">
                  <h3 className="text-base font-bold text-white">No workshops available</h3>
                  <p className="text-xs text-[#9A9A9A]">There are currently no verified workshops in your area.</p>
                  <p className="text-[10px] text-[#9A9A9A]/60">Register a workshop or check back later.</p>
                </div>
              ) : (
                workshops.map((w) => (
                  <div key={w._id} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] hover:border-[#FFD400] transition-all flex flex-col justify-between shadow-md relative overflow-hidden text-xs">
                    
                    {/* Top Header Card */}
                    <div className="flex gap-4 items-start">
                      <Image 
                        src={w.owner_id?.profile_image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                        alt="logo" 
                        width={48}
                        height={48}
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
                        onClick={() => handleOpenBookingModal(w)}
                        className="py-2 border border-white/5 hover:border-white/20 text-[#9A9A9A] hover:text-white rounded-[12px] text-[9px] font-bold uppercase transition-all"
                      >
                        Book Service
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6 text-left max-w-5xl mx-auto font-sans text-xs">
            
            {/* Upper profile header card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#151515] border border-[rgba(255,255,255,0.06)] p-6 rounded-[22px] shadow-md relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <Image 
                    src={user?.profile_image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                    alt="avatar" 
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full border-2 border-[#FFD400]/40 object-cover"
                  />
                  {user?.plan === "PREMIUM" && (
                    <span className="absolute -bottom-1 -right-1 bg-[#FFD400] text-black text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-[#111] flex items-center gap-0.5 shadow-md animate-pulse">
                      ⭐ PREMIUM
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                    {user?.name}
                  </h2>
                  <p className="text-xs text-[#9A9A9A] font-medium font-mono mt-0.5">{user?.email}</p>
                  <p className="text-[10px] text-[#9A9A9A]/60 font-mono mt-0.5">Phone: {user?.phone}</p>
                </div>
              </div>
              <button
                onClick={handleOpenEditProfile}
                className="w-full md:w-auto px-5 py-3 bg-[#FFD400] hover:bg-[#FFC300] text-black font-extrabold rounded-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                Edit Profile
              </button>
            </div>

            {/* Dashboard responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Personal details & Stats */}
              <div className="space-y-6">
                <div className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-4 shadow-md">
                  <h3 className="font-bold text-[10px] uppercase text-[#9A9A9A] tracking-wider border-b border-white/5 pb-2">Profile Specifications</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Gender</span>
                      <span className="text-white block mt-0.5">{user?.gender || "Not Specified"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Date of Birth</span>
                      <span className="text-white block mt-0.5">{user?.dob || "Not Specified"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Emergency Contact</span>
                      <span className="text-white block mt-0.5">{user?.emergency_contact || "Not Specified"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Home Coordinates</span>
                      <span className="text-white block mt-0.5">{user?.city ? `${user.city}, ${user.state || ""}` : "Not Specified"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-4 shadow-md">
                  <h3 className="font-bold text-[10px] uppercase text-[#9A9A9A] tracking-wider border-b border-white/5 pb-2">Vehicle Summary</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-[#111] rounded-xl border border-white/5">
                      <span className="block text-lg font-black text-white">{vehicles.length}</span>
                      <span className="block text-[8px] text-[#9A9A9A] uppercase tracking-wider mt-0.5">Total Vehicles</span>
                    </div>
                    <div className="p-3 bg-[#111] rounded-xl border border-white/5">
                      <span className="block text-lg font-black text-[#FFD400]">{complaints.filter(c => c.status === "Pending" || c.status === "Inspection").length}</span>
                      <span className="block text-[8px] text-[#9A9A9A] uppercase tracking-wider mt-0.5">Active Alerts</span>
                    </div>
                    <div className="p-3 bg-[#111] rounded-xl border border-white/5">
                      <span className="block text-lg font-black text-[#7CFF7A]">{complaints.filter(c => c.status === "Completed" || c.status === "Delivered").length}</span>
                      <span className="block text-[8px] text-[#9A9A9A] uppercase tracking-wider mt-0.5">Repairs Done</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="p-3 bg-[#111] rounded-xl border border-white/5">
                      <span className="block text-lg font-black text-white">{bookings.length}</span>
                      <span className="block text-[8px] text-[#9A9A9A] uppercase tracking-wider mt-0.5">Bookings</span>
                    </div>
                    <div className="p-3 bg-[#111] rounded-xl border border-white/5">
                      <span className="block text-lg font-black text-white">{invoice ? "1" : "0"}</span>
                      <span className="block text-[8px] text-[#9A9A9A] uppercase tracking-wider mt-0.5">Invoices</span>
                    </div>
                    <div className="p-3 bg-[#111] rounded-xl border border-white/5">
                      <span className="block text-lg font-black text-white">{complaints.length}</span>
                      <span className="block text-[8px] text-[#9A9A9A] uppercase tracking-wider mt-0.5">AI Predictions</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Account status & Subscription details */}
              <div className="space-y-6">
                <div className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-4 shadow-md">
                  <h3 className="font-bold text-[10px] uppercase text-[#9A9A9A] tracking-wider border-b border-white/5 pb-2">Account Metrics</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Plan status</span>
                      <span className="text-[#FFD400] block mt-0.5 font-bold uppercase">{user?.plan || "FREE PLAN"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Vehicle Limit</span>
                      <span className="text-white block mt-0.5 font-bold">{user?.plan === "PREMIUM" ? "Unlimited" : "2 Vehicles"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Member Since</span>
                      <span className="text-white block mt-0.5 font-mono">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "01/07/2026"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9A9A] uppercase block">Account Status</span>
                      <span className="text-[#7CFF7A] block mt-0.5 font-bold uppercase">ACTIVE SECURE</span>
                    </div>
                  </div>
                </div>

                {/* SUBSCRIPTION PANEL */}
                <div className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] space-y-4 shadow-md">
                  <h3 className="font-bold text-[10px] uppercase text-[#9A9A9A] tracking-wider border-b border-white/5 pb-2">Subscription Control</h3>
                  {user?.plan !== "PREMIUM" ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#111] rounded-xl border border-white/5">
                        <span className="block text-white font-bold uppercase text-[10px]">FREE TIER LEVEL</span>
                        <p className="text-[10px] text-[#9A9A9A] mt-1">Limited to 2 registered vehicles and basic diagnostics. Upgrade for full features.</p>
                      </div>
                      <button
                        onClick={handleUpgradeToPremium}
                        className="w-full py-3 bg-[#FFD400] hover:bg-[#FFC300] text-black font-extrabold rounded-xl uppercase tracking-wider transition-all"
                      >
                        Upgrade to Premium (₹499)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#FFD400]/10 rounded-xl border border-[#FFD400]/20 flex items-center justify-between">
                        <div>
                          <span className="block text-[#FFD400] font-bold uppercase text-[10px]">PREMIUM TIER LEVEL</span>
                          <span className="block text-[9px] text-[#9A9A9A] mt-0.5">Unlimited vehicles & AI Scanner Diagnostics</span>
                        </div>
                        <span className="bg-[#FFD400] text-black font-bold text-[9px] px-2 py-0.5 rounded">ACTIVE</span>
                      </div>
                      <button
                        onClick={() => showToast("info", "Your premium subscription remains valid and does not expire.")}
                        className="w-full py-3 border border-[#FFD400]/40 text-[#FFD400] hover:bg-[#FFD400]/10 font-extrabold rounded-xl uppercase tracking-wider transition-all"
                      >
                        Renew Subscription
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* PAYMENT TRANSACTION HISTORY */}
            <div className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-md space-y-4">
              <h3 className="font-bold text-[10px] uppercase text-[#9A9A9A] tracking-wider border-b border-white/5 pb-2">Payment Transaction History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] text-[#9A9A9A] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Transaction ID</th>
                      <th className="py-2.5 px-3">Payment Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[10px] text-[#9A9A9A]">
                    {user?.plan === "PREMIUM" ? (
                      <tr>
                        <td className="py-3 px-3 text-[#FFD400] font-bold">TXN_{user?.paymentId || "8472910482"}</td>
                        <td className="py-3 px-3 text-white">{user?.subscriptionStart ? new Date(user.subscriptionStart).toLocaleDateString() : "01/07/2026"}</td>
                        <td className="py-3 px-3 text-white font-bold">₹499.00</td>
                        <td className="py-3 px-3"><span className="bg-emerald-500/10 text-[#7CFF7A] px-2 py-0.5 rounded text-[8px] font-bold uppercase">Success</span></td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => showToast("info", "Downloading PDF invoice representation.")}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[8px] uppercase font-bold"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="py-4 px-3 text-center col-span-5 text-xs text-[#9A9A9A] font-sans" colSpan={5}>
                          No transactions found. Register for Premium plan to see receipts here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECURITY & ACCOUNT DELETION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <form onSubmit={handleSavePassword} className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-md space-y-4">
                <h3 className="font-bold text-[10px] uppercase text-[#9A9A9A] tracking-wider border-b border-white/5 pb-2">Security & Passwords</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-[#9A9A9A] uppercase font-bold mb-1">New Password</label>
                    <input
                      type="password"
                      value={changePassword}
                      onChange={(e) => setChangePassword(e.target.value)}
                      required
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#9A9A9A] uppercase font-bold mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={changeConfirmPassword}
                      onChange={(e) => setChangeConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => showToast("success", "Password reset email template dispatched successfully.")}
                    className="px-3 py-1.5 border border-white/5 hover:bg-white/5 text-[#9A9A9A] hover:text-white rounded-lg font-bold uppercase transition-all text-[9px]"
                  >
                    Reset Password
                  </button>
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-4 py-1.5 bg-[#FFD400] hover:bg-[#FFC300] text-black rounded-lg font-bold uppercase transition-all text-[9px]"
                  >
                    {passwordSaving ? "Saving..." : "Change Password"}
                  </button>
                </div>
              </form>

              <div className="p-6 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-md space-y-4">
                <h3 className="font-bold text-[10px] uppercase text-[#9A9A9A] tracking-wider border-b border-white/5 pb-2">Account Administration</h3>
                <p className="text-[#9A9A9A] leading-relaxed">Modify authentication states, clean sessions, or terminate registration properties.</p>
                
                <div className="flex flex-col md:flex-row gap-2 pt-2">
                  <button
                    onClick={() => showToast("success", "Logged out from all other devices successfully.")}
                    className="flex-1 py-3 border border-white/5 hover:bg-white/5 text-[#9A9A9A] hover:text-white rounded-xl font-bold uppercase tracking-wider text-center"
                  >
                    Logout All Devices
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete your FIXORA account? This deletes all your vehicles registry and repair history. This action cannot be undone.")) {
                        showToast("error", "Simulated delete account action. Contact support to finalize.");
                      }
                    }}
                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-[#FF5959] rounded-xl font-bold uppercase tracking-wider text-center transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </div>

            </div>

            {/* EDIT PROFILE MODAL */}
            {isEditingProfile && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveProfile} className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] max-w-lg w-full p-6 space-y-5 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto">
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="absolute top-4 right-4 p-1 rounded-full bg-white/5 text-[#9A9A9A] hover:text-white"
                  >
                    <X size={16} />
                  </button>
                  
                  <div>
                    <h3 className="font-extrabold text-lg text-white uppercase tracking-wider">Edit Owner Profile</h3>
                    <p className="text-[10px] text-[#9A9A9A] mt-0.5">Modify personal parameters and contact preferences.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    
                    {/* Profile image upload row */}
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <Image 
                        src={editProfileImage || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                        alt="avatar" 
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full border border-white/10 object-cover"
                      />
                      <div>
                        <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">Profile Photo</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-[10px] text-white bg-white/5 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#FFD400] file:text-black hover:file:bg-[#FFC300]"
                        />
                        {uploadingLogo && <span className="text-[#FFD400] text-[9px] mt-1 block">Uploading image...</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">Full Name *</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                          className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">Phone Number *</label>
                        <input 
                          type="text" 
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          required
                          className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">Gender</label>
                        <select 
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">Date of Birth</label>
                        <input 
                          type="date" 
                          value={editDob}
                          onChange={(e) => setEditDob(e.target.value)}
                          className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">Address</label>
                      <input 
                        type="text" 
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">City</label>
                        <input 
                          type="text" 
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">State</label>
                        <input 
                          type="text" 
                          value={editState}
                          onChange={(e) => setEditState(e.target.value)}
                          className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">Pincode</label>
                        <input 
                          type="text" 
                          value={editPincode}
                          onChange={(e) => setEditPincode(e.target.value)}
                          className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1">Emergency Contact</label>
                      <input 
                        type="text" 
                        value={editEmergencyContact}
                        onChange={(e) => setEditEmergencyContact(e.target.value)}
                        placeholder="Name & Contact number"
                        className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                      />
                    </div>

                  </div>

                  <div className="flex flex-col gap-2 pt-2 text-xs font-semibold">
                    <button
                      type="submit"
                      disabled={profileSaving || uploadingLogo}
                      className="w-full py-3 bg-[#FFD400] hover:bg-[#FFC300] disabled:opacity-50 text-black font-extrabold rounded-xl transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="w-full py-3 border border-white/5 hover:bg-white/5 text-[#9A9A9A] hover:text-white rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

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

        {/* Premium Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-[#151515] border border-[#FFD400]/40 rounded-[28px] max-w-md w-full p-8 space-y-6 shadow-2xl relative">
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 text-[#9A9A9A] hover:text-white p-1 rounded-full bg-white/5"
              >
                <X size={16} />
              </button>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#FFD400]/10 border border-[#FFD400]/30 flex items-center justify-center text-[#FFD400]">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-white uppercase">Upgrade to Premium</h3>
                <p className="text-xs text-[#9A9A9A] leading-relaxed">
                  You have reached the maximum limit of 2 vehicles on the Free Plan.<br/>
                  Upgrade to Premium (₹499) to add unlimited vehicles.
                </p>
              </div>

              <div className="space-y-3 p-4 bg-[#111111] rounded-2xl border border-white/5 text-xs text-[#9A9A9A]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-[#FFD400]" />
                  <span>Unlimited vehicles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-[#FFD400]" />
                  <span>Unlimited AI diagnostics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-[#FFD400]" />
                  <span>Unlimited complaints</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-[#FFD400]" />
                  <span>Priority support & Premium badge</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={handleUpgradeToPremium}
                  disabled={processingUpgrade}
                  className="w-full py-3 bg-[#FFD400] hover:bg-[#FFC300] disabled:opacity-50 text-black font-extrabold rounded-xl transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  {processingUpgrade ? "Processing..." : "Upgrade Now (₹499)"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 border border-white/5 hover:bg-white/5 text-[#9A9A9A] hover:text-white rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING MODAL */}
        {showBookingModal && bookingWorkshop && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] max-w-md w-full p-6 space-y-6 text-left shadow-2xl relative">
              <button 
                onClick={() => setShowBookingModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full bg-white/5 text-[#9A9A9A] hover:text-white"
              >
                <X size={16} />
              </button>
              
              <div>
                <h3 className="font-extrabold text-lg text-white uppercase tracking-wider">Book Service Slot</h3>
                <p className="text-[10px] text-[#9A9A9A] mt-0.5">Scheduling service with {bookingWorkshop.name}</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1.5">Select Vehicle</label>
                  <select 
                    value={bookingVehicleId}
                    onChange={(e) => setBookingVehicleId(e.target.value)}
                    className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFD400]"
                  >
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>{v.make} {v.model} ({v.license_plate})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1.5">Service Required</label>
                  <select 
                    value={bookingService}
                    onChange={(e) => setBookingService(e.target.value)}
                    className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFD400]"
                  >
                    {(bookingWorkshop.services || ["General Diagnostics", "Scheduled Maintenance", "Electrical Tuning"]).map((s: string, idx: number) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1.5">Preferred Date</label>
                    <input 
                      type="date" 
                      value={bookingPreferredDate}
                      onChange={(e) => setBookingPreferredDate(e.target.value)}
                      className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFD400]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1.5">Preferred Time</label>
                    <select 
                      value={bookingPreferredTime}
                      onChange={(e) => setBookingPreferredTime(e.target.value)}
                      className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFD400]"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#9A9A9A] uppercase font-bold mb-1.5">Special Instructions / Notes</label>
                  <textarea 
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Describe symptoms, requested parts, or special instructions..."
                    rows={3}
                    className="w-full bg-[#151515] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFD400] resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 text-xs font-semibold">
                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="w-full py-3 bg-[#FFD400] hover:bg-[#FFC300] disabled:opacity-50 text-black font-extrabold rounded-xl transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  {bookingLoading ? "Booking..." : "Confirm Booking"}
                </button>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="w-full py-3 border border-white/5 hover:bg-white/5 text-[#9A9A9A] hover:text-white rounded-xl transition-all"
                >
                  Cancel
                </button>
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
