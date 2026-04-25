export interface Column {
  id: string;
  title: string;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  imageUrls: string;
  columnId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string; 
  updatedAt: string; 
}