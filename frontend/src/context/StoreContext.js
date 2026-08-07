import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, productsApi, cartApi, ordersApi, toJersey } from "../lib/api";
import { toast } from "sonner";

const StoreContext = createContext();

const GUEST_CART_KEY = "kc_guest_cart";
const WISHLIST_KEY = "kc_wishlist";
const TOKEN_KEY = "kc_token";

const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const StoreProvider = ({ children }) => {
  // Auth state
  const [user, setUser] = useState({ isLoggedIn: false });
  const [authLoading, setAuthLoading] = useState(true);

  // Products
  const [jerseys, setJerseys] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Cart: list of { jersey, size, quantity, customName }
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist (client-side)
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Orders
  const [orders, setOrders] = useState([]);

  // Fetch current user from token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUser({ ...u, isLoggedIn: true }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser({ isLoggedIn: false });
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // Load product catalog
  useEffect(() => {
    setProductsLoading(true);
    productsApi
      .list({ limit: 100 })
      .then((data) => setJerseys((data.items || []).map(toJersey)))
      .catch(() => toast.error("Failed to load catalog"))
      .finally(() => setProductsLoading(false));
  }, []);

  // Sync wishlist to localStorage
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // ---- Cart hydration ----
  const hydrateCart = useCallback(
    (backendCart) => {
      if (!backendCart || !backendCart.items) return [];
      return backendCart.items
        .map((ci) => {
          const jersey = jerseys.find((j) => j.id === ci.product_id) || {
            id: ci.product_id,
            name: ci.name,
            image: ci.image,
            price: ci.price,
          };
          return {
            jersey,
            size: ci.size,
            quantity: ci.qty,
            customName: "None",
          };
        })
        .filter(Boolean);
    },
    [jerseys]
  );

  // Load cart when user changes
  useEffect(() => {
    if (!user.isLoggedIn) {
      const g = readGuestCart();
      const items = g
        .map((ci) => {
          const jersey = jerseys.find((j) => j.id === ci.product_id);
          return jersey ? { jersey, size: ci.size, quantity: ci.qty, customName: "None" } : null;
        })
        .filter(Boolean);
      setCart(items);
      return;
    }
    cartApi
      .get()
      .then((data) => setCart(hydrateCart(data)))
      .catch(() => {});
  }, [user.isLoggedIn, jerseys, hydrateCart]);

  // Fetch my orders on login
  useEffect(() => {
    if (!user.isLoggedIn) {
      setOrders([]);
      return;
    }
    ordersApi
      .mine()
      .then((data) => setOrders(data))
      .catch(() => {});
  }, [user.isLoggedIn]);

  // ---- Auth actions ----
  const register = async ({ email, password, name, phone }) => {
    const res = await authApi.register({ email, password, name, phone });
    toast.success("Verification code sent to your email");
    return res;
  };

  const verifyOtp = async ({ email, code }) => {
    const res = await authApi.verifyOtp({ email, code });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setUser({ ...res.user, isLoggedIn: true });
    // Migrate guest cart to backend
    const guest = readGuestCart();
    if (guest.length) {
      for (const g of guest) {
        try {
          await cartApi.add(g.product_id, g.size, g.qty);
        } catch (_) {}
      }
      writeGuestCart([]);
    }
    toast.success("Signed in");
    return res;
  };

  const login = async ({ email, password }) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setUser({ ...res.user, isLoggedIn: true });
    toast.success("Welcome back");
    return res;
  };

  const resendOtp = async (email) => {
    await authApi.resendOtp(email);
    toast.success("New code sent");
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser({ isLoggedIn: false });
    setCart([]);
    setOrders([]);
    toast.success("Signed out");
  };

  // ---- Cart actions ----
  const addToCart = async (jersey, size = "M", quantity = 1, customName = "None") => {
    if (user.isLoggedIn) {
      try {
        const data = await cartApi.add(jersey.id, size, quantity);
        setCart(hydrateCart(data));
      } catch (e) {
        toast.error("Could not add to cart");
        return;
      }
    } else {
      const g = readGuestCart();
      const idx = g.findIndex((it) => it.product_id === jersey.id && it.size === size);
      if (idx >= 0) g[idx].qty += quantity;
      else g.push({ product_id: jersey.id, size, qty: quantity });
      writeGuestCart(g);
      setCart((prev) => {
        const existing = prev.findIndex(
          (it) => it.jersey.id === jersey.id && it.size === size
        );
        if (existing >= 0) {
          const upd = [...prev];
          upd[existing].quantity += quantity;
          return upd;
        }
        return [...prev, { jersey, size, quantity, customName }];
      });
    }
    setIsCartOpen(true);
  };

  const removeFromCart = async (index) => {
    const item = cart[index];
    if (!item) return;
    if (user.isLoggedIn) {
      const data = await cartApi.remove(item.jersey.id, item.size);
      setCart(hydrateCart(data));
    } else {
      const g = readGuestCart().filter(
        (it) => !(it.product_id === item.jersey.id && it.size === item.size)
      );
      writeGuestCart(g);
      setCart((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateQuantity = async (index, delta) => {
    const item = cart[index];
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) return removeFromCart(index);
    if (user.isLoggedIn) {
      const data = await cartApi.update(item.jersey.id, item.size, newQty);
      setCart(hydrateCart(data));
    } else {
      const g = readGuestCart();
      const idx = g.findIndex((it) => it.product_id === item.jersey.id && it.size === item.size);
      if (idx >= 0) g[idx].qty = newQty;
      writeGuestCart(g);
      setCart((prev) => {
        const upd = [...prev];
        upd[index] = { ...upd[index], quantity: newQty };
        return upd;
      });
    }
  };

  const clearCart = async () => {
    if (user.isLoggedIn) {
      await cartApi.clear();
    } else {
      writeGuestCart([]);
    }
    setCart([]);
  };

  // ---- Wishlist actions ----
  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ---- Orders ----
  const placeOrder = async ({ phone, shipping_address, coupon_code }) => {
    const items = cart.map((c) => ({
      product_id: c.jersey.id,
      size: c.size,
      qty: c.quantity,
    }));
    const order = await ordersApi.place({ items, phone, shipping_address, coupon_code });
    setOrders((prev) => [order, ...prev]);
    return order;
  };

  const refreshOrders = async () => {
    if (!user.isLoggedIn) return;
    const data = await ordersApi.mine();
    setOrders(data);
  };

  return (
    <StoreContext.Provider
      value={{
        // Auth
        user,
        authLoading,
        register,
        verifyOtp,
        login,
        resendOtp,
        logout,

        // Products
        jerseys,
        productsLoading,

        // Cart
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,

        // Wishlist
        wishlist,
        toggleWishlist,

        // Orders
        orders,
        placeOrder,
        refreshOrders,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
