import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { Package, Truck, CheckCircle2, Clock, ArrowRight } from "lucide-react";

export default function Orders() {
  const { orders } = useStore();

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#222222] pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Collector Dashboard</span>
            <h1 className="text-3xl font-black uppercase tracking-tight mt-1">Order History & Tracking</h1>
          </div>
          <Link to="/catalog" className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white mt-4 md:mt-0 flex items-center gap-1">
            Browse More Jerseys <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-[#141414] border border-zinc-800 p-16 text-center space-y-4">
            <Package className="w-12 h-12 text-zinc-500 mx-auto" />
            <h3 className="text-lg font-bold uppercase">No Orders Found</h3>
            <p className="text-xs font-mono text-zinc-400">You haven't placed any jersey archive orders yet.</p>
            <Link to="/catalog" className="inline-block bg-white text-black font-bold text-xs uppercase tracking-widest px-6 py-3">
              Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-6" data-testid="orders-list">
            {orders.map((ord, idx) => (
              <div key={ord.orderId || idx} className="bg-[#141414] border border-zinc-800 p-6 sm:p-8 space-y-6" data-testid={`order-card-${idx}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-white">{ord.orderId}</span>
                      <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[10px] font-mono uppercase tracking-widest text-green-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ord.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-400">Placed on {ord.date}</p>
                  </div>
                  <span className="text-lg font-mono font-bold text-white">${ord.total}</span>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Items Ordered</p>
                  <div className="space-y-2">
                    {ord.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-mono bg-zinc-900 p-3 border border-zinc-800">
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="text-zinc-400 text-[10px]">Size: {item.size} • Qty: {item.quantity} {item.customName ? `• Print: ${item.customName}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-2 border-t border-zinc-900">
                  <span>Shipping Address: <span className="text-white">{ord.shippingAddress}</span></span>
                  <button className="text-white underline hover:text-zinc-300" data-testid={`track-courier-${idx}`}>Track Courier</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
