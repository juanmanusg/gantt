'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Gantt, { Task } from 'frappe-gantt'
import { updateTask, deleteTask } from '@/app/actions/gantt'
import { Trash2, Edit } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type TaskData = {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  type: string
  isDisabled: boolean
  dependencies: string
  dependencyPercentage: number
}

type CtxMenu = { open: boolean; x: number; y: number; task: TaskData | null }

export default function GanttChart({ initialTasks }: { initialTasks: TaskData[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<Gantt | null>(null)
  const isInternalChange = useRef(false)
  // Keep a ref to always-fresh initialTasks for use inside native event listeners
  const tasksRef = useRef<TaskData[]>(initialTasks)
  tasksRef.current = initialTasks

  const [view, setView] = useState('Day')
  const [isMounted, setIsMounted] = useState(false)
  const [activeTask, setActiveTask] = useState<TaskData | null>(null)
  const [ctx, setCtx] = useState<CtxMenu>({ open: false, x: 0, y: 0, task: null })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskData | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!ctx.open) return
    const close = () => setCtx(m => ({ ...m, open: false }))
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('click', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [ctx.open])

  const toFrappeTasks = useCallback((tasks: TaskData[]) => {
    return tasks.map(t => ({
      id: t.id,
      name: t.name,
      start: t.start.toISOString().split('T')[0],
      end: t.end.toISOString().split('T')[0],
      progress: t.progress,
      dependencies: t.dependencies,
    }))
  }, [])

  const initGantt = useCallback(() => {
    if (!containerRef.current || tasksRef.current.length === 0) return
    
    // Preserve scroll position before cleanup
    const scrollPos = containerRef.current.scrollLeft
    
    try {
      // ONLY clear innerHTML if we are changing view or mounting
      // Avoid clearing if we just want to update data
      containerRef.current.innerHTML = ''
      
      ganttRef.current = new Gantt(containerRef.current, toFrappeTasks(tasksRef.current), {
        on_click: (task: Task) => {
          const found = tasksRef.current.find(t => t.id === task.id) ?? null
          setActiveTask(found)
        },
        on_date_change: async (task: Task, start: Date, end: Date) => {
          isInternalChange.current = true
          await updateTask(task.id, { start, end })
        },
        on_progress_change: async (task: Task, progress: number) => {
          isInternalChange.current = true
          await updateTask(task.id, { progress })
        },
        view_mode: view,
        language: 'es',
        bar_height: 30,
        padding: 18,
        header_height: 60,
        custom_popup_html: null,
        // Disable internal auto-scroll to avoid jumps
        scroll_to: null,
      } as any)
      
      // Restore scroll position
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = scrollPos
        }
      }, 10)
    } catch (e) {
      console.warn('Gantt init error', e)
    }
  }, [toFrappeTasks, view]) // Removed initialTasks from dependencies

  // Sync server data → refresh Gantt (skip if internal drag/progress change)
  useEffect(() => {
    if (!ganttRef.current || !isMounted) return
    if (isInternalChange.current) { isInternalChange.current = false; return }
    
    // Preserve scroll position
    const scrollPos = containerRef.current?.scrollLeft || 0
    
    const rows = toFrappeTasks(initialTasks)
    try { 
      ganttRef.current.refresh(rows)
      // Restore scroll after a small delay to ensure internal rendering is done
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = scrollPos
        }
      }, 50)
    } catch { 
      initGantt() 
    }
  }, [initialTasks, isMounted, toFrappeTasks, initGantt])

  // Re-init when view changes or on first mount
  useEffect(() => { if (isMounted) initGantt() }, [isMounted, initGantt])


  // Use a stable ref so the native listener always reads fresh tasks
  const handleSvgContextMenu = useCallback((e: React.MouseEvent | Event) => {
    const me = e as MouseEvent
    const target = me.target as SVGElement

    // Try both bar-wrapper (frappe-gantt >=0.6) and direct bar-group patterns
    let barEl = target.closest('[data-id]') as SVGElement | null
    // If closest [data-id] is the svg root, ignore
    if (barEl && barEl.tagName === 'svg') barEl = null

    if (!barEl) return // right-click outside a bar → let browser default show

    me.preventDefault()
    const taskId = barEl.getAttribute('data-id')
    const found = tasksRef.current.find(t => t.id === taskId) ?? null

    if (found) setActiveTask(found)
    setCtx({ open: true, x: me.clientX, y: me.clientY, task: found })
  }, [])

  const doDelete = async (task: TaskData) => {
    setCtx(m => ({ ...m, open: false }))
    await deleteTask(task.id)
    setActiveTask(null)
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingTask) return
    setEditLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await updateTask(editingTask.id, {
        name: fd.get('name') as string,
        start: new Date(fd.get('start') as string),
        end: new Date(fd.get('end') as string),
        progress: parseInt(fd.get('progress') as string),
        dependencies: fd.get('dependency') as string,
        dependencyPercentage: parseInt(fd.get('depPercentage') as string || '100'),
      })
      setIsEditOpen(false)
      setEditingTask(null)
    } catch (err) {
      console.error(err)
    } finally {
      setEditLoading(false)
    }
  }

  if (!isMounted) return <div className="p-10 text-center text-gray-400">Cargando...</div>

  return (
    <div className="p-4 flex flex-col gap-4 bg-white rounded-2xl shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-gray-800">
          Cronograma
          {activeTask && (
            <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 border px-2 py-0.5 rounded-full">
              Tarea activa: {activeTask.name}
            </span>
          )}
        </h2>
        <select
          value={view}
          onChange={e => setView(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="Day">Días</option>
          <option value="Week">Semanas</option>
          <option value="Month">Meses</option>
        </select>
      </div>

      {/* Gantt container — no overflow-hidden so fixed menu can escape */}
      <div className="relative border rounded-xl bg-white shadow-inner">
        <div 
          ref={containerRef} 
          className="gantt-wrapper min-h-[400px]" 
          onContextMenu={handleSvgContextMenu}
        />
      </div>

      {/* Custom context menu */}
      {ctx.open && (
        <div
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden min-w-[190px]"
          style={{ top: ctx.y + 4, left: ctx.x + 4 }}
          onClick={e => e.stopPropagation()}
        >
          {ctx.task ? (
            <>
              <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b bg-gray-50 truncate">
                {ctx.task.name}
              </div>
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                onClick={() => {
                  setCtx(m => ({ ...m, open: false }))
                  setEditingTask(ctx.task)
                  setIsEditOpen(true)
                }}
              >
                <Edit className="h-4 w-4 text-blue-500 shrink-0" />
                Editar tarea
              </button>
              <div className="h-px bg-gray-100" />
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                onClick={() => doDelete(ctx.task!)}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Eliminar tarea
              </button>
            </>
          ) : (
            <div className="px-4 py-5 text-xs text-gray-400 text-center italic">
              Haz clic derecho sobre una barra
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input name="name" defaultValue={editingTask.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inicio</Label>
                  <Input name="start" type="date" defaultValue={editingTask.start.toISOString().split('T')[0]} required />
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Input name="end" type="date" defaultValue={editingTask.end.toISOString().split('T')[0]} required />
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <Label className="flex justify-between mb-2">
                  Progreso <span>{editingTask.progress}%</span>
                </Label>
                <Input name="progress" type="range" min="0" max="100" defaultValue={editingTask.progress} className="cursor-pointer" />
              </div>
              <div className="space-y-2">
                <Label>Dependencia</Label>
                <select name="dependency" defaultValue={editingTask.dependencies || ''} className="w-full h-10 rounded-md border bg-white px-3 text-sm">
                  <option value="">Ninguna</option>
                  {initialTasks.filter(t => t.id !== editingTask.id).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Punto de conexión</Label>
                <select name="depPercentage" defaultValue={String(editingTask.dependencyPercentage ?? 100)} className="w-full h-10 rounded-md border bg-white px-3 text-sm">
                  <option value="0">0% (Comienzan juntos)</option>
                  <option value="25">25% del progreso padre</option>
                  <option value="50">50% del progreso padre</option>
                  <option value="75">75% del progreso padre</option>
                  <option value="100">100% (Al terminar el padre)</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
