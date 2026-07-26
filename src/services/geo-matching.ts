import { api } from './api';

export interface PlaydateMatch {
  postId: string;
  ownerId: string;
  petName?: string;
  breed?: string;
  age?: number;
  photo?: string;
  distance_km: number;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  date: string;
  description: string;
  match_score: number;
}

export interface PlaydateMatchesResponse {
  matches: PlaydateMatch[];
}

export const getPlaydateMatches = async (
  lat: number,
  lng: number,
  petId: string,
  radiusKm: number = 5,
  sort: 'score' | 'recent' = 'score',
): Promise<PlaydateMatchesResponse> => {
  const response = await api.get('/playdate/matches', {
    params: {
      lat,
      lng,
      petId,
      radiusKm,
      sort,
    },
  });
  return response.data;
};
