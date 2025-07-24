-- Tournament Bracket Generator Database Schema
-- Run this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table to store tournament metadata
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table to store players, linked to a tournament
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    seed_position INT -- Original position/seed before shuffling
);

-- 3. Table to store individual matches within a bracket
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    match_number INT NOT NULL, -- Position within the round
    player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
    is_bye BOOLEAN DEFAULT FALSE,
    next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL -- Link to the next match
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_tournament_id ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round_number ON matches(round_number);

-- Add some constraints to ensure data integrity
ALTER TABLE matches ADD CONSTRAINT check_round_number CHECK (round_number > 0);
ALTER TABLE matches ADD CONSTRAINT check_match_number CHECK (match_number > 0);
ALTER TABLE players ADD CONSTRAINT check_seed_position CHECK (seed_position IS NULL OR seed_position > 0);
