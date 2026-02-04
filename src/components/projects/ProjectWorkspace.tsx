import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Folder, 
  Palette, 
  FileText, 
  CheckSquare, 
  MessageSquare,
  Archive,
  ExternalLink
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Project, useProjects } from "@/hooks/useProjects";
import { DesignTab } from "./tabs/DesignTab";
import { ResourcesTab } from "./tabs/ResourcesTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { TasksTab } from "./tabs/TasksTab";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProjectWorkspaceProps {
  project: Project;
}

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("tasks");
  const { archiveProject } = useProjects();
  const { isAdminOrStaff, isAdmin } = useUserRole();

  const statusColors = {
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    archived: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              {project.title}
            </h1>
            <Badge
              variant="outline"
              className={statusColors[project.status as keyof typeof statusColors] || statusColors.active}
            >
              {project.status}
            </Badge>
          </div>
          {project.client && (
            <p className="mt-1 text-muted-foreground">
              {project.client.name}
              {project.client.company && ` • ${project.client.company}`}
            </p>
          )}
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>

        {isAdminOrStaff && project.status !== "archived" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Archive className="h-4 w-4" />
                Complete Project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will move the project to the archives. You can restore it
                  later if needed. The project will no longer appear in your
                  active dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => archiveProject.mutate(project.id)}
                >
                  Archive Project
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-1 sm:w-auto sm:grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="tasks" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Design</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Folder className="h-4 w-4" />
            <span className="hidden sm:inline">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <TasksTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <DesignTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <ResourcesTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab projectId={project.id} clientId={project.client_id} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
