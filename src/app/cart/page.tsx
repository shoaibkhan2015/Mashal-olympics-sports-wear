import type { Metadata } from "next";
import { CartPage } from "@/components/cart-page";
import { getCartProducts } from "@/lib/storefront-products";

export const metadata: Metadata = { title: "Cart" };

export default async function CartRoute() {
  return <CartPage products={await getCartProducts()} />;
}
