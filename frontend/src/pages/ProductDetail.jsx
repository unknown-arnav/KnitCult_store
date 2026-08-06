import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MOCK_JERSEYS } from "../mock";
import { useStore } from "../context/StoreContext";
import { Star, ShieldCheck, Truck, RotateCcw, Check, ShoppingBag, Plus, Minus, ArrowRight, History, X } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useStore();

  const jersey = MOCK_JERSEYS.find(j => j.id === id) || MOCK_JERSEYS[0];

  const [selectedSize, setSelectedSize] = useState(jersey.sizes[0]);
  const [selectedPlayer, setSelectedPlayer] = useState(jersey.availablePlayers[0]);
  const [customInput, setCustomInput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(jersey.image);
  const [addedToast, setAddedToast] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const finalPlayerName = selectedPlayer === "CUSTOM NAME" ? (customInput ? customInput.toUpperCase() : "YOURNAME #99") : selectedPlayer;

  const handleAddToCart = () => {
    addToCart(jersey, selectedSize, quantity, finalPlayerName);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-white">Catalog</Link>
          <span>/</span>
          <span className="text-white">{jersey.name}</span>
        </div>

        {/* Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left: Images */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] bg-[#161616] border border-zinc-800 overflow-hidden relative">
              <img 
                src={activeImage} 
                alt={jersey.name} 
                className="w-full h-full object-cover transition-all duration-300"
                data-testid="product-main-image"
              />
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 text-xs font-mono uppercase tracking-widest text-white border border-zinc-700">
                {jersey.league} • {jersey.year}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveImage(jersey.image)}
                className={`aspect-[4/3] bg-zinc-900 border ${activeImage === jersey.image ? 'border-white' : 'border-zinc-800'} overflow-hidden`}
                data-testid="thumbnail-front-btn"
              >
                <img src={jersey.image} alt="Front View" className="w-full h-full object-cover" />
              </button>
              <button 
                onClick={() => setActiveImage(jersey.backImage)}
                className={`aspect-[4/3] bg-zinc-900 border ${activeImage === jersey.backImage ? 'border-white' : 'border-zinc-800'} overflow-hidden`}
                data-testid="thumbnail-back-btn"
              >
                <img src={jersey.backImage} alt="Back View" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          {/* Right: Configuration & Details */}
          <div className="lg:col-span-5 space-y-8 bg-[#141414] p-8 border border-zinc-800">
            
            <div className="space-y-2 border-b border-zinc-800 pb-6">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{jersey.club} Archive Replica</span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">{jersey.name}</h1>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-2xl font-mono font-bold text-white">${jersey.price}</span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
                  <Star className="w-4 h-4 fill-white text-white" />
                  <span className="font-bold">{jersey.rating}</span>
                  <span className="text-zinc-500">({jersey.reviewsCount} collector reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                {jersey.description}
              </p>

              <button 
                onClick={() => setHistoryModalOpen(true)}
                className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs font-mono uppercase tracking-widest text-zinc-300 hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2"
                data-testid="open-history-modal-btn"
              >
                <History className="w-4 h-4 text-white" /> View Historical Campaign & Club Story
              </button>
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400 uppercase tracking-widest">Select Size</span>
                <span className="text-zinc-400 underline cursor-pointer">Size Guide</span>
              </div>
              <div className="grid grid-cols-5 gap-2" data-testid="size-selector-group">
                {jersey.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-3 text-xs font-mono font-bold border transition-colors ${selectedSize === sz ? 'bg-white text-black border-white' : 'bg-zinc-900 text-white border-zinc-700 hover:border-zinc-500'}`}
                    data-testid={`size-btn-${sz}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Printing Customizer */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">
                Official Name & Number Printing
              </label>
              <select 
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                data-testid="player-select"
              >
                {jersey.availablePlayers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {selectedPlayer === "CUSTOM NAME" && (
                <div className="pt-2">
                  <input 
                    type="text" 
                    placeholder="ENTER NAME & NUMBER (e.g. BECKHAM #7)" 
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-white"
                    data-testid="custom-player-input"
                  />
                </div>
              )}
              <p className="text-[10px] font-mono text-zinc-500">Preview Print: <span className="text-white font-bold">{finalPlayerName}</span></p>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Quantity</label>
              <div className="flex items-center w-36 border border-zinc-700 bg-zinc-900">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2.5 text-zinc-400 hover:text-white" data-testid="qty-minus">-</button>
                <span className="flex-1 text-center font-mono text-xs font-bold text-white">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2.5 text-zinc-400 hover:text-white" data-testid="qty-plus">+</button>
              </div>
            </div>

            {/* Add to Cart CTA */}
            <div className="space-y-3 pt-4">
              <button 
                onClick={handleAddToCart}
                className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-xl"
                data-testid="add-to-cart-btn"
              >
                <ShoppingBag className="w-4 h-4" /> Add To Bag • ${(jersey.price * quantity)}
              </button>

              {addedToast && (
                <div className="bg-zinc-900 border border-white text-white p-3 text-xs font-mono flex items-center justify-center gap-2 animate-pulse" data-testid="added-toast">
                  <Check className="w-4 h-4 text-green-400" /> Added to your shopping bag successfully!
                </div>
              )}
            </div>

            {/* Guarantee features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>100% Authenticity Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-white" />
                <span>Express Worldwide Shipping</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <RotateCcw className="w-4 h-4 text-white" />
                <span>Hassle-Free 30-Day Collector Returns</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Historical Campaign Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" data-testid="history-modal">
          <div className="bg-[#141414] border border-zinc-700 max-w-lg w-full p-8 space-y-6 relative shadow-2xl">
            <button 
              onClick={() => setHistoryModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              data-testid="close-history-modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{jersey.club} • Campaign {jersey.year}</span>
              <h3 className="text-xl font-black uppercase tracking-tight">{jersey.name}</h3>
            </div>

            <div className="space-y-4 text-xs font-mono text-zinc-300 leading-relaxed border-y border-zinc-800 py-4">
              <p>
                The <span className="text-white font-bold">{jersey.year}</span> season remains etched in football lore. Worn during dramatic European nights and domestic glory, this edition represents the pinnacle of club identity and heritage.
              </p>
              <p>
                Meticulously reproduced with archival accuracy, featuring high-density embroidery, historical sponsor placements, and breathable match-spec weave.
              </p>
            </div>

            <button 
              onClick={() => setHistoryModalOpen(false)}
              className="w-full bg-white text-black py-3 font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Back to Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
