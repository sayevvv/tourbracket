"use client"

import { useState, useMemo } from "react"
import type { TournamentData, Match } from "@/lib/supabase"
import { WinnerModal } from "./winner-modal"
import { cn } from "@/lib/utils"

interface BracketDisplayProps {
  tournamentData: TournamentData
}

interface MatchPosition {
  x: number
  y: number
  width: number
  height: number
  match: Match
}

interface RoundData {
  roundNumber: number
  matches: Match[]
  positions: MatchPosition[]
  x: number
  width: number
}

export function BracketDisplay({ tournamentData }: BracketDisplayProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { matches } = tournamentData

  // Calculate bracket layout with proper alignment
  const bracketLayout = useMemo(() => {
    if (matches.length === 0) return null

    // Group matches by round
    const matchesByRound = matches.reduce(
      (acc, match) => {
        if (!acc[match.round_number]) {
          acc[match.round_number] = []
        }
        acc[match.round_number].push(match)
        return acc
      },
      {} as Record<number, Match[]>,
    )

    const rounds = Object.keys(matchesByRound)
      .map(Number)
      .sort((a, b) => a - b)

    // Layout constants - increased height for better status text spacing
    const MATCH_WIDTH = 280
    const MATCH_HEIGHT = 140 // Increased from 120 to 140 for bottom text space
    const ROUND_SPACING = 350
    const BASE_MATCH_SPACING = 160 // Increased from 140 to 160 for better vertical spacing
    const PADDING = 60

    const roundsData: RoundData[] = []
    let totalWidth = PADDING

    // Calculate positions for each round with proper vertical alignment
    rounds.forEach((roundNumber, roundIndex) => {
      const roundMatches = matchesByRound[roundNumber].sort((a, b) => a.match_number - b.match_number)

      // Calculate vertical spacing - each round has exponentially more space between matches
      const verticalSpacing = BASE_MATCH_SPACING * Math.pow(2, roundIndex)

      // Calculate starting Y position to center the round vertically
      const totalRoundHeight = (roundMatches.length - 1) * (MATCH_HEIGHT + verticalSpacing)
      const startY = PADDING + (roundIndex > 0 ? verticalSpacing / 2 : 0)

      const positions: MatchPosition[] = []
      const roundX = totalWidth

      roundMatches.forEach((match, matchIndex) => {
        const y = startY + matchIndex * (MATCH_HEIGHT + verticalSpacing)
        positions.push({
          x: roundX,
          y,
          width: MATCH_WIDTH,
          height: MATCH_HEIGHT,
          match,
        })
      })

      roundsData.push({
        roundNumber,
        matches: roundMatches,
        positions,
        x: roundX,
        width: MATCH_WIDTH,
      })

      totalWidth += MATCH_WIDTH + ROUND_SPACING
    })

    // Calculate total height based on the first round (which has the most matches)
    const firstRound = roundsData[0]
    const maxHeight = firstRound
      ? firstRound.positions[firstRound.positions.length - 1].y + MATCH_HEIGHT + PADDING
      : 400

    return {
      rounds: roundsData,
      width: totalWidth - ROUND_SPACING + PADDING,
      height: Math.max(maxHeight, 600), // Minimum height
      matchWidth: MATCH_WIDTH,
      matchHeight: MATCH_HEIGHT,
    }
  }, [matches])

  const handleMatchClick = (match: Match) => {
    // Only allow clicking if match has two players and no winner
    if (match.player1_id && match.player2_id && !match.winner_id && !match.is_bye) {
      setSelectedMatch(match)
      setIsModalOpen(true)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedMatch(null)
  }

  if (!bracketLayout || matches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No matches found for this tournament.</p>
      </div>
    )
  }

  const getRoundTitle = (roundNumber: number, totalRounds: number) => {
    if (roundNumber === totalRounds) return "🏆 Final"
    if (roundNumber === totalRounds - 1) return "🥇 Semifinal"
    if (roundNumber === totalRounds - 2) return "🥈 Quarterfinal"
    return `Round ${roundNumber}`
  }

  const getMatchStatus = (match: Match) => {
    if (match.winner_id) return "completed"
    if (match.is_bye) return "bye"
    if (match.player1_id && match.player2_id) return "ready"
    return "waiting"
  }

  const isMatchClickable = (match: Match) => {
    return match.player1_id && match.player2_id && !match.winner_id && !match.is_bye
  }

  return (
    <div className="w-full">
      {/* Tournament Progress Indicator - positioned outside SVG */}
      <div className="flex justify-end mb-4">
        <div className="bg-card border rounded-lg p-4 shadow-sm min-w-[200px]">
          <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Tournament Progress</div>

          {/* Progress circles */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {bracketLayout.rounds.map((round, index) => {
              const completedMatches = round.matches.filter((m) => m.winner_id).length
              const totalMatches = round.matches.length
              const isComplete = completedMatches === totalMatches
              const hasProgress = completedMatches > 0

              return (
                <div
                  key={`progress-${round.roundNumber}`}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors",
                    isComplete && "bg-green-500 border-green-500 text-white",
                    hasProgress && !isComplete && "bg-orange-500 border-orange-500 text-white",
                    !hasProgress &&
                      "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400",
                  )}
                  title={`Round ${round.roundNumber}: ${completedMatches}/${totalMatches} complete`}
                >
                  {round.roundNumber}
                </div>
              )
            })}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {matches.filter((m) => m.winner_id).length} / {matches.length} matches complete
          </div>
        </div>
      </div>

      <div className="overflow-auto bg-gradient-to-br from-background to-muted/20 rounded-lg border">
        <svg
          width={bracketLayout.width}
          height={bracketLayout.height}
          viewBox={`0 0 ${bracketLayout.width} ${bracketLayout.height}`}
          className="min-w-full min-h-[600px]"
          style={{ maxWidth: "none" }}
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="transparent" />

          {/* Bracket connections with fixed alignment */}
          <g className="bracket-connections">
            {bracketLayout.rounds.slice(0, -1).map((round, roundIndex) => {
              const nextRound = bracketLayout.rounds[roundIndex + 1]
              if (!nextRound) return null

              return (
                <g key={`connections-${round.roundNumber}`}>
                  {/* Process matches in pairs for proper bracket connections */}
                  {Array.from({ length: Math.ceil(round.positions.length / 2) }).map((_, pairIndex) => {
                    const match1Index = pairIndex * 2
                    const match2Index = pairIndex * 2 + 1
                    const match1 = round.positions[match1Index]
                    const match2 = round.positions[match2Index]
                    const nextMatch = nextRound.positions[pairIndex]

                    if (!match1 || !nextMatch) return null

                    // Calculate connection points
                    const match1CenterY = match1.y + match1.height / 2
                    const match2CenterY = match2 ? match2.y + match2.height / 2 : match1CenterY
                    const nextMatchCenterY = nextMatch.y + nextMatch.height / 2

                    const startX = match1.x + match1.width
                    const endX = nextMatch.x
                    const midX = startX + (endX - startX) / 2

                    // Determine connection colors
                    const match1HasWinner = match1.match.winner_id
                    const match2HasWinner = match2?.match.winner_id
                    const match1Color = match1HasWinner ? "stroke-green-500" : "stroke-muted-foreground/40"
                    const match2Color = match2HasWinner ? "stroke-green-500" : "stroke-muted-foreground/40"

                    return (
                      <g key={`connection-pair-${pairIndex}`}>
                        {/* Horizontal line from first match */}
                        <line
                          x1={startX}
                          y1={match1CenterY}
                          x2={midX}
                          y2={match1CenterY}
                          className={cn("stroke-2 transition-colors", match1Color)}
                        />

                        {/* Horizontal line from second match (if exists) */}
                        {match2 && (
                          <line
                            x1={startX}
                            y1={match2CenterY}
                            x2={midX}
                            y2={match2CenterY}
                            className={cn("stroke-2 transition-colors", match2Color)}
                          />
                        )}

                        {/* Vertical connecting line */}
                        <line
                          x1={midX}
                          y1={Math.min(match1CenterY, match2CenterY)}
                          x2={midX}
                          y2={Math.max(match1CenterY, match2CenterY)}
                          className="stroke-2 stroke-muted-foreground/40"
                        />

                        {/* Horizontal line to next match */}
                        <line
                          x1={midX}
                          y1={nextMatchCenterY}
                          x2={endX}
                          y2={nextMatchCenterY}
                          className="stroke-2 stroke-muted-foreground/40"
                        />

                        {/* Arrow pointing to next match */}
                        <polygon
                          points={`${endX - 10},${nextMatchCenterY - 5} ${endX},${nextMatchCenterY} ${endX - 10},${nextMatchCenterY + 5}`}
                          className="fill-muted-foreground/40"
                        />
                      </g>
                    )
                  })}
                </g>
              )
            })}
          </g>

          {/* Round headers */}
          {bracketLayout.rounds.map((round) => (
            <g key={`header-${round.roundNumber}`}>
              <text x={round.x + round.width / 2} y={30} textAnchor="middle" className="fill-primary font-bold text-xl">
                {getRoundTitle(round.roundNumber, bracketLayout.rounds.length)}
              </text>
              <line
                x1={round.x + round.width / 2 - 40}
                y1={38}
                x2={round.x + round.width / 2 + 40}
                y2={38}
                className="stroke-primary stroke-2"
              />
            </g>
          ))}

          {/* Matches with improved sizing and layout */}
          {bracketLayout.rounds.map((round) =>
            round.positions.map((position) => {
              const { match } = position
              const status = getMatchStatus(match)
              const clickable = isMatchClickable(match)

              return (
                <g key={match.id} className="match-group">
                  {/* Match container with larger click area */}
                  <rect
                    x={position.x}
                    y={position.y}
                    width={position.width}
                    height={position.height}
                    rx={12}
                    className={cn(
                      "transition-all duration-300 stroke-2",
                      status === "completed" && "fill-green-50 dark:fill-green-950/30 stroke-green-400",
                      status === "bye" && "fill-blue-50 dark:fill-blue-950/30 stroke-blue-400",
                      status === "ready" &&
                        clickable &&
                        "fill-orange-50 dark:fill-orange-950/30 stroke-orange-400 cursor-pointer hover:fill-orange-100 dark:hover:fill-orange-950/50 hover:stroke-orange-500",
                      status === "ready" && !clickable && "fill-background stroke-border",
                      status === "waiting" && "fill-muted/30 stroke-muted-foreground/30",
                    )}
                    onClick={clickable ? () => handleMatchClick(match) : undefined}
                  />

                  {/* Clickable indicator */}
                  {clickable && (
                    <circle
                      cx={position.x + position.width - 15}
                      cy={position.y + 15}
                      r={5}
                      className="fill-orange-400 animate-pulse"
                    />
                  )}

                  {/* Winner crown */}
                  {match.winner_id && (
                    <text x={position.x + position.width - 20} y={position.y + 20} className="text-xl">
                      👑
                    </text>
                  )}

                  {/* Player 1 section */}
                  <g className="player1">
                    <rect
                      x={position.x + 12}
                      y={position.y + 12}
                      width={position.width - 24}
                      height={36}
                      rx={6}
                      className={cn(
                        "transition-all duration-200",
                        match.winner_id === match.player1_id
                          ? "fill-green-100 dark:fill-green-900/40 stroke-green-300"
                          : "fill-background/80 stroke-border/50",
                      )}
                    />
                    <text
                      x={position.x + position.width / 2}
                      y={position.y + 34}
                      textAnchor="middle"
                      className={cn(
                        "text-base font-medium transition-colors",
                        match.winner_id === match.player1_id ? "fill-green-800 dark:fill-green-200" : "fill-foreground",
                      )}
                    >
                      {match.player1?.name || "TBD"}
                    </text>

                    {/* Bye indicator for player 1 */}
                    {match.is_bye && match.player1 && (
                      <>
                        <rect
                          x={position.x + position.width - 60}
                          y={position.y + 18}
                          width={40}
                          height={20}
                          rx={10}
                          className="fill-blue-100 dark:fill-blue-900/30 stroke-blue-300"
                        />
                        <text
                          x={position.x + position.width - 40}
                          y={position.y + 31}
                          textAnchor="middle"
                          className="text-xs font-bold fill-blue-700 dark:fill-blue-300"
                        >
                          BYE
                        </text>
                      </>
                    )}
                  </g>

                  {/* VS divider - only show if not a bye */}
                  {!match.is_bye && (
                    <g className="vs-divider">
                      <line
                        x1={position.x + 30}
                        y1={position.y + position.height / 2 - 10} // Moved up slightly
                        x2={position.x + position.width - 80}
                        y2={position.y + position.height / 2 - 10}
                        className="stroke-border stroke-2"
                      />
                      <rect
                        x={position.x + position.width / 2 - 15}
                        y={position.y + position.height / 2 - 20} // Moved up slightly
                        width={30}
                        height={20}
                        rx={10}
                        className="fill-background stroke-border"
                      />
                      <text
                        x={position.x + position.width / 2}
                        y={position.y + position.height / 2 - 5} // Moved up slightly
                        textAnchor="middle"
                        className="text-sm font-semibold fill-muted-foreground"
                      >
                        VS
                      </text>
                    </g>
                  )}

                  {/* Player 2 section - only show if not a bye */}
                  {!match.is_bye && (
                    <g className="player2">
                      <rect
                        x={position.x + 12}
                        y={position.y + position.height - 68} // Adjusted to leave more space at bottom
                        width={position.width - 24}
                        height={36}
                        rx={6}
                        className={cn(
                          "transition-all duration-200",
                          match.winner_id === match.player2_id
                            ? "fill-green-100 dark:fill-green-900/40 stroke-green-300"
                            : "fill-background/80 stroke-border/50",
                        )}
                      />
                      <text
                        x={position.x + position.width / 2}
                        y={position.y + position.height - 42} // Adjusted positioning
                        textAnchor="middle"
                        className={cn(
                          "text-base font-medium transition-colors",
                          match.winner_id === match.player2_id
                            ? "fill-green-800 dark:fill-green-200"
                            : "fill-foreground",
                        )}
                      >
                        {match.player2?.name || "TBD"}
                      </text>
                    </g>
                  )}

                  {/* Match status indicator at bottom with proper spacing */}
                  <g className="status-indicator">
                    <rect
                      x={position.x + 8}
                      y={position.y + position.height - 25} // Background for status text
                      width={position.width - 16}
                      height={20}
                      rx={4}
                      className="fill-muted/20"
                    />
                    <circle
                      cx={position.x + 20}
                      cy={position.y + position.height - 15}
                      r={4}
                      className={cn(
                        status === "completed" && "fill-green-500",
                        status === "bye" && "fill-blue-500",
                        status === "ready" && "fill-orange-500 animate-pulse",
                        status === "waiting" && "fill-gray-400",
                      )}
                    />
                    <text
                      x={position.x + 32}
                      y={position.y + position.height - 10} // Better positioned with more space
                      className="text-sm fill-muted-foreground font-medium"
                    >
                      {status === "completed" && `Winner: ${match.winner?.name}`}
                      {status === "bye" && "Advances automatically"}
                      {status === "ready" && "Click to select winner"}
                      {status === "waiting" && "Waiting for previous matches"}
                    </text>
                  </g>
                </g>
              )
            }),
          )}
        </svg>
      </div>

      {selectedMatch && <WinnerModal match={selectedMatch} isOpen={isModalOpen} onClose={handleModalClose} />}
    </div>
  )
}
