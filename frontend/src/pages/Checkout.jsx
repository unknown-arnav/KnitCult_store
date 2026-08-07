import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { couponsApi, paymentsApi } from "../lib/api";
import { ShieldCheck, Lock, CreditCard, Truck, CheckCircle2, ChevronRight, ArrowRight, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { cart, user, authLoading, placeOrder } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Shipping/Phone, 2: Payment, 3: Success
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState({
    name: user.name || "",
    line1: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null); // { discount_amount, code }
  const [couponError, setCouponError] = useState("");
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    if (!authLoading && !user.isLoggedIn) {
      navigate("/signin?next=/checkout");
    }
  }, [authLoading, user.isLoggedIn, navigate]);

  const subtotal = cart.reduce((s, i) => s + i.jersey.price * i.quantity, 0);
  const discount = couponInfo?.discount_amount || 0;
  const shippingFee = subtotal >= 150 ? 0 : 15;
  const total = Math.max(0, subtotal - discount) + (cart.length ? shippingFee : 0);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoadingCoupon(true);
    setCouponError("");
    try {
      const res = await couponsApi.validate(couponCode.trim().toUpperCase(), subtotal);
      if (!res.valid) {
        setCouponError(res.message);
        setCouponInfo(null);
      } else {
        setCouponInfo(res);
        toast.success(`${res.code} applied — saved $${res.discount_amount.toFixed(2)}`);
      }
    } catch (e) {
      setCouponError("Failed to validate coupon");
    } finally {
      setLoadingCoupon(false);
    }
  };

  const submitShipping = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const completeOrder = async (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Phone number required");
      return;
    }
    setPlacing(true);
    try {
      const order = await placeOrder({
        phone,
        shipping_address: address,
        coupon_code: couponInfo?.code || null,
      });
      // MOCK PhonePe payment
      await paymentsApi.create(order.id);
      setConfirmedOrder({ ...order, phone });
      setStep(3);
      toast.success("Order placed. Confirmation email sent.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold uppercase tracking-wider font-mono">Your Bag is Empty</h2>
        <p className="text-xs font-mono text-zinc-400">Add some legendary jerseys before checking out.</p>
        <Link to="/catalog" className="bg-white text-black font-bold text-xs uppercase tracking-widest px-8 py-3.5" data-testid="empty-checkout-browse">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col items-center justify-center text-center space-y-3 border-b border-[#222222] pb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/logo.svg" alt="KnitCult" className="w-full h-full object-contain" style={{ filter: "brightness(0) invert(1) contrast(1.4) drop-shadow(0 0 0.5px rgba(255,255,255,0.6))" }} />
            </div>
            <span className="font-bold uppercase tracking-widest text-sm">KnitCult Secure Checkout</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className={step >= 1 ? 'text-white font-bold' : ''}>1. Shipping</span>
            <ChevronRight className="w-3 h-3" />
            <span className={step >= 2 ? 'text-white font-bold' : ''}>2. Payment</span>
            <ChevronRight className="w-3 h-3" />
            <span className={step === 3 ? 'text-white font-bold' : ''}>3. Confirmation</span>
          </div>
        </div>

        {step === 3 ? (
          <div className="max-w-2xl mx-auto bg-[#141414] border border-zinc-800 p-8 sm:p-12 text-center space-y-6" data-testid="order-success-screen">
            <div className="w-20 h-20 bg-zinc-900 border border-white rounded-full flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Order Successfully Placed</span>
              <h2 className="text-3xl font-black uppercase tracking-tight">Thank You For Your Order</h2>
              <p className="text-xs font-mono text-zinc-400">
                Tracking ID: <span className="text-white font-bold" data-testid="order-tracking-id">{confirmedOrder?.tracking_id}</span>
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 text-left space-y-3 text-xs font-mono">
              <p className="text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Order Summary</p>
              <div className="flex justify-between"><span>Ship to:</span><span className="text-white text-right">{address.name}, {address.city}</span></div>
              <div className="flex justify-between"><span>Phone:</span><span className="text-white">{confirmedOrder?.phone}</span></div>
              <div className="flex justify-between"><span>Payment:</span><span className="text-white">Mock success (PhonePe stub)</span></div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-zinc-800"><span>Total Paid:</span><span className="text-white">${confirmedOrder?.total.toFixed(2)}</span></div>
            </div>
            <p className="text-xs font-mono text-zinc-400">A confirmation email has been sent to <span className="text-white">{user.email}</span></p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/orders" className="bg-white text-black font-bold text-xs uppercase tracking-widest px-8 py-4 hover:bg-zinc-200 transition-colors" data-testid="go-to-orders-btn">
                Track Live Order
              </Link>
              <Link to="/catalog" className="border border-zinc-700 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 hover:bg-zinc-800 transition-colors" data-testid="continue-shopping-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              {step === 1 && (
                <form onSubmit={submitShipping} className="space-y-6 bg-[#141414] p-8 border border-zinc-800" data-testid="shipping-form">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h2 className="text-lg font-bold uppercase tracking-wider font-mono">1. Shipping & Contact</h2>
                    <span className="text-xs font-mono text-zinc-400">Secure 256-bit</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Full Name</label>
                    <input type="text" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} required className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="shipping-name" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Phone Number (for order updates)</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98xxx xxxxx" className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="shipping-phone" />
                    <p className="text-[10px] font-mono text-zinc-500">You can change this phone number even after the order ships.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Street Address</label>
                    <input type="text" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} required className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="shipping-line1" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">City</label>
                      <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="shipping-city" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">State</label>
                      <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} required className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="shipping-state" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Postal Code</label>
                      <input type="text" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} required className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="shipping-zip" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Country</label>
                      <input type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} required className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="shipping-country" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors" data-testid="proceed-to-payment-btn">
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={completeOrder} className="space-y-6 bg-[#141414] p-8 border border-zinc-800" data-testid="payment-form">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h2 className="text-lg font-bold uppercase tracking-wider font-mono">2. Payment (PhonePe)</h2>
                    <button type="button" onClick={() => setStep(1)} className="text-xs font-mono text-zinc-400 underline">Edit Shipping</button>
                  </div>

                  <div className="p-6 bg-zinc-900 border border-white text-xs font-mono space-y-3">
                    <p className="text-white font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-400" /> PhonePe UPI Checkout — MOCK MODE</p>
                    <p className="text-zinc-400 leading-relaxed">
                      Clicking Complete Order will place your order, simulate a successful PhonePe payment, and email you the confirmation. Real PhonePe integration will be enabled once merchant credentials are configured.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 opacity-60">
                    <div className="border border-zinc-800 bg-[#111111] p-4 text-xs font-mono flex items-center gap-3">
                      <Lock className="w-5 h-5 text-zinc-500" />
                      <div><p className="font-bold text-zinc-400">Cards</p><p className="text-[10px] text-zinc-500">Enabled with PhonePe</p></div>
                    </div>
                    <div className="border border-zinc-800 bg-[#111111] p-4 text-xs font-mono flex items-center gap-3">
                      <Lock className="w-5 h-5 text-zinc-500" />
                      <div><p className="font-bold text-zinc-400">UPI</p><p className="text-[10px] text-zinc-500">Any UPI app</p></div>
                    </div>
                  </div>

                  <button type="submit" disabled={placing} className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-2xl" data-testid="complete-order-btn">
                    {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Complete Secure Order • $${total.toFixed(2)}`}
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-5 bg-[#141414] border border-zinc-800 p-8 space-y-6">
              <h3 className="text-lg font-bold uppercase tracking-wider font-mono border-b border-zinc-800 pb-4">Order Summary ({cart.length} items)</h3>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center justify-between border-b border-zinc-900 pb-4">
                    <img src={item.jersey.image} alt={item.jersey.name} className="w-14 h-16 object-cover bg-zinc-900 border border-zinc-800" />
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.jersey.name}</h4>
                      <p className="text-[10px] font-mono text-zinc-400">Size: {item.size} • Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-white">${(item.jersey.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1"><Tag className="w-3 h-3" /> Coupon Code</label>
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="FIRST10" className="flex-1 bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white" data-testid="coupon-input" />
                  <button type="button" onClick={applyCoupon} disabled={loadingCoupon || !couponCode.trim()} className="bg-white text-black px-4 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50" data-testid="apply-coupon-btn">
                    {loadingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-[10px] font-mono text-red-400">{couponError}</p>}
                {couponInfo?.valid && <p className="text-[10px] font-mono text-green-400" data-testid="coupon-applied-msg">{couponInfo.code} applied — saved ${couponInfo.discount_amount.toFixed(2)}</p>}
              </div>

              <div className="space-y-2 text-xs font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-white">${subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between"><span>Discount</span><span className="text-green-400">-${discount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Shipping</span><span className="text-white">{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-sm font-bold text-white pt-3 border-t border-zinc-800"><span>Total Due</span><span className="font-mono text-base">${total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
