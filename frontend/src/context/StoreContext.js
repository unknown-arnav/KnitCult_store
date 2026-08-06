import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_JERSEYS } from "../mock";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("kits_user");
    return saved ? JSON.parse(saved) : { name: "Alex Morgan", email: "alex@cultura.com", isLoggedIn: true };
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("kits_cart");
    return saved ? JSON.parse(saved) : [
      { jersey: MOCK_JERSEYS[0], size: "M", quantity: 1, customName: "ZIDANE #5" }
    ];
  });

  const [wishlist, setWishlist] = useState(["j-01", "j-03"]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("kits_orders");
    return saved ? JSON.parse(saved) : [
      {
        orderId: "KC-94821",
        date: "2026-06-12",
        status: "In Transit",
        total: 125,
        items: [{ name: "Real Madrid 2001-02 Centenary", size: "L", quantity: 1 }],
        shippingAddress: "742 Evergreen Terrace, Springfield"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("kits_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("kits_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("kits_orders", JSON.stringify(orders));
  }, [orders]);

  const login = (email, name) => {
    const newUser = { name: name || email.split("@")[0], email, isLoggedIn: true };
    setUser(newUser);
  };

  const logout = () => {
    setUser({ name: "", email: "", isLoggedIn: false });
  };

  const addToCart = (jersey, size = "M", quantity = 1, customName = "None") => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.jersey.id === jersey.id && item.size === size && item.customName === customName);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { jersey, size, quantity, customName }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const addOrder = (orderData) => {
    const newOrder = {
      orderId: `KC-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split("T")[0],
      status: "Processing",
      ...orderData
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  return (
    <StoreContext.Provider value={{
      user, login, logout,
      cart, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen,
      wishlist, toggleWishlist,
      orders, addOrder
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
