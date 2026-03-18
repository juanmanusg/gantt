'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Infrastructure
import { PrismaProjectRepository } from '@/modules/project/infrastructure/PrismaProjectRepository'
import { PrismaTaskRepository } from '@/modules/task/infrastructure/PrismaTaskRepository'

// Use Cases
import { EnsureDefaultProjectUseCase } from '@/modules/project/application/EnsureDefaultProject'
import { GetTasksUseCase } from '@/modules/task/application/GetTasks'
import { CreateTaskUseCase } from '@/modules/task/application/CreateTask'
import { UpdateTaskUseCase } from '@/modules/task/application/UpdateTask'
import { DeleteTaskUseCase } from '@/modules/task/application/DeleteTask'

// Dependency Injection (Infrastructure Adapters)
const projectRepository = new PrismaProjectRepository(prisma)
const taskRepository = new PrismaTaskRepository(prisma)

// Use Case Instances
const ensureDefaultProjectUseCase = new EnsureDefaultProjectUseCase(projectRepository)
const getTasksUseCase = new GetTasksUseCase(taskRepository)
const createTaskUseCase = new CreateTaskUseCase(taskRepository)
const updateTaskUseCase = new UpdateTaskUseCase(taskRepository)
const deleteTaskUseCase = new DeleteTaskUseCase(taskRepository)

export async function ensureDefaultProject() {
  const project = await ensureDefaultProjectUseCase.execute()
  return project
}

export async function getTasks(projectId: string) {
  const tasks = await getTasksUseCase.execute(projectId)
  return tasks
}

export async function createTask(data: {
  name: string
  start: Date
  end: Date
  progress?: number
  type?: string
  dependencies?: string
  dependencyPercentage?: number
  projectId: string
}) {
  const task = await createTaskUseCase.execute(data)
  revalidatePath('/')
  return task
}

export async function updateTask(id: string, data: Partial<{
  name: string
  start: Date
  end: Date
  progress: number
  dependencies: string
  dependencyPercentage: number
}>) {
  const task = await updateTaskUseCase.execute(id, data)
  revalidatePath('/')
  return task
}

export async function deleteTask(id: string) {
  await deleteTaskUseCase.execute(id)
  revalidatePath('/')
}
