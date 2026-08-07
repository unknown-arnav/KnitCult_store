import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ordersApi } from "../lib/api";
import { Package, Truck, CheckCircle2, Clock, ArrowRight, Phone, Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLE = {
  pending: "text-zinc-400",
  paid: "text-blue-400",
  processing: "text-yellow-400",
  in_transit: "text-orange-400",
  delivered: "text-green-400",
  cancelled: "text-red-400",
};

export default function Orders() {
  const { orders, user, authLoading, refreshOrders } = useStore();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  React.useEffect(() => {
    if (!authLoading && !user.isLoggedIn) navigate("/signin?next=/orders");
  }, [authLoading, user.isLoggedIn, navigate]);

  const startEditPhone = (order) => {
    setEditingId(order.id);
    setPhoneDraft(order.phone || "");
  };

  const savePhone = async (order) => {
    if (!phoneDraft.trim()) {
      toast.error("Phone cannot be empty");
      return;
    }
    setSavingPhone(true);
    try {
      await ordersApi.updatePhone(order.id, phoneDraft.trim());
      toast.success("Phone updated");
      setEditingId(null);
      refreshOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update phone");
    } finally {
      setSavingPhone(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>;
  }

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
            <Link to="/catalog" className="inline-block bg-white text-black font-bold text-xs uppercase tracking-widest px-6 py-3">Explore Catalog</Link>
          </div>
        ) : (
          <div className="space-y-6" data-testid="orders-list">
            {orders.map((ord) => (
              <div key={ord.id} className="bg-[#141414] border border-zinc-800 p-6 sm:p-8 space-y-6" data-testid={`order-card-${ord.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold font-mono text-white">{ord.tracking_id}</span>
                      <span className={`px-2.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[10px] font-mono uppercase tracking-widest ${STATUS_STYLE[ord.status] || 'text-zinc-400'} flex items-center gap-1`}>
                        <Clock className="w-3 h-3" /> {ord.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {ord.payment_status === "paid" ? "Paid" : ord.payment_status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-400">Placed on {new Date(ord.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-lg font-mono font-bold text-white">₹{ord.total.toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Items ({ord.items.length})</p>
                  <div className="space-y-2">
                    {ord.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs font-mono bg-zinc-900 p-3 border border-zinc-800">
                        {item.product_image && <img src={item.product_image} alt="" className="w-10 h-12 object-cover border border-zinc-800" />}
                        <div className="flex-1">
                          <p className="font-bold text-white">{item.product_name}</p>
                          <p className="text-zinc-400 text-[10px]">Size: {item.size} • Qty: {item.qty} • ${item.price_at_purchase.toFixed(2)} each</p>
                        </div>
                        <span className="text-white font-bold">₹{(item.price_at_purchase * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-900 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-zinc-400 uppercase tracking-widest text-[10px]">Ship to</span>
                    <p className="text-white">{ord.shipping_address?.name}, {ord.shipping_address?.city}, {ord.shipping_address?.country}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 uppercase tracking-widest text-[10px] flex items-center gap-1"><Phone className="w-3 h-3" /> Contact phone</span>
                      {ord.status !== "delivered" && ord.status !== "cancelled" && editingId !== ord.id && (
                        <button onClick={() => startEditPhone(ord)} className="text-white underline text-[10px] flex items-center gap-1" data-testid={`edit-phone-btn-${ord.id}`}>
                          <Edit2 className="w-3 h-3" /> Change
                        </button>
                      )}
                    </div>
                    {editingId === ord.id ? (
                      <div className="flex gap-2">
                        <input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid={`phone-input-${ord.id}`} />
                        <button onClick={() => savePhone(ord)} disabled={savingPhone} className="bg-white text-black px-3 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50" data-testid={`save-phone-btn-${ord.id}`}>
                          {savingPhone ? "..." : "Save"}
                        </button>
                        <button onClick={() => setEditingId(null)} className="border border-zinc-700 text-zinc-400 px-3 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-white">{ord.phone || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
