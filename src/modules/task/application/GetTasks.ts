import { TaskRepository } from '../domain/TaskRepository';
import { Task } from '../domain/Task';

export class GetTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(projectId: string): Promise<Task[]> {
    return await this.taskRepository.findByProjectId(projectId);
  }
}
