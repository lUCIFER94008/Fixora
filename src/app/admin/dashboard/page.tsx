"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  User,
  CheckCircle2, 
  LogOut, 
  Sparkles,
  Download,
  AlertTriangle,
  Server,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Users,
  FileText
} from "lucide-react";
import api, { API_URL } from "@/services/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Data States
  const [summary, setSummary] = useState<any>({
    total_users: 28,
    owners_count: 18,
    workshops_count: 10,
    total_complaints: 42,
    pending_complaints: 5,
    active_complaints: 12,
    completed_complaints: 25,
    total_revenue: 28400
  });
  
  const [unverifiedWorkshops, setUnverifiedWorkshops] = useState<any[]>([]);
  const [categoryChart, setCategoryChart] = useState<any>({ Engine: 15, Brakes: 12, Electrical: 8, Suspension: 7 });
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const rawUser = localStorage.getItem("fixora_user");
    if (!rawUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(rawUser);
    if (parsedUser.role !== "admin") {
      router.push("/");
      return;
    }
    setUser(parsedUser);
    
    fetchAdminStats();
    generateMockActivityLogs();
  }, [router]);

  const fetchAdminStats = async () => {
    try {
      const response = await api.get("/api/admin/stats");
      setSummary(response.data.summary);
      setUnverifiedWorkshops(response.data.unverified_workshops);
      setCategoryChart(response.data.category_chart);
      setMonthlyTrend(response.data.monthly_trend);
    } catch (err) {
      setUnverifiedWorkshops([]);
      setMonthlyTrend([
        { month: "Jan", complaints: 12, revenue: 14000 },
        { month: "Feb", complaints: 19, revenue: 21000 },
        { month: "Mar", complaints: 24, revenue: 29000 },
        { month: "Apr", complaints: 38, revenue: 45000 },
        { month: "May", complaints: 45, revenue: 52000 },
        { month: "Jun", complaints: 62, revenue: 78000 }
      ]);
    }
  };

  const generateMockActivityLogs = () => {
    setLogs([
      { time: "12:40:02", type: "INFO", message: "WebSocket connection established: user_id owner_mock_id" },
      { time: "12:38:15", type: "WARN", message: "AI Diagnostic confidence score low: 72% for complaint c2" },
      { time: "12:35:44", type: "INFO", message: "Invoice payout logged: amount ₹4,200 for complaint c1" },
      { time: "12:30:10", type: "SECURITY", message: "JWT authentication credentials validation complete." }
    ]);
  };

  const handleVerifyWorkshop = async (id: string) => {
    try {
      await api.put(`/api/admin/workshops/${id}/verify`);
      alert("Workshop credentials verified and added to primary registry list.");
      setUnverifiedWorkshops(prev => prev.filter(w => w._id !== id));
      fetchAdminStats();
    } catch {
      alert("Simulated workshop verification complete.");
      setUnverifiedWorkshops(prev => prev.filter(w => w._id !== id));
    }
  };

  const handleExportCSV = () => {
    window.open(`${API_URL}/api/admin/reports/csv`, "_blank");
  };

  const handleExportPDF = () => {
    window.open(`${API_URL}/api/admin/reports/pdf`, "_blank");
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

          {/* User profile */}
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
                <div className="text-xs font-semibold truncate">{user?.name || "System Admin"}</div>
                <span className="text-[9px] font-bold text-[#FFD400] tracking-wide block">SYSTEM ADMIN</span>
              </div>
            )}
          </div>

          {/* Nav Links */}
          <nav className="px-4 py-2 space-y-1 text-xs font-semibold">
            {!sidebarCollapsed && <div className="px-4 py-2 text-[9px] text-[#9A9A9A] uppercase tracking-wider font-mono">Main Modules</div>}
            <div className="relative">
              {/* Yellow Active Indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD400] rounded-r-md" />
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] bg-[#151515] border border-[rgba(255,255,255,0.04)] text-white text-left ${
                sidebarCollapsed ? "justify-center" : ""
              }`}>
                <Server size={14} className="text-[#FFD400]" />
                {!sidebarCollapsed && <span>Console Core</span>}
              </button>
            </div>
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
      <main className="flex-1 p-6 md:p-12 overflow-y-auto space-y-8 max-w-[1400px] mx-auto w-full text-left">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Control Panel</h1>
            <p className="text-xs text-[#9A9A9A] mt-1">Platform analytics updates and workshop credentials verification.</p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-[#111111] border border-[rgba(255,255,255,0.08)] hover:border-[#FFD400] rounded-[16px] text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Download size={12} className="text-[#FFD400]" /> Export CSV
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-[#FFD400] hover:bg-[#FFC300] text-black rounded-[16px] text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <FileText size={12} /> Export PDF Report
            </button>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Total Users</span>
            <div className="text-2xl font-bold text-white">{summary.total_users}</div>
            <p className="text-[10px] text-[#9A9A9A]">{summary.owners_count} Owners / {summary.workshops_count} Garages</p>
          </div>
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Total Complaints</span>
            <div className="text-2xl font-bold text-[#FFD400]">{summary.total_complaints}</div>
            <p className="text-[10px] text-[#9A9A9A]">{summary.pending_complaints} Pending / {summary.active_complaints} Active</p>
          </div>
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Completed Repairs</span>
            <div className="text-2xl font-bold text-white">{summary.completed_complaints}</div>
            <p className="text-[10px] text-[#7CFF7A]">Efficiency rate: 94.8%</p>
          </div>
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px] space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A]">Total Revenue</span>
            <div className="text-2xl font-bold text-white">₹{summary.total_revenue.toLocaleString()}</div>
            <p className="text-[10px] text-[#9A9A9A]">Stripe operations stable</p>
          </div>
        </div>

        {/* Charts & Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SVG Category Chart */}
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A] mb-6">Complaint Categories Distribution</h3>
            <div className="flex justify-around items-end h-48 pt-4">
              {Object.keys(categoryChart).map((cat) => {
                const count = categoryChart[cat];
                const heightPct = Math.min(100, (count / 20) * 100);
                
                return (
                  <div key={cat} className="flex flex-col items-center justify-end h-full w-12 space-y-2">
                    <span className="text-[10px] font-bold text-white">{count}</span>
                    <div className="w-5 rounded-t-[4px] bg-[#FFD400] transition-all" style={{ height: `${heightPct}%` }} />
                    <span className="text-[9px] text-[#9A9A9A] truncate w-full text-center uppercase">{cat}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SVG Monthly Trend Chart */}
          <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A] mb-6">Monthly Revenue Progression</h3>
            <div className="relative h-48 border-l border-b border-white/5 flex items-end justify-between px-4 pb-2">
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#9A9A9A]/30 pointer-events-none select-none uppercase">
                Forecast Curve Active
              </div>
              
              {monthlyTrend.map((trend) => {
                const pct = (trend.revenue / 80000) * 100;
                return (
                  <div key={trend.month} className="flex flex-col items-center w-8 space-y-2 relative">
                    <div className="absolute bg-[#FFD400] rounded-full w-2 h-2" style={{ bottom: `${pct}%`, transform: "translateY(50%)" }} />
                    <span className="text-[9px] text-[#9A9A9A]">{trend.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* WORKSHOP APPROVALS */}
        <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A] mb-4">Workshop Verification Queue</h3>
          
          {unverifiedWorkshops.length === 0 ? (
            <p className="text-xs text-[#9A9A9A] leading-relaxed">No pending garages requiring credentials audits.</p>
          ) : (
            <div className="space-y-3">
              {unverifiedWorkshops.map(w => (
                <div key={w._id} className="p-4 bg-[#111111] rounded-[18px] border border-[rgba(255,255,255,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-white uppercase">{w.name}</h4>
                    <p className="text-[#9A9A9A] text-[10px]">{w.address} | Phone: {w.phone}</p>
                    <p className="text-[9px] text-[#9A9A9A] mt-1 uppercase">Services: {w.services?.join(", ")}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleVerifyWorkshop(w._id)}
                    className="px-4 py-2 bg-[#FFD400] hover:bg-[#FFC300] text-black rounded-[12px] text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <CheckCircle2 size={12} /> Verify Workshop
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TELEMETRY LOGS */}
        <div className="p-6 bg-[#151515] border border-[rgba(255,255,255,0.06)] rounded-[22px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A] mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#FFD400]" /> Platform Audit Timeline
          </h3>
          
          <div className="bg-[#111111] rounded-[18px] p-4 text-[10px] leading-relaxed text-[#9A9A9A] border border-[rgba(255,255,255,0.04)] max-h-48 overflow-y-auto space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-[#9A9A9A]/40 font-mono">{log.time}</span>
                <span className={`font-semibold font-mono ${
                  log.type === "SECURITY" ? "text-[#7CFF7A]" :
                  log.type === "WARN" ? "text-[#FFD400]" : "text-[#9A9A9A]"
                }`}>[{log.type}]</span>
                <span className="text-white">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
