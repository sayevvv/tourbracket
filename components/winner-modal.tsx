"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Match } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface WinnerModalProps {
  match: Match
  isOpen: boolean
  onClose: () => void
}

export function WinnerModal({ match, isOpen, onClose }: WinnerModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSetWinner = async (winnerId: string) => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("🏆 Setting winner:", {
        matchId: match.id,
        winnerId,
        round: match.round_number,
        matchNumber: match.match_number,
      })

      // Validate that the winner is one of the players in this match
      if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
        throw new Error("Winner must be one of the players in this match")
      }

      // Update the match with the winner
      const { error: updateError } = await supabase.from("matches").update({ winner_id: winnerId }).eq("id", match.id)

      if (updateError) {
        console.error("Failed to update match:", updateError)
        throw new Error("Failed to update match winner")
      }

      console.log("✅ Match winner updated successfully")

      // Advanced winner to next round with proper bye handling
      await advanceWinnerWithByeHandling(match, winnerId)

      toast({
        title: "Success",
        description: "Winner has been set and advanced to the next round!",
      })

      onClose()

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Failed to set winner:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set winner. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!match.player1 || !match.player2) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Winner</DialogTitle>
          <DialogDescription>Choose the winner of this match to advance to the next round.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="font-medium">{match.player1.name}</p>
            <p className="text-sm text-muted-foreground">vs</p>
            <p className="font-medium">{match.player2.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleSetWinner(match.player1!.id)}
              disabled={isLoading}
              className="h-auto p-4"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-center">
                  <div className="font-medium">{match.player1.name}</div>
                  <div className="text-xs opacity-75">Set as Winner</div>
                </div>
              )}
            </Button>

            <Button
              onClick={() => handleSetWinner(match.player2!.id)}
              disabled={isLoading}
              className="h-auto p-4"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-center">
                  <div className="font-medium">{match.player2.name}</div>
                  <div className="text-xs opacity-75">Set as Winner</div>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

async function advanceWinnerWithByeHandling(match: Match, winnerId: string) {
  if (!supabase) return

  console.log("🚀 Advancing winner to next round:", {
    matchId: match.id,
    winnerId,
    round: match.round_number,
    matchNumber: match.match_number,
  })

  try {
    // Find the next round matches
    const { data: nextMatches, error: nextMatchError } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", match.tournament_id)
      .eq("round_number", match.round_number + 1)
      .order("match_number")

    if (nextMatchError) {
      console.error("Error finding next matches:", nextMatchError)
      throw new Error("Failed to find next round matches")
    }

    if (nextMatches && nextMatches.length > 0) {
      // Calculate which next match this winner should advance to
      const nextMatchIndex = Math.floor((match.match_number - 1) / 2)
      const nextMatch = nextMatches[nextMatchIndex]

      if (nextMatch) {
        console.log(`🎯 Target next match: R${nextMatch.round_number}M${nextMatch.match_number}`)
        console.log(
          `   Current state: Player1=${nextMatch.player1_id ? "SET" : "EMPTY"}, Player2=${nextMatch.player2_id ? "SET" : "EMPTY"}`,
        )

        // Determine which slot to fill in the next match
        const updateData: { player1_id?: string; player2_id?: string } = {}

        if (!nextMatch.player1_id) {
          updateData.player1_id = winnerId
          console.log(`   📍 Assigning winner to Player1 slot`)
        } else if (!nextMatch.player2_id) {
          updateData.player2_id = winnerId
          console.log(`   📍 Assigning winner to Player2 slot`)
        } else {
          console.log("   ⚠️ Next match already has both players assigned")
          return
        }

        // Update the next match
        const { error: advanceError } = await supabase.from("matches").update(updateData).eq("id", nextMatch.id)

        if (advanceError) {
          console.error("Failed to advance winner:", advanceError)
          throw new Error("Failed to advance winner to next round")
        }

        console.log("✅ Winner advanced successfully to next round")

        // Only check for bye creation if both slots are now filled or if this is a special case
        await checkForByeCreation(nextMatch.id, match.tournament_id, match.round_number + 1)
      }
    } else {
      console.log("🏁 No next round found - this was likely the final match")
    }
  } catch (error) {
    console.error("Error in advanceWinnerWithByeHandling:", error)
    throw error
  }
}

async function checkForByeCreation(nextMatchId: string, tournamentId: string, roundNumber: number) {
  if (!supabase) return

  try {
    // Get the updated next match to check current state
    const { data: nextMatch, error } = await supabase.from("matches").select("*").eq("id", nextMatchId).single()

    if (error || !nextMatch) {
      console.error("Failed to fetch updated next match:", error)
      return
    }

    console.log(`🔍 Checking for bye creation in R${nextMatch.round_number}M${nextMatch.match_number}:`)
    console.log(`   Player1: ${nextMatch.player1_id ? "SET" : "EMPTY"}`)
    console.log(`   Player2: ${nextMatch.player2_id ? "SET" : "EMPTY"}`)

    // If both players are set, no bye needed
    if (nextMatch.player1_id && nextMatch.player2_id) {
      console.log("✅ Both players assigned - match ready to play!")
      return
    }

    // If only one player is set, check if we should create a bye
    if (nextMatch.player1_id && !nextMatch.player2_id) {
      // Check if there are any incomplete matches in the previous round that could still provide an opponent
      const { data: previousRoundMatches, error: prevError } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round_number", roundNumber - 1)

      if (prevError) {
        console.error("Error checking previous round matches:", prevError)
        return
      }

      // Find the sibling matches that should feed into this next match
      const expectedMatch1Number = (nextMatch.match_number - 1) * 2 + 1
      const expectedMatch2Number = (nextMatch.match_number - 1) * 2 + 2

      const siblingMatch1 = previousRoundMatches?.find((m) => m.match_number === expectedMatch1Number)
      const siblingMatch2 = previousRoundMatches?.find((m) => m.match_number === expectedMatch2Number)

      console.log(`   Expected sibling matches: ${expectedMatch1Number}, ${expectedMatch2Number}`)
      console.log(`   Sibling 1 winner: ${siblingMatch1?.winner_id ? "SET" : "EMPTY"}`)
      console.log(`   Sibling 2 winner: ${siblingMatch2?.winner_id ? "SET" : "EMPTY"}`)

      // Only create a bye if both sibling matches are complete and one doesn't have a winner (shouldn't happen)
      // OR if there's only one sibling match (edge case in tournament structure)
      const bothSiblingsComplete = siblingMatch1?.winner_id && siblingMatch2?.winner_id
      const onlyOneSibling = !siblingMatch2 && siblingMatch1?.winner_id

      if (bothSiblingsComplete) {
        console.log("⚠️ Both sibling matches complete but only one player in next match - this shouldn't happen")
        // Don't create a bye in this case, there might be a data inconsistency
        return
      }

      if (onlyOneSibling) {
        console.log("🎯 Only one sibling match exists and it's complete - creating bye")

        const { error: byeError } = await supabase
          .from("matches")
          .update({
            is_bye: true,
            winner_id: nextMatch.player1_id,
          })
          .eq("id", nextMatchId)

        if (byeError) {
          console.error("Failed to create bye:", byeError)
        } else {
          console.log("✅ Bye created successfully")
          // Don't recursively advance - let the user see the bye and advance manually if needed
        }
      } else {
        console.log("⏳ Waiting for sibling match to complete")
      }
    } else if (!nextMatch.player1_id && nextMatch.player2_id) {
      // Move player2 to player1 position for consistency
      console.log("🔄 Moving Player2 to Player1 position")

      const { error: moveError } = await supabase
        .from("matches")
        .update({
          player1_id: nextMatch.player2_id,
          player2_id: null,
        })
        .eq("id", nextMatchId)

      if (moveError) {
        console.error("Failed to move player:", moveError)
      } else {
        console.log("✅ Player moved to Player1 position")
        // Recheck for bye creation with the new arrangement
        await checkForByeCreation(nextMatchId, tournamentId, roundNumber)
      }
    }
  } catch (error) {
    console.error("Error in checkForByeCreation:", error)
  }
}
