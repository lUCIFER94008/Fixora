"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Reset link sent! Check your inbox.");
      } else {
        setStatus("error");
        setMessage(data.detail || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent flex items-center justify-center p-6 text-white overflow-hidden font-sans">

      {/* Gold ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #FFD400 0%, transparent 70%)" }}
      />

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
          <p className="text-[#9A9A9A] text-xs">Password Recovery Protocol</p>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-white">Forgot Your Password?</h1>
          <p className="text-[#9A9A9A] text-xs leading-relaxed">
            Enter the email address linked to your FIXORA account and we&apos;ll send you a secure reset link.
          </p>
        </div>

        {/* Success state */}
        {status === "success" ? (
          <div className="space-y-6">
            <div className="p-5 rounded-[16px] bg-[#7CFF7A]/10 border border-[#7CFF7A]/20 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 size={36} className="text-[#7CFF7A]" />
              <div>
                <p className="text-[#7CFF7A] font-bold text-sm">Email Sent!</p>
                <p className="text-[#9A9A9A] text-xs mt-1 leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="p-4 rounded-[12px] bg-[#FFD400]/5 border border-[#FFD400]/15 text-xs text-[#9A9A9A] leading-relaxed">
              <p>📧 Check your <strong className="text-white">spam or junk folder</strong> if you don&apos;t see the email within a few minutes.</p>
              <p className="mt-1">⏰ The link expires in <strong className="text-[#FFD400]">15 minutes</strong>.</p>
            </div>
            <button
              onClick={() => { setStatus("idle"); setEmail(""); setMessage(""); }}
              className="w-full py-3 rounded-[14px] text-xs font-bold bg-[#1E1E1E] border border-[rgba(255,255,255,0.06)] text-[#9A9A9A] hover:text-white hover:border-white/20 transition-all"
            >
              Send to a different email
            </button>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-[#FFD400] text-xs font-bold hover:underline"
            >
              <ArrowLeft size={12} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-left">

            {/* Error message */}
            {status === "error" && (
              <div className="p-3.5 rounded-[12px] bg-[#FF5959]/10 border border-[#FF5959]/20 text-[#FF5959] text-xs flex items-center gap-2 font-mono">
                <ShieldAlert size={14} className="flex-shrink-0" />
                {message}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-[#9A9A9A]" size={14} />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="driver@fixora.com"
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A] transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="send-reset-btn"
              disabled={status === "loading" || !email.trim()}
              className="w-full py-3.5 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 uppercase tracking-wider"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  Send Reset Link <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Back to Login */}
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-[#9A9A9A] hover:text-white text-xs transition-colors pt-1"
            >
              <ArrowLeft size={12} /> Back to Login
            </Link>
          </form>
        )}

      </div>
    </div>
  );
}
