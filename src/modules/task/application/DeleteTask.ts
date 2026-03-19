import { TaskRepository } from '../domain/TaskRepository';

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new Error('Task not found');

    // Validar que solo se puedan eliminar tareas hoja
    const allTasks = await this.taskRepository.findByProjectId(task.projectId);
    const isLeaf = !allTasks.some(t => {
      const deps = t.dependencies.split(',').filter(d => d.trim() !== '');
      return deps.includes(id);
    });

    if (!isLeaf) {
      throw new Error('No se puede eliminar una tarea de la que dependen otras tareas. Elimina primero sus sucesores.');
    }

    await this.taskRepository.delete(id);
  }
}
