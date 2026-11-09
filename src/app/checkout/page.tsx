import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout-page";
import { getCartProducts } from "@/lib/storefront-products";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutRoute() {
  return <CheckoutPage products={await getCartProducts()} />;
}
