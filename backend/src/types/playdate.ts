export interface PlaydatePost {
  id: string;
  ownerId: string;
  petId: string;
  petName?: string;
  breed?: string;
  age?: number;
  photo?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  date: string; // ISO date
  description: string;
  interested_owners: string[]; // array of userIds
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id?: string;
  sender: string; // userId
  text: string;
  timestamp: string; // ISO
}

export interface PlaydateChat {
  id: string;
  postId: string;
  ownerId: string; // post creator
  interestedOwnerId: string; // other owner
  messages: Message[];
  status: 'active' | 'archived';
  created_at: string;
  updated_at?: string;
}

export interface PlaydateFilter {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  breed?: string;
  ageMin?: number;
  ageMax?: number;
  dateStart?: string;
  dateEnd?: string;
}
