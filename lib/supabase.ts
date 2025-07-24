import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
}

// Create Supabase client with error handling
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}

// Types for our database tables
export interface Tournament {
  id: string
  name: string
  created_at: string
}

export interface Player {
  id: string
  tournament_id: string
  name: string
  seed_position: number | null
}

export interface Match {
  id: string
  tournament_id: string
  round_number: number
  match_number: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  is_bye: boolean
  next_match_id: string | null
  player1?: Player | null
  player2?: Player | null
  winner?: Player | null
}

export interface TournamentData {
  tournament: Tournament
  players: Player[]
  matches: Match[]
}
