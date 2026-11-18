import type { Product } from "@/lib/supabase/types";

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground";

export function ProductDetailFields({ product }: { product?: Product }) {
  const faqs = (product?.product_faqs ?? [])
    .map(({ question, answer }) => `${question} | ${answer}`)
    .join("\n");

  return (
    <div className="grid gap-4 rounded-xl border border-border p-4 sm:col-span-2 lg:col-span-3">
      <h4 className="font-semibold">Optional product details</h4>
      <label className="grid gap-2 text-sm">
        Material / fabric details
        <textarea
          name="fabric_details"
          rows={2}
          maxLength={3000}
          defaultValue={product?.fabric_details ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        Fit details
        <textarea
          name="fit_details"
          rows={2}
          maxLength={2000}
          defaultValue={product?.fit_details ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        Care instructions
        <textarea
          name="care_instructions"
          rows={2}
          maxLength={3000}
          defaultValue={product?.care_instructions ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        Customization options available
        <textarea
          name="customization_options"
          rows={2}
          maxLength={3000}
          defaultValue={product?.customization_options ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        Size measurements and measuring instructions
        <textarea
          name="size_guide"
          rows={3}
          maxLength={4000}
          defaultValue={product?.size_guide ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        Product FAQs (one “Question | Answer” per line; only include confirmed details)
        <textarea
          name="product_faqs"
          rows={4}
          maxLength={12000}
          defaultValue={faqs}
          placeholder={"Can this be customized? | Enter the confirmed answer."}
          className={fieldClass}
        />
      </label>
    </div>
  );
}
