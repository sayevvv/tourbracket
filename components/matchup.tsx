"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Match } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface MatchupProps {
  match: Match
  onClick: () => void
}

export function Matchup({ match, onClick }: MatchupProps) {
  const { player1, player2, winner, is_bye } = match

  const isClickable = player1 && player2 && !winner && !is_bye
  const isComplete = winner || is_bye

  return (
    <Card
      className={cn(
        "w-64 transition-all duration-300 relative overflow-hidden",
        isClickable && "cursor-pointer hover:shadow-xl hover:scale-105 hover:border-orange-400 hover:-translate-y-1",
        isComplete && "bg-gradient-to-br from-muted/50 to-muted/30",
        winner && "border-green-400 shadow-green-100 dark:shadow-green-900/20",
        "border-2 shadow-lg",
      )}
      onClick={isClickable ? onClick : undefined}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Player 1 */}
          <div
            className={cn(
              "flex items-center justify-center p-3 rounded-lg text-center font-medium transition-all duration-200",
              "border border-border/50 bg-background/50",
              winner?.id === player1?.id &&
                "bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 border-green-300 font-bold text-green-800 dark:text-green-200 shadow-sm",
            )}
          >
            <span className="truncate text-center w-full">{player1?.name || "TBD"}</span>
            {is_bye && player1 && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                BYE
              </span>
            )}
          </div>

          {/* VS divider - only show if not a bye */}
          {!is_bye && (
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
              <span className="px-3 text-xs font-semibold text-muted-foreground bg-background rounded-full border">
                VS
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
            </div>
          )}

          {/* Player 2 - only show if not a bye */}
          {!is_bye && (
            <div
              className={cn(
                "flex items-center justify-center p-3 rounded-lg text-center font-medium transition-all duration-200",
                "border border-border/50 bg-background/50",
                winner?.id === player2?.id &&
                  "bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 border-green-300 font-bold text-green-800 dark:text-green-200 shadow-sm",
              )}
            >
              <span className="truncate text-center w-full">{player2?.name || "TBD"}</span>
            </div>
          )}
        </div>

        {/* Match status */}
        <div className="mt-4 text-center">
          {winner ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400 font-semibold">Winner: {winner.name}</span>
            </div>
          ) : is_bye ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Advances automatically</span>
            </div>
          ) : player1 && player2 ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Click to select winner</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Waiting for previous matches</span>
            </div>
          )}
        </div>

        {/* Clickable indicator */}
        {isClickable && <div className="absolute top-2 right-2 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>}

        {/* Winner crown */}
        {winner && <div className="absolute -top-1 -right-1 text-yellow-500 text-lg">👑</div>}
      </CardContent>
    </Card>
  )
}
