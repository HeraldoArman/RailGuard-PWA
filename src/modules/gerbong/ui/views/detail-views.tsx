import Link from "next/link"
import { ArrowLeft, Eye, Send } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DetailViews() {
  return (
    <div className="min-h-screen bg-background pb-24">


      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Alert Header */}
        <Card className="bg-destructive/10 border-destructive/30 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-destructive/20 p-2 rounded-lg">
              <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-destructive mb-1">Suspicious Interaction Detected</h2>
              <p className="text-sm text-foreground/80">Carriage 5 • 14:45:32</p>
            </div>
          </div>
        </Card>

        {/* Blurred Snapshot */}
        <Card className="bg-card border-border overflow-hidden mb-6">
          <div className="aspect-video bg-secondary/30 relative flex items-center justify-center">
            <div className="absolute inset-0 backdrop-blur-3xl bg-secondary/50" />
            <div className="relative z-10 text-center">
              <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Visual snapshot (privacy protected)</p>
            </div>
          </div>
        </Card>

        {/* Detection Details */}
        <Card className="bg-card border-border p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Detection Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Confidence Level</span>
              <Badge className="bg-warning/20 text-warning border-warning/30">87% High</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Detection Type</span>
              <span className="text-sm font-medium text-foreground">Physical Contact</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Behavior Pattern</span>
              <span className="text-sm font-medium text-foreground">Unreciprocated</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="text-sm font-medium text-foreground">23 seconds</span>
            </div>
          </div>
        </Card>

        {/* Additional Context */}
        <Card className="bg-card border-border p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Context Information</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• AI detected sustained physical contact between two individuals</p>
            <p>• Body language analysis indicates discomfort from one party</p>
            <p>• No verbal distress signals detected</p>
            <p>• Situation requires discreet officer assessment</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-border hover:bg-secondary bg-transparent"
            >
              <Eye className="w-4 h-4" />
              Monitor Silently
            </Button>
            <Button className="flex items-center gap-2 bg-primary hover:bg-destructive/90 text-destructive-foreground">
              <Send className="w-4 h-4" />
              Send Officer
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
