from django.contrib import admin

from .models import Category, Order, OrderItem, Product, Promotion, Subcategory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    raw_id_fields = ("product",)


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "category")
    list_filter = ("category",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name_with_weight", "slug", "price", "is_available", "category", "created_at")
    list_filter = ("is_available", "category", "promotion")
    search_fields = ("name_with_weight", "slug", "composition")
    raw_id_fields = ("promotion",)
    prepopulated_fields = {"slug": ("name_with_weight",)}
    autocomplete_fields = ("category", "subcategory")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "customer_name",
        "customer_phone",
        "order_type",
        "status",
        "total_price",
        "created_at",
    )
    list_filter = ("order_type", "status", "payment_method", "created_at")
    search_fields = ("customer_name", "customer_phone", "customer_email", "delivery_address")
    inlines = (OrderItemInline,)
    raw_id_fields = ("user",)
