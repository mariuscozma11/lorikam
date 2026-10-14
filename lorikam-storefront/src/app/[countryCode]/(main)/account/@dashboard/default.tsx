// Fallback for this slot on a URL it does not match — see the account layout
// for why /account is split into parallel routes. Rendering nothing is the
// point: without a default.tsx Next.js answers 404 for the whole route instead
// of just leaving the slot empty.
export default function Default() {
  return null
}
