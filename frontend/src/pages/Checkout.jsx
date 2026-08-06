import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ShieldCheck, Lock, CreditCard, Truck, CheckCircle2, ChevronRight, ArrowRight } from "lucide-react";

export default function Checkout() {
  const { cart, subtotal, addOrder } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success

  // Form states
  const [formData, setFormData] = useState({
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex@cultura.com",
    address: "742 Evergreen Terrace",
    city: "Springfield",
    country: "United States",
    postalCode: "97477",
    cardNumber: "•••• •••• •••• 4242",
    cardExpiry: "08/28",
    cardCvc: "921"
  });

  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const subtotalAmount = cart.reduce((sum, item) => sum + item.jersey.price * item.quantity, 0);
  const shippingFee = subtotalAmount > 150 ? 0 : 15;
  const totalAmount = subtotalAmount + (cart.length > 0 ? shippingFee : 0);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCompleteOrder = (e) => {
    e.preventDefault();
    const newOrder = addOrder({
      total: totalAmount,
      items: cart.map(i => ({ name: i.jersey.name, size: i.size, quantity: i.quantity, customName: i.customName })),
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}`
    });
    setConfirmedOrder(newOrder);
    setStep(3);
  };

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
        
        {/* Checkout Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-3 border-b border-[#222222] pb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-black font-black flex items-center justify-center text-xs">KC</div>
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
          /* Success Order View */
          <div className="max-w-2xl mx-auto bg-[#141414] border border-zinc-800 p-8 sm:p-12 text-center space-y-6" data-testid="order-success-screen">
            <div className="w-20 h-20 bg-zinc-900 border border-white rounded-full flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Order Successfully Placed</span>
              <h2 className="text-3xl font-black uppercase tracking-tight">Thank You For Your Order</h2>
              <p className="text-xs font-mono text-zinc-400">
                Order Tracking ID: <span className="text-white font-bold">{confirmedOrder?.orderId || "KC-84920"}</span>
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 text-left space-y-3 text-xs font-mono">
              <p className="text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Order Summary</p>
              <div className="flex justify-between">
                <span>Shipping Address:</span>
                <span className="text-white text-right">{confirmedOrder?.shippingAddress || formData.address}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery:</span>
                <span className="text-white">3-5 Business Days (Express Archive Courier)</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-zinc-800">
                <span>Total Paid:</span>
                <span className="text-white">${confirmedOrder?.total || totalAmount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link 
                to="/orders" 
                className="bg-white text-black font-bold text-xs uppercase tracking-widest px-8 py-4 hover:bg-zinc-200 transition-colors"
                data-testid="go-to-orders-btn"
              >
                Track Live Order
              </Link>
              <Link 
                to="/catalog" 
                className="border border-zinc-700 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 hover:bg-zinc-800 transition-colors"
                data-testid="continue-shopping-btn"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Form Left */}
            <div className="lg:col-span-7 space-y-8">
              
              {step === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6 bg-[#141414] p-8 border border-zinc-800" data-testid="shipping-form">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h2 className="text-lg font-bold uppercase tracking-wider font-mono">1. Shipping Address</h2>
                    <span className="text-xs font-mono text-zinc-400">Secure 256-bit</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">First Name</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        value={formData.firstName} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                        data-testid="shipping-firstname"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Last Name</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        value={formData.lastName} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                        data-testid="shipping-lastname"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Email Address (For Tracking & Receipt)</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                      className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                      data-testid="shipping-email"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Street Address</label>
                    <input 
                      type="text" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
                      required 
                      className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                      data-testid="shipping-address"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">City</label>
                      <input 
                        type="text" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                        data-testid="shipping-city"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Country</label>
                      <input 
                        type="text" 
                        name="country" 
                        value={formData.country} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                        data-testid="shipping-country"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Postal Code</label>
                      <input 
                        type="text" 
                        name="postalCode" 
                        value={formData.postalCode} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                        data-testid="shipping-postal"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                    data-testid="proceed-to-payment-btn"
                  >
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleCompleteOrder} className="space-y-6 bg-[#141414] p-8 border border-zinc-800" data-testid="payment-form">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h2 className="text-lg font-bold uppercase tracking-wider font-mono">2. Payment Method</h2>
                    <button type="button" onClick={() => setStep(1)} className="text-xs font-mono text-zinc-400 underline">Edit Shipping</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-white bg-zinc-900 p-4 text-xs font-mono flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-white" />
                      <div>
                        <p className="font-bold text-white">Credit Card (Simulated)</p>
                        <p className="text-[10px] text-zinc-400">Instant Test Mode</p>
                      </div>
                    </div>
                    <div className="border border-zinc-800 bg-[#111111] p-4 text-xs font-mono flex items-center gap-3 opacity-60">
                      <Lock className="w-5 h-5 text-zinc-500" />
                      <div>
                        <p className="font-bold text-zinc-400">Apple Pay / Web3</p>
                        <p className="text-[10px] text-zinc-500">Quick Checkout</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Card Number</label>
                    <input 
                      type="text" 
                      name="cardNumber" 
                      value={formData.cardNumber} 
                      onChange={handleInputChange} 
                      required 
                      className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                      data-testid="payment-card-number"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Expiration Date</label>
                      <input 
                        type="text" 
                        name="cardExpiry" 
                        value={formData.cardExpiry} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                        data-testid="payment-card-expiry"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">CVC / CVV</label>
                      <input 
                        type="text" 
                        name="cardCvc" 
                        value={formData.cardCvc} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                        data-testid="payment-card-cvc"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1">
                    <p className="text-white font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-400" /> Secure Checkout Simulation</p>
                    <p>Clicking complete will instantly process your test order, generate tracking, and clear your shopping bag.</p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-2xl"
                    data-testid="complete-order-btn"
                  >
                    Complete Secure Order • ${totalAmount}
                  </button>
                </form>
              )}

            </div>

            {/* Cart Summary Right */}
            <div className="lg:col-span-5 bg-[#141414] border border-zinc-800 p-8 space-y-6">
              <h3 className="text-lg font-bold uppercase tracking-wider font-mono border-b border-zinc-800 pb-4">
                Order Summary ({cart.length} items)
              </h3>

              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center justify-between border-b border-zinc-900 pb-4">
                    <img src={item.jersey.image} alt={item.jersey.name} className="w-14 h-16 object-cover bg-zinc-900 border border-zinc-800" />
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.jersey.name}</h4>
                      <p className="text-[10px] font-mono text-zinc-400">Size: {item.size} • Qty: {item.quantity}</p>
                      {item.customName && item.customName !== "None" && (
                        <p className="text-[10px] font-mono text-zinc-300">Print: {item.customName}</p>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-white">${item.jersey.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">${subtotalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">{shippingFee === 0 ? 'FREE' : `$${shippingFee}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-3 border-t border-zinc-800">
                  <span>Total Due</span>
                  <span className="font-mono text-base">${totalAmount}</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
