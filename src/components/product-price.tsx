import { formatPrice, type ProductPricing } from "@/lib/product-pricing";

export function ProductPrice({
  product,
  className,
}: {
  product: ProductPricing;
  className?: string;
}) {
  if (product.price === null || product.effective_price === null) return null;

  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums ${className ?? ""}`}>
      {product.discount_percentage > 0 && (
        <>
          <span className="rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
            {product.discount_percentage}% OFF
          </span>
          <del className="text-[0.8em] font-normal text-muted-foreground">
            <span className="sr-only">Original price </span>
            {formatPrice(product.price)}
          </del>
          <span className="sr-only">Discounted price </span>
        </>
      )}
      <span>{formatPrice(product.effective_price)}</span>
    </p>
  );
}
