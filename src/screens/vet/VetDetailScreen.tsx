import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useVet } from '../../hooks/useVet';
import { Vet } from '../../services/vet';
import { getReviewsForTarget, markReviewHelpful, Review } from '../../services/review';

interface VetDetailScreenProps {
  vetId: string;
  onBooking: (vet: Vet) => void;
}

export const VetDetailScreen: React.FC<VetDetailScreenProps> = ({ vetId, onBooking }) => {
  const { loading, error, fetchVetById } = useVet();
  const [vet, setVet] = useState<Vet | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  useEffect(() => {
    const loadVet = async () => {
      const data = await fetchVetById(vetId);
      setVet(data);
    };
    loadVet();
  }, [vetId]);

  useEffect(() => {
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const response = await getReviewsForTarget(vetId, 'vet', 'recent', 20, 0);
        setReviews(response.reviews);
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (vetId) {
      loadReviews();
    }
  }, [vetId]);

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r,
        ),
      );
    } catch (err) {
      console.error('Error marking review helpful:', err);
    }
  };

  const filteredReviews = ratingFilter
    ? reviews.filter((r) => r.rating === ratingFilter)
    : reviews;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (!vet || error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Vet not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{vet.clinic_name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {vet.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({vet.review_count} reviews)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.text}>{vet.location.address}</Text>
        <Text style={styles.text}>{vet.location.city}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specialties</Text>
        <View style={styles.specialties}>
          {vet.specialties.map((spec, idx) => (
            <View key={idx} style={styles.badge}>
              <Text style={styles.badgeText}>{spec}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hours</Text>
        <Text style={styles.text}>
          {vet.hours.open} - {vet.hours.close}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consultation Fee</Text>
        <Text style={styles.fee}>Rp {vet.consultation_fee.toLocaleString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
        <View style={styles.ratingFilterRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRatingFilter(ratingFilter === star ? null : star)}
              style={[
                styles.ratingFilterButton,
                ratingFilter === star && styles.ratingFilterButtonActive,
              ]}
            >
              <Text style={styles.ratingFilterText}>{star}★</Text>
            </TouchableOpacity>
          ))}
        </View>

        {reviewsLoading ? (
          <ActivityIndicator size="small" color="#0f5c4a" />
        ) : filteredReviews.length === 0 ? (
          <Text style={styles.noReviews}>No reviews yet</Text>
        ) : (
          <View style={styles.reviewsList}>
            {filteredReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewRating}>{'★'.repeat(review.rating)}</Text>
                  <Text style={styles.reviewVerified}>
                    {review.verified ? '✓ Verified' : ''}
                  </Text>
                </View>
                {review.text && <Text style={styles.reviewText}>{review.text}</Text>}
                <View style={styles.reviewFooter}>
                  <TouchableOpacity
                    onPress={() => handleMarkHelpful(review.id)}
                    style={styles.helpfulButton}
                  >
                    <Text style={styles.helpfulText}>👍 {review.helpful_count}</Text>
                  </TouchableOpacity>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.bookButton} onPress={() => onBooking(vet)}>
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  fee: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f5c4a',
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e4efe9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f5c4a',
  },
  bookButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
  ratingFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ratingFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  ratingFilterButtonActive: {
    backgroundColor: '#0f5c4a',
  },
  ratingFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRating: {
    fontSize: 14,
    color: '#FFD700',
  },
  reviewVerified: {
    fontSize: 12,
    color: '#0f5c4a',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpfulButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  helpfulText: {
    fontSize: 12,
    color: '#0f5c4a',
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  noReviews: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
