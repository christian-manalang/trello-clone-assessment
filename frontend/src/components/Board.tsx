/**
 * Board.tsx
 * Main Kanban board component. Implements @dnd-kit for drag-and-drop functionality.
 * Features dynamic columns, multiple image attachments via JSON serialization, 
 * and optimistic UI updates during `onDragOver` for real-time sorting.
 */

import { useState, useEffect, useRef } from 'react';
import { 
  DndContext, 
  type DragStartEvent, 
  type DragEndEvent, 
  type DragMoveEvent, 
  type DragOverEvent,
  closestCorners,     
  DragOverlay, 
  useDroppable 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast, { Toaster } from 'react-hot-toast';
import type { Ticket, Column } from '../types';

const priorityColors = {
  LOW: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  HIGH: 'bg-rose-100 text-rose-800 border-rose-200',
};

const columnStyles: Record<string, { border: string; bg: string; label: string }> = {
  TODO: { border: 'border-pink-400', bg: 'bg-pink-50/40', label: 'To Do' },
  IN_PROGRESS: { border: 'border-amber-400', bg: 'bg-amber-50/40', label: 'In Progress' },
  DONE: { border: 'border-emerald-400', bg: 'bg-emerald-50/40', label: 'Done' },
};

const parseImages = (imageUrls: string): string[] => {
  try { return JSON.parse(imageUrls || '[]'); } 
  catch { return []; }
};

function SortableTicket({ 
  ticket, 
  showDetails,
  onDelete, 
  onUpdate,
  onClick 
}: { 
  ticket: Ticket; 
  showDetails: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Ticket>) => void;
  onClick: (ticket: Ticket) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: ticket.id,
    data: { type: 'Ticket', ticket } 
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(ticket.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const images = parseImages(ticket.imageUrls);

  const style = { 
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1, 
  };

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle !== ticket.title) {
      onUpdate(ticket.id, { title: editTitle });
    } else {
      setEditTitle(ticket.title);
    }
  };

  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-4 rounded-xl shadow-sm text-gray-800 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative group border border-gray-100 flex flex-col"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${priorityColors[ticket.priority || 'LOW']}`}>
          {ticket.priority || 'LOW'}
        </span>
        
        <button
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => onDelete(ticket.id)}
          className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          ✕
        </button>
      </div>

      {isEditing ? (
        <input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleTitleSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
          onPointerDown={(e) => e.stopPropagation()} 
          className="w-full border-b-2 border-pink-500 bg-pink-50/50 outline-none p-1 font-semibold text-gray-900 rounded-t-sm"
        />
      ) : (
        <p 
          className="font-semibold text-gray-800 hover:text-pink-600 transition-colors p-1 rounded cursor-text break-words leading-snug"
          onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
          {ticket.title}
        </p>
      )}

      {images.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-pink-500 bg-pink-50 self-start px-2 py-1 rounded-md border border-pink-100">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          {images.length} Attachment{images.length > 1 ? 's' : ''}
        </div>
      )}

      {showDetails && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {images.length > 0 && (
            <div className="mb-3 w-full h-36 overflow-hidden rounded-lg shadow-sm border border-gray-200">
              <img src={images[0]} alt="Attachment Preview" className="w-full h-full object-cover pointer-events-none" />
            </div>
          )}
          {ticket.description && (
            <p className="text-gray-600 bg-gray-50 p-2 rounded-md italic mb-3 line-clamp-2 leading-relaxed">"{ticket.description}"</p>
          )}
          <div className="flex flex-col gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wide">
            <p>Created: {formatDate(ticket.createdAt)}</p>
            <p>Updated: {formatDate(ticket.updatedAt)}</p>
          </div>
        </div>
      )}

      <button 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onClick(ticket)}
        className="mt-4 text-[11px] text-pink-500 hover:text-pink-700 font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity self-start flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
        Open Details
      </button>
    </div>
  );
}

function DroppableColumn({ 
  column, 
  tickets, 
  showDetails,
  onDeleteTicket, 
  onDeleteColumn,
  onUpdateColumn,
  onUpdateTicket,
  onTicketClick
}: { 
  column: Column; 
  tickets: Ticket[]; 
  showDetails: boolean;
  onDeleteTicket: (id: string) => void;
  onDeleteColumn: (id: string) => void;
  onUpdateColumn: (id: string, title: string) => void;
  onUpdateTicket: (id: string, data: Partial<Ticket>) => void;
  onTicketClick: (ticket: Ticket) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ 
    id: column.id,
    data: { type: 'Column', column }
  });

  const [isEditingCol, setIsEditingCol] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);
  const colInputRef = useRef<HTMLInputElement>(null);
  
  const conf = columnStyles[column.title] || columnStyles.TODO;

  const handleColSubmit = () => {
    setIsEditingCol(false);
    if (colTitle.trim() && colTitle !== column.title) {
      onUpdateColumn(column.id, colTitle);
    } else {
      setColTitle(column.title);
    }
  };

  useEffect(() => { if (isEditingCol && colInputRef.current) colInputRef.current.focus(); }, [isEditingCol]);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-[340px] shrink-0 max-h-[calc(100vh-240px)] p-3 rounded-2xl border-t-4 shadow-sm backdrop-blur-md transition-all duration-300 ${
        isOver ? 'bg-white/80 ring-2 ring-pink-300 scale-[1.02] border-pink-400' : 'bg-white/40 border-pink-300'
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-2 shrink-0 group">
        
        {isEditingCol ? (
          <input
            ref={colInputRef}
            value={colTitle}
            onChange={(e) => setColTitle(e.target.value)}
            onBlur={handleColSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleColSubmit()}
            className="flex-1 mr-2 bg-white/70 border-b-2 border-pink-500 outline-none px-1 font-extrabold text-gray-900 rounded-sm"
          />
        ) : (
          <h2 
            className="font-extrabold text-gray-700 tracking-tight cursor-text hover:text-pink-600 transition-colors flex-1"
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditingCol(true); }}
            title="Double-click to edit list name"
          >
            {column.title}
          </h2>
        )}

        <div className="flex items-center gap-2">
          <span className="bg-white/60 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {tickets.length}
          </span>
          <button 
            onClick={() => onDeleteColumn(column.id)}
            className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete List"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto px-1 pb-4 styled-scrollbar min-h-[50px]">
        <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <SortableTicket 
              key={ticket.id} 
              ticket={ticket} 
              showDetails={showDetails}
              onDelete={onDeleteTicket} 
              onUpdate={onUpdateTicket}
              onClick={onTicketClick}
            />
          ))}
        </SortableContext>
        
        {tickets.length === 0 && (
          <div className="h-24 border-2 border-dashed border-gray-300/50 rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Board() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  const [newTitle, setNewTitle] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Ticket['priority']>('LOW');
  
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [colRes, tixRes] = await Promise.all([
        fetch('http://localhost:3000/api/columns'),
        fetch('http://localhost:3000/api/tickets')
      ]);
      if (!colRes.ok || !tixRes.ok) throw new Error('Server returned an error');
      
      setColumns(await colRes.json());
      setTickets(await tixRes.json());
    } catch (err) {
      setError('Could not connect to the database.');
      toast.error('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    const promise = fetch('http://localhost:3000/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newColumnTitle }),
    }).then(res => {
      if (!res.ok) throw new Error();
      setNewColumnTitle('');
      fetchData();
    });

    toast.promise(promise, { loading: 'Adding List...', success: 'List added!', error: 'Failed to add list.' });
  };

  const handleUpdateColumn = async (id: string, title: string) => {
    setColumns((current) => current.map((c) => (c.id === id ? { ...c, title } : c)));
    try {
      const response = await fetch(`http://localhost:3000/api/columns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      toast.error('Failed to update list name.');
      fetchData(); 
    }
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;
    const id = columnToDelete;
    setColumnToDelete(null); 
    
    const promise = fetch(`http://localhost:3000/api/columns/${id}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error(); });
      
    toast.promise(promise, { loading: 'Deleting list...', success: 'List deleted.', error: 'Failed to delete.' })
      .catch(() => fetchData()).then(() => fetchData());
  };

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || columns.length === 0) return;

    const promise = fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, priority: newPriority, columnId: columns[0].id }),
    }).then(res => {
      if (!res.ok) throw new Error();
      setNewTitle('');
      setNewPriority('LOW');
      fetchData();
    });

    toast.promise(promise, { loading: 'Adding task...', success: 'Task added!', error: 'Failed to add task.' });
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    setTickets((current) => current.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    try {
      const response = await fetch(`http://localhost:3000/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error();
      if (selectedTicket?.id === id) {
        setSelectedTicket(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      toast.error('Failed to save changes.');
      fetchData(); 
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDragDelta(0);
  };

  const handleDragMove = (event: DragMoveEvent) => { setDragDelta(event.delta.x); };

  /**
   * handleDragOver: Fires continuously while dragging.
   * Optimistically updates the React state to move items between columns visually
   * before the user drops them, creating the "make space" animation.
   */

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const isActiveTicket = active.data.current?.type === 'Ticket';
    const isOverTicket = over.data.current?.type === 'Ticket';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTicket) return;

    setTickets((current) => {
      const activeIndex = current.findIndex((t) => t.id === activeId);
      const activeTicket = current[activeIndex];

      if (isOverTicket) {
        const overIndex = current.findIndex((t) => t.id === overId);
        const overTicket = current[overIndex];

        if (activeTicket.columnId !== overTicket.columnId) {
          const newTickets = [...current];
          newTickets[activeIndex] = { ...activeTicket, columnId: overTicket.columnId };
          return arrayMove(newTickets, activeIndex, overIndex);
        }
        return arrayMove(current, activeIndex, overIndex);
      }

      if (isOverColumn) {
        const overColumnId = over.id as string;
        if (activeTicket.columnId !== overColumnId) {
          const newTickets = [...current];
          newTickets[activeIndex] = { ...activeTicket, columnId: overColumnId };
          return arrayMove(newTickets, activeIndex, newTickets.length - 1);
        }
      }
      return current;
    });
  };

  /**
   * handleDragEnd: Fires when the user drops the item.
   * Because `handleDragOver` already sorted the local state, this function
   * is only responsible for persisting the final location to the database.
   */

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null); setDragDelta(0); 

    const { active, over } = event;
    if (!over) { fetchData(); return; }

    const activeTicket = tickets.find((t) => t.id === active.id);
    if (!activeTicket) return;

    try {
      const response = await fetch(`http://localhost:3000/api/tickets/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: activeTicket.columnId }),
      });
      if (!response.ok) throw new Error();
    } catch {
      toast.error('Failed to sync location.');
      fetchData(); 
    }
  };

  const handleDeleteTicket = async (id: string) => {
    setTickets((current) => current.filter((t) => t.id !== id));
    const promise = fetch(`http://localhost:3000/api/tickets/${id}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error(); });
    toast.promise(promise, { loading: 'Deleting...', success: 'Ticket deleted.', error: 'Failed to delete.' })
      .catch(() => fetchData());
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTicket) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const currentImages = parseImages(selectedTicket.imageUrls);
        const newImages = [...currentImages, reader.result as string];
        updateTicket(selectedTicket.id, { imageUrls: JSON.stringify(newImages) });
        toast.success("Image uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (indexToRemove: number) => {
    if (!selectedTicket) return;
    const currentImages = parseImages(selectedTicket.imageUrls);
    const newImages = currentImages.filter((_, idx) => idx !== indexToRemove);
    updateTicket(selectedTicket.id, { imageUrls: JSON.stringify(newImages) });
  };

  const activeTicket = tickets.find((t) => t.id === activeId);
  const overlayRotation = Math.min(Math.max(dragDelta * 0.05, -6), 6);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'font-semibold text-sm shadow-xl rounded-xl' }} />
      
      <DndContext 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart} 
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd} 
        onDragCancel={() => { setActiveId(null); setDragDelta(0); fetchData(); }}
      >
        <div className="p-8 min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-50 via-slate-50 to-rose-50 flex flex-col">
          
          <div className="mb-6 shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 tracking-tight drop-shadow-sm py-2 mb-2">
                Project Board
              </h1>
              
              <label className="flex items-center gap-3 text-sm text-gray-700 font-bold bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white shadow-sm cursor-pointer hover:bg-white hover:shadow transition-all duration-300">
                <input
                  type="checkbox"
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500 cursor-pointer"
                />
                Show Extra Details
              </label>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <form onSubmit={handleAddTicket} className="flex gap-3 flex-1 min-w-[320px] bg-white/70 backdrop-blur-xl p-2.5 rounded-2xl shadow-sm border border-white">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={columns.length === 0}
                  placeholder={columns.length === 0 ? "Create a list below first!" : "What needs to be done?"}
                  className="flex-1 px-4 py-2 outline-none text-gray-900 bg-transparent font-medium placeholder-gray-400 disabled:opacity-50"
                />
                <div className="h-8 w-[1px] bg-gray-200 self-center hidden sm:block"></div>
                <select 
                  value={newPriority} 
                  onChange={(e) => setNewPriority(e.target.value as Ticket['priority'])}
                  className="px-4 py-2 bg-transparent outline-none text-gray-700 font-bold cursor-pointer hover:text-pink-600 transition-colors"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
                <button 
                  type="submit" 
                  disabled={isLoading || columns.length === 0}
                  className="bg-pink-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-pink-700 hover:shadow-md active:scale-95 disabled:opacity-50 transition-all duration-200"
                >
                  Add Task
                </button>
              </form>

              <form onSubmit={handleAddColumn} className="flex gap-3 w-full md:w-auto bg-white/70 backdrop-blur-xl p-2.5 rounded-2xl shadow-sm border border-white">
                <input 
                  type="text"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Add a new list..."
                  className="flex-1 md:w-48 px-4 py-2 bg-transparent outline-none font-medium text-gray-700 placeholder-gray-400"
                />
                <button type="submit" disabled={!newColumnTitle.trim()} className="bg-white text-pink-700 border border-pink-100 font-bold px-6 py-2.5 rounded-xl hover:bg-pink-50 disabled:opacity-50 transition-colors">
                  Add List
                </button>
              </form>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center flex-1 w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-pink-600 shadow-xl"></div>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl w-full max-w-2xl shadow-sm">
              <div className="flex">
                <span className="text-rose-500 font-bold text-lg mr-3">!</span>
                <div>
                  <h3 className="text-sm font-bold text-rose-800">Connection Error</h3>
                  <p className="text-sm text-rose-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-8 overflow-x-auto pb-4 flex-1 styled-scrollbar min-h-0">
              {columns.map((column) => (
                <DroppableColumn 
                  key={column.id} 
                  column={column} 
                  tickets={tickets.filter((t) => t.columnId === column.id)}
                  showDetails={showDetails} 
                  onDeleteTicket={handleDeleteTicket}
                  onDeleteColumn={(id) => setColumnToDelete(id)}
                  onUpdateColumn={handleUpdateColumn}
                  onUpdateTicket={updateTicket}
                  onTicketClick={setSelectedTicket}
                />
              ))}
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={{ duration: 300, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }} className="z-[9999]">
          {activeTicket ? (
            <div 
              className="bg-white p-4 rounded-xl shadow-[0_20px_50px_rgba(236,_72,_153,_0.2)] ring-4 ring-pink-500 text-gray-900 cursor-grabbing border border-pink-200 flex flex-col w-[310px]"
              style={{
                transform: `rotate(${overlayRotation}deg) scale(1.05)`,
                transition: 'transform 0.1s ease-out' 
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${priorityColors[activeTicket.priority || 'LOW']}`}>
                  {activeTicket.priority || 'LOW'}
                </span>
              </div>
              <p className="font-semibold p-1 break-words leading-snug">{activeTicket.title}</p>
              
              {parseImages(activeTicket.imageUrls).length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 self-start px-2 py-1 rounded-md border border-gray-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  {parseImages(activeTicket.imageUrls).length} Attachment{parseImages(activeTicket.imageUrls).length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>

      <div className="fixed bottom-8 right-8 z-40 group">
        <button type="button" className="w-14 h-14 rounded-full bg-pink-600 text-white text-2xl font-black shadow-[0_8px_30px_rgb(236,72,153,0.3)] hover:bg-pink-500 hover:scale-110 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center border-2 border-white/20">
          ?
        </button>
        <div className="absolute bottom-20 right-0 w-72 p-5 bg-gray-900/95 backdrop-blur-md text-white text-sm rounded-2xl shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-300 origin-bottom-right border border-gray-700">
          <p className="font-black text-pink-400 uppercase tracking-widest text-xs border-b border-gray-700 pb-3 mb-4">Pro Tips</p>
          <ul className="space-y-4 text-left font-medium">
            <li className="flex gap-3 items-center"><span className="text-gray-400 font-bold">•</span> <span>Double-click cards/lists to edit title</span></li>
            <li className="flex gap-3 items-center"><span className="text-gray-400 font-bold">•</span> <span>Drag & Drop anywhere</span></li>
            <li className="flex gap-3 items-center"><span className="text-gray-400 font-bold">•</span> <span>Press Enter to save edits</span></li>
            <li className="flex gap-3 items-center"><span className="text-gray-400 font-bold">•</span> <span>Hover column title and click ✕ to delete</span></li>
          </ul>
        </div>
      </div>

      {columnToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Delete List?</h2>
            <p className="text-gray-500 mb-8 font-medium">This action cannot be undone. All tasks inside this list will be permanently deleted.</p>
            <div className="flex gap-4">
              <button onClick={() => setColumnToDelete(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={confirmDeleteColumn} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md hover:shadow-lg transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onPointerDown={() => setSelectedTicket(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-[0_20px_50px_rgba(236,_72,_153,_0.1)] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Task Details</h2>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-rose-500 bg-gray-100 hover:bg-rose-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors font-bold">✕</button>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-pink-50/50 rounded-2xl border border-pink-100">
                <label className="block text-sm font-bold text-pink-900 mb-3 uppercase tracking-wider">Attachments</label>
                
                {parseImages(selectedTicket.imageUrls).length > 0 && (
                  <div className="flex gap-4 overflow-x-auto pb-4 mb-2 styled-scrollbar">
                    {parseImages(selectedTicket.imageUrls).map((imgUrl, index) => (
                      <div key={index} className="relative group shrink-0">
                        <img src={imgUrl} alt="Attachment" className="w-48 h-32 object-cover rounded-xl border border-gray-200 shadow-sm" />
                        <button 
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-white/90 text-rose-600 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                          title="Remove Image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-white file:text-pink-600 file:shadow-sm hover:file:bg-pink-50 cursor-pointer transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Title</label>
                <input 
                  defaultValue={selectedTicket.title}
                  onBlur={(e) => updateTicket(selectedTicket.id, { title: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 font-semibold text-lg transition-all"
                />
              </div>

              <div className="flex gap-5">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">List (Column)</label>
                  <select 
                    value={selectedTicket.columnId}
                    onChange={(e) => updateTicket(selectedTicket.id, { columnId: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 font-semibold text-gray-700 cursor-pointer transition-all"
                  >
                    {columns.map(col => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Priority</label>
                  <select 
                    value={selectedTicket.priority || 'LOW'}
                    onChange={(e) => updateTicket(selectedTicket.id, { priority: e.target.value as Ticket['priority'] })}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 font-semibold text-gray-700 cursor-pointer transition-all"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Description</label>
                <textarea 
                  defaultValue={selectedTicket.description || ''}
                  onBlur={(e) => updateTicket(selectedTicket.id, { description: e.target.value })}
                  placeholder="Add a more detailed description to this task..."
                  className="w-full border-2 border-gray-200 rounded-xl p-4 min-h-[140px] outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 resize-y font-medium text-gray-800 transition-all leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}