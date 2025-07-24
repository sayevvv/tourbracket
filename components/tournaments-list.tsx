"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Users, Trophy, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DeleteTournamentDialog } from "./delete-tournament-dialog"

interface Tournament {
  id: string
  name: string
  created_at: string
  players: { count: number }[]
  matches: { count: number }[]
}

interface TournamentsListProps {
  tournaments: Tournament[]
}

export function TournamentsList({ tournaments }: TournamentsListProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; tournament: Tournament | null }>({
    isOpen: false,
    tournament: null,
  })

  const handleDeleteClick = (tournament: Tournament) => {
    setDeleteDialog({
      isOpen: true,
      tournament,
    })
  }

  const handleDeleteClose = () => {
    setDeleteDialog({
      isOpen: false,
      tournament: null,
    })
  }

  if (tournaments.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>No Tournaments Yet</CardTitle>
          <CardDescription>
            You haven't created any tournaments yet. Create your first tournament to get started!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/">Create Your First Tournament</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTournamentStatus = (tournament: Tournament) => {
    const playerCount = tournament.players[0]?.count || 0
    const matchCount = tournament.matches[0]?.count || 0

    if (playerCount === 0) return { status: "Empty", variant: "secondary" as const }
    if (matchCount === 0) return { status: "Setup", variant: "outline" as const }

    // This is a simplified status - in a real app you'd check match completion
    return { status: "Active", variant: "default" as const }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournaments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tournaments.reduce((sum, t) => sum + (t.players[0]?.count || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Tournament</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{tournaments.length > 0 ? tournaments[0].name : "None"}</div>
            <div className="text-xs text-muted-foreground">
              {tournaments.length > 0 ? formatDate(tournaments[0].created_at) : ""}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournaments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tournaments</CardTitle>
          <CardDescription>Click on any tournament to view its bracket and manage matches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament Name</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((tournament) => {
                const { status, variant } = getTournamentStatus(tournament)
                const playerCount = tournament.players[0]?.count || 0

                return (
                  <TableRow key={tournament.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/tournament/${tournament.id}`} className="hover:text-primary transition-colors">
                        {tournament.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {playerCount} players
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant}>{status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tournament.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/tournament/${tournament.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Bracket
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(tournament)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Tournament
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteDialog.tournament && (
        <DeleteTournamentDialog
          tournament={deleteDialog.tournament}
          isOpen={deleteDialog.isOpen}
          onClose={handleDeleteClose}
        />
      )}
    </div>
  )
}
