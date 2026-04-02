import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getPromotions().then(data => {
      setPromotions(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Акции</h1>
        {promotions.length === 0 ? (
          <p className="text-center text-gray-500">Нет активных акций</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map(promo => (
              <div key={promo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img src={promo.image_url} alt={promo.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{promo.title}</h2>
                  <p className="text-gray-600">{promo.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;