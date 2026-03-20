"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import CustomizationFields, {
  CustomizationField,
  validateCustomizationFields,
} from "@modules/products/components/customization-fields"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ColorMap = Record<string, string>

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  onOptionsChange?: (options: Record<string, string | undefined>) => void
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  onOptionsChange,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [customizationValues, setCustomizationValues] = useState<Record<string, string>>({})
  const [customizationErrors, setCustomizationErrors] = useState<Record<string, string>>({})
  const countryCode = useParams().countryCode as string

  // Extract customization fields from product metadata
  const customizationFields = useMemo(() => {
    const fields = product.metadata?.customization_fields
    if (Array.isArray(fields)) {
      return fields as CustomizationField[]
    }
    return []
  }, [product.metadata])

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Max quantity based on inventory
  const maxQuantity = useMemo(() => {
    if (!selectedVariant?.manage_inventory) return 10
    if (selectedVariant?.allow_backorder) return 10
    return Math.min(selectedVariant?.inventory_quantity || 1, 10)
  }, [selectedVariant])

  // update the options when a variant is selected/deselected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      // Empty string means deselection - set to undefined
      [optionId]: value === "" ? undefined : value,
    }))
  }

  // Notify parent of options changes for image filtering
  useEffect(() => {
    onOptionsChange?.(options)
  }, [options, onOptionsChange])

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // Extract color map from product metadata
  const colorMap = (product.metadata?.color_map as ColorMap) || {}

  // Check if customization is valid
  const isCustomizationValid = useMemo(() => {
    if (customizationFields.length === 0) return true
    const { isValid } = validateCustomizationFields(customizationFields, customizationValues)
    return isValid
  }, [customizationFields, customizationValues])

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    // Validate customization fields if present
    if (customizationFields.length > 0) {
      const { isValid, errors } = validateCustomizationFields(customizationFields, customizationValues)
      setCustomizationErrors(errors)
      if (!isValid) return null
    }

    setIsAdding(true)

    // Build metadata with customizations if present
    const metadata = customizationFields.length > 0
      ? { customizations: customizationValues }
      : undefined

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
      metadata,
    })

    // Reset customization values and quantity after adding to cart
    if (customizationFields.length > 0) {
      setCustomizationValues({})
      setCustomizationErrors({})
    }
    setQuantity(1)

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                      colorMap={colorMap}
                      variants={product.variants}
                      currentOptions={options}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        {/* Customization Fields */}
        {customizationFields.length > 0 && (
          <>
            <Divider />
            <CustomizationFields
              fields={customizationFields}
              values={customizationValues}
              onChange={setCustomizationValues}
              errors={customizationErrors}
              disabled={!!disabled || isAdding}
            />
          </>
        )}

        <div className="flex items-center gap-x-4">
          {/* Quantity Controls */}
          {selectedVariant && inStock && (
            <div className="flex items-center border border-ui-border-base rounded-md">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || !!disabled || isAdding}
                className="w-10 h-10 flex items-center justify-center text-ui-fg-base hover:bg-ui-bg-base-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Scade cantitatea"
              >
                −
              </button>
              <span className="w-12 text-center text-ui-fg-base font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity || !!disabled || isAdding}
                className="w-10 h-10 flex items-center justify-center text-ui-fg-base hover:bg-ui-bg-base-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Crește cantitatea"
              >
                +
              </button>
            </div>
          )}
          <Button
            onClick={handleAddToCart}
            disabled={
              !inStock ||
              !selectedVariant ||
              !!disabled ||
              isAdding ||
              !isValidVariant ||
              !isCustomizationValid
            }
            variant="primary"
            className="flex-1 h-10"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {!selectedVariant || !isValidVariant
              ? "Selectează varianta"
              : !inStock
              ? "Stoc epuizat"
              : "Adaugă în coș"}
          </Button>
        </div>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
          colorMap={colorMap}
          quantity={quantity}
          setQuantity={setQuantity}
          maxQuantity={maxQuantity}
        />
      </div>
    </>
  )
}
