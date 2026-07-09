"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck
} from "lucide-react";

// ── Password strength helpers ──────────────────────
interface StrengthRule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: StrengthRule[] = [
  { label: "At least 8 characters",    test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter (A–Z)",   test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter (a–z)",   test: (pw) => /[a-z]/.test(pw) },
  { label: "Number (0–9)",             test: (pw) => /[0-9]/.test(pw) },
  { label: "Special character (!@#…)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function getStrength(pw: string): number {
  return RULES.filter((r) => r.test(pw)).length;
}

function StrengthBar({ score }: { score: number }) {
  const colors = ["#FF5959", "#FF5959", "#FFD400", "#FFD400", "#7CFF7A"];
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const color  = score > 0 ? colors[score - 1] : "#2A2A2A";
  const label  = score > 0 ? labels[score - 1] : "";

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? color : "#2A2A2A" }}
          />
        ))}
      </div>
      {label && (
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
          {label}
        </p>
      )}
    </div>
  );
}

// ── Main form (needs useSearchParams so must be wrapped in Suspense) ──
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  // Token validation
  const [tokenStatus, setTokenStatus] = useState<
    "checking" | "valid" | "invalid"
  >("checking");

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Submission state
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const strength = getStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // ── Verify token on mount ──────────────────────
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        setTokenStatus(data.valid ? "valid" : "invalid");
      } catch {
        setTokenStatus("invalid");
      }
    })();
  }, [token]);

  // ── Submit new password ────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strength < 5) {
      setErrorMsg("Please meet all password requirements before submitting.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitStatus("loading");
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
        setErrorMsg(data.detail || "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitStatus("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render: checking token ──────────────────────
  if (tokenStatus === "checking") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 size={36} className="text-[#FFD400] animate-spin" />
        <p className="text-[#9A9A9A] text-xs">Verifying reset link...</p>
      </div>
    );
  }

  // ── Render: invalid / expired token ────────────
  if (tokenStatus === "invalid") {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-[16px] bg-[#FF5959]/10 border border-[#FF5959]/20 flex flex-col items-center gap-3 text-center">
          <XCircle size={36} className="text-[#FF5959]" />
          <div>
            <p className="text-[#FF5959] font-bold text-sm">Reset Link Expired</p>
            <p className="text-[#9A9A9A] text-xs mt-1 leading-relaxed">
              This reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
        </div>
        <Link
          href="/forgot-password"
          className="w-full py-3.5 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          Request a New Link <ArrowRight size={14} />
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-[#9A9A9A] hover:text-white text-xs transition-colors"
        >
          <ArrowLeft size={12} /> Back to Login
        </Link>
      </div>
    );
  }

  // ── Render: success ─────────────────────────────
  if (submitStatus === "success") {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-[16px] bg-[#7CFF7A]/10 border border-[#7CFF7A]/20 flex flex-col items-center gap-3 text-center">
          <ShieldCheck size={40} className="text-[#7CFF7A]" />
          <div>
            <p className="text-[#7CFF7A] font-bold text-base">Password Reset Successful!</p>
            <p className="text-[#9A9A9A] text-xs mt-2 leading-relaxed">
              Your password has been updated. You can now log in with your new credentials.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-3.5 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          Go to Login <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // ── Render: valid form ──────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">

      {/* Error */}
      {submitStatus === "error" && (
        <div className="p-3.5 rounded-[12px] bg-[#FF5959]/10 border border-[#FF5959]/20 text-[#FF5959] text-xs flex items-start gap-2 font-mono">
          <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      )}

      {/* New Password */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-[#9A9A9A]" size={14} />
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a strong password"
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[16px] pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400]/40 placeholder-[#9A9A9A] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-[#9A9A9A] hover:text-white transition-colors"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Strength bar */}
        {password.length > 0 && <StrengthBar score={strength} />}

        {/* Rules checklist */}
        {password.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <li key={rule.label} className="flex items-center gap-2 text-[10px]">
                  {passed
                    ? <CheckCircle2 size={10} className="text-[#7CFF7A] flex-shrink-0" />
                    : <XCircle      size={10} className="text-[#9A9A9A] flex-shrink-0" />}
                  <span className={passed ? "text-[#7CFF7A]" : "text-[#9A9A9A]"}>
                    {rule.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9A9A9A] block">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-[#9A9A9A]" size={14} />
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter your password"
            className={`w-full bg-[#111111] border rounded-[16px] pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:ring-1 placeholder-[#9A9A9A] transition-colors ${
              passwordsMismatch
                ? "border-[#FF5959] focus:border-[#FF5959] focus:ring-[#FF5959]/40"
                : passwordsMatch
                ? "border-[#7CFF7A] focus:border-[#7CFF7A] focus:ring-[#7CFF7A]/40"
                : "border-[#2A2A2A] focus:border-[#FFD400] focus:ring-[#FFD400]/40"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-[#9A9A9A] hover:text-white transition-colors"
            aria-label="Toggle confirm password visibility"
          >
            {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {passwordsMismatch && (
          <p className="text-[10px] text-[#FF5959] flex items-center gap-1 mt-1">
            <XCircle size={10} /> Passwords do not match
          </p>
        )}
        {passwordsMatch && (
          <p className="text-[10px] text-[#7CFF7A] flex items-center gap-1 mt-1">
            <CheckCircle2 size={10} /> Passwords match
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        id="reset-password-btn"
        disabled={loading || strength < 5 || !passwordsMatch}
        className="w-full py-3.5 rounded-[16px] font-bold bg-[#FFD400] text-black hover:bg-[#FFC300] hover:scale-[1.02] transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 uppercase tracking-wider mt-2"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            Reset Password <ArrowRight size={14} />
          </>
        )}
      </button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-[#9A9A9A] hover:text-white text-xs transition-colors pt-1"
      >
        <ArrowLeft size={12} /> Back to Login
      </Link>
    </form>
  );
}

// ── Page wrapper ────────────────────────────────────
export default function ResetPassword() {
  return (
    <div className="relative min-h-screen bg-transparent flex items-center justify-center p-6 text-white overflow-hidden font-sans">

      {/* Gold ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #FFD400 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md p-8 rounded-[22px] bg-[#151515] border border-[rgba(255,255,255,0.06)] shadow-2xl relative z-10 space-y-8">

        {/* Branding */}
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
          <p className="text-[#9A9A9A] text-xs">Secure Credential Reset</p>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-white">Set New Password</h1>
          <p className="text-[#9A9A9A] text-xs leading-relaxed">
            Create a strong password for your FIXORA account. All requirements must be met.
          </p>
        </div>

        {/* Form — needs Suspense because it reads search params */}
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-[#FFD400] animate-spin" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

      </div>
    </div>
  );
}
