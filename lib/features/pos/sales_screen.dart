import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/money_format.dart';
import '../../core/utils/order_calculator.dart';
import '../../data/models/category_model.dart';
import '../../data/models/order_model.dart';
import '../../data/models/product_model.dart';
import '../../data/repositories/product_repository.dart';
import '../../services/cart_storage_service.dart';
import 'widgets/product_card.dart';
import 'order_review_screen.dart';

class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  final _productRepo = ProductRepository();

  bool _isDineIn = true;
  String _selectedCategoryId = ''; // Rỗng = TẤT CẢ
  final Map<String, int> _cartQuantities = {}; // productId -> quantity
  final Map<String, ProductModel> _cartProducts = {}; // productId -> product

  @override
  void initState() {
    super.initState();
    _productRepo.seedInitialDataIfEmpty();
    _restoreDraftCart();
  }

  Future<void> _restoreDraftCart() async {
    final draft = await CartStorageService.loadDraftCart();
    if (draft.items.isNotEmpty && mounted) {
      setState(() {
        _isDineIn = draft.isDineIn;
        for (final item in draft.items) {
          _cartQuantities[item.productId] = item.quantity;
        }
      });
    }
  }

  void _persistDraft() {
    final items = _buildOrderItems();
    CartStorageService.saveDraftCart(items: items, isDineIn: _isDineIn);
  }

  void _onProductTapped(ProductModel product) {
    setState(() {
      _cartProducts[product.id] = product;
      _cartQuantities[product.id] = (_cartQuantities[product.id] ?? 0) + 1;
    });
    _persistDraft();
  }

  List<OrderItemModel> _buildOrderItems() {
    final items = <OrderItemModel>[];
    _cartQuantities.forEach((prodId, qty) {
      if (qty > 0) {
        final prod = _cartProducts[prodId];
        if (prod != null) {
          final price = prod.getPrice(isDineIn: _isDineIn);
          final subtotal = OrderCalculator.calculateSubtotal(price, qty);
          items.add(OrderItemModel(
            productId: prodId,
            name: prod.name,
            icon: prod.icon,
            price: price,
            quantity: qty,
            subtotal: subtotal,
            trackStock: prod.trackStock,
          ));
        }
      }
    });
    return items;
  }

  int get _totalItemCount {
    return _cartQuantities.values.fold(0, (sum, q) => sum + q);
  }

  int get _totalAmount {
    int sum = 0;
    _cartQuantities.forEach((prodId, qty) {
      if (qty > 0) {
        final prod = _cartProducts[prodId];
        if (prod != null) {
          final price = prod.getPrice(isDineIn: _isDineIn);
          sum += OrderCalculator.calculateSubtotal(price, qty);
        }
      }
    });
    return sum;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.textMain, size: 28),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'BÁN HÀNG',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: AppColors.textMain,
          ),
        ),
        actions: [
          if (_totalItemCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: TextButton.icon(
                onPressed: () {
                  setState(() {
                    _cartQuantities.clear();
                    _cartProducts.clear();
                  });
                  _persistDraft();
                },
                icon: const Icon(Icons.delete_sweep, color: AppColors.dangerRed, size: 24),
                label: const Text(
                  'XÓA HẾT',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.dangerRed,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. CÔNG TẮC CHẾ ĐỘ: UỐNG TẠI QUÁN vs MANG VỀ
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() => _isDineIn = true);
                          _persistDraft();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isDineIn ? AppColors.dineInBlue : const Color(0xFFF1F5F9),
                          foregroundColor: _isDineIn ? Colors.white : AppColors.textMuted,
                          elevation: _isDineIn ? 4 : 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(
                              color: _isDineIn ? AppColors.dineInBlue : AppColors.borderColor,
                              width: 2,
                            ),
                          ),
                        ),
                        child: Text(
                          AppStrings.modeDineIn,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: _isDineIn ? Colors.white : AppColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() => _isDineIn = false);
                          _persistDraft();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: !_isDineIn ? AppColors.takeawayOrange : const Color(0xFFF1F5F9),
                          foregroundColor: !_isDineIn ? Colors.white : AppColors.textMuted,
                          elevation: !_isDineIn ? 4 : 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(
                              color: !_isDineIn ? AppColors.takeawayOrange : AppColors.borderColor,
                              width: 2,
                            ),
                          ),
                        ),
                        child: Text(
                          AppStrings.modeTakeAway,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: !_isDineIn ? Colors.white : AppColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 2. DANH MỤC DẠNG WRAP (TỰ XUỐNG DÒNG, KHÔNG CUỘN NGANG)
            StreamBuilder<List<CategoryModel>>(
              stream: _productRepo.getActiveCategoriesStream(),
              builder: (context, snapshot) {
                final categories = snapshot.data ?? [];

                return Container(
                  width: double.infinity,
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      // Chip Tất cả
                      _buildCategoryChip(
                        id: '',
                        title: AppStrings.catAll,
                        isSelected: _selectedCategoryId.isEmpty,
                      ),
                      ...categories.map((c) => _buildCategoryChip(
                            id: c.id,
                            title: '${c.icon} ${c.name}',
                            isSelected: _selectedCategoryId == c.id,
                          )),
                    ],
                  ),
                );
              },
            ),

            const Divider(height: 1, color: AppColors.borderColor),

            // 3. LƯỚI SẢN PHẨM (2 CỘT)
            Expanded(
              child: StreamBuilder<List<ProductModel>>(
                stream: _productRepo.getActiveProductsStream(categoryId: _selectedCategoryId),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  final products = snapshot.data ?? [];
                  if (products.isEmpty) {
                    return const Center(
                      child: Text(
                        'Chưa có sản phẩm nào trong danh mục này',
                        style: TextStyle(fontSize: 18, color: AppColors.textMuted),
                      ),
                    );
                  }

                  // Lưu trữ vào cache map để lookup khi tạo đơn
                  for (final p in products) {
                    _cartProducts[p.id] = p;
                  }

                  return GridView.builder(
                    padding: const EdgeInsets.fromLTRB(14, 14, 14, 90),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.82,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      final qty = _cartQuantities[product.id] ?? 0;

                      return ProductCard(
                        product: product,
                        isDineIn: _isDineIn,
                        selectedQuantity: qty,
                        onTap: () => _onProductTapped(product),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),

      // 4. THANH GHIM ĐÁY (STICKY BOTTOM BAR): XEM ĐƠN & HOÀN TẤT
      bottomSheet: _totalItemCount > 0
          ? Container(
              color: Colors.transparent,
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 68,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final items = _buildOrderItems();
                    final result = await Navigator.push<bool>(
                      context,
                      MaterialPageRoute(
                        builder: (_) => OrderReviewScreen(
                          isDineIn: _isDineIn,
                          items: items,
                        ),
                      ),
                    );

                    if (result == true && mounted) {
                      setState(() {
                        _cartQuantities.clear();
                        _cartProducts.clear();
                      });
                      await CartStorageService.clearDraft();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    elevation: 8,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '$_totalItemCount món',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'XEM ĐƠN',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        MoneyFormat.formatVND(_totalAmount),
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildCategoryChip({
    required String id,
    required String title,
    required bool isSelected,
  }) {
    return InkWell(
      onTap: () {
        setState(() => _selectedCategoryId = id);
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.textMain : AppColors.bgLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.textMain : AppColors.borderColor,
            width: 1.5,
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: isSelected ? Colors.white : AppColors.textMain,
          ),
        ),
      ),
    );
  }
}
