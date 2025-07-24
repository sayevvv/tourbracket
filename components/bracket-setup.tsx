"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function BracketSetup() {
  const [formData, setFormData] = useState({
    tournamentName: "",
    playerList: "Alice\nBob\nCharlie\nDiana\nEve\nFrank\nGrace\nHenry",
    randomize: true,
  })
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const createTournamentClient = async () => {
    console.log("Starting tournament creation...")

    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not configured. Please set up your environment variables.",
        variant: "destructive",
      })
      return
    }

    if (!formData.tournamentName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tournament name",
        variant: "destructive",
      })
      return
    }

    const players = formData.playerList
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (players.length < 2) {
      toast({
        title: "Error",
        description: "Please enter at least 2 players",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      // Randomize players if requested
      let finalPlayers = [...players]
      if (formData.randomize) {
        finalPlayers = shuffleArray(finalPlayers)
      }

      // Calculate bracket structure
      const totalSlots = getNextPowerOfTwo(finalPlayers.length)
      const numRounds = Math.log2(totalSlots)

      console.log("Tournament structure:", {
        playerCount: finalPlayers.length,
        totalSlots,
        numRounds,
      })

      // Create tournament
      console.log("Creating tournament...")
      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .insert({ name: formData.tournamentName })
        .select()
        .single()

      if (tournamentError || !tournament) {
        throw new Error(`Failed to create tournament: ${tournamentError?.message || "Unknown error"}`)
      }

      console.log("Tournament created:", tournament.id)

      // Create players
      console.log("Creating players...")
      const playersData = finalPlayers.map((name, index) => ({
        tournament_id: tournament.id,
        name,
        seed_position: index + 1,
      }))

      const { data: createdPlayers, error: playersError } = await supabase.from("players").insert(playersData).select()

      if (playersError || !createdPlayers) {
        throw new Error(`Failed to create players: ${playersError?.message || "Unknown error"}`)
      }

      console.log("Players created:", createdPlayers.length)

      // Generate and create matches with proper bye advancement
      console.log("Generating matches with bye advancement...")
      const matches = await generateMatchesWithByeAdvancement(tournament.id, createdPlayers, totalSlots, numRounds)

      const { error: matchesError } = await supabase.from("matches").insert(matches)

      if (matchesError) {
        throw new Error(`Failed to create matches: ${matchesError.message}`)
      }

      console.log("Tournament created successfully with proper bye advancement!")

      toast({
        title: "Success!",
        description: "Tournament created successfully with automatic bye advancement",
      })

      // Navigate to tournament page
      router.push(`/tournament/${tournament.id}`)
    } catch (error) {
      console.error("Tournament creation failed:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tournament",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const playerCount = formData.playerList.split("\n").filter((name) => name.trim().length > 0).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Setup</CardTitle>
        <CardDescription>Enter your tournament details and player list to generate a bracket</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tournament-name">Tournament Name</Label>
            <Input
              id="tournament-name"
              placeholder="Enter tournament name"
              value={formData.tournamentName}
              onChange={(e) => updateFormData("tournamentName", e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-list">Player List</Label>
            <Textarea
              id="player-list"
              placeholder="Enter player names, one per line&#10;John Doe&#10;Jane Smith&#10;Mike Johnson&#10;Sarah Wilson"
              value={formData.playerList}
              onChange={(e) => updateFormData("playerList", e.target.value)}
              rows={8}
              disabled={isCreating}
            />
            <p className="text-sm text-muted-foreground">
              {playerCount} players entered
              {playerCount > 0 && (
                <span className="ml-2">
                  → {Math.pow(2, Math.ceil(Math.log2(playerCount)))} bracket slots (
                  {Math.pow(2, Math.ceil(Math.log2(playerCount))) - playerCount} byes)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="randomize"
              checked={formData.randomize}
              onCheckedChange={(checked) => updateFormData("randomize", checked)}
              disabled={isCreating}
            />
            <Label htmlFor="randomize">Randomize player order</Label>
          </div>

          <Button onClick={createTournamentClient} className="w-full" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Bracket...
              </>
            ) : (
              "Generate Bracket"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Utility functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getNextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

async function generateMatchesWithByeAdvancement(
  tournamentId: string,
  players: any[],
  totalSlots: number,
  numRounds: number,
) {
  console.log("🏗️ Generating matches with bye advancement:", {
    tournamentId,
    playerCount: players.length,
    totalSlots,
    numRounds,
  })

  const matches: any[] = []
  const matchesByRound: { [key: number]: any[] } = {}

  // Generate all matches for each round
  for (let round = 1; round <= numRounds; round++) {
    const matchesInRound = Math.pow(2, numRounds - round)
    matchesByRound[round] = []

    for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
      const match = {
        tournament_id: tournamentId,
        round_number: round,
        match_number: matchNum,
        player1_id: null,
        player2_id: null,
        winner_id: null,
        is_bye: false,
        next_match_id: null,
      }

      matchesByRound[round].push(match)
      matches.push(match)
    }
  }

  // Assign players to first round matches
  const firstRoundMatches = matchesByRound[1]
  let playerIndex = 0

  console.log("👥 Assigning players to first round...")
  for (const match of firstRoundMatches) {
    if (playerIndex < players.length) {
      match.player1_id = players[playerIndex].id
      console.log(`   Player1: ${players[playerIndex].name} → R1M${match.match_number}`)
      playerIndex++
    }

    if (playerIndex < players.length) {
      match.player2_id = players[playerIndex].id
      console.log(`   Player2: ${players[playerIndex].name} → R1M${match.match_number}`)
      playerIndex++
    } else if (match.player1_id) {
      // This is a bye - player1 automatically advances
      match.is_bye = true
      match.winner_id = match.player1_id
      console.log(
        `   🎯 BYE: ${players.find((p) => p.id === match.player1_id)?.name} gets bye in R1M${match.match_number}`,
      )
    }
  }

  // Process bye advancement through all rounds
  console.log("🚀 Processing bye advancement through all rounds...")
  await advanceByeWinnersToNextRounds(matchesByRound, players, numRounds)

  console.log("✅ Generated matches with bye advancement:", {
    totalMatches: matches.length,
    byeMatches: matches.filter((m) => m.is_bye).length,
    byRound: Object.keys(matchesByRound).map((round) => ({
      round: Number.parseInt(round),
      matches: matchesByRound[Number.parseInt(round)].length,
      byes: matchesByRound[Number.parseInt(round)].filter((m) => m.is_bye).length,
      preAdvanced: matchesByRound[Number.parseInt(round)].filter((m) => m.player1_id || m.player2_id).length,
    })),
  })

  return matches
}

async function advanceByeWinnersToNextRounds(
  matchesByRound: { [key: number]: any[] },
  players: any[],
  numRounds: number,
) {
  console.log("🔄 Processing bye advancement through all rounds...")

  // Process each round to advance bye winners
  for (let round = 1; round < numRounds; round++) {
    const currentRoundMatches = matchesByRound[round]
    const nextRoundMatches = matchesByRound[round + 1]

    console.log(`📋 Processing Round ${round} → Round ${round + 1}`)

    // Process matches in pairs (since each pair feeds into one next-round match)
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      const match1 = currentRoundMatches[i]
      const match2 = currentRoundMatches[i + 1] || null // Handle odd number of matches
      const nextMatchIndex = Math.floor(i / 2)
      const nextMatch = nextRoundMatches[nextMatchIndex]

      if (!nextMatch) continue

      console.log(
        `   🔗 Linking M${match1.match_number}${match2 ? ` & M${match2.match_number}` : ""} → R${round + 1}M${nextMatch.match_number}`,
      )

      // Check if match1 has a bye winner
      if (match1.is_bye && match1.winner_id) {
        const playerName = players.find((p) => p.id === match1.winner_id)?.name
        if (!nextMatch.player1_id) {
          nextMatch.player1_id = match1.winner_id
          console.log(`     ✅ Advanced bye winner ${playerName} to R${round + 1}M${nextMatch.match_number} (Player1)`)
        } else if (!nextMatch.player2_id) {
          nextMatch.player2_id = match1.winner_id
          console.log(`     ✅ Advanced bye winner ${playerName} to R${round + 1}M${nextMatch.match_number} (Player2)`)
        }
      }

      // Check if match2 has a bye winner
      if (match2 && match2.is_bye && match2.winner_id) {
        const playerName = players.find((p) => p.id === match2.winner_id)?.name
        if (!nextMatch.player1_id) {
          nextMatch.player1_id = match2.winner_id
          console.log(`     ✅ Advanced bye winner ${playerName} to R${round + 1}M${nextMatch.match_number} (Player1)`)
        } else if (!nextMatch.player2_id) {
          nextMatch.player2_id = match2.winner_id
          console.log(`     ✅ Advanced bye winner ${playerName} to R${round + 1}M${nextMatch.match_number} (Player2)`)
        }
      }

      // After advancing bye winners, check if the next match now has a bye situation
      if (nextMatch.player1_id && !nextMatch.player2_id) {
        // Only player1, this becomes a bye if no more matches can fill player2
        const remainingMatches = currentRoundMatches.slice(i + 2)
        const hasMoreWinners = remainingMatches.some((m) => m.is_bye && m.winner_id)

        if (!hasMoreWinners && i + 1 >= currentRoundMatches.length) {
          nextMatch.is_bye = true
          nextMatch.winner_id = nextMatch.player1_id
          const playerName = players.find((p) => p.id === nextMatch.player1_id)?.name
          console.log(
            `     🎯 Created bye in R${round + 1}M${nextMatch.match_number}: ${playerName} advances automatically`,
          )
        }
      } else if (!nextMatch.player1_id && nextMatch.player2_id) {
        // Only player2, move to player1 and make it a bye
        nextMatch.player1_id = nextMatch.player2_id
        nextMatch.player2_id = null
        nextMatch.is_bye = true
        nextMatch.winner_id = nextMatch.player1_id
        const playerName = players.find((p) => p.id === nextMatch.player1_id)?.name
        console.log(
          `     🎯 Created bye in R${round + 1}M${nextMatch.match_number}: ${playerName} advances automatically`,
        )
      }
    }
  }

  // Final verification
  console.log("🔍 Verifying bye advancement integrity...")
  let totalByes = 0
  let advancementErrors = 0

  for (let round = 1; round <= numRounds; round++) {
    const roundMatches = matchesByRound[round]
    const byeMatches = roundMatches.filter((m) => m.is_bye)
    totalByes += byeMatches.length

    console.log(`   Round ${round}: ${byeMatches.length} bye matches out of ${roundMatches.length} total matches`)

    // Verify each bye match has a winner
    byeMatches.forEach((match) => {
      if (!match.winner_id) {
        console.error(`   ❌ Bye match in Round ${round}, Match ${match.match_number} has no winner!`)
        advancementErrors++
      } else {
        const player = players.find((p) => p.id === match.winner_id)
        console.log(`   ✅ Bye verified: ${player?.name} advances from R${round}M${match.match_number}`)
      }
    })

    // Verify advancement to next round
    if (round < numRounds) {
      const nextRoundMatches = matchesByRound[round + 1]
      byeMatches.forEach((byeMatch) => {
        const advancedToNextRound = nextRoundMatches.some(
          (nextMatch) => nextMatch.player1_id === byeMatch.winner_id || nextMatch.player2_id === byeMatch.winner_id,
        )

        if (!advancedToNextRound) {
          console.error(`   ❌ Bye winner from R${round}M${byeMatch.match_number} not found in Round ${round + 1}!`)
          advancementErrors++
        }
      })
    }
  }

  console.log(`🏆 Bye Advancement Summary:`)
  console.log(`   Total bye matches: ${totalByes}`)
  console.log(`   Advancement errors: ${advancementErrors}`)
  console.log(`   Status: ${advancementErrors === 0 ? "✅ All byes properly advanced" : "❌ Errors detected"}`)

  if (advancementErrors > 0) {
    throw new Error(`Bye advancement verification failed with ${advancementErrors} errors`)
  }
}
