from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.conf import settings
from datetime import datetime
import json
from urllib import request as urllib_request

from .models import Category, Order, Product, Promotion, Subcategory
from .permissions import IsStaffUser, ReadOnlyOrStaff
from .serializers import (
    CategorySerializer,
    OrderCreateSerializer,
    OrderListSerializer,
    OrderStatusUpdateSerializer,
    ProductSerializer,
    PromotionSerializer,
    SubcategorySerializer,
)


class SlugLookupMixin:
    lookup_field = "slug"
    lookup_value_regex = r"[^/]+"


class PromotionViewSet(SlugLookupMixin, viewsets.ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [ReadOnlyOrStaff]


class CategoryViewSet(SlugLookupMixin, viewsets.ModelViewSet):
    queryset = Category.objects.prefetch_related("subcategories")
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrStaff]


class SubcategoryViewSet(SlugLookupMixin, viewsets.ModelViewSet):
    queryset = Subcategory.objects.select_related("category")
    serializer_class = SubcategorySerializer
    permission_classes = [ReadOnlyOrStaff]

    def get_queryset(self):
        qs = super().get_queryset()
        category_slug = self.request.query_params.get("category_slug")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        return qs


class ProductViewSet(SlugLookupMixin, viewsets.ModelViewSet):
    queryset = Product.objects.select_related(
        "category",
        "subcategory",
        "promotion",
    )
    serializer_class = ProductSerializer
    permission_classes = [ReadOnlyOrStaff]

    def get_queryset(self):
        qs = super().get_queryset()
        category_slug = self.request.query_params.get("category")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        subcategory_slug = self.request.query_params.get("subcategory")
        if subcategory_slug:
            qs = qs.filter(subcategory__slug=subcategory_slug)
        promotion_slug = self.request.query_params.get("promotion")
        if promotion_slug:
            qs = qs.filter(promotion__slug=promotion_slug)
        if self.request.query_params.get("available") == "1":
            qs = qs.filter(is_available=True)
        return qs


class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Создание — всем; список/детали — авторизованным (свои заказы); staff — все заказы; смена статуса — staff."""

    queryset = Order.objects.prefetch_related("items__product").select_related("user")
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action in ("partial_update", "update"):
            return OrderStatusUpdateSerializer
        return OrderListSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action == "cancel":
            return [permissions.IsAuthenticated()]
        if self.action in ("partial_update", "update", "history"):
            return [IsStaffUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_staff:
            return qs
        return qs.filter(user=user)

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        out = OrderListSerializer(order, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="history")
    def history(self, request):
        """История заказов для админа с фильтром по дате"""
        date_str = request.query_params.get("date")
        qs = Order.objects.prefetch_related("items__product").select_related("user")
        
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                qs = qs.filter(created_at__date=target_date)
            except ValueError:
                pass
        
        # Показываем только завершенные и отмененные заказы
        qs = qs.filter(status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED])
        qs = qs.order_by("-created_at")
        
        serializer = OrderListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order: Order = self.get_object()
        user = request.user
        if not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        if order.user_id != user.id and not user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if order.status in (Order.Status.COMPLETED, Order.Status.CANCELLED):
            return Response(
                {"detail": "Этот заказ уже нельзя отменить."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])
        out = OrderListSerializer(order, context={"request": request})
        return Response(out.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def dadata_address_suggest(request):
    """
    DaData подсказки адресов (через бэкенд, чтобы не светить токен в фронтенде).
    """
    query = (request.query_params.get("query") or "").strip()
    if not query:
        return Response({"suggestions": []})

    token = getattr(settings, "DADATA_TOKEN", "") or ""
    if not token:
        # В разработке токен может отсутствовать.
        return Response({"suggestions": []})

    url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
    }
    payload = {"query": query, "count": 7, "locations": [{"kladrId": "*"}]}

    try:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = urllib_request.Request(url, data=body, headers=headers, method="POST")
        with urllib_request.urlopen(req, timeout=5) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
    except Exception:
        return Response({"suggestions": []})

    suggestions = []
    for item in data.get("suggestions", []) or []:
        v = item.get("value")
        if isinstance(v, str) and v.strip():
            suggestions.append(v.strip())

    return Response({"suggestions": suggestions[:10]})
