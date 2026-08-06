import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { User, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Signin() {
  const { user, login, logout } = useStore();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("alex@cultura.com");
  const [password, setPassword] = useState("••••••••");
  const [name, setName] = useState("Alex Morgan");
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, name);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      navigate("/catalog");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#141414] border border-zinc-800 p-8 sm:p-10 shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex w-12 h-12 bg-white text-black font-black items-center justify-center text-lg rounded-none mx-auto">
            KC
          </Link>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {user.isLoggedIn ? "Collector Account" : (isRegister ? "Create Archive Account" : "Sign In to Kits & Cultura")}
          </h2>
          <p className="text-xs font-mono text-zinc-400">
            {user.isLoggedIn ? "Manage your collection & track active shipments" : "Access limited drops, order history & saved wishlists"}
          </p>
        </div>

        {successMsg && (
          <div className="bg-zinc-900 border border-white p-4 text-xs font-mono text-center text-green-400 flex items-center justify-center gap-2" data-testid="signin-success-banner">
            <CheckCircle2 className="w-4 h-4" /> Authentication successful! Redirecting...
          </div>
        )}

        {user.isLoggedIn && !successMsg ? (
          <div className="space-y-6 text-center" data-testid="user-profile-view">
            <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="w-16 h-16 rounded-full bg-white text-black font-bold flex items-center justify-center text-xl mx-auto font-mono">
                {user.name.charAt(0)}
              </div>
              <h3 className="font-bold text-base text-white">{user.name}</h3>
              <p className="text-xs font-mono text-zinc-400">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest">
                VIP Collector Tier 1
              </span>
            </div>

            <div className="space-y-3">
              <Link 
                to="/orders" 
                className="w-full bg-white text-black py-3.5 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                data-testid="profile-view-orders-btn"
              >
                View Order History
              </Link>
              <button 
                onClick={logout}
                className="w-full border border-zinc-700 bg-zinc-900 text-zinc-300 py-3.5 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                data-testid="sign-out-btn"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="signin-form">
            
            {isRegister && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required 
                    className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                    data-testid="auth-name-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                  data-testid="auth-email-input"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                  data-testid="auth-password-input"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-xl"
              data-testid="auth-submit-btn"
            >
              {isRegister ? "Create Account & Enter" : "Sign In to Archive"} <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs font-mono text-zinc-400 hover:text-white underline"
                data-testid="toggle-auth-mode-btn"
              >
                {isRegister ? "Already have an account? Sign In" : "New collector? Create an account"}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
