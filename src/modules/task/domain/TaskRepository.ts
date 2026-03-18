import { Task } from './Task';

export interface TaskRepository {
  findByProjectId(projectId: string): Promise<Task[]>;
  create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isDisabled'>): Promise<Task>;
  update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>>): Promise<Task>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Task | null>;
}
