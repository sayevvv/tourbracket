"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database, Key, Play } from 'lucide-react'

export function SetupInstructions() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Welcome to Tournament Bracket Generator</h2>
        <p className="text-muted-foreground">
          To get started, you'll need to configure Supabase for database functionality.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Configuration Required:</strong> Supabase environment variables are not set up. 
          Follow the steps below to configure your database.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Step 1: Create Supabase Project
            </CardTitle>
            <CardDescription>
              Set up your database backend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a> and create a new project</li>
              <li>Wait for your project to be fully provisioned</li>
              <li>Go to Settings → API to find your project URL and anon key</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Step 2: Configure Environment Variables
            </CardTitle>
            <CardDescription>
              Add your Supabase credentials to the project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Create a <code className="bg-muted px-1 rounded">.env.local</code> file in your project root with:</p>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Step 3: Set Up Database Schema
            </CardTitle>
            <CardDescription>
              Run the SQL script to create the required tables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>In your Supabase dashboard, go to the SQL Editor</li>
              <li>Run the script from <code className="bg-muted px-1 rounded">scripts/01-create-tables.sql</code></li>
              <li>This will create the tournaments, players, and matches tables</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertDescription>
          After completing these steps, restart your development server and refresh this page to start creating tournaments!
        </AlertDescription>
      </Alert>
    </div>
  )
}
