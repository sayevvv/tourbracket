import { BracketSetup } from "@/components/bracket-setup"
import { SetupInstructions } from "@/components/setup-instructions"
import { ConnectionTest } from "@/components/connection-test"
import { isSupabaseConfigured } from "@/lib/supabase"
import Link from "next/link"
import { Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return <SetupInstructions />
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Create Your Tournament</h2>
        <p className="text-muted-foreground mb-6">
          Set up a new single-elimination tournament bracket. Enter your tournament name and player list to get started.
        </p>

        {/* Add View Tournaments Button */}
        <div className="flex justify-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/tournaments">
              <Trophy className="mr-2 h-4 w-4" />
              View Existing Tournaments
            </Link>
          </Button>
        </div>
      </div>

      <ConnectionTest />
      <BracketSetup />
    </div>
  )
}
