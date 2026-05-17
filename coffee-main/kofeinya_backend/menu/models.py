from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User


def _unique_slug(model_cls, base: str, instance_pk=None) -> str:
    base_slug = slugify(base, allow_unicode=True) or "item"
    slug = base_slug
    n = 1
    qs = model_cls.objects.filter(slug=slug)
    if instance_pk is not None:
        qs = qs.exclude(pk=instance_pk)
    while qs.exists():
        slug = f"{base_slug}-{n}"
        n += 1
        qs = model_cls.objects.filter(slug=slug)
        if instance_pk is not None:
            qs = qs.exclude(pk=instance_pk)
    return slug


class Promotion(models.Model):
    """Акция на сайте (оформление как блог)."""

    name = models.CharField(max_length=255, verbose_name="Название")
    slug = models.SlugField(max_length=255, unique=True, db_index=True, blank=True)
    image = models.ImageField(upload_to="promotions/", verbose_name="Картинка")
    description = models.TextField(verbose_name="Описание")
    conditions = models.TextField(verbose_name="Условия акции", blank=True, default="")
    terms = models.TextField(verbose_name="Пользовательское соглашение", blank=True, default="")
    banner_image = models.ImageField(upload_to="promotions/banners/", verbose_name="Изображение шапки", null=True, blank=True)
    pdf_file = models.FileField(upload_to="promotions/pdf/", verbose_name="PDF файл", null=True, blank=True)
    pdf_link_text = models.CharField(max_length=255, verbose_name="Текст ссылки на PDF", blank=True, default="")
    end_date = models.DateTimeField(verbose_name="Дата окончания акции", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Акция"
        verbose_name_plural = "Акции"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(Promotion, self.name, self.pk)
        super().save(*args, **kwargs)


class Category(models.Model):
    """Категория продуктов."""

    name = models.CharField(max_length=255, verbose_name="Название")
    slug = models.SlugField(max_length=255, unique=True, db_index=True, blank=True)
    image = models.ImageField(
        upload_to="categories/",
        verbose_name="Фото",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(Category, self.name, self.pk)
        super().save(*args, **kwargs)


class Subcategory(models.Model):
    """Подкатегория (необязательный уровень под категорией)."""

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="subcategories",
        verbose_name="Категория",
    )
    name = models.CharField(max_length=255, verbose_name="Название")
    slug = models.SlugField(max_length=255, unique=True, db_index=True, blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Подкатегория"
        verbose_name_plural = "Подкатегории"

    def __str__(self) -> str:
        return f"{self.category.name} / {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(Subcategory, self.name, self.pk)
        super().save(*args, **kwargs)


class Product(models.Model):
    """Товар."""

    name_with_weight = models.CharField(
        max_length=500,
        verbose_name="Название с грамовкой",
    )
    slug = models.SlugField(max_length=500, unique=True, db_index=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")
    image = models.ImageField(upload_to="products/", verbose_name="Картинка")
    is_available = models.BooleanField(default=True, verbose_name="Наличие")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        verbose_name="Акция",
    )
    composition = models.TextField(verbose_name="Состав")
    protein_per_100g = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name="Белки на 100 г",
    )
    fat_per_100g = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name="Жиры на 100 г",
    )
    carbs_per_100g = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name="Углеводы на 100 г",
    )
    calories_per_100g = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name="Калории на 100 г",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="products",
        verbose_name="Категория",
    )
    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="products",
        verbose_name="Подкатегория",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Товар"
        verbose_name_plural = "Товары"

    def __str__(self) -> str:
        return self.name_with_weight

    def clean(self):
        super().clean()
        if self.subcategory_id and self.subcategory.category_id != self.category_id:
            raise ValidationError(
                {"subcategory": "Подкатегория должна принадлежать выбранной категории."}
            )

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(Product, self.name_with_weight, self.pk)
        super().save(*args, **kwargs)


class Order(models.Model):
    class OrderType(models.TextChoices):
        DELIVERY = "delivery", "Доставка"
        IN_HOUSE = "in_house", "В заведении"

    """Заказ. Для гостя user может быть пустым — контакты в customer_*."""

    class Status(models.TextChoices):
        NEW = "new", "Новый"
        CONFIRMED = "confirmed", "Подтверждён"
        PREPARING = "preparing", "Готовится"
        DELIVERING = "delivering", "Доставляется"
        COMPLETED = "completed", "Завершён"
        CANCELLED = "cancelled", "Отменён"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Наличные"

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        db_index=True,
    )
    order_type = models.CharField(
        max_length=20,
        choices=OrderType.choices,
        default=OrderType.DELIVERY,
        db_index=True,
        verbose_name="Тип заказа",
    )
    delivery_address = models.TextField(verbose_name="Адрес доставки", blank=True, default="")
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Доставка",
    )
    customer_name = models.CharField(max_length=255, verbose_name="Имя", default="", blank=True)
    customer_phone = models.CharField(max_length=32, verbose_name="Телефон", default="", blank=True)
    customer_email = models.EmailField(blank=True, default="", verbose_name="Email")
    notes = models.TextField(blank=True, default="", verbose_name="Комментарий")
    payment_method = models.CharField(
        max_length=32,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
        verbose_name="Оплата",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"

    def __str__(self) -> str:
        return f"Заказ #{self.pk}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Цена за ед. на момент заказа",
    )

    class Meta:
        verbose_name = "Позиция заказа"
        verbose_name_plural = "Позиции заказов"

    def __str__(self) -> str:
        return f"{self.product} × {self.quantity}"


class DishOfTheDay(models.Model):
    """Блюдо дня - специальное предложение на определенный период."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="dish_of_day",
        verbose_name="Блюдо",
    )
    old_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Старая цена (для скидки)",
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Цена со скидкой",
    )
    active_from = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Активно с",
    )
    active_until = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Активно до",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активно",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Блюдо дня"
        verbose_name_plural = "Блюда дня"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Блюдо дня: {self.product.name_with_weight}"
