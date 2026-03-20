"use client"

import { useCallback } from "react"
import { clx } from "@medusajs/ui"
import FilterSection from "./filter-section"
import { Team } from "@lib/data/teams"

type TeamFilterProps = {
  teams: Team[]
  selectedTeams: string[]
  onChange: (teams: string[]) => void
}

export default function TeamFilter({
  teams,
  selectedTeams,
  onChange,
}: TeamFilterProps) {
  const handleToggle = useCallback(
    (teamHandle: string) => {
      if (selectedTeams.includes(teamHandle)) {
        onChange(selectedTeams.filter((h) => h !== teamHandle))
      } else {
        onChange([...selectedTeams, teamHandle])
      }
    },
    [selectedTeams, onChange]
  )

  if (teams.length === 0) {
    return null
  }

  return (
    <FilterSection title="Echipa">
      <div className="space-y-2">
        {teams.map((team) => {
          const isSelected = selectedTeams.includes(team.handle)
          return (
            <label
              key={team.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={clx(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-ui-fg-base border-ui-fg-base"
                    : "border-ui-border-base bg-ui-bg-base group-hover:border-ui-fg-muted"
                )}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(team.handle)}
                className="sr-only"
              />
              <div className="flex items-center gap-2">
                {team.logo && (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-5 h-5 object-contain rounded"
                  />
                )}
                <span
                  className={clx(
                    "text-sm transition-colors",
                    isSelected ? "text-ui-fg-base" : "text-ui-fg-subtle"
                  )}
                >
                  {team.name}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </FilterSection>
  )
}
