import { TaskRepository } from '../domain/TaskRepository';
import { Task } from '../domain/Task';

export class GetTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(projectId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.findByProjectId(projectId);
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    // Identificamos los sucesores (tareas que dependen de cada tarea)
    const successorsMap = new Map<string, string[]>();
    tasks.forEach(task => {
      const deps = task.dependencies.split(',').filter(d => d.trim() !== '');
      deps.forEach(depId => {
        const list = successorsMap.get(depId) || [];
        list.push(task.id);
        successorsMap.set(depId, list);
      });
    });

    const memoSources = new Map<string, { id: string; name: string; reason: string | null }[]>();

    /**
     * Devuelve la lista de tareas que están causando el bloqueo (culpables).
     * Una tarea está indirectamente bloqueada si alguno de sus sucesores
     * está bloqueado (bloqueo directo) o tiene sucesores bloqueados.
     */
    const getBlockingSources = (taskId: string, visited: Set<string>): { id: string; name: string; reason: string | null }[] => {
      if (memoSources.has(taskId)) return memoSources.get(taskId)!;
      if (visited.has(taskId)) return [];

      const successors = successorsMap.get(taskId) || [];
      const sources: { id: string; name: string; reason: string | null }[] = [];
      
      const newVisited = new Set(visited);
      newVisited.add(taskId);

      for (const succId of successors) {
        const succTask = taskMap.get(succId);
        if (!succTask) continue;

        // Si el sucesor está bloqueado directamente, él mismo es una fuente
        if (succTask.status === 'BLOCKED') {
          sources.push({
            id: succTask.id,
            name: succTask.name,
            reason: succTask.blockingReason
          });
        }

        // También buscamos fuentes en los sucesores del sucesor (recursivo)
        const subSources = getBlockingSources(succId, newVisited);
        sources.push(...subSources);
      }

      // Eliminar duplicados por ID
      const uniqueSources = Array.from(new Map(sources.map(s => [s.id, s])).values());
      memoSources.set(taskId, uniqueSources);
      return uniqueSources;
    };

    return tasks.map(task => {
      const sources = getBlockingSources(task.id, new Set());
      return {
        ...task,
        isLeaf: !successorsMap.has(task.id) || successorsMap.get(task.id)!.length === 0,
        isIndirectlyBlocked: sources.length > 0,
        blockingSources: sources
      };
    });
  }
}
