"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Dish } from "./types";

const CART_KEY = "platoya_cart";
const ADDRESS_KEY = "platoya_address";

type CartContextValue = {
  items: CartItem[];
  address: string;
  setAddress: (value: string) => void;
  addDish: (dish: Dish) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddressState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const addr = localStorage.getItem(ADDRESS_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
      if (addr) setAddressState(addr);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(ADDRESS_KEY, address);
  }, [address, ready]);

  const setAddress = useCallback((value: string) => {
    setAddressState(value);
  }, []);

  const addDish = useCallback((dish: Dish) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.dishId === dish._id);
      if (existing) {
        return prev.map((i) =>
          i.dishId === dish._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          dishId: dish._id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          imageUrl: dish.imageUrl,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((dishId: string) => {
    setItems((prev) => prev.filter((i) => i.dishId !== dishId));
  }, []);

  const updateQuantity = useCallback((dishId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.dishId === dishId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      address,
      setAddress,
      addDish,
      removeItem,
      updateQuantity,
      clear,
      total,
      count,
    }),
    [items, address, setAddress, addDish, removeItem, updateQuantity, clear, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
