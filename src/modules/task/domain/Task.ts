export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  status: string;
  blockingReason: string | null;
  type: string;
  isDisabled: boolean;
  dependencies: string;
  dependencyPercentage: number;
  projectId: string;
  isIndirectlyBlocked?: boolean;
  isLeaf?: boolean;
  blockingSources?: { id: string; name: string; reason: string | null }[];
  createdAt: Date;
  updatedAt: Date;
}
