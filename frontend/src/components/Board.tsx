import { useState, useEffect } from 'react';
import type { Ticket } from '../types';

export default function Board() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // mock data
  useEffect(() => {
    setTickets([
      { id: '1', title: 'Design Database Schema', status: 'DONE' },
      { id: '2', title: 'Setup Express Server', status: 'IN_PROGRESS' },
      { id: '3', title: 'Implement Drag and Drop', status: 'TODO' },
    ]);
  }, []);

  const columns: Array<Ticket['status']> = ['TODO', 'IN_PROGRESS', 'DONE'];

  return (
    <div className="flex gap-6 p-8 min-h-screen bg-gray-50 overflow-x-auto">
      {columns.map((status) => (
        <div key={status} className="flex-1 min-w-[300px] bg-gray-200 p-4 rounded-xl shadow-sm flex flex-col">
          <h2 className="font-bold text-gray-700 text-lg mb-4 tracking-wide">
            {status.replace('_', ' ')}
          </h2>
          
          <div className="flex flex-col gap-3 flex-grow">
            {tickets
              .filter((t) => t.status === status)
              .map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md cursor-grab transition-shadow"
                >
                  <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}