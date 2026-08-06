import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { MOCK_JERSEYS } from "../mock";
import { ArrowRight, ShieldCheck, Sparkles, Trophy, Star, ChevronRight, RefreshCw, Box } from "lucide-react";

export default function Home() {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const trendingJerseys = MOCK_JERSEYS.filter(j => j.isTrending).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white selection:bg-white selection:text-black">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#222222]">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1683142032379-a95b8af4fda5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHw0fHxmb290YmFsbCUyMHNvY2NlciUyMGplcnNleSUyMG1pbmltYWxpc3QlMjBtb2RlbHxlbnwwfHx8fDE3ODYwNTI2MDl8MA&ixlib=rb-4.1.0&q=85" 
            alt="Hero Background" 
            className="w-full h-full object-cover filter grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 flex flex-col items-start space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-xs font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-white" /> Archive Edition 2026 • Match Grade Replicas
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter uppercase max-w-4xl leading-[1.05]">
            SACRED THREADS. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
              ICONIC MOMENTS.
            </span>
          </h1>

          <p className="text-zinc-400 max-w-xl text-base sm:text-lg font-light leading-relaxed">
            Curated collector-grade soccer jerseys from legendary historical campaigns. Precision stitched, sponsor verified, and custom player numbered.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
            <Link 
              to="/catalog" 
              className="bg-white text-black font-bold text-xs uppercase tracking-widest px-8 py-4 flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors shadow-2xl"
              data-testid="hero-explore-catalog-btn"
            >
              Explore Full Archive <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/catalog?filter=trending" 
              className="border border-zinc-700 bg-zinc-900/80 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors"
              data-testid="hero-trending-btn"
            >
              Trending Player Editions
            </Link>
          </div>

          {/* Key Archive Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-zinc-800/80 w-full text-zinc-400 font-mono text-xs">
            <div>
              <p className="text-white text-lg font-bold font-sans">100%</p>
              <p className="tracking-wider uppercase">Match Spec Detail</p>
            </div>
            <div>
              <p className="text-white text-lg font-bold font-sans">Free Global</p>
              <p className="tracking-wider uppercase">Shipping Over $150</p>
            </div>
            <div>
              <p className="text-white text-lg font-bold font-sans">Custom Name</p>
              <p className="tracking-wider uppercase">& Number Pressing</p>
            </div>
            <div>
              <p className="text-white text-lg font-bold font-sans">4.9 / 5.0</p>
              <p className="tracking-wider uppercase">Collector Rating</p>
            </div>
          </div>

        </div>
      </section>

      {/* Quick Category Switcher */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">Curated Collections</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">Shop By Category & Era</h2>
          </div>
          <Link to="/catalog" className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1 mt-4 md:mt-0">
            View All Catalogs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Retro Centenary", desc: "1980s - 2000s Masterpieces", image: MOCK_JERSEYS[0].image, link: "/catalog?era=retro" },
            { title: "Premier League", desc: "Invincibles & Title Winners", image: MOCK_JERSEYS[2].image, link: "/catalog?league=Premier+League" },
            { title: "Serie A Icons", desc: "Calcio Golden Era Kits", image: MOCK_JERSEYS[1].image, link: "/catalog?league=Serie+A" },
            { title: "International", desc: "World Cup Glory Editions", image: MOCK_JERSEYS[7].image, link: "/catalog?league=International" }
          ].map((cat, i) => (
            <Link 
              key={i} 
              to={cat.link}
              className="group relative h-80 bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-end p-6"
              data-testid={`category-card-${i}`}
            >
              <div className="absolute inset-0 z-0 opacity-40 group-hover:scale-105 group-hover:opacity-60 transition-all duration-500">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover filter grayscale" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent" />
              </div>
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">{cat.desc}</span>
                <h3 className="text-xl font-bold uppercase text-white flex items-center justify-between">
                  {cat.title}
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Player Editions Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#222222]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">Most Demanded</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">Trending Player Editions</h2>
          </div>
          <Link to="/catalog" className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1 mt-4 md:mt-0">
            Browse Archive <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trendingJerseys.map((jersey) => {
            const isWishlisted = wishlist.includes(jersey.id);
            return (
              <div key={jersey.id} className="group bg-[#141414] border border-zinc-800 flex flex-col justify-between" data-testid={`jersey-card-${jersey.id}`}>
                <div>
                  <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                    <img 
                      src={jersey.image} 
                      alt={jersey.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-white border border-zinc-800">
                      {jersey.year} • {jersey.club}
                    </div>

                    <button 
                      onClick={() => toggleWishlist(jersey.id)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-none flex items-center justify-center bg-black/70 backdrop-blur-md border border-zinc-800 transition-colors ${isWishlisted ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
                      data-testid={`wishlist-btn-${jersey.id}`}
                    >
                      <Star className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span>{jersey.league}</span>
                      <span className="text-white flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-white text-white" /> {jersey.rating} ({jersey.reviewsCount})
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
                  <span className="text-base font-bold font-mono text-white">${jersey.price}</span>
                  <Link 
                    to={`/product/${jersey.id}`}
                    className="bg-white text-black font-bold text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-zinc-200 transition-colors"
                    data-testid={`view-jersey-${jersey.id}`}
                  >
                    Configure & Buy
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Brand Banner / Quote */}
      <section className="bg-[#111111] border-y border-[#222222] py-20 my-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <Trophy className="w-10 h-10 mx-auto text-zinc-400" />
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
            "Football shirts are not merely polyester; they are wearable history, tribal armor, and portals to moments of pure euphoria."
          </h2>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Kits & Cultura Archive Manifesto</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] border-t border-[#222222] text-zinc-400 text-xs font-mono py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white text-black font-black flex items-center justify-center text-xs">KC</div>
              <span className="font-bold text-white uppercase tracking-widest">KnitCult</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">
              The premier destination for vintage match-worn aesthetics and collector-grade soccer jerseys.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-widest">Archive Links</h4>
            <Link to="/catalog" className="block hover:text-white">Full Catalog</Link>
            <Link to="/catalog?filter=trending" className="block hover:text-white">Trending Editions</Link>
            <Link to="/orders" className="block hover:text-white">Order Tracking</Link>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-widest">Customer Care</h4>
            <p className="hover:text-white cursor-pointer">Authenticity Guarantee</p>
            <p className="hover:text-white cursor-pointer">Global Express Shipping</p>
            <p className="hover:text-white cursor-pointer">Returns & Exchanges</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-widest">Newsletter</h4>
            <p className="text-zinc-500">Get early access to limited retro drops.</p>
            <div className="flex gap-2 pt-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-zinc-900 border border-zinc-800 px-3 py-2 text-white text-xs w-full focus:outline-none focus:border-white"
                data-testid="newsletter-input"
              />
              <button className="bg-white text-black px-4 py-2 font-bold uppercase text-[10px]" data-testid="newsletter-submit">Join</button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
