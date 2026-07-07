"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Car, 
  Wrench, 
  Activity, 
  Shield, 
  MessageSquare, 
  Send, 
  ChevronDown, 
  Brain, 
  Clock, 
  Sparkles, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  ArrowRight,
  CheckCircle2,
  Layers,
  FileText
} from "lucide-react";
import { useTheme } from "next-themes";
import api from "@/services/api";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  // Interactive Chatbot State
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "assistant", content: "Welcome to Fixora AI Diagnostics. How is your vehicle behaving? Describe any mechanical issues." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  if (!mounted) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: "user", content: userMsg }]);
    setChatMessage("");
    setIsTyping(true);

    try {
      const response = await api.post("/api/chat/messages", {
        receiver_id: "ai_bot",
        content: userMsg
      }, {
        headers: { "Authorization": "Bearer mock_token" } 
      }).catch(() => {
        return {
          data: {
            content: userMsg.toLowerCase().includes("brake") 
              ? "Squealing brakes are generally caused by worn friction pads. I recommend scheduling an inspection at NEON HYPERGARAGE." 
              : "That sounds like a mechanical anomaly. Submitted details are logged in our diagnostic engine. I suggest registering an account to sync with a technician."
          }
        };
      });
      
      const reply = response.data.content;
      
      setTimeout(() => {
        setChatHistory(prev => [...prev, { role: "assistant", content: reply }]);
        setIsTyping(false);
      }, 750);

    } catch (err) {
      setTimeout(() => {
        setChatHistory(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting to the neural core. Please try again!" }]);
        setIsTyping(false);
      }, 500);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent text-white overflow-hidden selection:bg-[#FFD400] selection:text-black">
      
      {/* Floating Glass Navbar */}
      <header className="fixed top-6 inset-x-0 z-50 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-[120px]">
          <nav className={`w-full glass-panel rounded-[18px] transition-all duration-300 flex items-center justify-between shadow-2xl ${
            scrolled ? "py-3 px-6 bg-black/90 border-[rgba(255,255,255,0.08)] scale-[0.99]" : "py-4 px-8 bg-black/40 border-[rgba(255,255,255,0.06)]"
          }`}>
            {/* Logo (Left) */}
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png" 
                alt="FIXORA logo" 
                width={30} 
                height={30}
                className="rounded-full border border-[rgba(255,255,255,0.08)]"
              />
              <span className="font-bold text-xl tracking-tight text-white font-sans">FIXORA</span>
            </Link>

            {/* Navigation (Center) */}
            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide">
              <a href="#features" className="text-[#9A9A9A] hover:text-white transition-colors">Features</a>
              <a href="#diagnostics" className="text-[#9A9A9A] hover:text-white transition-colors">AI Diagnostics</a>
              <a href="#pricing" className="text-[#9A9A9A] hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-[#9A9A9A] hover:text-white transition-colors font-sans">FAQ</a>
            </div>

            {/* Buttons (Right) */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                className="p-2 rounded-full border border-[rgba(255,255,255,0.06)] bg-[#111111] text-[#9A9A9A] hover:text-white hover:border-[#FFD400] transition-all"
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              {session?.user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src={session.user.image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                      alt={session.user.name || "profile"} 
                      className="w-8 h-8 rounded-full border border-[#FFD400]/40 object-cover"
                    />
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[11px] font-bold text-white leading-tight">{session.user.name}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#FFD400] font-mono leading-none">{(session.user as any).role || "Owner"}</span>
                    </div>
                  </div>
                  <Link 
                    href={(session.user as any).role === "workshop" ? "/workshop/dashboard" : "/owner/dashboard"}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] transition-all"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="px-4 py-2 rounded-full text-xs font-semibold border border-[rgba(255,255,255,0.1)] hover:bg-white/5 transition-all text-white"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="px-5 py-2 rounded-full text-xs font-semibold border border-[rgba(255,255,255,0.08)] bg-transparent hover:bg-white/5 transition-all text-white"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="px-5 py-2 rounded-full text-xs font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.03] transition-all shadow-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center gap-3">
              <button 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                className="p-2 rounded-full bg-[#111111] border border-[rgba(255,255,255,0.06)] text-white"
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                className="text-[#9A9A9A] hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </nav>

          {/* Mobile menu modal */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 p-6 rounded-[18px] glass-panel flex flex-col gap-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-[#9A9A9A] hover:text-white font-medium py-1">Features</a>
              <a href="#diagnostics" onClick={() => setMobileMenuOpen(false)} className="text-[#9A9A9A] hover:text-white font-medium py-1">AI Diagnostics</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-[#9A9A9A] hover:text-white font-medium py-1">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-[#9A9A9A] hover:text-white font-medium py-1">FAQ</a>
              <hr className="border-[rgba(255,255,255,0.06)] my-2" />
              <div className="flex flex-col gap-3">
                {session?.user ? (
                  <>
                    <div className="flex items-center gap-3 p-2.5 rounded-[12px] bg-white/5 border border-white/10">
                      <img 
                        src={session.user.image || "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"} 
                        alt="profile" 
                        className="w-9 h-9 rounded-full object-cover border border-[#FFD400]/40"
                      />
                      <div>
                        <div className="text-xs font-bold text-white leading-none">{session.user.name}</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#FFD400] font-mono mt-1">{(session.user as any).role || "Owner"}</div>
                      </div>
                    </div>
                    <Link 
                      href={(session.user as any).role === "workshop" ? "/workshop/dashboard" : "/owner/dashboard"}
                      onClick={() => setMobileMenuOpen(false)} 
                      className="w-full text-center py-2.5 rounded-[16px] bg-[#FFD400] text-black text-xs font-bold"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        localStorage.clear();
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full text-center py-2.5 rounded-[16px] border border-[rgba(255,255,255,0.08)] text-xs font-semibold text-white"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-[16px] border border-[rgba(255,255,255,0.08)] text-xs font-semibold">Login</Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-[16px] bg-[#FFD400] text-black text-xs font-bold">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-28 px-6 md:px-16 lg:px-[120px] max-w-[1400px] mx-auto flex justify-center">
        
        {/* Centered Content */}
        <div className="max-w-[900px] w-full flex flex-col items-center text-center space-y-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD400]/10 border border-[#FFD400]/20 text-[#FFD400] text-xs font-semibold tracking-wide">
            <Sparkles size={12} className="text-[#FFD400]" /> AI-Powered Diagnostics & Fleet Manager
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            AI-Powered Vehicle Diagnostics & Smart Workshop Management
          </h1>
          
          <p className="text-[#9A9A9A] max-w-2xl text-[15px] leading-relaxed mx-auto">
            Diagnose mechanical faults instantly with state-of-the-art AI estimation, coordinate with premium workshops, and monitor active repairs in real-time. Minimalist. Elegant. Seamless.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link 
              href="/register" 
              className="px-6 py-3.5 rounded-[16px] text-xs font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.03] transition-all shadow-md flex items-center gap-2 group"
            >
              Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a 
              href="#diagnostics" 
              className="px-6 py-3.5 rounded-[16px] text-xs font-semibold bg-transparent border border-[rgba(255,255,255,0.08)] hover:bg-[#111111] hover:border-white/20 transition-all text-white"
            >
              Live Demo
            </a>
          </div>

          {/* Stats Counter */}
          <div className="grid grid-cols-3 gap-6 pt-10 w-full border-t border-[rgba(255,255,255,0.06)] text-center">
            <div>
              <div className="text-2xl font-bold text-white sm:text-3xl">15k+</div>
              <div className="text-[10px] text-[#9A9A9A] uppercase tracking-wider mt-1.5">Repairs Coordinated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#FFD400] sm:text-3xl">99.4%</div>
              <div className="text-[10px] text-[#9A9A9A] uppercase tracking-wider mt-1.5">AI Fault Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white sm:text-3xl">240+</div>
              <div className="text-[10px] text-[#9A9A9A] uppercase tracking-wider mt-1.5">Elite Garages</div>
            </div>
          </div>

        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-6 md:px-16 lg:px-[120px] max-w-[1400px] mx-auto border-t border-[rgba(255,255,255,0.06)]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD400]/10 border border-[#FFD400]/20 text-[#FFD400] text-[10px] font-bold tracking-wider uppercase">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Premium Repair Infrastructure
          </h2>
          <p className="text-[#9A9A9A] text-sm leading-relaxed">
            An elegant dashboard environment crafted for fleet tracking, automated fault predictions, and live instant messenger communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-[22px] flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="w-10 h-10 rounded-[14px] bg-[#111111] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FFD400]">
                <Brain size={20} className="text-[#FFD400]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Neural Diagnostics</h3>
                <p className="text-xs text-[#9A9A9A] leading-relaxed">
                  Log symptoms to calculate severity parameters and estimate repair guidelines immediately using modern machine learning cores.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold text-[#FFD400] group-hover:text-[#FFC300] pt-6 flex items-center gap-1 cursor-pointer">
              Read details <ArrowRight size={12} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-[22px] flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="w-10 h-10 rounded-[14px] bg-[#111111] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FFD400]">
                <Wrench size={20} className="text-[#FFD400]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Workshop Dispatch</h3>
                <p className="text-xs text-[#9A9A9A] leading-relaxed">
                  Dispatch tickets automatically to verified specialists based on location matching, reviews, and active workloads.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold text-[#FFD400] group-hover:text-[#FFC300] pt-6 flex items-center gap-1 cursor-pointer">
              Read details <ArrowRight size={12} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-[22px] flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="w-10 h-10 rounded-[14px] bg-[#111111] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FFD400]">
                <Activity size={20} className="text-[#FFD400]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Timeline Tracking</h3>
                <p className="text-xs text-[#9A9A9A] leading-relaxed">
                  Monitor telemetry updates, mechanics logs, progress photos, and digital billing parameters dynamically on a single interface.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold text-[#FFD400] group-hover:text-[#FFC300] pt-6 flex items-center gap-1 cursor-pointer">
              Read details <ArrowRight size={12} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-[22px] flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="w-10 h-10 rounded-[14px] bg-[#111111] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FFD400]">
                <MessageSquare size={20} className="text-[#FFD400]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Live Messaging</h3>
                <p className="text-xs text-[#9A9A9A] leading-relaxed">
                  Discuss issues directly with mechanics via real-time WebSocket channels equipped with typing updates.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold text-[#FFD400] group-hover:text-[#FFC300] pt-6 flex items-center gap-1 cursor-pointer">
              Read details <ArrowRight size={12} />
            </div>
          </div>

        </div>
      </section>

      {/* AI Diagnostic Terminal Sandbox */}
      <section id="diagnostics" className="py-24 px-6 md:px-16 lg:px-[120px] max-w-[1400px] mx-auto border-t border-[rgba(255,255,255,0.06)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Information */}
          <div className="lg:col-span-5 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD400]/10 border border-[#FFD400]/20 text-[#FFD400] text-[10px] font-bold tracking-wider uppercase">
              Interactive Test Console
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Test Our Diagnostics Core
            </h2>
            <p className="text-[#9A9A9A] text-sm leading-relaxed">
              Input any mechanical issue your vehicle is showing. Our custom neural model parses the context to simulate estimates, prioritize severity, and recommend repair coordinates.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-[#9A9A9A]">
                <CheckCircle2 size={14} className="text-[#FFD400]" /> Natural language problem logs
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9A9A9A]">
                <CheckCircle2 size={14} className="text-[#FFD400]" /> Estimated billing boundary thresholds
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9A9A9A]">
                <CheckCircle2 size={14} className="text-[#FFD400]" /> Multi-workshop queue routing
              </div>
            </div>
          </div>

          {/* Interactive Chat Console */}
          <div className="lg:col-span-7 w-full">
            <div className="w-full bg-[#151515] rounded-[22px] border border-[rgba(255,255,255,0.08)] shadow-2xl overflow-hidden flex flex-col h-[400px]">
              
              {/* Header */}
              <div className="px-6 py-4 bg-[#111111] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5959]/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFD400]/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7CFF7A]/90" />
                  <span className="text-[11px] font-mono text-[#9A9A9A] ml-2">fixora-chatbot-shell</span>
                </div>
                <div className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white uppercase font-mono">Synced</div>
              </div>

              {/* Chat history */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 font-sans text-xs">
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] p-3.5 rounded-[18px] ${
                      msg.role === "user" 
                        ? "bg-[#FFD400] text-black font-semibold rounded-tr-none" 
                        : "bg-[#111111] border border-[rgba(255,255,255,0.06)] text-white rounded-tl-none"
                    }`}>
                      <span className={`text-[8px] uppercase tracking-wider block mb-1 ${
                        msg.role === "user" ? "text-black/60" : "text-[#9A9A9A]"
                      }`}>
                        {msg.role === "user" ? "Vehicle Owner" : "Fixora AI Core"}
                      </span>
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] p-4 rounded-[18px] rounded-tl-none text-[#9A9A9A] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#9A9A9A] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[#9A9A9A] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-[#9A9A9A] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input console */}
              <form onSubmit={handleSendMessage} className="p-4 bg-[#111111] border-t border-[rgba(255,255,255,0.06)] flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="e.g. Drivetrain is slipping on acceleration, Brakes squealing..." 
                  className="flex-1 bg-[#080808] border border-[#2A2A2A] rounded-[16px] px-4 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A]"
                />
                <button 
                  type="submit" 
                  aria-label="Send message"
                  className="p-3 bg-[#FFD400] text-black hover:bg-[#FFC300] rounded-[16px] transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>

            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 md:px-16 lg:px-[120px] max-w-[1400px] mx-auto border-t border-[rgba(255,255,255,0.06)]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD400]/10 border border-[#FFD400]/20 text-[#FFD400] text-[10px] font-bold tracking-wider uppercase">
            Pricing Plans
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Select Your Subscription Tier
          </h2>
          <p className="text-[#9A9A9A] text-sm leading-relaxed">
            Transparent commission bounds. Free diagnostic status logs for drivers, tailored options for workshops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="glass-card p-8 rounded-[22px] flex flex-col justify-between border-[rgba(255,255,255,0.06)] h-full w-full hover:shadow-[0_0_25px_rgba(255,212,0,0.12)] transition-all duration-300">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Vehicle Driver</span>
                <h3 className="text-xl font-bold text-white mt-1">BASIC CORE</h3>
              </div>
              <p className="text-xs text-[#9A9A9A] leading-relaxed min-h-[40px]">Ideal for individual owners desiring predictive maintenance support.</p>
              <div className="py-4">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-[#9A9A9A] text-xs"> / Lifetime Free</span>
              </div>
              <ul className="space-y-3 text-xs text-[#9A9A9A]">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Add up to 3 cars</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> AI diagnostic reports</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Live repair updates</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Messaging with technicians</li>
              </ul>
            </div>
            <Link 
              href="/register" 
              className="mt-8 w-full text-center py-3 rounded-[16px] border border-[rgba(255,255,255,0.08)] hover:border-white transition-all text-xs font-semibold text-white"
            >
              Sign Up Now
            </Link>
          </div>

          {/* Card 2 - Highlighted */}
          <div className="glass-card p-8 rounded-[22px] flex flex-col justify-between border-[#FFD400] relative overflow-hidden h-full w-full hover:shadow-[0_0_25px_rgba(255,212,0,0.15)] transition-all duration-300">
            <div className="absolute top-0 right-0 px-3 py-1 bg-[#FFD400] text-black text-[9px] font-extrabold uppercase rounded-bl-[12px] tracking-wide select-none">
              Most Popular
            </div>
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#FFD400]">Workshop Specialized</span>
                <h3 className="text-xl font-bold text-white mt-1">GARAGE CORE</h3>
              </div>
              <p className="text-xs text-[#9A9A9A] leading-relaxed min-h-[40px]">For independent mechanic workshops looking to sync platform bookings.</p>
              <div className="py-4">
                <span className="text-4xl font-bold text-white">₹999</span>
                <span className="text-[#9A9A9A] text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-[#9A9A9A]">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Unlimited diagnostic bookings</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Manage up to 8 mechanics</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Full telemetry dashboard analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> PDF & digital invoice pipeline</li>
              </ul>
            </div>
            <Link 
              href="/register" 
              className="mt-8 w-full text-center py-3 rounded-[16px] bg-[#FFD400] hover:bg-[#FFC300] text-black font-bold text-xs transition-all hover:scale-[1.02]"
            >
              Get Workshop Seat
            </Link>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 rounded-[22px] flex flex-col justify-between border-[rgba(255,255,255,0.06)] h-full w-full md:col-span-2 lg:col-span-1 md:w-[calc(50%-16px)] md:mx-auto lg:w-full hover:shadow-[0_0_25px_rgba(255,212,0,0.12)] transition-all duration-300">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Platform Administrator</span>
                <h3 className="text-xl font-bold text-white mt-1">CONTROL MODULE</h3>
              </div>
              <p className="text-xs text-[#9A9A9A] leading-relaxed min-h-[40px]">For multi-outlet service groups requiring advanced control panels.</p>
              <div className="py-4">
                <span className="text-4xl font-bold text-white">₹4,999</span>
                <span className="text-[#9A9A9A] text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-[#9A9A9A]">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Multi-outlet dashboard views</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Security audit logs</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Platform transaction metrics</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#FFD400]" /> Custom API endpoints access</li>
              </ul>
            </div>
            <Link 
              href="/register" 
              className="mt-8 w-full text-center py-3 rounded-[16px] border border-[rgba(255,255,255,0.08)] hover:border-white transition-all text-xs font-semibold text-white"
            >
              Contact Sales
            </Link>
          </div>

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 px-6 md:px-16 lg:px-[120px] max-w-[800px] mx-auto border-t border-[rgba(255,255,255,0.06)]">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Frequently Asked Queries
          </h2>
          <p className="text-[#9A9A9A] text-sm leading-relaxed">
            Common questions regarding predictive machine learning models and mechanical routing parameters.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the AI Diagnostics compute vehicle severity?",
              a: "Our AI systems leverage descriptions of your car symptoms, matching key details with structured diagnostic databases. The system determines issue categories, severity percentages, and average pricing estimates dynamically."
            },
            {
              q: "Can the dashboard be synced if backend integrations are down?",
              a: "Yes. The platform is designed with immediate fallback pathways. In the absence of Twilio or Cloudinary environment details, the server logs communication directly to console endpoints and serves avatars locally."
            },
            {
              q: "Is interactive chat encrypted and secure?",
              a: "Yes. Message streams utilize WebSocket pipelines backed by JWT tokens, verifying authorization channels for drivers and mechanics."
            },
            {
              q: "How does invoice billing generation operate?",
              a: "Workshops enter line-item records on their dashboard consoles, immediately generating invoices that drivers can pay through digital payment gates."
            }
          ].map((item, index) => (
            <div 
              key={index}
              className="rounded-[18px] bg-[#111111] border border-[rgba(255,255,255,0.06)] overflow-hidden"
            >
              <button 
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-sm hover:bg-white/5 transition-colors text-white"
              >
                <span>{item.q}</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 text-[#FFD400] ${activeFaq === index ? "rotate-180" : ""}`}
                />
              </button>
              
              {activeFaq === index && (
                <div className="px-6 pb-5 pt-1 text-xs text-[#9A9A9A] leading-relaxed border-t border-[rgba(255,255,255,0.04)] bg-[#151515]">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-[rgba(255,255,255,0.06)] py-16 px-6 md:px-16 lg:px-[120px]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image 
                src="https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png" 
                alt="FIXORA logo" 
                width={25} 
                height={25}
                className="rounded-full"
              />
              <span className="font-bold text-lg tracking-tight text-white">FIXORA</span>
            </div>
            <p className="text-xs text-[#9A9A9A] leading-relaxed">
              Premium dashboard infrastructure for vehicle diagnostic assessments and garage operations.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-2 text-xs text-[#9A9A9A]">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#diagnostics" className="hover:text-white">AI Diagnostics</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#faq" className="hover:text-white font-sans">FAQ</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Auth Core</h4>
            <ul className="space-y-2 text-xs text-[#9A9A9A]">
              <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-white">Register</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Newsletter</h4>
            <p className="text-xs text-[#9A9A9A]">Subscribe for automated fleet notifications.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="fleet@domain.com" 
                className="bg-[#080808] border border-[#2A2A2A] rounded-[12px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD400] flex-1"
              />
              <button className="px-4 py-2 bg-white text-black hover:bg-[#FFD400] rounded-[12px] text-xs font-bold transition-colors">
                Join
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-[1400px] mx-auto border-t border-[rgba(255,255,255,0.06)] mt-12 pt-8 text-center text-[10px] text-[#9A9A9A]/60">
          &copy; {new Date().getFullYear()} FIXORA INC. ALL RIGHTS RESERVED.
        </div>
      </footer>

    </div>
  );
}
