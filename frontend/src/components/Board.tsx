import { useState, useEffect } from 'react';
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Ticket } from '../types';

function DraggableTicket({ ticket, onDelete }: { ticket: Ticket; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-4 rounded-lg shadow text-gray-900 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group"
    >
      <div className="flex justify-between items-start">
        <p>{ticket.title}</p>
        
        <button
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => onDelete(ticket.id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function DroppableColumn({ status, tickets, onDelete }: { status: string; tickets: Ticket[]; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[300px] p-4 rounded-xl transition-colors ${
        isOver ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-200'
      }`}
    >
      <h2 className="font-bold text-gray-700 mb-4">{status.replace('_', ' ')}</h2>
      <div className="flex flex-col gap-3 min-h-[150px]">
        {tickets.map((ticket) => (
          <DraggableTicket key={ticket.id} ticket={ticket} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default function Board() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTitle, setNewTitle] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/tickets');
      if (!response.ok) throw new Error('Server returned an error');
      
      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Could not connect to the database. Please make sure the server is running.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setNewTitle('');
        fetchTickets();
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as Ticket['status'];

    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket || currentTicket.status === newStatus) return;

    setTickets((current) =>
      current.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      const response = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        console.error('Failed to update DB');
        fetchTickets();
      }
    } catch (error) {
      console.error('Drag update error:', error);
      fetchTickets();
    }
  };

  const handleDeleteTicket = async (id: string) => {
    setTickets((current) => current.filter((t) => t.id !== id));

    try {
      const response = await fetch(`http://localhost:3000/api/tickets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete from DB');
        fetchTickets();
      }
    } catch (error) {
      console.error('Delete error:', error);
      fetchTickets();
    }
  };

  const columns: Array<Ticket['status']> = ['TODO', 'IN_PROGRESS', 'DONE'];

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-8 min-h-screen bg-gray-50">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">Project Board</h1>
          <form onSubmit={handleAddTicket} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-shadow"
            />
            <button 
              type="submit" 
              disabled={isLoading} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Task
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md w-full max-w-2xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500 font-bold">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map((status) => (
              <DroppableColumn 
                key={status} 
                status={status} 
                tickets={tickets.filter((t) => t.status === status)}
                onDelete={handleDeleteTicket} 
              />
            ))}
          </div>
        )}

      </div>
    </DndContext>
  );
}