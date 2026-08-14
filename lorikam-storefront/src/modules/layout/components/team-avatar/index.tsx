import { clx } from "@medusajs/ui"

import { Team } from "@lib/data/teams"

type TeamAvatarProps = {
  team: Team
  className?: string
}

/**
 * Teams often have no logo uploaded yet, so fall back to a monogram tinted
 * with the club colour instead of leaving a hole in the grid.
 */
const TeamAvatar = ({ team, className }: TeamAvatarProps) => {
  const base = clx(
    "shrink-0 rounded-full overflow-hidden flex items-center justify-center",
    className
  )

  if (team.logo) {
    return (
      <span className={clx(base, "bg-white ring-1 ring-black/5")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={team.logo}
          alt=""
          loading="lazy"
          className="w-full h-full object-contain p-[15%]"
        />
      </span>
    )
  }

  return (
    <span
      className={clx(base, "text-white font-semibold")}
      style={{ backgroundColor: team.primary_color || "#111827" }}
      aria-hidden
    >
      {team.name.charAt(0).toUpperCase()}
    </span>
  )
}

export default TeamAvatar
