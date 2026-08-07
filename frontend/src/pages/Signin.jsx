import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { User, Mail, Lock, Phone, ArrowRight, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Signin() {
  const { user, register, login, verifyOtp, resendOtp, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("next") || "/catalog";

  const [mode, setMode] = useState("login"); // login | register | otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  const submitRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, password, name, phone });
      setOtpEmail(email);
      setMode("otp");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      navigate(redirectTo);
    } catch (err) {
      const detail = err.response?.data?.detail || "Login failed";
      if (err.response?.status === 403 && /verify/i.test(detail)) {
        setOtpEmail(email);
        setMode("otp");
        toast.info(detail);
      } else {
        toast.error(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp({ email: otpEmail, code: otpCode });
      navigate(redirectTo);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(otpEmail);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not resend");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#141414] border border-zinc-800 p-8 sm:p-10 shadow-2xl">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex w-20 h-20 items-center justify-center mx-auto">
            <img src="/logo.svg" alt="KnitCult" className="w-full h-full object-contain" style={{ filter: "brightness(0) invert(1) contrast(1.4) drop-shadow(0 0 0.5px rgba(255,255,255,0.6))" }} />
          </Link>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {user.isLoggedIn
              ? "Collector Account"
              : mode === "otp"
                ? "Verify Your Email"
                : mode === "register"
                  ? "Create Archive Account"
                  : "Sign In to KnitCult"}
          </h2>
          <p className="text-xs font-mono text-zinc-400">
            {user.isLoggedIn
              ? "Manage your collection & track active shipments"
              : mode === "otp"
                ? `We sent a 6-digit code to ${otpEmail}`
                : "Access limited drops, order history & saved wishlists"}
          </p>
        </div>

        {user.isLoggedIn ? (
          <div className="space-y-6 text-center" data-testid="user-profile-view">
            <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="w-16 h-16 rounded-full bg-white text-black font-bold flex items-center justify-center text-xl mx-auto font-mono">
                {(user.name || user.email || "K").charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-base text-white">{user.name || user.email}</h3>
              <p className="text-xs font-mono text-zinc-400">{user.email}</p>
              {user.phone && <p className="text-xs font-mono text-zinc-500">{user.phone}</p>}
              <span className="inline-block mt-2 px-3 py-1 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest">
                {user.role === "admin" ? "Admin" : "Verified Collector"}
              </span>
            </div>
            <div className="space-y-3">
              <Link to="/orders" className="w-full block bg-white text-black py-3.5 font-bold text-xs uppercase tracking-widest text-center hover:bg-zinc-200 transition-colors" data-testid="profile-view-orders-btn">
                View Order History
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" className="w-full block border border-white bg-black text-white py-3.5 font-bold text-xs uppercase tracking-widest text-center hover:bg-zinc-900 transition-colors" data-testid="profile-admin-panel-btn">
                  Admin Panel
                </Link>
              )}
              <button onClick={logout} className="w-full border border-zinc-700 bg-zinc-900 text-zinc-300 py-3.5 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors" data-testid="sign-out-btn">
                Sign Out
              </button>
            </div>
          </div>
        ) : mode === "otp" ? (
          <form onSubmit={submitOtp} className="space-y-6" data-testid="otp-form">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">6-Digit Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} required className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-lg tracking-[0.8em] text-white font-mono focus:outline-none focus:border-white" data-testid="otp-input" />
              </div>
            </div>
            <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-xl" data-testid="otp-verify-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & Enter <ArrowRight className="w-4 h-4" /></>}
            </button>
            <div className="flex items-center justify-between text-xs font-mono">
              <button type="button" onClick={handleResend} className="text-zinc-400 hover:text-white underline" data-testid="otp-resend-btn">Resend code</button>
              <button type="button" onClick={() => setMode("login")} className="text-zinc-400 hover:text-white underline">Back to sign in</button>
            </div>
          </form>
        ) : (
          <form onSubmit={mode === "register" ? submitRegister : submitLogin} className="space-y-6" data-testid={`${mode}-form`}>
            {mode === "register" && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="auth-name-input" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="auth-phone-input" />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="auth-email-input" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="auth-password-input" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-xl" data-testid="auth-submit-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{mode === "register" ? "Create Account & Send OTP" : "Sign In to Archive"} <ArrowRight className="w-4 h-4" /></>}
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => setMode(mode === "register" ? "login" : "register")} className="text-xs font-mono text-zinc-400 hover:text-white underline" data-testid="toggle-auth-mode-btn">
                {mode === "register" ? "Already have an account? Sign In" : "New collector? Create an account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
