from decimal import Decimal

from django.db import transaction
from rest_framework import serializers
from PIL import Image, UnidentifiedImageError

from .models import Category, DishOfTheDay, Order, OrderItem, Product, Promotion, Subcategory


MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB


def _validate_image_upload(file_obj):
    if file_obj is None:
        return file_obj
    size = getattr(file_obj, "size", None)
    if isinstance(size, int) and size > MAX_IMAGE_BYTES:
        raise serializers.ValidationError("Файл слишком большой (макс. 5MB).")
    content_type = (getattr(file_obj, "content_type", "") or "").lower()
    if content_type and not content_type.startswith("image/"):
        raise serializers.ValidationError("Разрешены только изображения.")
    try:
        file_obj.seek(0)
        img = Image.open(file_obj)
        img.verify()
    except (UnidentifiedImageError, OSError):
        raise serializers.ValidationError("Некорректный файл изображения.")
    finally:
        try:
            file_obj.seek(0)
        except Exception:
            pass
    return file_obj


class PromotionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    banner_image_url = serializers.SerializerMethodField()
    pdf_file_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        if obj.image:
            return self.context["request"].build_absolute_uri(obj.image.url)
        return None

    def get_banner_image_url(self, obj):
        if obj.banner_image:
            return self.context["request"].build_absolute_uri(obj.banner_image.url)
        return None

    def get_pdf_file_url(self, obj):
        if obj.pdf_file:
            return self.context["request"].build_absolute_uri(obj.pdf_file.url)
        return None

    def validate_image(self, value):
        return _validate_image_upload(value)

    def validate_banner_image(self, value):
        return _validate_image_upload(value)

    class Meta:
        model = Promotion
        fields = (
            "id",
            "name",
            "slug",
            "image",
            "image_url",
            "description",
            "conditions",
            "terms",
            "banner_image",
            "banner_image_url",
            "pdf_file",
            "pdf_file_url",
            "pdf_link_text",
            "end_date",
            "created_at",
        )
        read_only_fields = ("slug", "created_at", "image_url", "banner_image_url", "pdf_file_url")


class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = ("id", "name", "slug", "category")
        read_only_fields = ("slug",)


class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubcategorySerializer(many=True, read_only=True)

    def validate_image(self, value):
        return _validate_image_upload(value)

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "image", "subcategories")
        read_only_fields = ("slug",)


class ProductSerializer(serializers.ModelSerializer):
    """Белки/жиры/углеводы/ккал на 100 г — массив из четырёх чисел."""

    nutrition_per_100g = serializers.ListField(
        child=serializers.DecimalField(max_digits=8, decimal_places=2),
        min_length=4,
        max_length=4,
        write_only=True,
        required=False,
    )
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        if obj.image:
            return self.context["request"].build_absolute_uri(obj.image.url)
        return None

    class Meta:
        model = Product
        fields = (
            "id",
            "name_with_weight",
            "slug",
            "price",
            "image",
            "image_url",
            "is_available",
            "created_at",
            "promotion",
            "composition",
            "nutrition_per_100g",
            "category",
            "subcategory",
        )
        read_only_fields = ("slug", "created_at", "image_url")

    def validate_image(self, value):
        return _validate_image_upload(value)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["nutrition_per_100g"] = [
            instance.protein_per_100g,
            instance.fat_per_100g,
            instance.carbs_per_100g,
            instance.calories_per_100g,
        ]
        return data

    def validate(self, attrs):
        sub = attrs.get("subcategory", getattr(self.instance, "subcategory", None))
        cat = attrs.get("category", getattr(self.instance, "category", None))
        if sub is not None and cat is not None and sub.category_id != cat.id:
            raise serializers.ValidationError(
                {"subcategory": "Подкатегория должна принадлежать выбранной категории."}
            )
        return attrs

    def _apply_nutrition(self, instance: Product, value: list):
        p, f, c, k = value
        instance.protein_per_100g = Decimal(str(p))
        instance.fat_per_100g = Decimal(str(f))
        instance.carbs_per_100g = Decimal(str(c))
        instance.calories_per_100g = Decimal(str(k))

    def create(self, validated_data):
        nutrition = validated_data.pop("nutrition_per_100g", None)
        if nutrition is None:
            raise serializers.ValidationError(
                {"nutrition_per_100g": "Укажите массив из четырёх чисел: белки, жиры, углеводы, ккал на 100 г."}
            )
        product = Product(**validated_data)
        self._apply_nutrition(product, nutrition)
        product.save()
        return product

    def update(self, instance, validated_data):
        nutrition = validated_data.pop("nutrition_per_100g", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if nutrition is not None:
            self._apply_nutrition(instance, nutrition)
        instance.save()
        return instance


class OrderItemNestedSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name_with_weight", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "product", "product_name", "product_slug", "quantity", "price")


class OrderListSerializer(serializers.ModelSerializer):
    items = OrderItemNestedSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(
        source="total_price", max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "created_at",
            "order_type",
            "status",
            "total_price",
            "total_amount",
            "delivery_address",
            "delivery_fee",
            "customer_name",
            "customer_phone",
            "customer_email",
            "notes",
            "payment_method",
            "items",
        )


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True)
    order_type = serializers.ChoiceField(choices=Order.OrderType.choices, default=Order.OrderType.DELIVERY)
    delivery_address = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_fee = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    customer_name = serializers.CharField(max_length=255)
    customer_phone = serializers.CharField(max_length=32)
    customer_email = serializers.EmailField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.CASH)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Добавьте хотя бы одну позицию.")
        return value

    def validate(self, attrs):
        order_type = attrs.get("order_type", Order.OrderType.DELIVERY)
        delivery_address = (attrs.get("delivery_address") or "").strip()
        payment_method = attrs.get("payment_method")

        if payment_method != Order.PaymentMethod.CASH:
            raise serializers.ValidationError({"payment_method": "Пока доступна только оплата наличными."})

        if order_type == Order.OrderType.DELIVERY and not delivery_address:
            raise serializers.ValidationError({"delivery_address": "Укажите адрес доставки."})

        if order_type == Order.OrderType.IN_HOUSE:
            attrs["delivery_address"] = "В заведении"
            attrs["delivery_fee"] = Decimal("0")
        else:
            attrs["delivery_address"] = delivery_address
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        items_data = validated_data.pop("items")
        user = request.user if request.user.is_authenticated else None

        lines_total = Decimal("0")
        line_objects = []
        for row in items_data:
            pid = row["product_id"]
            qty = row["quantity"]
            try:
                product = Product.objects.select_for_update().get(pk=pid)
            except Product.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"items": f"Товар id={pid} не найден."}
                ) from exc
            if not product.is_available:
                raise serializers.ValidationError(
                    {"items": f"Товар «{product.name_with_weight}» сейчас недоступен."}
                )
            line_total = product.price * qty
            lines_total += line_total
            line_objects.append((product, qty, product.price))

        delivery_fee = validated_data.get("delivery_fee") or Decimal("0")
        total = lines_total + delivery_fee

        order = Order.objects.create(
            user=user,
            total_price=total,
            order_type=validated_data["order_type"],
            delivery_fee=delivery_fee,
            delivery_address=validated_data["delivery_address"],
            customer_name=validated_data["customer_name"],
            customer_phone=validated_data["customer_phone"],
            customer_email=validated_data.get("customer_email") or "",
            notes=validated_data.get("notes") or "",
            payment_method=validated_data["payment_method"],
        )
        for product, qty, unit_price in line_objects:
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=qty,
                price=unit_price,
            )
        return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status",)


class DishOfTheDaySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = DishOfTheDay
        fields = (
            "id",
            "product",
            "product_id",
            "old_price",
            "sale_price",
            "active_from",
            "active_until",
            "is_active",
            "created_at",
        )
        read_only_fields = ("created_at",)

    def validate(self, attrs):
        # Проверяем, что продукт существует
        product_id = attrs.get("product_id")
        if product_id:
            try:
                Product.objects.get(pk=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    {"product_id": "Товар не найден."}
                )
        return attrs
