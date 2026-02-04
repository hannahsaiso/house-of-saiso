import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, Database } from "lucide-react";
import { FinancialLedger } from "./FinancialLedger";
import { TeamTab } from "./TeamTab";
import { ClientDatabaseTab } from "./ClientDatabaseTab";
import { useUserRole } from "@/hooks/useUserRole";

export function VaultTabs() {
  const { isAdmin } = useUserRole();

  // Staff can only see Client Database, not Financials or HR (Team)
  // Per custom knowledge: "Frankie (Staff) should never see the 'Financials' or 'HR' tabs"
  const defaultTab = isAdmin ? "financials" : "clients";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-8 border-b border-[hsl(var(--vault-border))] bg-transparent p-0">
        {isAdmin && (
          <TabsTrigger
            value="financials"
            className="gap-2 rounded-none border-b-2 border-transparent px-6 py-3 text-[hsl(var(--vault-muted))] data-[state=active]:border-[hsl(var(--vault-accent))] data-[state=active]:bg-transparent data-[state=active]:text-[hsl(var(--vault-accent))]"
          >
            <DollarSign className="h-4 w-4" />
            Financials
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger
            value="team"
            className="gap-2 rounded-none border-b-2 border-transparent px-6 py-3 text-[hsl(var(--vault-muted))] data-[state=active]:border-[hsl(var(--vault-accent))] data-[state=active]:bg-transparent data-[state=active]:text-[hsl(var(--vault-accent))]"
          >
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        )}
        <TabsTrigger
          value="clients"
          className="gap-2 rounded-none border-b-2 border-transparent px-6 py-3 text-[hsl(var(--vault-muted))] data-[state=active]:border-[hsl(var(--vault-accent))] data-[state=active]:bg-transparent data-[state=active]:text-[hsl(var(--vault-accent))]"
        >
          <Database className="h-4 w-4" />
          Client Database
        </TabsTrigger>
      </TabsList>

      {isAdmin && (
        <TabsContent value="financials" className="mt-0">
          <FinancialLedger />
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="team" className="mt-0">
          <TeamTab />
        </TabsContent>
      )}

      <TabsContent value="clients" className="mt-0">
        <ClientDatabaseTab />
      </TabsContent>
    </Tabs>
  );
}
