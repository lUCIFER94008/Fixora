"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldAlert, ArrowRight } from "lucide-react";
import api from "@/services/api";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { access_token, refresh_token, user } = response.data;
      
      // Save tokens
      localStorage.setItem("fixora_access_token", access_token);
      localStorage.setItem("fixora_refresh_token", refresh_token);
      localStorage.setItem("fixora_user", JSON.stringify(user));

      // Trigger credentials signin in NextAuth to establish session cookie
      await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      // Redirect based on role
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "workshop") {
        router.push("/workshop/dashboard");
      } else {
        router.push("/owner/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password combination");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent flex items-center justify-center p-6 text-white overflow-hidden font-sans">
      
      {/* Main Glass Box */}
      <div className="w-full max-w-md p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-2xl relative z-10 space-y-8">
        
        {/* Branding header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <Image 
              src="https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png" 
              alt="FIXORA logo" 
              width={50} 
              height={50}
              className="rounded-full border border-[rgba(255,255,255,0.08)]"
            />
            <span className="font-bold text-2xl tracking-tight text-white font-sans mt-1">FIXORA</span>
          </Link>
          <p className="text-[#9A9A9A] text-xs">Enter credentials to access your control panel.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-[12px] bg-[#FF5959]/10 border border-[#FF5959]/20 text-[#FF5959] text-xs flex items-center gap-2 font-mono">
            <ShieldAlert size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-[#9A9A9A]" size={14} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="driver@fixora.com" 
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">Password</label>
              <a href="#" className="text-[9px] text-[#FFD400] hover:underline uppercase">Forgot Key?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-[#9A9A9A]" size={14} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••" 
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A]"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#9A9A9A] hover:text-white"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center pt-1">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-[#FFD400] rounded"
            />
            <label htmlFor="remember" className="text-xs text-[#9A9A9A] select-none ml-2 cursor-pointer">Keep me logged in</label>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider mt-4"
          >
            {loading ? "Authenticating..." : "Login to Dashboard"} <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-xs text-[#9A9A9A] text-center pt-2">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#FFD400] hover:underline font-bold">Register here</Link>
        </p>

      </div>

    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-white bg-black font-mono text-xs">
        INITIALIZING COMPASS CORRIDOR...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
