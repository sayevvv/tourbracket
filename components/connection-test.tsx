"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function ConnectionTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const { toast } = useToast()

  const testConnection = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client is not initialized",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setConnectionStatus("idle")

    try {
      // Test the connection by trying to fetch from tournaments table
      const { data, error } = await supabase.from("tournaments").select("count").limit(1)

      if (error) {
        console.error("Connection test error:", error)
        setConnectionStatus("error")
        toast({
          title: "Connection Failed",
          description: `Database error: ${error.message}`,
          variant: "destructive",
        })
      } else {
        console.log("Connection test successful:", data)
        setConnectionStatus("success")
        toast({
          title: "Connection Successful",
          description: "Database is properly configured and accessible",
        })
      }
    } catch (error) {
      console.error("Connection test failed:", error)
      setConnectionStatus("error")
      toast({
        title: "Connection Failed",
        description: "Unable to connect to database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Database Connection Test
          {connectionStatus === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
          {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>Test your Supabase database connection before creating tournaments</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={testConnection} disabled={isLoading} variant="outline">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            "Test Database Connection"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
