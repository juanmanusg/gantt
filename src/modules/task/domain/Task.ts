export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  status: string;
  blockingReason?: string;
  type: string;
  isDisabled: boolean;
  dependencies: string;
  dependencyPercentage: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}
