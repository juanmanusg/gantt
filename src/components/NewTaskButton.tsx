'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/app/actions/gantt'
import { TaskData } from './GanttChart'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Link2, Percent } from 'lucide-react'

export default function NewTaskButton({ 
  projectId, 
  tasks = [] 
}: { 
  projectId: string, 
  tasks?: TaskData[] 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasDependency, setHasDependency] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Evitamos el error de hidratación asegurándonos de que el componente 
  // solo se renderice visualmente una vez montado en el cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Helper to get dates in YYYY-MM-DD format
  const getFormattedDate = (daysOffset = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + daysOffset)
    return date.toISOString().split('T')[0]
  }

  const today = getFormattedDate(0)
  const tomorrow = getFormattedDate(1)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await createTask({
        name: formData.get('name') as string,
        start: new Date(formData.get('start') as string),
        end: new Date(formData.get('end') as string),
        projectId,
        progress: 0,
        type: 'task',
        dependencies: formData.get('dependency') as string,
        dependencyPercentage: parseInt(formData.get('depPercentage') as string || '100')
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Error al crear tarea:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) {
    return (
      <Button className="bg-blue-600 text-white opacity-50 cursor-not-allowed">
        <Plus className="mr-2 h-4 w-4" />
        Nueva Tarea
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Añadir Nueva Tarea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-semibold">Nombre de la Tarea</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="Ej. Diseño UI" 
              required 
              autoFocus
              className="rounded-xl"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start" className="text-sm font-semibold">Fecha de Inicio</Label>
              <Input 
                id="start" 
                name="start" 
                type="date" 
                defaultValue={today} 
                required 
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end" className="text-sm font-semibold">Fecha de Fin</Label>
              <Input 
                id="end" 
                name="end" 
                type="date" 
                defaultValue={tomorrow} 
                required 
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dependency" className="text-sm font-semibold flex items-center gap-2">
              <Link2 className="w-3 h-3" />
              Dependencia (Bloqueada por)
            </Label>
            <select
              id="dependency"
              name="dependency"
              onChange={(e) => setHasDependency(e.target.value !== "")}
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Ninguna</option>
              {tasks.filter(t => t.id !== 'Task 0').map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          {hasDependency && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
              <Label htmlFor="depPercentage" className="text-sm font-semibold flex items-center gap-2">
                <Percent className="w-3 h-3 text-blue-500" />
                Punto de conexión
              </Label>
              <select
                id="depPercentage"
                name="depPercentage"
                defaultValue="100"
                className="flex h-10 w-full rounded-xl border border-blue-100 bg-blue-50/30 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">0% (Comienzan juntos)</option>
                <option value="25">25% del progreso padre</option>
                <option value="50">50% del progreso padre</option>
                <option value="75">75% del progreso padre</option>
                <option value="100">100% (Al terminar el padre)</option>
              </select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {loading ? 'Guardando...' : 'Guardar Tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
