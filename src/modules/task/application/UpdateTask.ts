import { TaskRepository } from '../domain/TaskRepository';
import { Task } from '../domain/Task';

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string, data: Partial<{
    name: string;
    start: Date;
    end: Date;
    progress: number;
    dependencies: string;
    dependencyPercentage: number;
  }>): Promise<Task> {
    const currentTask = await this.taskRepository.findById(id);
    if (!currentTask) throw new Error('Task not found');

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
