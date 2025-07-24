import { notFound } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { BracketDisplay } from "@/components/bracket-display"
import type { TournamentData } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface TournamentPageProps {
  params: Promise<{ id: string }>
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { id } = await params

  // Check if Supabase is configured
  if (!isSupabaseConfigured() || !supabase) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>Supabase is not configured. Please set up your environment variables.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">To use this application, you need to:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Create a Supabase project</li>
              <li>Run the database schema from scripts/01-create-tables.sql</li>
              <li>Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch tournament data
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single()

  if (tournamentError || !tournament) {
    notFound()
  }

  // Fetch players
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("tournament_id", id)
    .order("seed_position")

  if (playersError) {
    notFound()
  }

  // Fetch matches with player data
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(`
      *,
      player1:players!matches_player1_id_fkey(*),
      player2:players!matches_player2_id_fkey(*),
      winner:players!matches_winner_id_fkey(*)
    `)
    .eq("tournament_id", id)
    .order("round_number")
    .order("match_number")

  if (matchesError) {
    notFound()
  }

  const tournamentData: TournamentData = {
    tournament,
    players: players || [],
    matches: matches || [],
  }

  return (
    <div>
      {/* Add Back Button */}
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-muted-foreground">
          {players?.length || 0} players • {Math.max(...(matches?.map((m) => m.round_number) || [0]))} rounds
        </p>
      </div>
      <BracketDisplay tournamentData={tournamentData} />
    </div>
  )
}
