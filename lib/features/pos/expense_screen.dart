import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/money_format.dart';
import '../../core/utils/units_conversion.dart';
import '../../data/models/expense_category_model.dart';
import '../../data/models/product_model.dart';
import '../../data/repositories/expense_repository.dart';
import '../../data/repositories/product_repository.dart';
import '../../services/audio_service.dart';
import 'widgets/casio_keypad.dart';

class ExpenseScreen extends StatefulWidget {
  const ExpenseScreen({super.key});

  @override
  State<ExpenseScreen> createState() => _ExpenseScreenState();
}

class _ExpenseScreenState extends State<ExpenseScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _productRepo = ProductRepository();
  final _expenseRepo = ExpenseRepository();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // ================= XỬ LÝ NHẬP HÀNG BÁN =================

  Future<void> _handleRestockProduct(ProductModel product) async {
    bool isCase = false;

    // Nếu món có thiết lập Thùng (unitsPerCase > 1) thì hỏi nhập Thùng hay Lon
    if (product.unitsPerCase != null && product.unitsPerCase! > 1) {
      final unitChoice = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'CHỌN ĐƠN VỊ NHẬP:\n${product.name.toUpperCase()}',
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 64,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, true), // Thùng
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.takeawayOrange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    '📦 NHẬP THEO THÙNG (${product.unitsPerCase} ${product.unit})',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 64,
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(ctx, false), // Lon lẻ
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.takeawayOrange, width: 2),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    '🥫 NHẬP LẺ TỪNG ${product.unit.toUpperCase()}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.takeawayOrange,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );

      if (unitChoice == null) return;
      isCase = unitChoice;
    }

    if (!mounted) return;

    // 1. Nhập số lượng
    final qty = await CasioKeypad.show(
      context,
      title: isCase ? 'NHẬP SỐ THÙNG' : 'NHẬP SỐ ${product.unit.toUpperCase()}',
      subtitle: product.name.toUpperCase(),
      initialValue: 1,
      isMoney: false,
    );
    if (qty == null || qty <= 0 || !mounted) return;

    // 2. Nhập số tiền đã trả cho đại lý
    final amount = await CasioKeypad.show(
      context,
      title: 'NHẬP TỔNG TIỀN ĐÃ TRẢ',
      subtitle: 'Tiền mua $qty ${isCase ? 'thùng' : product.unit} ${product.name}',
      initialValue: 0,
      isMoney: true,
    );
    if (amount == null || amount <= 0 || !mounted) return;

    // 3. Màn hình xác nhận lớn
    final totalUnits = isCase
        ? UnitsConversion.convertCasesToUnits(qty, product.unitsPerCase)
        : qty;

    final confirmText = isCase
        ? 'Nhập $qty THÙNG ($totalUnits ${product.unit}) ${product.name}\nTổng tiền: ${MoneyFormat.formatVND(amount)}'
        : 'Nhập $qty ${product.unit} ${product.name}\nTổng tiền: ${MoneyFormat.formatVND(amount)}';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'XÁC NHẬN NHẬP HÀNG',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              confirmText,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, height: 1.4),
            ),
            const SizedBox(height: 12),
            const Text(
              'Số lượng sẽ được cộng vào kho và tiền chi sẽ được ghi vào sổ hôm nay.',
              style: TextStyle(fontSize: 14, color: AppColors.textMuted),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('HỦY', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: const Text('ĐÚNG, LƯU ✔', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await _expenseRepo.recordRestockExpense(
        productId: product.id,
        productName: product.name,
        isCase: isCase,
        inputQuantity: qty,
        unitsPerCase: product.unitsPerCase,
        amount: amount,
        createdBy: 'POS_DEVICE',
      );

      await AudioService().playSuccess();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '✔ Đã nhập kho thành công: +$totalUnits ${product.unit} ${product.name}!',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      }
    }
  }

  // ================= XỬ LÝ CHI ĐỒ DÙNG QUÁN =================

  Future<void> _handleSuppliesExpense(String categoryName) async {
    // 1. Nhập số tiền
    final amount = await CasioKeypad.show(
      context,
      title: 'NHẬP SỐ TIỀN CHI',
      subtitle: categoryName.toUpperCase(),
      initialValue: 0,
      isMoney: true,
    );
    if (amount == null || amount <= 0 || !mounted) return;

    final isHuge = amount >= 1000000;

    // 2. Màn hình xác nhận lớn
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'XÁC NHẬN CHI TIỀN',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chi ${MoneyFormat.formatVND(amount)}\ncho "$categoryName"',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, height: 1.4),
            ),
            if (isHuge) ...[
              const SizedBox(height: 10),
              const Text(
                '⚠️ CẢNH BÁO: Số tiền từ 1 triệu đồng trở lên, hãy kiểm tra kỹ số 0!',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.dangerRed),
              ),
            ],
            const SizedBox(height: 12),
            const Text(
              'Khoản chi này sẽ được ghi vào sổ tiền hôm nay.',
              style: TextStyle(fontSize: 14, color: AppColors.textMuted),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('HỦY', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.takeawayOrange,
              foregroundColor: Colors.white,
            ),
            child: const Text('ĐÚNG, GHI CHI ✔', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await _expenseRepo.recordSuppliesExpense(
        categoryName: categoryName,
        amount: amount,
        createdBy: 'POS_DEVICE',
      );

      await AudioService().playSuccess();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '✔ Đã ghi nhận phiếu chi ${MoneyFormat.formatVND(amount)}!',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
      }
    }
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
          'CHI TIỀN / MUA HÀNG',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: AppColors.textMain,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.takeawayOrange,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.takeawayOrange,
          indicatorWeight: 4,
          labelStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
          unselectedLabelStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          tabs: const [
            Tab(text: '📦 NHẬP HÀNG BÁN'),
            Tab(text: '🛒 MUA ĐỒ DÙNG'),
          ],
        ),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 650),
            child: TabBarView(
              controller: _tabController,
              children: [
          // TAB 1: NHẬP THÊM HÀNG BÁN (TỒN KHO)
          StreamBuilder<List<ProductModel>>(
            stream: _productRepo.getActiveProductsStream(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              // Chỉ hiện những món có quản lý tồn kho (trackStock == true)
              final restockable = (snapshot.data ?? []).where((p) => p.trackStock).toList();

              if (restockable.isEmpty) {
                return const Center(
                  child: Text(
                    'Không có sản phẩm nào cần quản lý kho.',
                    style: TextStyle(fontSize: 18, color: AppColors.textMuted),
                  ),
                );
              }

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: restockable.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final p = restockable[index];

                  return InkWell(
                    onTap: () => _handleRestockProduct(p),
                    borderRadius: BorderRadius.circular(18),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppColors.borderColor, width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: AppColors.bgLight,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Center(
                              child: Text(p.icon, style: const TextStyle(fontSize: 32)),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.name.toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.textMain,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Tồn hiện tại: ${p.stockQuantity} ${p.unit} ${p.unitsPerCase != null ? '(${p.unitsPerCase} ${p.unit}/thùng)' : ''}',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: p.stockQuantity <= p.lowStockAt
                                        ? AppColors.dangerRed
                                        : AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.takeawayOrange.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.takeawayOrange, width: 1.5),
                            ),
                            child: const Text(
                              '+ NHẬP',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: AppColors.takeawayOrange,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),

          // TAB 2: MUA ĐỒ DÙNG CHO QUÁN (CHI PHÍ VẬN HÀNH)
          StreamBuilder<List<ExpenseCategoryModel>>(
            stream: _productRepo.getExpenseCategoriesStream(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              final categories = snapshot.data ?? [];

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  final cat = categories[index];

                  return SizedBox(
                    height: 76,
                    child: ElevatedButton(
                      onPressed: () => _handleSuppliesExpense(cat.name),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.textMain,
                        elevation: 2,
                        side: const BorderSide(color: AppColors.borderColor, width: 2),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            cat.name,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textMain,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'GHI CHI ➔',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFFB45309),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    ),
  ),
),
    );
  }
}
