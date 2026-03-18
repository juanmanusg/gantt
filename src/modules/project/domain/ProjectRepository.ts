import { Project } from './Project';

export interface ProjectRepository {
  findFirst(): Promise<Project | null>;
  create(data: { name: string; description: string }): Promise<Project>;
}
