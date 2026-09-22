import { useState } from "react";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useActionFeedback } from "@/components/shared/action-feedback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useProjects,
  type ProjectItem,
} from "@/features/projects/project-context";

interface AddToProjectProps {
  buildItem: () => Omit<ProjectItem, "id" | "selected">;
  onAdded?: (projectName: string) => void;
  size?: "sm" | "default";
  defaultMachine?: string;
  accountId?: string;
}

const NEW_PROJECT = "__new__";
const SELECT_PROJECT = "__select__";

export function AddToProject({ buildItem, onAdded, size = "default", defaultMachine, accountId = "account-northstar" }: AddToProjectProps) {
  const { projects, addItemToProject, createProject } = useProjects();
  const { showFeedback } = useActionFeedback();
  const [target, setTarget] = useState<string>(SELECT_PROJECT);
  const hasProjects = projects.length > 0;
  const selectedProjectName = projects.find((project) => project.id === target)?.name;

  function handleTargetChange(value: string) {
    if (value === NEW_PROJECT) {
      const name = window.prompt("Name the new repair project", "New repair project");
      if (!name) return;
      const projectId = createProject({
        name,
        accountId,
        machine: defaultMachine ?? "",
        issue: "",
        status: "Planning",
        responsible: "",
        targetDate: "",
      });
      setTarget(projectId);
      return;
    }

    setTarget(value);
  }

  function handleAdd() {
    if (!hasProjects || target === SELECT_PROJECT) return;
    let projectId = target;
    let projectName = projects.find((project) => project.id === target)?.name ?? "project";

    if (target === NEW_PROJECT) {
      const name = window.prompt("Name the new repair project", "New repair project");
      if (!name) return;
      projectId = createProject({
        name,
        accountId,
        machine: defaultMachine ?? "",
        issue: "",
        status: "Planning",
        responsible: "",
        targetDate: "",
      });
      projectName = name;
    }

    const item = buildItem();
    addItemToProject(projectId, item);
    showFeedback({ itemName: item.name, destination: "project", projectName });
    onAdded?.(projectName);
  }

  return (
    <div className="flex items-center" role="group" aria-label="Add item to project">
      <Button variant="outline" size={size === "sm" ? "sm" : "default"} className="rounded-r-none" disabled={!hasProjects || target === SELECT_PROJECT} onClick={handleAdd}>
        {target === SELECT_PROJECT ? (hasProjects ? "Select project" : "No project") : <><FolderPlus className={size === "sm" ? "mr-2 size-3" : "mr-2 size-4"} />{selectedProjectName}</>}
      </Button>
      <Select value={target} onValueChange={handleTargetChange}>
        <SelectTrigger className={size === "sm" ? "size-8 justify-center rounded-l-none px-0 text-xs [&>span]:hidden [&>svg]:m-0" : "size-9 justify-center rounded-l-none px-0 [&>span]:hidden [&>svg]:m-0"} aria-label="Choose project" title="Choose project">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SELECT_PROJECT} disabled>Select project</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
          ))}
          <SelectItem value={NEW_PROJECT}>+ New project…</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
