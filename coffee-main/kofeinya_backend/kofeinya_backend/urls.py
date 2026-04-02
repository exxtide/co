from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from menu.views import (
    CategoryViewSet,
    dadata_address_suggest,
    OrderViewSet,
    ProductViewSet,
    PromotionViewSet,
    SubcategoryViewSet,
)

router = DefaultRouter()
router.register(r"promotions", PromotionViewSet, basename="promotion")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"subcategories", SubcategoryViewSet, basename="subcategory")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"orders", OrderViewSet, basename="order")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include(router.urls)),
    path("api/dadata/address-suggest/", dadata_address_suggest),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
