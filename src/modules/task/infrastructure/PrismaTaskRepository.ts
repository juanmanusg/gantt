import { PrismaClient } from '@prisma/client';
import { TaskRepository } from '../domain/TaskRepository';
import { Task } from '../domain/Task';

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProjectId(projectId: string): Promise<Task[]> {
    return await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { start: 'asc' }
    });
  }

  async findById(id: string): Promise<Task | null> {
    return await this.prisma.task.findUnique({
      where: { id }
    });
  }

  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isDisabled'>): Promise<Task> {
    return await this.prisma.task.create({
      data: {
        name: data.name,
        start: data.start,
        end: data.end,
        progress: data.progress,
        type: data.type,
        dependencies: data.dependencies,
        dependencyPercentage: data.dependencyPercentage,
        projectId: data.projectId,
      }
    });
  }

  async update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>>): Promise<Task> {
    return await this.prisma.task.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id }
    });
  }
}
