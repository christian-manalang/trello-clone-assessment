import { useState, useEffect } from 'react';
import type { Ticket } from '../types';

export default function Board() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTitle, setNewTitle] = useState('');

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tickets');
      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch error:', error);
      setTickets([]);
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

  const columns: Array<Ticket['status']> = ['TODO', 'IN_PROGRESS', 'DONE'];

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <form onSubmit={handleAddTicket} className="mb-8 flex gap-2 max-w-md">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
          Add
        </button>
      </form>

      <div className="flex gap-6 overflow-x-auto">
        {columns.map((status) => (
          <div key={status} className="flex-1 min-w-[300px] bg-gray-200 p-4 rounded-xl">
            <h2 className="font-bold text-gray-700 mb-4">{status.replace('_', ' ')}</h2>
            <div className="flex flex-col gap-3">
              {tickets
                .filter((t) => t.status === status)
                .map((ticket) => (
                  <div key={ticket.id} className="bg-white p-4 rounded-lg shadow text-gray-900">
                    {ticket.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}