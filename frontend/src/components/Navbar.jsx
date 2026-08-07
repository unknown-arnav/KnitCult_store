import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ShoppingBag, Heart, User, Search, ShieldCheck, ArrowRight, Menu, X } from "lucide-react";

export default function Navbar() {
  const { cart, wishlist, user, setIsCartOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-[#222222]" data-testid="site-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-1 group" data-testid="brand-logo-link">
          <div className="w-20 h-20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <img
              src="/logo.svg"
              alt="KnitCult"
              className="w-full h-full object-contain"
              style={{ filter: "brightness(0) invert(1) contrast(1.4) drop-shadow(0 0 0.5px rgba(255,255,255,0.6))" }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-white tracking-widest text-lg leading-none">KnitCult</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
          <Link to="/" className={`transition-colors hover:text-white ${location.pathname === '/' ? 'text-white border-b border-white pb-1' : 'text-zinc-400'}`} data-testid="nav-home">
            Home
          </Link>
          <Link to="/catalog" className={`transition-colors hover:text-white ${location.pathname === '/catalog' ? 'text-white border-b border-white pb-1' : 'text-zinc-400'}`} data-testid="nav-catalog">
            Catalog & Search
          </Link>
          <Link to="/orders" className={`transition-colors hover:text-white ${location.pathname === '/orders' ? 'text-white border-b border-white pb-1' : 'text-zinc-400'}`} data-testid="nav-orders">
            Order Tracking
          </Link>
          <Link to="/wishlist" className={`transition-colors hover:text-white ${location.pathname === '/wishlist' ? 'text-white border-b border-white pb-1' : 'text-zinc-400'}`} data-testid="nav-wishlist">
            Wishlist
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-5">
          <Link to="/signin" className="text-zinc-400 hover:text-white transition-colors p-2 flex items-center gap-2" data-testid="user-account-btn">
            <User className="w-5 h-5" />
            <span className="text-xs hidden lg:inline font-mono">{user.isLoggedIn ? user.name.split(" ")[0] : "Sign In"}</span>
          </Link>

          {/* Cart Trigger */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative bg-white text-black px-4 py-2.5 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-colors"
            data-testid="cart-drawer-trigger"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Bag</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-zinc-800 text-white font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-zinc-400 hover:text-white p-2"
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#161616] border-b border-[#333333] px-6 py-5 space-y-4" data-testid="mobile-menu-dropdown">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-white font-medium">Home</Link>
          <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-300">Catalog & Search</Link>
          <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-300">Order Tracking</Link>
          <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-300">Wishlist & Alerts</Link>
          <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-300">Account / Sign In</Link>
        </div>
      )}
    </header>
  );
}
