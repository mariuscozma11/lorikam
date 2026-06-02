import { Badge } from "@medusajs/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">Atenție:</span> Doar în scop de
      testare.
    </Badge>
  )
}

export default PaymentTest
