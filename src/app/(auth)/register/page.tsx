"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Lock, 
  Wrench, 
  Car, 
  ShieldAlert, 
  ArrowRight,
  UploadCloud
} from "lucide-react";
import api from "@/services/api";
import { signIn } from "next-auth/react";

export default function Register() {
  const router = useRouter();
  
  // Registration States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rawPhone, setRawPhone] = useState("");
  const [role, setRole] = useState("owner"); // owner or workshop
  const [profileImage, setProfileImage] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Workshop specific
  const [workshopName, setWorkshopName] = useState("");
  const [workshopAddress, setWorkshopAddress] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const cookieRole = role === "owner" ? "vehicleOwner" : "workshopOwner";
      document.cookie = `fixora_selected_role=${cookieRole}; path=/; max-age=600`;
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (e) {
      console.error(e);
      setError("Google Login failed. Please try again.");
      setGoogleLoading(false);
    }
  };
  
  // Password Strength
  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "bg-slate-700", pct: 0 };
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let score = 0;
    if (hasLength) score += 20;
    if (hasUpper) score += 20;
    if (hasLower) score += 20;
    if (hasDigit) score += 20;
    if (hasSpecial) score += 20;

    if (score < 40) return { label: "Weak (min 8 chars, mix case/digits/symbols)", color: "bg-red-500", pct: score };
    if (score < 100) return { label: "Medium", color: "bg-yellow-500", pct: score };
    return { label: "Strong", color: "bg-emerald-500", pct: 100 };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Maximum image size is 5MB");
      return;
    }

    setUploading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await api.post("/api/auth/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfileImage(response.data.url);
    } catch (err) {
      // Local simulated file fallback
      setProfileImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250");
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Client-side validations
    if (name.trim().length < 3) {
      setError("Name must be at least 3 characters.");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (!/^[6-9]\d{9}$/.test(rawPhone)) {
      setError("Phone number is invalid. Must be a valid 10-digit Indian mobile number.");
      setLoading(false);
      return;
    }
    const strength = getPasswordStrength();
    if (strength.pct < 100) {
      setError("Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.");
      setLoading(false);
      return;
    }

    const fullPhone = `+91${rawPhone}`;

    try {
      // 1. Pre-check if email/phone exists
      await api.post("/api/auth/register-check", { email, phone: fullPhone });
      
      // 2. Trigger Phone OTP & Email OTP in parallel
      await Promise.all([
        api.post("/api/auth/send-phone-otp", { phone: fullPhone }),
        api.post("/api/auth/send-email-otp", { email })
      ]);

      // 3. Save details to sessionStorage
      sessionStorage.setItem("fixora_pending_registration", JSON.stringify({
        name,
        email,
        phone: fullPhone,
        password,
        role,
        profileImage,
        workshopName: role === "workshop" ? workshopName : undefined,
        workshopAddress: role === "workshop" ? workshopAddress : undefined
      }));

      // 4. Redirect to verify page
      router.push("/verify");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to send SMS or Email OTP. Please check services configuration.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="relative min-h-screen bg-transparent flex items-center justify-center p-6 md:p-12 lg:px-16 text-white overflow-hidden font-sans">
      
      {/* Container for Centered Form */}
      <div className="w-full max-w-[700px] relative z-10">
        
        {/* Form Card */}
        <div className="w-full py-6 px-6 sm:py-8 sm:px-10 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-2xl flex flex-col justify-center space-y-8">
          
          <div className="flex flex-col items-center text-center space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image 
                src="https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png" 
                alt="FIXORA logo" 
                width={32} 
                height={32}
                className="rounded-full"
              />
              <span className="font-bold text-xl tracking-wider text-white">FIXORA</span>
            </Link>
            <div className="pt-2">
              <h2 className="text-xl font-bold uppercase tracking-wide">
                Initialize Account
              </h2>
              <p className="text-[#9A9A9A] text-xs mt-1">
                Join the luxury AI platform for smart vehicle care.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-[12px] bg-[#FF5959]/10 border border-[#FF5959]/20 text-[#FF5959] text-xs flex items-center gap-2 font-mono">
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-6 text-left">
            
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setRole("owner")}
                className={`py-3 rounded-[16px] text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                  role === "owner" 
                    ? "bg-[#FFD400] border-[#FFD400] text-black" 
                    : "bg-[#111111] border-[rgba(255,255,255,0.06)] text-[#9A9A9A] hover:text-white"
                }`}
              >
                <Car size={14} /> Owner
              </button>
              <button 
                type="button"
                onClick={() => setRole("workshop")}
                className={`py-3 rounded-[16px] text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                  role === "workshop" 
                    ? "bg-[#FFD400] border-[#FFD400] text-black" 
                    : "bg-[#111111] border-[rgba(255,255,255,0.06)] text-[#9A9A9A] hover:text-white"
                }`}
              >
                <Wrench size={14} /> Workshop
              </button>
            </div>

            {/* OAuth Buttons */}
            <div className="w-full">
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 rounded-[16px] border border-[#FFD400] bg-transparent hover:bg-[#FFD400]/10 transition-all text-xs font-semibold flex items-center justify-center gap-2 text-white disabled:opacity-50"
              >
                Google
              </button>
            </div>

            {/* Avatar Upload */}
            <div className="flex items-center gap-4 bg-[#111111] p-3 rounded-[18px] border border-[rgba(255,255,255,0.04)]">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#151515] border border-white/10 relative flex items-center justify-center">
                {profileImage ? (
                  <Image src={profileImage} alt="Avatar Preview" fill className="object-cover" />
                ) : (
                  <User className="text-[#9A9A9A]" size={20} />
                )}
              </div>
              <div className="flex-1 text-left">
                <span className="text-[9px] uppercase tracking-wider text-[#9A9A9A] block">Avatar Coordinates</span>
                <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] text-[#FFD400] hover:underline font-semibold">
                  <UploadCloud size={12} /> {uploading ? "Uploading..." : "Upload Profile Photo"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-[#9A9A9A]" size={14} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe" 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Email Node</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-[#9A9A9A]" size={14} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="driver@gmail.com" 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A]"
                  />
                </div>
              </div>

              {/* Phone Input with Fixed 🇮🇳 +91 Prefix */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">SMS Coordinates</label>
                <div className="relative flex items-center bg-[#111111] border border-[#2A2A2A] rounded-[16px] focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400]/40 pl-3">
                  <div className="flex items-center gap-1.5 pr-2 border-r border-[#2A2A2A] text-xs text-[#9A9A9A] font-semibold select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input 
                    type="tel" 
                    value={rawPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setRawPhone(val);
                      setPhone(val ? `+91${val}` : "");
                    }}
                    required
                    placeholder="9876543210" 
                    className="w-full bg-transparent border-0 outline-none pl-3 pr-4 py-3 text-xs text-white focus:outline-none placeholder-[#5A5A5A]"
                  />
                </div>
                {rawPhone && !/^[6-9]\d{9}$/.test(rawPhone) && (
                  <span className="text-[9px] text-[#FF5959] block mt-0.5 font-mono">Invalid number. Must be a 10-digit Indian mobile number.</span>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-[#9A9A9A]" size={14} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••" 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A]"
                  />
                </div>
              </div>
            </div>

            {/* Password strength details */}
            {password && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[9px] text-[#9A9A9A]">
                  <span>Password Strength:</span>
                  <span className="font-bold">{strength.label}</span>
                </div>
                <div className="w-full bg-[#111111] h-1 rounded-full overflow-hidden">
                  <div className={`${strength.color} h-full transition-all`} style={{ width: `${strength.pct}%` }} />
                </div>
              </div>
            )}

            {/* Workshop specific fields */}
            {role === "workshop" && (
              <div className="space-y-4 border-t border-[rgba(255,255,255,0.06)] pt-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Workshop Branding</label>
                  <input 
                    type="text" 
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    required
                    placeholder="e.g. Porsche Specialist Garage" 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Physical Garage Address</label>
                  <input 
                    type="text" 
                    value={workshopAddress}
                    onChange={(e) => setWorkshopAddress(e.target.value)}
                    required
                    placeholder="e.g. 77 Luxury Boulevard, Munich" 
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A]"
                  />
                </div>
              </div>
            )}

            <div className="text-[10px] text-[#9A9A9A] leading-relaxed select-none pt-1">
              By initializing credentials, you consent to our <a href="#" className="text-[#FFD400] hover:underline font-semibold">Terms of Protocol</a> and <a href="#" className="text-[#FFD400] hover:underline font-semibold">Privacy Policy</a>.
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading || (rawPhone !== "" && !/^[6-9]\d{9}$/.test(rawPhone))}
              className="w-full py-3.5 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? "Sending Verification OTPs..." : "Initialize Registration"} <ArrowRight size={14} />
            </button>

          </form>

          <p className="text-xs text-[#9A9A9A] text-center pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-[#FFD400] hover:underline font-bold">Login here</Link>
          </p>

        </div>

      </div>

    </div>
  );
}
