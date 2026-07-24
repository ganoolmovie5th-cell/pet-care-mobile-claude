import { api } from './api';
import { Vet } from './vet';

export interface RecommendedVet extends Vet {
  distance_km: number;
  rank_reason: string;
  recommendation_score: number;
}

export interface RecommendationsResponse {
  recommended_vets: RecommendedVet[];
}

export const getRecommendedVets = async (
  ownerId: string,
  lat: number,
  lng: number,
  petId: string,
  limit: number = 10
): Promise<RecommendationsResponse> => {
  const response = await api.get('/recommendations/vets', {
    params: {
      ownerId,
      lat,
      lng,
      petId,
      limit,
    },
  });
  return response.data;
};
