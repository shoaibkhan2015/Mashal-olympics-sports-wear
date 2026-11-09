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
import Link from "next/link";
import { Check, X } from "lucide-react";
import type { Product } from "@/lib/supabase/types";

export type BasketLine = {
  productId: string;
  quantity: number;
  size?: string;
  colour?: string;
};

const basketKey = "mashal-basket-v1";
type BasketContextValue = {
  basket: BasketLine[];
  count: number;
  hydrated: boolean;
  notice: string;
  addToBasket: (
    product: Product,
    quantity?: number,
    size?: string,
    colour?: string,
  ) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, size?: string, colour?: string) => void;
  clearBasket: () => void;
  dismissNotice: () => void;
};

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(basketKey);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (
            Array.isArray(parsed) &&
            parsed.every(
              (line) =>
                typeof line?.productId === "string" &&
                Number.isInteger(line.quantity) &&
                line.quantity >= 1 &&
                line.quantity <= 100 &&
                (line.size === undefined || typeof line.size === "string") &&
                (line.colour === undefined || typeof line.colour === "string"),
            )
          ) {
            setBasket(parsed);
          }
        }
      } catch (error) {
        console.error("Could not restore the basket:", error);
        setNotice("Your saved basket could not be restored in this browser.");
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(basketKey, JSON.stringify(basket));
    } catch (error) {
      console.error("Could not persist the basket:", error);
      window.setTimeout(() => setNotice("Your basket could not be saved in this browser."), 0);
    }
  }, [basket, hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const addToBasket = useCallback(
    async (product: Product, quantity = 1, size = "", colour = "") => {
      if (
        !product.is_active ||
        product.price === null ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        throw new Error("This product cannot be added to your basket.");
      }
      if (product.stock_quantity !== null && product.stock_quantity < quantity) {
        throw new Error("This product is currently out of stock.");
      }
      if ((product.available_sizes ?? []).length && !product.available_sizes.includes(size)) {
        throw new Error("Choose an available size first.");
      }
      if ((product.available_colours ?? []).length && !product.available_colours.includes(colour)) {
        throw new Error("Choose an available colour first.");
      }

      const existing = basket.find(
        (line) =>
          line.productId === product.id &&
          (line.size ?? "") === size &&
          (line.colour ?? "") === colour,
      );
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      const totalProductQuantity = basket
        .filter((line) => line.productId === product.id)
        .reduce((total, line) => total + line.quantity, quantity);
      if (
        nextQuantity > 100 ||
        (product.stock_quantity !== null && totalProductQuantity > product.stock_quantity)
      ) {
        throw new Error("The requested quantity is not available.");
      }
      setBasket(
        existing
          ? basket.map((line) => (line === existing ? { ...line, quantity: nextQuantity } : line))
          : [...basket, { productId: product.id, quantity, size, colour }],
      );
      setNotice("Product added to your cart");
    },
    [basket],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, size = "", colour = "") => {
      setBasket((current) =>
        quantity < 1
          ? current.filter(
              (line) =>
                !(
                  line.productId === productId &&
                  (line.size ?? "") === size &&
                  (line.colour ?? "") === colour
                ),
            )
          : current.map((line) =>
              line.productId === productId &&
              (line.size ?? "") === size &&
              (line.colour ?? "") === colour
                ? { ...line, quantity: Math.min(100, quantity) }
                : line,
            ),
      );
    },
    [],
  );

  const clearBasket = useCallback(() => setBasket([]), []);
  const dismissNotice = useCallback(() => setNotice(""), []);
  const value = useMemo(
    () => ({
      basket,
      count: basket.reduce((sum, item) => sum + item.quantity, 0),
      hydrated,
      notice,
      addToBasket,
      updateQuantity,
      clearBasket,
      dismissNotice,
    }),
    [basket, hydrated, notice, addToBasket, updateQuantity, clearBasket, dismissNotice],
  );

  return (
    <BasketContext.Provider value={value}>
      {children}
      {notice && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm shadow-xl sm:inset-x-auto sm:right-6"
        >
          <Check className="size-5 shrink-0 text-primary" />
          <span className="flex-1">{notice}</span>
          <Link
            href="/cart"
            onClick={dismissNotice}
            className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            View Cart
          </Link>
          <button type="button" onClick={dismissNotice} aria-label="Dismiss notification">
            <X className="size-4" />
          </button>
        </div>
      )}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) throw new Error("useBasket must be used within BasketProvider");
  return context;
}
