import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen } = useStore();

  const subtotal = cart.reduce((sum, item) => sum + item.jersey.price * item.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 199;
  const total = subtotal + (cart.length > 0 ? shipping : 0);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" data-testid="cart-drawer-overlay">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#121212] border-l border-[#262626] text-white flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-[#262626]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold tracking-wider uppercase font-mono">Your Shopping Bag ({cart.length})</h2>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="text-zinc-400 hover:text-white p-1"
              data-testid="close-cart-btn"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-zinc-400 py-16">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-zinc-800">
                  <ShoppingBag className="w-8 h-8 text-zinc-500" />
                </div>
                <p className="text-sm font-mono">Your bag is currently empty.</p>
                <Link 
                  to="/catalog" 
                  onClick={() => setIsCartOpen(false)}
                  className="bg-white text-black font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-zinc-200 transition-colors"
                  data-testid="empty-cart-browse-btn"
                >
                  Explore Catalog
                </Link>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.jersey.id}-${item.size}-${item.customName}-${index}`} className="flex gap-4 pb-6 border-b border-[#262626] items-start" data-testid={`cart-item-${index}`}>
                  <img src={item.jersey.image} alt={item.jersey.name} className="w-20 h-24 object-cover bg-zinc-900 border border-zinc-800" />
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{item.jersey.club} • {item.jersey.year}</span>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{item.jersey.name}</h3>
                    <div className="text-xs text-zinc-400 space-y-0.5 font-mono">
                      <p>Size: <span className="text-white font-bold">{item.size}</span></p>
                      {item.customName && item.customName !== "None" && (
                        <p>Print: <span className="text-white font-bold">{item.customName}</span></p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-zinc-700 bg-zinc-900">
                        <button 
                          onClick={() => updateQuantity(index, -1)} 
                          className="px-2 py-1 text-zinc-400 hover:text-white"
                          data-testid={`cart-decrease-${index}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-mono font-bold text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(index, 1)} 
                          className="px-2 py-1 text-zinc-400 hover:text-white"
                          data-testid={`cart-increase-${index}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-bold font-mono text-white">₹{item.jersey.price * item.quantity}</span>

                      <button 
                        onClick={() => removeFromCart(index)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        data-testid={`cart-remove-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cart.length > 0 && (
            <div className="p-6 bg-[#161616] border-t border-[#262626] space-y-4">
              <div className="space-y-2 text-xs font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping {subtotal > 5000 ? '(Free over ₹5000)' : ''}</span>
                  <span className="text-white">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
                  <span>Total</span>
                  <span className="font-mono text-base">₹{total}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link 
                  to="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg"
                  data-testid="proceed-to-checkout-btn"
                >
                  Proceed to Secure Checkout <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> Authenticity guaranteed • Secure 256-bit encryption
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
