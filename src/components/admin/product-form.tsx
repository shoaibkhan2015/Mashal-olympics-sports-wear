import { createProduct, updateProduct } from "@/app/admin/actions";
import { AdminSubmit } from "@/components/admin/admin-controls";
import { ProductDetailFields } from "@/components/admin/product-detail-fields";
import { ProductImagePicker } from "@/components/admin/product-image-picker";
import type { Product } from "@/lib/supabase/types";

export function ProductForm({
  product,
  categories,
  detailsAvailable,
  listPageSize,
  listExpanded,
}: {
  product?: Product;
  categories: { id: string; name: string; is_active: boolean }[];
  detailsAvailable: boolean;
  listPageSize?: number;
  listExpanded?: boolean;
}) {
  return (
    <form action={product ? updateProduct : createProduct} className="admin-catalog-form">
      {product && (
        <>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="list_page_size" value={listPageSize} />
          <input type="hidden" name="list_expanded" value={listExpanded ? "1" : "0"} />
        </>
      )}
      <fieldset className="admin-fieldset">
        <legend>Product details</legend>
        <div className="admin-field-grid">
          <label>
            Product name <span className="admin-required">Required</span>
            <input required name="name" maxLength={160} defaultValue={product?.name} />
          </label>
          <label>
            Collection <span className="admin-required">Required</span>
            <select required name="category_id" defaultValue={product?.category_id ?? ""}>
              <option value="">Select a collection</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.is_active ? "" : " (hidden)"}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field-wide">
            Description
            <textarea
              name="description"
              rows={3}
              maxLength={4000}
              defaultValue={product?.description}
            />
          </label>
        </div>
      </fieldset>
      <fieldset className="admin-fieldset">
        <legend>Pricing and inventory</legend>
        <div className="admin-field-grid">
          <label>
            Price (PKR)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product?.price ?? ""}
            />
            <small>Leave blank for a quote-only listing.</small>
          </label>
          <label>
            Discount (%)
            <input
              name="discount_percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={product?.discount_percentage || ""}
            />
          </label>
          <label>
            Stock quantity
            <input
              name="stock_quantity"
              type="number"
              min="0"
              max="100000"
              step="1"
              defaultValue={product?.stock_quantity ?? ""}
            />
            <small>Leave blank for made-to-order items.</small>
          </label>
          <label>
            Available sizes
            <input
              name="available_sizes"
              placeholder="S, M, L, XL"
              maxLength={1200}
              defaultValue={product?.available_sizes?.join(", ")}
            />
            <small>Separate sizes with commas.</small>
          </label>
          <label>
            Available colours
            <input
              name="available_colours"
              placeholder="Black, Red, Blue"
              maxLength={1800}
              defaultValue={product?.available_colours?.join(", ")}
            />
            <small>Separate colours with commas.</small>
          </label>
        </div>
      </fieldset>
      <fieldset className="admin-fieldset">
        <legend>Images</legend>
        <div className="admin-field-grid">
          <ProductImagePicker
            initialUrls={
              product?.image_urls?.length
                ? product.image_urls
                : product?.image_url
                  ? [product.image_url]
                  : []
            }
          />
          {detailsAvailable && (
            <ProductImagePicker
              name="fabric_image_urls"
              label="Fabric and detail close-ups"
              initialUrls={product?.fabric_image_urls ?? []}
            />
          )}
        </div>
      </fieldset>
      {detailsAvailable && (
        <details className="admin-optional">
          <summary>Fabric, fit, care, sizing and FAQs</summary>
          <ProductDetailFields product={product} />
        </details>
      )}
      <div className="admin-form-actions">
        <label className="admin-checkbox">
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active} />
          <span>
            Publish product <small>A price is required.</small>
          </span>
        </label>
        <AdminSubmit>{product ? "Save product" : "Add product"}</AdminSubmit>
      </div>
    </form>
  );
}
