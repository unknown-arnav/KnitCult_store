import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { adminApi } from "../lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, RefreshCw, Package, Tag, ShoppingCart, Save, X } from "lucide-react";

const EMPTY_PRODUCT = {
  name: "",
  price: 0,
  image: "",
  images: [],
  description: "",
  club: "",
  league: "",
  era: "",
  year: "",
  player: "",
  tags: "",
  stock: { S: 0, M: 0, L: 0, XL: 0 },
  is_active: true,
  is_trending: false,
  historical_campaign: {},
};

const EMPTY_COUPON = {
  code: "",
  discount_type: "percent",
  discount_value: 10,
  expiry_type: "count",
  max_uses: 100,
  valid_from: null,
  valid_until: null,
  min_order_value: 0,
  is_active: true,
};

export default function AdminPanel() {
  const { user, authLoading } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("products");

  useEffect(() => {
    if (!authLoading) {
      if (!user.isLoggedIn) navigate("/signin?next=/admin");
      else if (user.role !== "admin") navigate("/");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user.isLoggedIn || user.role !== "admin") {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="border-b border-[#222222] pb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Owner Dashboard</span>
          <h1 className="text-3xl font-black uppercase tracking-tight mt-1">KnitCult Admin</h1>
        </div>

        <div className="flex gap-2 border-b border-[#222222]">
          {[
            { id: "products", label: "Products", icon: Package },
            { id: "coupons", label: "Coupons", icon: Tag },
            { id: "orders", label: "Orders", icon: ShoppingCart },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-5 py-3 text-xs font-mono uppercase tracking-widest border-b-2 flex items-center gap-2 ${tab === t.id ? "border-white text-white" : "border-transparent text-zinc-400 hover:text-white"}`} data-testid={`admin-tab-${t.id}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "products" && <ProductsTab />}
        {tab === "coupons" && <CouponsTab />}
        {tab === "orders" && <OrdersTab />}
      </div>
    </div>
  );
}

// ----------------- Products -----------------
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // product or "new"

  const load = () => {
    setLoading(true);
    adminApi.listProducts().then(setProducts).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const refreshCache = async () => {
    try {
      const res = await adminApi.refreshRecCache();
      toast.success(`Cache refreshed: ${res.products_cached} products`);
    } catch {
      toast.error("Cache refresh failed");
    }
  };

  const handleSave = async (data) => {
    try {
      if (editing === "new") {
        await adminApi.createProduct(data);
        toast.success("Product created");
      } else {
        await adminApi.updateProduct(editing.id, data);
        toast.success("Product updated");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try {
      await adminApi.deleteProduct(p.id);
      toast.success("Product deactivated");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-xs font-mono text-zinc-400">{products.length} products</p>
        <div className="flex gap-3">
          <button onClick={refreshCache} className="text-xs font-mono border border-zinc-700 text-zinc-300 px-4 py-2 hover:text-white flex items-center gap-2" data-testid="admin-refresh-cache-btn">
            <RefreshCw className="w-3 h-3" /> Refresh Rec Cache
          </button>
          <button onClick={() => setEditing("new")} className="bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-2 flex items-center gap-2" data-testid="admin-new-product-btn">
            <Plus className="w-3 h-3" /> New Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="bg-[#141414] border border-zinc-800 overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[#161616] border-b border-zinc-800 text-zinc-400 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Club</th>
                <th className="text-right p-3">Price</th>
                <th className="text-center p-3">Trend</th>
                <th className="text-center p-3">Active</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-zinc-900 hover:bg-[#161616]" data-testid={`admin-product-row-${p.id}`}>
                  <td className="p-3 flex items-center gap-3">
                    {p.image && <img src={p.image} alt="" className="w-10 h-12 object-cover" />}
                    <span className="text-white">{p.name}</span>
                  </td>
                  <td className="p-3 text-zinc-300">{p.club}</td>
                  <td className="p-3 text-right text-white">${p.price.toFixed(2)}</td>
                  <td className="p-3 text-center">{p.is_trending ? "★" : ""}</td>
                  <td className="p-3 text-center">{p.is_active ? "✓" : "✗"}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => setEditing(p)} className="text-white hover:underline" data-testid={`admin-edit-product-${p.id}`}><Edit2 className="w-3.5 h-3.5 inline" /></button>
                    <button onClick={() => handleDelete(p)} className="text-red-400 hover:underline" data-testid={`admin-delete-product-${p.id}`}><Trash2 className="w-3.5 h-3.5 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing === "new" ? EMPTY_PRODUCT : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({
    ...EMPTY_PRODUCT,
    ...initial,
    historical_campaign: initial.historical_campaign || {},
  });
  const [saving, setSaving] = useState(false);
  const [stockRows, setStockRows] = useState(
    Object.entries(f.stock || {}).map(([size, qty]) => ({ size, qty }))
  );
  const [imagesText, setImagesText] = useState((f.images || []).join("\n"));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const stock = {};
    stockRows.forEach((r) => {
      if (r.size.trim()) stock[r.size.trim().toUpperCase()] = Number(r.qty) || 0;
    });
    const images = imagesText.split(/\n/).map((s) => s.trim()).filter(Boolean);
    await onSave({ ...f, stock, images, price: Number(f.price) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <form onSubmit={submit} className="bg-[#141414] border border-zinc-700 max-w-3xl w-full p-8 space-y-5 my-8" data-testid="admin-product-form">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-lg font-black uppercase tracking-tight">{initial === EMPTY_PRODUCT ? "New Product" : `Edit: ${initial.name}`}</h3>
          <button type="button" onClick={onCancel}><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required />
          <Field label="Price (USD)" type="number" value={f.price} onChange={(v) => setF({ ...f, price: v })} required />
          <Field label="Club" value={f.club} onChange={(v) => setF({ ...f, club: v })} />
          <Field label="League" value={f.league} onChange={(v) => setF({ ...f, league: v })} />
          <Field label="Era (e.g. 2000s)" value={f.era} onChange={(v) => setF({ ...f, era: v })} />
          <Field label="Year" value={f.year} onChange={(v) => setF({ ...f, year: v })} />
          <Field label="Player" value={f.player} onChange={(v) => setF({ ...f, player: v })} />
          <Field label="Main Image URL" value={f.image} onChange={(v) => setF({ ...f, image: v })} />
        </div>
        <TextArea label="Additional Image URLs (one per line)" value={imagesText} onChange={setImagesText} rows={3} />
        <TextArea label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} rows={3} />
        <TextArea label="Tags (comma-separated, e.g. category:jersey, club:arsenal, player:henry, color:red)" value={f.tags} onChange={(v) => setF({ ...f, tags: v })} rows={2} />

        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Stock per size</label>
          <div className="grid grid-cols-4 gap-2">
            {stockRows.map((r, i) => (
              <div key={i} className="flex gap-1">
                <input value={r.size} onChange={(e) => { const n = [...stockRows]; n[i].size = e.target.value; setStockRows(n); }} placeholder="Size" className="w-16 bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-white font-mono" />
                <input type="number" value={r.qty} onChange={(e) => { const n = [...stockRows]; n[i].qty = e.target.value; setStockRows(n); }} className="w-16 bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-white font-mono" />
                <button type="button" onClick={() => setStockRows(stockRows.filter((_, k) => k !== i))} className="text-zinc-400 px-1">×</button>
              </div>
            ))}
            <button type="button" onClick={() => setStockRows([...stockRows, { size: "", qty: 0 }])} className="text-xs font-mono border border-zinc-700 text-zinc-300 px-3 py-1 hover:text-white">+ Size</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <label className="flex items-center gap-2 text-zinc-300"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Active</label>
          <label className="flex items-center gap-2 text-zinc-300"><input type="checkbox" checked={f.is_trending} onChange={(e) => setF({ ...f, is_trending: e.target.checked })} /> Trending</label>
        </div>

        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Historical Campaign (optional)</label>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <input placeholder="Title" value={f.historical_campaign?.title || ""} onChange={(e) => setF({ ...f, historical_campaign: { ...f.historical_campaign, title: e.target.value } })} className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-white" />
            <input placeholder="Subtitle" value={f.historical_campaign?.subtitle || ""} onChange={(e) => setF({ ...f, historical_campaign: { ...f.historical_campaign, subtitle: e.target.value } })} className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-white" />
          </div>
          <textarea placeholder="Story body" value={f.historical_campaign?.body || ""} onChange={(e) => setF({ ...f, historical_campaign: { ...f.historical_campaign, body: e.target.value } })} rows={3} className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white font-mono" />
        </div>

        <div className="flex gap-3 pt-3">
          <button type="submit" disabled={saving} className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50" data-testid="admin-save-product-btn">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3" /> Save Product</>}
          </button>
          <button type="button" onClick={onCancel} className="border border-zinc-700 text-zinc-300 px-6 py-3 text-xs font-bold uppercase tracking-widest">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{label}</label>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white" />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{label}</label>
      <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white" />
    </div>
  );
}

// ----------------- Coupons -----------------
function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.listCoupons().then(setCoupons).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (data) => {
    try {
      const clean = { ...data };
      if (clean.expiry_type === "count") clean.valid_until = null;
      if (clean.expiry_type === "time") clean.max_uses = null;
      clean.max_uses = clean.max_uses ? Number(clean.max_uses) : null;
      clean.discount_value = Number(clean.discount_value);
      clean.min_order_value = Number(clean.min_order_value || 0);
      if (editing === "new") await adminApi.createCoupon(clean);
      else await adminApi.updateCoupon(editing.id, clean);
      toast.success("Coupon saved");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await adminApi.deleteCoupon(c.id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-xs font-mono text-zinc-400">{coupons.length} coupons</p>
        <button onClick={() => setEditing("new")} className="bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-2 flex items-center gap-2" data-testid="admin-new-coupon-btn">
          <Plus className="w-3 h-3" /> New Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="bg-[#141414] border border-zinc-800">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[#161616] border-b border-zinc-800 text-zinc-400 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Discount</th>
                <th className="text-left p-3">Expiry</th>
                <th className="text-right p-3">Uses</th>
                <th className="text-center p-3">Active</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-zinc-900 hover:bg-[#161616]" data-testid={`admin-coupon-row-${c.id}`}>
                  <td className="p-3 text-white font-bold">{c.code}</td>
                  <td className="p-3 text-zinc-300">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : `$${c.discount_value}`}
                    {c.min_order_value > 0 && <span className="text-zinc-500"> (min ${c.min_order_value})</span>}
                  </td>
                  <td className="p-3 text-zinc-300">
                    {c.expiry_type === "count" ? `Count: ${c.max_uses ?? "∞"}` : `Until: ${c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "—"}`}
                  </td>
                  <td className="p-3 text-right text-white">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                  <td className="p-3 text-center">{c.is_active ? "✓" : "✗"}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => setEditing(c)} className="text-white hover:underline" data-testid={`admin-edit-coupon-${c.id}`}><Edit2 className="w-3.5 h-3.5 inline" /></button>
                    <button onClick={() => remove(c)} className="text-red-400 hover:underline" data-testid={`admin-delete-coupon-${c.id}`}><Trash2 className="w-3.5 h-3.5 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CouponForm initial={editing === "new" ? EMPTY_COUPON : editing} onSave={save} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}

function CouponForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({ ...EMPTY_COUPON, ...initial });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(f);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <form onSubmit={submit} className="bg-[#141414] border border-zinc-700 max-w-lg w-full p-8 space-y-5" data-testid="admin-coupon-form">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-lg font-black uppercase tracking-tight">{initial === EMPTY_COUPON ? "New Coupon" : `Edit: ${initial.code}`}</h3>
          <button type="button" onClick={onCancel}><X className="w-5 h-5" /></button>
        </div>

        <Field label="Code" value={f.code} onChange={(v) => setF({ ...f, code: v.toUpperCase() })} required />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Discount Type</label>
            <select value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white font-mono">
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat ($)</option>
            </select>
          </div>
          <Field label="Discount Value" type="number" value={f.discount_value} onChange={(v) => setF({ ...f, discount_value: v })} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Expiry Type</label>
            <select value={f.expiry_type} onChange={(e) => setF({ ...f, expiry_type: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white font-mono" data-testid="coupon-expiry-type-select">
              <option value="count">Count-based (max uses)</option>
              <option value="time">Time-based (until date)</option>
            </select>
          </div>
          {f.expiry_type === "count" ? (
            <Field label="Max Uses" type="number" value={f.max_uses ?? ""} onChange={(v) => setF({ ...f, max_uses: v })} />
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Valid Until</label>
              <input type="datetime-local" value={f.valid_until ? new Date(f.valid_until).toISOString().slice(0, 16) : ""} onChange={(e) => setF({ ...f, valid_until: e.target.value ? new Date(e.target.value).toISOString() : null })} className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white font-mono" />
            </div>
          )}
        </div>

        <Field label="Minimum Order Value ($)" type="number" value={f.min_order_value} onChange={(v) => setF({ ...f, min_order_value: v })} />

        <label className="flex items-center gap-2 text-xs font-mono text-zinc-300"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Active</label>

        <div className="flex gap-3 pt-3">
          <button type="submit" disabled={saving} className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50" data-testid="admin-save-coupon-btn">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3" /> Save Coupon</>}
          </button>
          <button type="button" onClick={onCancel} className="border border-zinc-700 text-zinc-300 px-6 py-3 text-xs font-bold uppercase tracking-widest">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ----------------- Orders -----------------
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.listOrders().then(setOrders).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (id, status) => {
    try {
      await adminApi.updateOrderStatus(id, status);
      toast.success(`Status → ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="bg-[#141414] border border-zinc-800">
      <table className="w-full text-xs font-mono">
        <thead className="bg-[#161616] border-b border-zinc-800 text-zinc-400 uppercase tracking-widest text-[10px]">
          <tr>
            <th className="text-left p-3">Tracking</th>
            <th className="text-left p-3">Phone</th>
            <th className="text-right p-3">Total</th>
            <th className="text-left p-3">Payment</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-zinc-900" data-testid={`admin-order-row-${o.id}`}>
              <td className="p-3 text-white">{o.tracking_id}</td>
              <td className="p-3 text-zinc-300">{o.phone}</td>
              <td className="p-3 text-right text-white">${o.total.toFixed(2)}</td>
              <td className="p-3 text-zinc-300">{o.payment_status}</td>
              <td className="p-3">
                <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-white font-mono" data-testid={`admin-order-status-${o.id}`}>
                  {["pending", "paid", "processing", "in_transit", "delivered", "cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-zinc-400">{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
