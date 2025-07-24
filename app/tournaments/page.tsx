import Link from "next/link"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { TournamentsList } from "@/components/tournaments-list"
import { SetupInstructions } from "@/components/setup-instructions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"

export default async function TournamentsPage() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured() || !supabase) {
    return <SetupInstructions />
  }

  // Fetch all tournaments with player and match counts
  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select(`
      *,
      players:players(count),
      matches:matches(count)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tournaments:", error)
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Tournament Dashboard</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Error Loading Tournaments</CardTitle>
            <CardDescription>There was an error loading the tournaments from the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Error: {error.message}</p>
            <Button asChild>
              <Link href="/">Create Your First Tournament</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tournament Dashboard</h1>
            <p className="text-muted-foreground">View and manage all your tournament brackets</p>
          </div>
        </div>

        <Button asChild>
          <Link href="/">
            <Plus className="h-4 w-4 mr-2" />
            Create New Tournament
          </Link>
        </Button>
      </div>

      {/* Tournaments List */}
      <TournamentsList tournaments={tournaments || []} />
    </div>
  )
}
