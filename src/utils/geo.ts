const EARTH_RADIUS_KM = 6371;

export const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return EARTH_RADIUS_KM * c;
};

export const filterPostsByRadius = (
  posts: Array<any>,
  userLat: number,
  userLng: number,
  radiusKm: number = 20
) => {
  return posts
    .map(post => ({
      ...post,
      distance: haversineDistance(userLat, userLng, post.location.lat, post.location.lng),
    }))
    .filter(post => post.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

export const getCurrentLocation = async (): Promise<{
  lat: number;
  lng: number;
} | null> => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => resolve(null)
      );
    } else {
      resolve(null);
    }
  });
};
