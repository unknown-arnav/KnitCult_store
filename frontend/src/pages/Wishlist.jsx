import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { Star, Trash2, ArrowRight, ShoppingBag } from "lucide-react";

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, jerseys } = useStore();

  const wishlistedJerseys = jerseys.filter(j => wishlist.includes(j.id));

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#222222] pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Saved Collector Editions</span>
            <h1 className="text-3xl font-black uppercase tracking-tight mt-1">My Wishlist & Low Stock Alerts</h1>
          </div>
          <Link to="/catalog" className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white mt-4 md:mt-0 flex items-center gap-1">
            Browse Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {wishlistedJerseys.length === 0 ? (
          <div className="bg-[#141414] border border-zinc-800 p-16 text-center space-y-4">
            <Star className="w-12 h-12 text-zinc-500 mx-auto" />
            <h3 className="text-lg font-bold uppercase">Your Wishlist is Empty</h3>
            <p className="text-xs font-mono text-zinc-400">Save rare retro jerseys to track availability and price drops.</p>
            <Link to="/catalog" className="inline-block bg-white text-black font-bold text-xs uppercase tracking-widest px-6 py-3">
              Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" data-testid="wishlist-grid">
            {wishlistedJerseys.map((jersey) => (
              <div key={jersey.id} className="group bg-[#141414] border border-zinc-800 flex flex-col justify-between" data-testid={`wishlist-item-${jersey.id}`}>
                <div>
                  <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                    <img 
                      src={jersey.image} 
                      alt={jersey.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-white border border-zinc-800">
                      {jersey.year} • {jersey.club}
                    </div>

                    <button 
                      onClick={() => toggleWishlist(jersey.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-none flex items-center justify-center bg-black/70 backdrop-blur-md border border-zinc-800 text-red-500 hover:text-zinc-400 transition-colors"
                      data-testid={`remove-wishlist-${jersey.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {jersey.isLimited && (
                      <div className="absolute bottom-3 left-3 bg-white text-black px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-widest animate-pulse">
                        ⚠️ Low Stock Alert
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span>{jersey.league}</span>
                      <span className="text-white flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-white text-white" /> {jersey.rating}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white line-clamp-1 uppercase tracking-wide">
                      {jersey.name}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-2 font-light">
                      {jersey.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-zinc-900 mt-4">
                  <span className="text-base font-bold font-mono text-white">₹{jersey.price}</span>
                  <Link 
                    to={`/product/${jersey.id}`}
                    className="bg-white text-black font-bold text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                    data-testid={`wishlist-configure-${jersey.id}`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
