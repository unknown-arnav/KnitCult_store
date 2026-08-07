import React, { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Filter, Star, SlidersHorizontal, ArrowUpDown, X, Check } from "lucide-react";
import { useStore } from "../context/StoreContext";

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toggleWishlist, wishlist, jerseys, productsLoading } = useStore();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedLeague, setSelectedLeague] = useState(searchParams.get("league") || "All Leagues");
  const [selectedClub, setSelectedClub] = useState(searchParams.get("club") || "All Clubs");
  const [selectedYear, setSelectedYear] = useState(searchParams.get("era") || "All Eras");
  const [sortBy, setSortBy] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(500);

  const leagues = useMemo(() => ["All Leagues", ...Array.from(new Set(jerseys.map(j => j.league).filter(Boolean)))], [jerseys]);
  const clubs = useMemo(() => ["All Clubs", ...Array.from(new Set(jerseys.map(j => j.club).filter(Boolean)))], [jerseys]);
  const years = useMemo(() => ["All Eras", ...Array.from(new Set(jerseys.map(j => j.year).filter(Boolean))).sort()], [jerseys]);

  const filteredJerseys = useMemo(() => {
    return jerseys.filter(jersey => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        jersey.name.toLowerCase().includes(q) ||
        (jersey.club || "").toLowerCase().includes(q) ||
        (jersey.player || "").toLowerCase().includes(q) ||
        (jersey.description || "").toLowerCase().includes(q);
      
      const matchesLeague = selectedLeague === "All Leagues" || jersey.league === selectedLeague;
      const matchesClub = selectedClub === "All Clubs" || jersey.club === selectedClub;
      const matchesYear = selectedYear === "All Eras" || jersey.year === selectedYear;
      const matchesPrice = jersey.price <= maxPrice;
      const isTrendingFilter = searchParams.get("filter") === "trending" ? jersey.isTrending : true;

      return matchesSearch && matchesLeague && matchesClub && matchesYear && matchesPrice && isTrendingFilter;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.reviewsCount - a.reviewsCount; // popular
    });
  }, [jerseys, searchQuery, selectedLeague, selectedClub, selectedYear, maxPrice, sortBy, searchParams]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLeague("All Leagues");
    setSelectedClub("All Clubs");
    setSelectedYear("All Eras");
    setMaxPrice(500);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222222] pb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Archive Search & Filter</span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mt-1">Soccer Jersey Collection</h1>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search club, player, year..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] border border-zinc-800 pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-white font-mono"
              data-testid="catalog-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3.5 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters and Sorting Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-[#141414] p-4 border border-zinc-800">
          
          {/* League Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">League</label>
            <select 
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-xs text-white p-2.5 font-mono focus:outline-none"
              data-testid="filter-league-select"
            >
              {leagues.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Club Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Club / Team</label>
            <select 
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-xs text-white p-2.5 font-mono focus:outline-none"
              data-testid="filter-club-select"
            >
              {clubs.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Year/Era Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Campaign / Year</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-xs text-white p-2.5 font-mono focus:outline-none"
              data-testid="filter-year-select"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Max Price Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              <span>Max Price</span>
              <span className="text-white font-bold">${maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="90" 
              max="500" 
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-white bg-zinc-800 h-2 mt-2"
              data-testid="filter-price-slider"
            />
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Sort By</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-xs text-white p-2.5 font-mono focus:outline-none"
              data-testid="sort-by-select"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

        </div>

        {/* Active Filters Bar & Count */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <p>Showing <span className="text-white font-bold">{filteredJerseys.length}</span> archive jerseys</p>
          {(selectedLeague !== "All Leagues" || selectedClub !== "All Clubs" || selectedYear !== "All Eras" || searchQuery !== "" || maxPrice < 500) && (
            <button 
              onClick={clearFilters}
              className="text-white underline hover:text-zinc-300 flex items-center gap-1"
              data-testid="clear-filters-btn"
            >
              <X className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          )}
        </div>

        {/* Grid of Jerseys */}
        {filteredJerseys.length === 0 ? (
          <div className="bg-[#141414] border border-zinc-800 py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto flex items-center justify-center border border-zinc-800">
              <Search className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold uppercase tracking-wide">No Jerseys Found</h3>
            <p className="text-xs font-mono text-zinc-400 max-w-sm mx-auto">
              No jerseys match your exact search criteria. Try adjusting your club, league, or era filter.
            </p>
            <button 
              onClick={clearFilters} 
              className="bg-white text-black font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-zinc-200"
              data-testid="no-results-clear-btn"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredJerseys.map((jersey) => {
              const isWishlisted = wishlist.includes(jersey.id);
              return (
                <div key={jersey.id} className="group bg-[#141414] border border-zinc-800 flex flex-col justify-between" data-testid={`catalog-item-${jersey.id}`}>
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
                        className={`absolute top-3 right-3 w-8 h-8 rounded-none flex items-center justify-center bg-black/70 backdrop-blur-md border border-zinc-800 transition-colors ${isWishlisted ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
                        data-testid={`catalog-wishlist-btn-${jersey.id}`}
                      >
                        <Star className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>

                      {jersey.isLimited && (
                        <div className="absolute bottom-3 left-3 bg-white text-black px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-widest">
                          Limited Run
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
                    <span className="text-base font-bold font-mono text-white">${jersey.price}</span>
                    <Link 
                      to={`/product/${jersey.id}`}
                      className="bg-white text-black font-bold text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-zinc-200 transition-colors"
                      data-testid={`catalog-configure-btn-${jersey.id}`}
                    >
                      Configure & Buy
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
