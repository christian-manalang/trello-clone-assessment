export interface Ticket {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string; 
  updatedAt: string; 
}