from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("menu", "0003_order_expand"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="order_type",
            field=models.CharField(
                choices=[("delivery", "Доставка"), ("in_house", "В заведении")],
                db_index=True,
                default="delivery",
                max_length=20,
                verbose_name="Тип заказа",
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="delivery_address",
            field=models.TextField(blank=True, default="", verbose_name="Адрес доставки"),
        ),
        migrations.AlterField(
            model_name="order",
            name="payment_method",
            field=models.CharField(
                choices=[("cash", "Наличные")],
                default="cash",
                max_length=32,
                verbose_name="Оплата",
            ),
        ),
    ]
