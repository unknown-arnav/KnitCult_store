import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { productsApi, recommendationsApi, toJersey } from "../lib/api";
import { Star, ShieldCheck, Truck, RotateCcw, Check, ShoppingBag, Plus, Minus, ArrowRight, History, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useStore();

  const [jersey, setJersey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState([]);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedPlayer, setSelectedPlayer] = useState("CUSTOM NAME");
  const [customInput, setCustomInput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    productsApi
      .get(id)
      .then((p) => {
        const j = toJersey(p);
        setJersey(j);
        setSelectedSize(j.sizes[0] || "M");
        setSelectedPlayer(j.availablePlayers[0]);
        setActiveImage(j.image);
      })
      .catch(() => {
        toast.error("Product not found");
        navigate("/catalog");
      })
      .finally(() => setLoading(false));

    recommendationsApi.get(id, 4).then((data) => setRecs(data.items || [])).catch(() => {});
  }, [id, navigate]);

  if (loading || !jersey) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const finalPlayerName =
    selectedPlayer === "CUSTOM NAME"
      ? customInput ? customInput.toUpperCase() : "YOURNAME #99"
      : selectedPlayer;

  const handleAddToCart = () => {
    addToCart(jersey, selectedSize, quantity, finalPlayerName);
    toast.success("Added to your bag");
  };

  const campaign = jersey.historicalCampaign || {};

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-white">Catalog</Link>
          <span>/</span>
          <span className="text-white">{jersey.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] bg-[#161616] border border-zinc-800 overflow-hidden relative">
              <img src={activeImage} alt={jersey.name} className="w-full h-full object-cover transition-all duration-300" data-testid="product-main-image" />
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 text-xs font-mono uppercase tracking-widest text-white border border-zinc-700">
                {jersey.league} • {jersey.year}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveImage(jersey.image)} className={`aspect-[4/3] bg-zinc-900 border ${activeImage === jersey.image ? 'border-white' : 'border-zinc-800'} overflow-hidden`} data-testid="thumbnail-front-btn">
                <img src={jersey.image} alt="Front" className="w-full h-full object-cover" />
              </button>
              <button onClick={() => setActiveImage(jersey.backImage)} className={`aspect-[4/3] bg-zinc-900 border ${activeImage === jersey.backImage ? 'border-white' : 'border-zinc-800'} overflow-hidden`} data-testid="thumbnail-back-btn">
                <img src={jersey.backImage} alt="Back" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8 bg-[#141414] p-8 border border-zinc-800">
            <div className="space-y-2 border-b border-zinc-800 pb-6">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{jersey.club} Archive Replica</span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">{jersey.name}</h1>
              <div className="flex items-center justify-between pt-2">
                <span className="text-2xl font-mono font-bold text-white">${jersey.price}</span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
                  <Star className="w-4 h-4 fill-white text-white" />
                  <span className="font-bold">{jersey.rating}</span>
                  <span className="text-zinc-500">({jersey.reviewsCount} reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-zinc-300 font-light leading-relaxed">{jersey.description}</p>
              {campaign.title && (
                <button onClick={() => setHistoryModalOpen(true)} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs font-mono uppercase tracking-widest text-zinc-300 hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2" data-testid="open-history-modal-btn">
                  <History className="w-4 h-4 text-white" /> View Historical Campaign & Club Story
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400 uppercase tracking-widest">Select Size</span>
                <span className="text-zinc-400 underline cursor-pointer">Size Guide</span>
              </div>
              <div className="grid grid-cols-5 gap-2" data-testid="size-selector-group">
                {jersey.sizes.map((sz) => (
                  <button key={sz} onClick={() => setSelectedSize(sz)} className={`py-3 text-xs font-mono font-bold border transition-colors ${selectedSize === sz ? 'bg-white text-black border-white' : 'bg-zinc-900 text-white border-zinc-700 hover:border-zinc-500'}`} data-testid={`size-btn-${sz}`}>
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Official Name & Number Printing</label>
              <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="player-select">
                {jersey.availablePlayers.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
              {selectedPlayer === "CUSTOM NAME" && (
                <div className="pt-2">
                  <input type="text" placeholder="ENTER NAME & NUMBER (e.g. BECKHAM #7)" value={customInput} onChange={(e) => setCustomInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-white" data-testid="custom-player-input" />
                </div>
              )}
              <p className="text-[10px] font-mono text-zinc-500">Preview Print: <span className="text-white font-bold">{finalPlayerName}</span></p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">Quantity</label>
              <div className="flex items-center w-36 border border-zinc-700 bg-zinc-900">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2.5 text-zinc-400 hover:text-white" data-testid="qty-minus">-</button>
                <span className="flex-1 text-center font-mono text-xs font-bold text-white">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2.5 text-zinc-400 hover:text-white" data-testid="qty-plus">+</button>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button onClick={handleAddToCart} className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-xl" data-testid="add-to-cart-btn">
                <ShoppingBag className="w-4 h-4" /> Add To Bag • ${(jersey.price * quantity).toFixed(2)}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-white" /><span>100% Authenticity Verified</span></div>
              <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-white" /><span>Express Worldwide Shipping</span></div>
              <div className="flex items-center gap-2 col-span-2"><RotateCcw className="w-4 h-4 text-white" /><span>Hassle-Free 30-Day Collector Returns</span></div>
            </div>
          </div>
        </div>

        {recs.length > 0 && (
          <section className="border-t border-[#222222] pt-12" data-testid="recommendations-section">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">You might also like</span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">Recommended For You</h2>
              </div>
              <Link to="/catalog" className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white">Browse Archive →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {recs.map((r) => (
                <Link key={r.id} to={`/product/${r.id}`} className="group bg-[#141414] border border-zinc-800 overflow-hidden" data-testid={`rec-card-${r.id}`}>
                  <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-white border border-zinc-800">{r.year} • {r.club}</div>
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-bold text-sm text-white line-clamp-1 uppercase tracking-wide">{r.name}</h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-sm text-white font-bold">${r.price}</span>
                      <span className="text-[10px] font-mono text-zinc-500">match {Math.round((r.score || 0) * 100)}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {historyModalOpen && campaign.title && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" data-testid="history-modal">
          <div className="bg-[#141414] border border-zinc-700 max-w-lg w-full p-8 space-y-6 relative shadow-2xl">
            <button onClick={() => setHistoryModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white" data-testid="close-history-modal">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{jersey.club} • Campaign {jersey.year}</span>
              <h3 className="text-xl font-black uppercase tracking-tight">{campaign.title}</h3>
              {campaign.subtitle && <p className="text-sm text-zinc-400 italic">{campaign.subtitle}</p>}
            </div>
            <div className="space-y-4 text-xs font-mono text-zinc-300 leading-relaxed border-y border-zinc-800 py-4">
              <p>{campaign.body}</p>
            </div>
            <button onClick={() => setHistoryModalOpen(false)} className="w-full bg-white text-black py-3 font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors">
              Back to Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
