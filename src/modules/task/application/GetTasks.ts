import { TaskRepository } from '../domain/TaskRepository';
import { Task } from '../domain/Task';

export class GetTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(projectId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.findByProjectId(projectId);
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const memo = new Map<string, boolean>();

    const checkIsIndirectlyBlocked = (taskId: string): boolean => {
      const task = taskMap.get(taskId);
      if (!task || task.status === 'BLOCKED') return false;

      // Helper to check if any ancestor is BLOCKED
      const hasBlockedAncestor = (id: string, visited: Set<string>): boolean => {
        if (visited.has(id)) return false;
        const t = taskMap.get(id);
        if (!t || !t.dependencies || t.dependencies === '') return false;
        
        const dep = taskMap.get(t.dependencies);
        if (dep?.status === 'BLOCKED') return true;
        
        visited.add(id);
        return hasBlockedAncestor(t.dependencies, visited);
      };

      // Helper to check if any descendant is BLOCKED and starts before this task ends
      const hasBlockedDescendant = (id: string, visited: Set<string>): boolean => {
        if (visited.has(id)) return false;
        const currentTask = taskMap.get(taskId); // The original task we are checking for
        if (!currentTask) return false;

        const children = tasks.filter(t => t.dependencies === id);
        for (const child of children) {
          // Temporal constraint: Child must start before parent ends to cause a block
          if (child.status === 'BLOCKED' && child.start < currentTask.end) return true;
          
          visited.add(id);
          if (hasBlockedDescendant(child.id, visited)) return true;
        }
        return false;
      };

      return hasBlockedAncestor(taskId, new Set()) || hasBlockedDescendant(taskId, new Set());
    };


    return tasks.map(task => ({
      ...task,
      isIndirectlyBlocked: checkIsIndirectlyBlocked(task.id)
    }));
  }
}
