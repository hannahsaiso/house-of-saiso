import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { Plus, Archive, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects, Project } from "@/hooks/useProjects";
import { ProjectWorkspace } from "@/components/projects/ProjectWorkspace";
import { NewProjectDialog } from "@/components/dashboard/NewProjectDialog";
import { format } from "date-fns";

const statusColors = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  archived: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { activeProjects, archivedProjects, isLoading, restoreProject } = useProjects(true);

  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  if (selectedProject) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => setSelectedProject(null)}
          >
            ← Back to Projects
          </Button>
          <ProjectWorkspace project={selectedProject} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-editorial text-muted-foreground">
              Agency
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Projects
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage client projects and workspaces.
            </p>
          </div>

          <NewProjectDialog
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            }
          />
        </div>

        {/* Tabs for Active/Archived */}
        <Tabs
          defaultValue="active"
          className="mt-8"
          onValueChange={(v) => setShowArchived(v === "archived")}
        >
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Active
              <Badge variant="secondary" className="ml-1">
                {activeProjects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="h-4 w-4" />
              Archives
              {archivedProjects.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {archivedProjects.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <ProjectGrid
              projects={activeProjects}
              isLoading={isLoading}
              onSelectProject={setSelectedProject}
            />
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <ProjectGrid
              projects={archivedProjects}
              isLoading={isLoading}
              onSelectProject={setSelectedProject}
              isArchived
              onRestore={(id) => restoreProject.mutate(id)}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

function ProjectGrid({
  projects,
  isLoading,
  onSelectProject,
  isArchived = false,
  onRestore,
}: {
  projects: Project[];
  isLoading: boolean;
  onSelectProject: (project: Project) => void;
  isArchived?: boolean;
  onRestore?: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {isArchived ? (
              <Archive className="h-6 w-6 text-muted-foreground" />
            ) : (
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <h4 className="font-medium">
            {isArchived ? "No archived projects" : "No projects yet"}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {isArchived
              ? "Completed projects will appear here"
              : "Create a new project to get started"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            onClick={() => onSelectProject(project)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-lg font-semibold leading-tight">
                    {project.title}
                  </h3>
                  {project.client && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.client.name}
                      {project.client.company && ` • ${project.client.company}`}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 ${
                    statusColors[project.status as keyof typeof statusColors] ||
                    statusColors.active
                  }`}
                >
                  {project.status}
                </Badge>
              </div>

              {project.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                {project.due_date && (
                  <span>Due {format(new Date(project.due_date), "MMM d, yyyy")}</span>
                )}
                {isArchived && project.archived_at && (
                  <span>
                    Archived {format(new Date(project.archived_at), "MMM d, yyyy")}
                  </span>
                )}
              </div>

              {isArchived && onRestore && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(project.id);
                  }}
                >
                  Restore Project
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default Projects;
