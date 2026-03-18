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
  isIndirectlyBlocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
