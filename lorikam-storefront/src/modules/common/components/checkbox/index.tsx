import { Checkbox, Label } from "@medusajs/ui"
import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  // Every instance used to render id="checkbox", so each label pointed at the
  // first box on the page and toggled the wrong one.
  const id = name ? `checkbox-${name}` : "checkbox"

  return (
    <div className="flex items-center space-x-2 ">
      <Checkbox
        className="text-base-regular flex items-center gap-x-2"
        id={id}
        role="checkbox"
        type="button"
        checked={checked}
        aria-checked={checked}
        onClick={onChange}
        name={name}
        data-testid={dataTestId}
      />
      <Label
        htmlFor={id}
        className="!transform-none !txt-medium"
        size="large"
      >
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
