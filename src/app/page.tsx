import { ensureDefaultProject, getTasks } from './actions/gantt'
import NewTaskButton from '@/components/NewTaskButton'
import GanttChart from '@/components/GanttChart'

export default async function Home() {
  const project = await ensureDefaultProject()
  const tasks = await getTasks(project.id)

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {project.name}
            </h1>
            <p className="text-gray-500 mt-1">{project.description}</p>
          </div>
          <NewTaskButton projectId={project.id} tasks={tasks} />
        </header>

        <section className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <GanttChart initialTasks={tasks} />
        </section>
      </div>
    </main>
  )
}
