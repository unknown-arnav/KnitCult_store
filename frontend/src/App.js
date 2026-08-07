import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { StoreProvider } from "./context/StoreContext";
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Signin from "./pages/Signin";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster theme="dark" position="top-right" richColors closeButton />
        <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-white selection:text-black font-sans">
          <Navbar />
          <CartDrawer />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/signin" element={<Signin />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
