import { PrismaClient } from '@prisma/client';
import { ProjectRepository } from '../domain/ProjectRepository';
import { Project } from '../domain/Project';

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findFirst(): Promise<Project | null> {
    return await this.prisma.project.findFirst();
  }

  async create(data: { name: string; description: string }): Promise<Project> {
    return await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
      }
    });
  }
}
