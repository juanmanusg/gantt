import { TaskRepository } from '../domain/TaskRepository';
import { Task } from '../domain/Task';

export class GetTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(projectId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.findByProjectId(projectId);
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const memo = new Map<string, boolean>();

    const checkIsIndirectlyBlocked = (taskId: string, visited: Set<string>): boolean => {
      // Si ya tenemos el resultado memoizado, lo devolvemos
      if (memo.has(taskId)) return memo.get(taskId)!;
      
      // Evitar ciclos (safety check, ya deberían estar prevenidos)
      if (visited.has(taskId)) return false;

      const task = taskMap.get(taskId);
      if (!task || !task.dependencies || task.dependencies === '') {
        memo.set(taskId, false);
        return false;
      }

      const depId = task.dependencies;
      const depTask = taskMap.get(depId);
      
      if (!depTask) {
        memo.set(taskId, false);
        return false;
      }

      // Si la dependencia directa está BLOCKED, esta tarea está indirectamente bloqueada
      if (depTask.status === 'BLOCKED') {
        memo.set(taskId, true);
        return true;
      }

      // Si no, verificamos recursivamente si la dependencia está indirectamente bloqueada
      const newVisited = new Set(visited);
      newVisited.add(taskId);
      const isDepIndirectlyBlocked = checkIsIndirectlyBlocked(depId, newVisited);
      
      memo.set(taskId, isDepIndirectlyBlocked);
      return isDepIndirectlyBlocked;
    };

    return tasks.map(task => ({
      ...task,
      isIndirectlyBlocked: checkIsIndirectlyBlocked(task.id, new Set())
    }));
  }
}
