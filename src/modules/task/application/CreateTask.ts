import { TaskRepository } from '../domain/TaskRepository';
import { Task } from '../domain/Task';

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(data: {
    name: string;
    start: Date;
    end: Date;
    progress?: number;
    type?: string;
    dependencies?: string;
    dependencyPercentage?: number;
    projectId: string;
  }): Promise<Task> {
    let startDate = data.start;
    const dependencyPercentage = data.dependencyPercentage ?? 100;

    // Si hay dependencia y no es la por defecto, calculamos la fecha de inicio
    if (data.dependencies && data.dependencies !== '') {
      const parentTask = await this.taskRepository.findById(data.dependencies);
      if (parentTask) {
        const duration = parentTask.end.getTime() - parentTask.start.getTime();
        const offset = Math.floor(duration * (dependencyPercentage / 100));
        startDate = new Date(parentTask.start.getTime() + offset);
        
        // Ajustamos la fecha de fin manteniendo la duración original solicitada
        const originalDuration = data.end.getTime() - data.start.getTime();
        data.end = new Date(startDate.getTime() + originalDuration);
      }
    }

    return await this.taskRepository.create({
      name: data.name,
      start: startDate,
      end: data.end,
      progress: data.progress ?? 0,
      type: data.type ?? 'task',
      dependencies: data.dependencies ?? '',
      dependencyPercentage: dependencyPercentage,
      projectId: data.projectId,
    });
  }
}
