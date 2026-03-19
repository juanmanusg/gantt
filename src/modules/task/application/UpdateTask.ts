import { TaskRepository } from '../domain/TaskRepository';
import { Task } from '../domain/Task';

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string, data: Partial<{
    name: string;
    start: Date;
    end: Date;
    progress: number;
    status: string;
    blockingReason: string;
    dependencies: string;
    dependencyPercentage: number;
  }>): Promise<Task> {
    const currentTask = await this.taskRepository.findById(id);
    if (!currentTask) throw new Error('Task not found');

    // Validar que solo se puedan bloquear tareas hoja
    if (data.status === 'BLOCKED') {
      const allTasks = await this.taskRepository.findByProjectId(currentTask.projectId);
      const isLeaf = !allTasks.some(t => {
        const deps = t.dependencies.split(',').filter(d => d.trim() !== '');
        return deps.includes(id);
      });
      if (!isLeaf) {
        throw new Error('Solo se pueden bloquear tareas que no tengan sucesores (tareas hoja)');
      }
    }

    // Validar ciclos si se cambia la dependencia
    if (data.dependencies !== undefined && data.dependencies !== '') {
      if (data.dependencies === id) {
        throw new Error('A task cannot depend on itself');
      }

      const allTasks = await this.taskRepository.findByProjectId(currentTask.projectId);
      const tasksMap = new Map(allTasks.map(t => [t.id, t]));
      
      let currentDepId = data.dependencies;
      const visited = new Set<string>();
      visited.add(id);

      while (currentDepId && currentDepId !== '') {
        if (visited.has(currentDepId)) {
          throw new Error('Cycle detected in dependencies');
        }
        visited.add(currentDepId);
        const parentTask = tasksMap.get(currentDepId);
        if (!parentTask || !parentTask.dependencies) break;
        currentDepId = parentTask.dependencies;
      }
    }

    const updatedData = { ...data };

    // Si se actualiza la dependencia o el porcentaje, recalculamos fechas
    if (data.dependencies !== undefined || data.dependencyPercentage !== undefined) {
      const depId = data.dependencies ?? currentTask.dependencies;
      const depPerc = data.dependencyPercentage ?? currentTask.dependencyPercentage;

      if (depId && depId !== '') {
        const parentTask = await this.taskRepository.findById(depId);
        if (parentTask) {
          const duration = parentTask.end.getTime() - parentTask.start.getTime();
          const offset = Math.floor(duration * (depPerc / 100));
          const newStart = new Date(parentTask.start.getTime() + offset);
          
          // Mantener la duración actual de la tarea
          const currentDuration = currentTask.end.getTime() - currentTask.start.getTime();
          updatedData.start = newStart;
          updatedData.end = new Date(newStart.getTime() + currentDuration);
        }
      }
    }

    return await this.taskRepository.update(id, updatedData);
  }
}
