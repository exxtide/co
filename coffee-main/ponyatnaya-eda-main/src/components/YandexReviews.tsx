import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
  likes: number;
}

interface ReviewsResponse {
  reviews: Review[];
  total_count: number;
  org_name: string;
  org_url: string;
}

const YandexReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgUrl, setOrgUrl] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get<ReviewsResponse>('/yandex-reviews/');
        setReviews(data.reviews);
        setOrgUrl(data.org_url);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="mb-4">Пока нет отзывов. Станьте первым!</p>
        <a
          href="https://yandex.ru/maps/org/ponyatnaya_yeda/218896215154/reviews"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
        >
          <span>Оставить отзыв на Яндекс.Картах</span>
          <ExternalLink size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <span className="text-gray-600 text-sm">
            {reviews.length} отзывов
          </span>
        </div>
        <a
          href={orgUrl || 'https://yandex.ru/maps/org/ponyatnaya_yeda/218896215154/'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Все отзывы
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-50 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                {review.avatar ? (
                  <img
                    src={review.avatar}
                    alt={review.author}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-red-600 font-semibold">
                    {review.author.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800 truncate">
                    {review.author}
                  </h4>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDate(review.date)}
                  </span>
                </div>
                <div className="flex items-center gap-1 my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  {review.text}
                </p>
                {review.likes > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <ThumbsUp size={12} />
                    <span>{review.likes}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-6">
        <a
          href="https://yandex.ru/maps/org/ponyatnaya_yeda/218896215154/reviews"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
        >
          <span>Оставить отзыв на Яндекс.Картах</span>
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

export default YandexReviews;

