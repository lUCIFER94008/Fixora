"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import api from "@/services/api";
import { signIn } from "next-auth/react";

export default function Verify() {
  const router = useRouter();
  
  // Pending registration data loaded from session storage
  const [pendingData, setPendingData] = useState<any>(null);
  const [smsOtp, setSmsOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingSms, setResendingSms] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Load pending data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dataStr = sessionStorage.getItem("fixora_pending_registration");
      if (dataStr) {
        try {
          setPendingData(JSON.parse(dataStr));
        } catch (e) {
          console.error("Error parsing pending registration:", e);
        }
      }
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const maskPhone = (ph: string) => {
    if (!ph) return "";
    // format expected: +919876543210
    if (ph.startsWith("+91") && ph.length === 13) {
      return `+91******${ph.slice(-4)}`;
    }
    return ph;
  };

  const maskEmail = (em: string) => {
    if (!em) return "";
    const parts = em.split("@");
    if (parts.length !== 2) return em;
    const [user, domain] = parts;
    if (user.length <= 3) {
      return `${user[0]}*****@${domain}`;
    }
    return `${user.slice(0, 3)}*****@${domain}`;
  };

  const handleResendSms = async () => {
    if (cooldown > 0 || !pendingData?.phone) return;
    setError("");
    setResendingSms(true);
    try {
      await api.post("/api/auth/send-phone-otp", { phone: pendingData.phone });
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to send SMS OTP. Twilio service unavailable.");
    } finally {
      setResendingSms(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || !pendingData?.email) return;
    setError("");
    setResendingEmail(true);
    try {
      await api.post("/api/auth/send-email-otp", { email: pendingData.email });
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Unable to send Email OTP. Email service unavailable.");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingData) return;
    setError("");
    setLoading(true);

    if (smsOtp.length !== 6 || emailOtp.length !== 6) {
      setError("Please enter valid 6-digit verification codes.");
      setLoading(false);
      return;
    }

    try {
      // 1. Verify SMS OTP via Twilio
      let phoneVerificationToken = "";
      try {
        const phoneRes = await api.post("/api/auth/verify-phone-otp", {
          phone: pendingData.phone,
          otp: smsOtp
        });
        phoneVerificationToken = phoneRes.data.token;
      } catch (err: any) {
        setError(err.response?.data?.detail || "Incorrect SMS OTP. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Verify Email OTP
      let emailVerificationToken = "";
      try {
        const emailRes = await api.post("/api/auth/verify-email-otp", {
          email: pendingData.email,
          otp: emailOtp
        });
        emailVerificationToken = emailRes.data.token;
      } catch (err: any) {
        setError(err.response?.data?.detail || "Incorrect Email OTP. Please try again.");
        setLoading(false);
        return;
      }

      // 3. Finalize User Creation in MongoDB
      const registerPayload = {
        name: pendingData.name,
        email: pendingData.email,
        phone: pendingData.phone,
        password: pendingData.password,
        role: pendingData.role,
        profileImage: pendingData.profileImage || undefined,
        workshop_name: pendingData.workshopName || undefined,
        workshop_address: pendingData.workshopAddress || undefined,
        phoneVerificationToken,
        emailVerificationToken
      };

      const registerRes = await api.post("/api/auth/register", registerPayload);
      const { access_token, refresh_token, user } = registerRes.data;

      // Save credentials locally
      localStorage.setItem("fixora_access_token", access_token);
      localStorage.setItem("fixora_refresh_token", refresh_token);
      localStorage.setItem("fixora_user", JSON.stringify(user));

      // Trigger automatic NextAuth login session
      await signIn("credentials", {
        email: pendingData.email,
        password: pendingData.password,
        redirect: false
      });

      // Clear pending state
      sessionStorage.removeItem("fixora_pending_registration");

      // Redirect to unified routing corridor
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration processing failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // If no registration data, show notice
  if (!pendingData) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-md p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-2xl text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <ShieldAlert className="text-[#FFD400]" size={48} />
            <h2 className="text-lg font-bold uppercase tracking-wider">No Pending Registration</h2>
            <p className="text-xs text-[#9A9A9A] leading-relaxed">
              We couldn&apos;t find any active account setup session. Please return to the registration terminal.
            </p>
          </div>
          <Link 
            href="/register" 
            className="w-full inline-flex py-3.5 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] transition-all text-xs justify-center items-center gap-2 uppercase tracking-wider"
          >
            Go to Register <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent flex items-center justify-center p-6 md:p-12 text-white overflow-hidden font-sans">
      
      {/* Verify Card Container */}
      <div className="w-full max-w-[500px] relative z-10">
        
        <div className="w-full py-8 px-6 sm:px-10 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-2xl flex flex-col justify-center space-y-8">
          
          <div className="flex flex-col items-center text-center space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
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
                Verify Your Account
              </h2>
              <p className="text-[#9A9A9A] text-xs mt-1">
                Enter OTP credentials dispatched to your coordinates.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-[12px] bg-[#FF5959]/10 border border-[#FF5959]/20 text-[#FF5959] text-xs flex items-center gap-2 font-mono">
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            
            {/* Coordinate Masking display */}
            <div className="space-y-3.5 bg-[#111111] p-4 rounded-[18px] border border-[rgba(255,255,255,0.04)] font-sans">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#9A9A9A] font-medium">SMS Verification:</span>
                <span className="text-white font-bold font-mono">{maskPhone(pendingData.phone)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#9A9A9A] font-medium">Email Verification:</span>
                <span className="text-white font-bold font-mono">{maskEmail(pendingData.email)}</span>
              </div>
            </div>

            {/* Countdown visual */}
            <div className="text-center font-mono text-xs">
              {cooldown > 0 ? (
                <span className="text-[#9A9A9A]">
                  Resend delay lock:{" "}
                  <strong className="text-[#FFD400]">
                    00:{cooldown.toString().padStart(2, "0")}
                  </strong>
                </span>
              ) : (
                <span className="text-[#FFD400] font-bold">Cooldown unlocked. Resends available.</span>
              )}
            </div>

            {/* SMS OTP input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">SMS OTP Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={smsOtp}
                onChange={(e) => setSmsOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                placeholder="[ _ _ _ _ _ _ ]" 
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#5A5A5A]"
              />
            </div>

            {/* Email OTP input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Email OTP Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                placeholder="[ _ _ _ _ _ _ ]" 
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#5A5A5A]"
              />
            </div>

            {/* Resend Actions Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={cooldown > 0 || resendingSms}
                onClick={handleResendSms}
                className="py-2.5 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-transparent hover:bg-white/5 transition-all text-[11px] font-semibold text-[#9A9A9A] hover:text-white disabled:opacity-40"
              >
                {resendingSms ? "Sending..." : "Resend SMS"}
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || resendingEmail}
                onClick={handleResendEmail}
                className="py-2.5 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-transparent hover:bg-white/5 transition-all text-[11px] font-semibold text-[#9A9A9A] hover:text-white disabled:opacity-40"
              >
                {resendingEmail ? "Sending..." : "Resend Email"}
              </button>
            </div>

            {/* Submit verifying */}
            <button 
              type="submit" 
              disabled={loading || smsOtp.length < 6 || emailOtp.length < 6}
              className="w-full py-3.5 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-30 uppercase tracking-wider mt-4"
            >
              {loading ? "Verifying Credentials..." : "Verify & Create Account"} <CheckCircle2 size={14} />
            </button>

            <div className="text-center">
              <Link 
                href="/register" 
                className="text-[10px] font-semibold text-[#9A9A9A] hover:text-white uppercase hover:underline"
              >
                Back to Registration Settings
              </Link>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}
