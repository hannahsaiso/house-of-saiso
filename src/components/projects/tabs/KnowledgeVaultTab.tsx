import { motion } from "framer-motion";
import { 
  Lock, 
  FileText, 
  Loader2, 
  RefreshCw,
  Sparkles,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useIntakeCanvas } from "@/hooks/useIntakeCanvas";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface KnowledgeVaultTabProps {
  projectId: string;
}

export function KnowledgeVaultTab({ projectId }: KnowledgeVaultTabProps) {
  const { canvas, vault, isLoadingVault, generateCharter } = useIntakeCanvas(projectId);

  if (isLoadingVault) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold">
          No Project Charter Yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Complete the Intake Canvas and generate a Project Charter to unlock the Knowledge Vault.
        </p>
        {canvas && (
          <Button
            className="mt-6 gap-2"
            onClick={() => generateCharter.mutate(canvas.id)}
            disabled={generateCharter.isPending}
          >
            {generateCharter.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Project Charter
          </Button>
        )}
      </div>
    );
  }

  // Check if charter has Historical Context section
  const hasHistoricalContext = vault.project_charter?.includes("Historical Context") || 
                               vault.project_charter?.includes("## Historical");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl space-y-8"
    >
      {/* Header with Tags */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-editorial text-muted-foreground">
              Project DNA
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              Knowledge Vault
            </h2>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Lock className="h-3 w-3" />
            Read-Only
          </Badge>
        </div>

        {/* Persistent Tags */}
        <div className="flex flex-wrap gap-2">
          {vault.pillar_tags?.map((pillar, index) => (
            <Badge
              key={`pillar-${index}`}
              variant="outline"
              className="border-primary/30 bg-primary/5 text-foreground"
            >
              {pillar}
            </Badge>
          ))}
          {vault.tone_tags?.map((tone, index) => (
            <Badge
              key={`tone-${index}`}
              variant="outline"
              className="border-accent/50 bg-accent/10 text-foreground"
            >
              {tone}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Project Charter */}
      <Card className="border-0 bg-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">
                  Project Charter
                </h3>
                <p className="text-xs text-muted-foreground">
                  Generated {format(new Date(vault.generated_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            {canvas && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateCharter.mutate(canvas.id)}
                disabled={generateCharter.isPending}
                className="gap-2 text-muted-foreground"
              >
                {generateCharter.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-heading prose-headings:tracking-tight prose-p:leading-relaxed prose-strong:font-semibold"
            dangerouslySetInnerHTML={{ 
              __html: formatCharterToHtml(vault.project_charter, hasHistoricalContext) 
            }}
          />
        </CardContent>
      </Card>

      {/* Historical Context Highlight (if present) */}
      {hasHistoricalContext && (
        <Card className="border-2 border-[hsl(43,65%,52%,0.3)] bg-[hsl(43,65%,52%,0.05)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(43,65%,52%,0.15)]">
                <History className="h-4 w-4 text-[hsl(43,65%,52%)]" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-[hsl(43,65%,42%)] dark:text-[hsl(43,65%,62%)]">
                  Historical Intelligence
                </h3>
                <p className="text-xs text-muted-foreground">
                  Exclusive insights from previous engagements
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-[hsl(43,65%,35%)] dark:text-[hsl(43,65%,70%)] leading-relaxed italic">
              This section contains proprietary knowledge synthesized from your client's history with the studio, 
              including past project preferences, successful approaches, and relationship insights.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Source Reference */}
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-xs text-muted-foreground">
          This charter was synthesized from the Intake Canvas data using AI. 
          It serves as the single source of truth for project strategy.
        </p>
      </div>
    </motion.div>
  );
}

function formatCharterToHtml(markdown: string, hasHistoricalContext: boolean): string {
  let html = markdown
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/g, "")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|l|p])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");

  // Add special styling to Historical Context section
  if (hasHistoricalContext) {
    html = html.replace(
      /(<h2>Historical Context<\/h2>)/gi,
      '<h2 class="text-[hsl(43,65%,42%)] dark:text-[hsl(43,65%,62%)] border-b-2 border-[hsl(43,65%,52%,0.3)] pb-2">Historical Context</h2>'
    );
  }

  return html;
}
