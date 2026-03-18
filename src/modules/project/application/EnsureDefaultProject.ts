import { ProjectRepository } from '../domain/ProjectRepository';
import { Project } from '../domain/Project';

export class EnsureDefaultProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(): Promise<Project> {
    const project = await this.projectRepository.findFirst();
    if (!project) {
      return await this.projectRepository.create({
        name: 'Mi Primer Proyecto Gantt',
        description: 'Proyecto de prueba'
      });
    }
    return project;
  }
}
