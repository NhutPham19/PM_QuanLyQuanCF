import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/money_format.dart';
import '../../../data/models/product_model.dart';
import '../../../services/audio_service.dart';

class ProductCard extends StatelessWidget {
  final ProductModel product;
  final bool isDineIn;
  final int selectedQuantity;
  final VoidCallback onTap;

  const ProductCard({
    super.key,
    required this.product,
    required this.isDineIn,
    required this.selectedQuantity,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final price = product.getPrice(isDineIn: isDineIn);
    final isSelected = selectedQuantity > 0;
    final isSpecialNonTrack = !product.trackStock && product.name.contains('ĐIẾU');

    return InkWell(
      onTap: () {
        AudioService().playBeep();
        onTap();
      },
      borderRadius: BorderRadius.circular(18),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGreen.withOpacity(0.06) : AppColors.cardBg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : AppColors.borderColor,
            width: isSelected ? 2.5 : 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppColors.primaryGreen.withOpacity(0.18)
                  : Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // PHẦN TRÊN: ẢNH HOẶC ICON (HÌNH ẢNH TO HƠN, RÕ NÉT)
                  Expanded(
                    child: Center(
                      child: product.imageUrl != null && product.imageUrl!.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: AspectRatio(
                                aspectRatio: 1.05,
                                child: CachedNetworkImage(
                                  imageUrl: product.imageUrl!,
                                  fit: BoxFit.cover,
                                  memCacheWidth: 350,
                                  placeholder: (context, url) => Container(
                                    color: AppColors.bgLight,
                                    child: Center(
                                      child: Text(
                                        product.icon,
                                        style: const TextStyle(fontSize: 48),
                                      ),
                                    ),
                                  ),
                                  errorWidget: (context, url, error) => Center(
                                    child: Text(
                                      product.icon,
                                      style: const TextStyle(fontSize: 48),
                                    ),
                                  ),
                                ),
                              ),
                            )
                          : Container(
                              width: 82,
                              height: 82,
                              decoration: BoxDecoration(
                                color: AppColors.bgLight,
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: Center(
                                child: Text(
                                  product.icon,
                                  style: const TextStyle(fontSize: 48),
                                ),
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // TÊN MÓN ĂN - CHỮ TO ĐẬM IN HOA
                  Text(
                    product.name.toUpperCase(),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textMain,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // GIÁ TIỀN RÕ RÀNG
                  Text(
                    MoneyFormat.formatVND(price),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: isDineIn ? AppColors.dineInBlue : AppColors.takeawayOrange,
                    ),
                  ),

                  // TỒN KHO HOẶC ĐƠN VỊ TÍNH
                  if (product.trackStock) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Kho: ${product.stockQuantity} ${product.unit}',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: product.stockQuantity <= product.lowStockAt
                            ? AppColors.dangerRed
                            : AppColors.textMuted,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // HUY HIỆU SỐ LƯỢNG ĐÃ CHỌN (GÓC TRÊN PHẢI)
            if (isSelected)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryGreen,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black26,
                        blurRadius: 4,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      '$selectedQuantity',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 19,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ),

            // HUY HIỆU ĐẶC BIỆT (Ví dụ: Thuốc lá lẻ)
            if (isSpecialNonTrack)
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFD97706), width: 1.2),
                  ),
                  child: const Text(
                    'Lẻ +2k',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFB45309),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
