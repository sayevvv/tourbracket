"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface DeleteTournamentDialogProps {
  tournament: {
    id: string
    name: string
  }
  isOpen: boolean
  onClose: () => void
}

export function DeleteTournamentDialog({ tournament, isOpen, onClose }: DeleteTournamentDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const isConfirmValid = confirmText.toLowerCase() === "delete"

  const handleDelete = async () => {
    if (!isConfirmValid || !supabase) {
      return
    }

    setIsDeleting(true)

    try {
      console.log("Deleting tournament:", tournament.id)

      // Delete the tournament (cascade will handle players and matches)
      const { error } = await supabase.from("tournaments").delete().eq("id", tournament.id)

      if (error) {
        console.error("Failed to delete tournament:", error)
        throw new Error("Failed to delete tournament")
      }

      console.log("Tournament deleted successfully")

      toast({
        title: "Tournament Deleted",
        description: `"${tournament.name}" has been permanently deleted.`,
      })

      onClose()
      setConfirmText("")

      // Refresh the page to update the tournaments list
      router.refresh()
    } catch (error) {
      console.error("Delete tournament error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete tournament. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Tournament
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the tournament, all players, and all match data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tournament Info */}
          <div className="p-4 bg-muted rounded-lg border-l-4 border-l-destructive">
            <div className="font-medium text-sm">Tournament to delete:</div>
            <div className="font-bold text-lg">{tournament.name}</div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-mono font-bold bg-muted px-1 rounded">delete</span> to confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              disabled={isDeleting}
              className={confirmText && !isConfirmValid ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {confirmText && !isConfirmValid && (
              <p className="text-sm text-destructive">Please type "delete" exactly to confirm</p>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-destructive">Warning:</div>
              <div className="text-muted-foreground">
                This will permanently delete all tournament data including players, matches, and results. This action
                cannot be undone.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="min-w-[100px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Tournament
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
