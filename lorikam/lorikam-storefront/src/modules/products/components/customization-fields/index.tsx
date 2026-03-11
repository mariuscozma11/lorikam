"use client"

import { useState, useEffect } from "react"
import { Input, Label, clx } from "@medusajs/ui"

export type CustomizationField = {
  key: string
  label: string
  type: "text" | "number"
  required: boolean
  maxLength?: number
  min?: number
  max?: number
}

type CustomizationFieldsProps = {
  fields: CustomizationField[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  errors: Record<string, string>
  disabled?: boolean
}

const CustomizationFields: React.FC<CustomizationFieldsProps> = ({
  fields,
  values,
  onChange,
  errors,
  disabled,
}) => {
  const handleChange = (key: string, value: string, field: CustomizationField) => {
    let processedValue = value

    // For text fields, convert to uppercase
    if (field.type === "text") {
      processedValue = value.toUpperCase()
    }

    // For number fields, only allow digits
    if (field.type === "number") {
      processedValue = value.replace(/[^0-9]/g, "")
    }

    onChange({
      ...values,
      [key]: processedValue,
    })
  }

  if (!fields || fields.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Personalizare</span>
        <span className="text-xs text-ui-fg-muted">(obligatoriu)</span>
      </div>

      <div className="flex flex-col gap-y-3">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-y-1">
            <Label
              size="small"
              className={clx("text-ui-fg-subtle", {
                "text-ui-fg-error": errors[field.key],
              })}
            >
              {field.label}
              {field.required && <span className="text-ui-fg-error ml-1">*</span>}
            </Label>
            <Input
              type={field.type === "number" ? "text" : "text"}
              inputMode={field.type === "number" ? "numeric" : "text"}
              value={values[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value, field)}
              placeholder={
                field.type === "number"
                  ? `${field.min || 1} - ${field.max || 99}`
                  : `Max ${field.maxLength || 20} caractere`
              }
              maxLength={field.type === "text" ? field.maxLength : undefined}
              disabled={disabled}
              className={clx({
                "border-ui-border-error": errors[field.key],
              })}
            />
            {errors[field.key] && (
              <span className="text-xs text-ui-fg-error">{errors[field.key]}</span>
            )}
            {field.type === "text" && field.maxLength && (
              <span className="text-xs text-ui-fg-muted">
                {(values[field.key] || "").length}/{field.maxLength} caractere
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Validation function
export const validateCustomizationFields = (
  fields: CustomizationField[],
  values: Record<string, string>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const value = values[field.key] || ""

    // Required check
    if (field.required && !value.trim()) {
      errors[field.key] = `${field.label} este obligatoriu`
      continue
    }

    // Skip further validation if empty and not required
    if (!value.trim()) continue

    // Text validation
    if (field.type === "text" && field.maxLength) {
      if (value.length > field.maxLength) {
        errors[field.key] = `Maximum ${field.maxLength} caractere`
      }
    }

    // Number validation
    if (field.type === "number") {
      const num = parseInt(value, 10)
      if (isNaN(num)) {
        errors[field.key] = "Introdu un numar valid"
      } else {
        if (field.min !== undefined && num < field.min) {
          errors[field.key] = `Minim ${field.min}`
        }
        if (field.max !== undefined && num > field.max) {
          errors[field.key] = `Maxim ${field.max}`
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export default CustomizationFields
