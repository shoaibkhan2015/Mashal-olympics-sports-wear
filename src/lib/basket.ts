import type { BasketLine } from "@/components/basket-provider";
import type { Product } from "@/lib/supabase/types";

export type ResolvedBasketLine = BasketLine & { product: Product | null };

export function resolveBasketLines(
  basket: BasketLine[],
  products: Product[],
): ResolvedBasketLine[] {
  return basket.map((line) => ({
    ...line,
    product: products.find((product) => product.id === line.productId) ?? null,
  }));
}

export function getBasketSubtotal(lines: ResolvedBasketLine[]) {
  return lines.reduce(
    (total, { product, quantity }) => total + (product?.price ?? 0) * quantity,
    0,
  );
}

export function hasUnavailableBasketItem(lines: ResolvedBasketLine[]) {
  const lineKeys = lines.map(({ productId, size, colour }) =>
    JSON.stringify([productId, size ?? "", colour ?? ""]),
  );

  return (
    lines.length > 20 ||
    new Set(lineKeys).size !== lineKeys.length ||
    lines.some(({ product, size, colour }, _, allLines) => {
      if (
        !product ||
        product.price === null ||
        !product.is_active ||
        product.stock_quantity === 0 ||
        (product.available_sizes.length > 0
          ? !product.available_sizes.includes(size ?? "")
          : !!size) ||
        (product.available_colours.length > 0
          ? !product.available_colours.includes(colour ?? "")
          : !!colour)
      ) {
        return true;
      }

      return (
        product.stock_quantity !== null &&
        allLines
          .filter((line) => line.productId === product.id)
          .reduce((sum, line) => sum + line.quantity, 0) > product.stock_quantity
      );
    })
  );
}

export function getBasketQuantityLimit(
  product: Product | null,
  currentQuantity: number,
  size: string | undefined,
  colour: string | undefined,
  basket: BasketLine[],
) {
  if (!product || product.stock_quantity === null) return 100;
  const otherVariantsQuantity = basket
    .filter(
      (line) =>
        line.productId === product.id &&
        !((line.size ?? "") === (size ?? "") && (line.colour ?? "") === (colour ?? "")),
    )
    .reduce((sum, line) => sum + line.quantity, 0);
  return Math.max(currentQuantity, Math.min(100, product.stock_quantity - otherVariantsQuantity));
}
