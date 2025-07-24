"use server"

import { redirect } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

/**
 * Creates a new tournament with players and generates the complete bracket structure
 */
export async function createTournament(tournamentName: string, playerList: string, randomize: boolean) {
  console.log("Server action called with:", {
    tournamentName,
    playerList: playerList.substring(0, 50) + "...",
    randomize,
  })

  // Check if Supabase is configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error("Supabase not configured")
    throw new Error("Supabase is not configured. Please set up your environment variables.")
  }

  if (!tournamentName || !playerList) {
    console.error("Missing required fields")
    throw new Error("Tournament name and player list are required")
  }

  // Parse player names
  let players = playerList
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name.length > 0)

  if (players.length < 2) {
    console.error("Not enough players:", players.length)
    throw new Error("At least 2 players are required")
  }

  // Randomize players if requested
  if (randomize) {
    players = shuffleArray([...players])
    console.log("Players randomized")
  }

  // Calculate bracket structure
  const totalSlots = getNextPowerOfTwo(players.length)
  const numRounds = Math.log2(totalSlots)

  console.log("Tournament structure:", {
    playerCount: players.length,
    totalSlots,
    numRounds,
  })

  try {
    // Create tournament
    console.log("Creating tournament record...")
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert({ name: tournamentName })
      .select()
      .single()

    if (tournamentError) {
      console.error("Tournament creation error:", tournamentError)
      throw new Error(`Failed to create tournament: ${tournamentError.message}`)
    }

    if (!tournament) {
      console.error("No tournament data returned")
      throw new Error("Tournament was not created")
    }

    console.log("Tournament created successfully:", tournament.id)

    // Create players with seed positions
    console.log("Creating player records...")
    const playersData = players.map((name, index) => ({
      tournament_id: tournament.id,
      name,
      seed_position: index + 1,
    }))

    const { data: createdPlayers, error: playersError } = await supabase.from("players").insert(playersData).select()

    if (playersError) {
      console.error("Players creation error:", playersError)
      throw new Error(`Failed to create players: ${playersError.message}`)
    }

    if (!createdPlayers || createdPlayers.length === 0) {
      console.error("No players created")
      throw new Error("Players were not created")
    }

    console.log("Players created successfully:", createdPlayers.length)

    // Generate bracket structure
    console.log("Generating bracket matches...")
    const matches = generateBracketMatches(tournament.id, createdPlayers, totalSlots, numRounds)

    if (matches.length === 0) {
      console.error("No matches generated")
      throw new Error("Failed to generate bracket matches")
    }

    console.log("Generated matches:", matches.length)

    // Insert all matches
    console.log("Inserting matches into database...")
    const { error: matchesError } = await supabase.from("matches").insert(matches)

    if (matchesError) {
      console.error("Matches creation error:", matchesError)
      throw new Error(`Failed to create matches: ${matchesError.message}`)
    }

    console.log("Tournament creation completed successfully")

    // Redirect to the tournament page
    redirect(`/tournament/${tournament.id}`)
  } catch (error) {
    console.error("Error in createTournament:", error)
    throw error
  }
}

/**
 * Utility function to shuffle an array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get the next power of 2 greater than or equal to n
 */
function getNextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

/**
 * Generate the complete bracket structure with all matches
 */
function generateBracketMatches(tournamentId: string, players: any[], totalSlots: number, numRounds: number) {
  console.log("Generating bracket with:", { tournamentId, playerCount: players.length, totalSlots, numRounds })

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

  // Link matches to their next round matches
  for (let round = 1; round < numRounds; round++) {
    const currentRoundMatches = matchesByRound[round]
    const nextRoundMatches = matchesByRound[round + 1]

    for (let i = 0; i < currentRoundMatches.length; i++) {
      const nextMatchIndex = Math.floor(i / 2)
      if (nextRoundMatches[nextMatchIndex]) {
        // We'll handle linking after database insertion since we need actual IDs
        currentRoundMatches[i].next_match_position = {
          round: round + 1,
          match: nextMatchIndex + 1,
        }
      }
    }
  }

  // Assign players to first round matches
  const firstRoundMatches = matchesByRound[1]
  let playerIndex = 0

  for (let i = 0; i < firstRoundMatches.length; i++) {
    const match = firstRoundMatches[i]

    // Assign first player
    if (playerIndex < players.length) {
      match.player1_id = players[playerIndex].id
      playerIndex++
    }

    // Assign second player or mark as bye
    if (playerIndex < players.length) {
      match.player2_id = players[playerIndex].id
      playerIndex++
    } else if (match.player1_id) {
      // This is a bye - player1 automatically advances
      match.is_bye = true
      match.winner_id = match.player1_id
    }
  }

  // Remove the temporary next_match_position property
  matches.forEach((match) => {
    delete match.next_match_position
  })

  console.log("Generated matches structure:", {
    totalMatches: matches.length,
    byRound: Object.keys(matchesByRound).map((round) => ({
      round: Number.parseInt(round),
      matches: matchesByRound[Number.parseInt(round)].length,
    })),
  })

  return matches
}
