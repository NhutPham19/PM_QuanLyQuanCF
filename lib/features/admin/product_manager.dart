import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/utils/money_format.dart';
import '../../data/models/category_model.dart';
import '../../data/models/product_model.dart';
import '../../data/repositories/cloudinary_repository.dart';
import '../../data/repositories/product_repository.dart';

class ProductManagerScreen extends StatefulWidget {
  const ProductManagerScreen({super.key});

  @override
  State<ProductManagerScreen> createState() => _ProductManagerScreenState();
}

class _ProductManagerScreenState extends State<ProductManagerScreen> {
  final _productRepo = ProductRepository();
  final _cloudinaryRepo = CloudinaryRepository();

  void _showProductForm({ProductModel? product, List<CategoryModel>? categories}) {
    final isEdit = product != null;
    final nameCtrl = TextEditingController(text: product?.name ?? '');
    final priceDineInCtrl = TextEditingController(text: product?.priceDineIn.toString() ?? '15000');
    final priceTakeAwayCtrl = TextEditingController(text: product?.priceTakeAway.toString() ?? '15000');
    final unitCtrl = TextEditingController(text: product?.unit ?? 'ly');
    final unitsPerCaseCtrl = TextEditingController(text: product?.unitsPerCase?.toString() ?? '');
    final stockCtrl = TextEditingController(text: product?.stockQuantity.toString() ?? '0');
    final lowStockCtrl = TextEditingController(text: product?.lowStockAt.toString() ?? '5');
    final iconCtrl = TextEditingController(text: product?.icon ?? '🥤');
    final imageUrlCtrl = TextEditingController(text: product?.imageUrl ?? '');

    String selectedCatId = product?.categoryId ?? (categories?.isNotEmpty == true ? categories!.first.id : '');
    bool trackStock = product?.trackStock ?? true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      isEdit ? 'SỬA MÓN ĂN / UỐNG' : 'THÊM MÓN MỚI',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),

                    // Tên món
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Tên món (ví dụ: CÀ PHÊ SỮA)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Chọn danh mục
                    if (categories != null && categories.isNotEmpty)
                      DropdownButtonFormField<String>(
                        initialValue: selectedCatId.isNotEmpty ? selectedCatId : categories.first.id,
                        decoration: const InputDecoration(
                          labelText: 'Danh mục',
                          border: OutlineInputBorder(),
                        ),
                        items: categories
                            .map((c) => DropdownMenuItem(
                                  value: c.id,
                                  child: Text('${c.icon} ${c.name}'),
                                ))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setModalState(() => selectedCatId = val);
                          }
                        },
                      ),
                    const SizedBox(height: 12),

                    // 2 MỨC GIÁ: TẠI QUÁN vs MANG VỀ
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: priceDineInCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Giá Tại Quán (đ)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: priceTakeAwayCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Giá Mang Về (đ)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Đơn vị tính & Quy đổi Thùng
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: unitCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Đơn vị (ly, lon, điếu...)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: unitsPerCaseCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Lon/Thùng (ví dụ: 24)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Tồn kho & Cảnh báo tồn thấp
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: stockCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Tồn kho hiện tại',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: lowStockCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Báo khi tồn dưới',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Icon & URL Ảnh Cloudinary
                    Row(
                      children: [
                        SizedBox(
                          width: 80,
                          child: TextField(
                            controller: iconCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Icon',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: imageUrlCtrl,
                            decoration: const InputDecoration(
                              labelText: 'URL Ảnh Cloudinary',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Checkbox Quản lý tồn kho
                    CheckboxListTile(
                      title: const Text(
                        'Quản lý trừ tồn kho',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: const Text(
                        'Bỏ chọn cho món bán lẻ như Thuốc Jet (điếu) hoặc đồ tự pha chế',
                      ),
                      value: trackStock,
                      onChanged: (val) {
                        setModalState(() => trackStock = val ?? true);
                      },
                      contentPadding: EdgeInsets.zero,
                    ),
                    const SizedBox(height: 16),

                    // Nút Lưu
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () async {
                          final name = nameCtrl.text.trim();
                          if (name.isEmpty) return;

                          final priceDineIn = int.tryParse(priceDineInCtrl.text.trim()) ?? 0;
                          final priceTakeAway = int.tryParse(priceTakeAwayCtrl.text.trim()) ?? priceDineIn;
                          final unit = unitCtrl.text.trim().isEmpty ? 'ly' : unitCtrl.text.trim();
                          final unitsPerCase = int.tryParse(unitsPerCaseCtrl.text.trim());
                          final stockQuantity = int.tryParse(stockCtrl.text.trim()) ?? 0;
                          final lowStockAt = int.tryParse(lowStockCtrl.text.trim()) ?? 5;
                          final icon = iconCtrl.text.trim().isEmpty ? '🥤' : iconCtrl.text.trim();
                          final rawImg = imageUrlCtrl.text.trim();
                          final imageUrl = rawImg.isNotEmpty ? _cloudinaryRepo.getOptimizedUrl(rawImg) : null;

                          final id = isEdit ? product.id : 'prod_${DateTime.now().millisecondsSinceEpoch}';

                          final savedProduct = ProductModel(
                            id: id,
                            name: name.toUpperCase(),
                            categoryId: selectedCatId,
                            icon: icon,
                            imageUrl: imageUrl,
                            priceDineIn: priceDineIn,
                            priceTakeAway: priceTakeAway,
                            stockQuantity: stockQuantity,
                            unit: unit,
                            unitsPerCase: unitsPerCase,
                            trackStock: trackStock,
                            lowStockAt: lowStockAt,
                            sortOrder: product?.sortOrder ?? 1,
                            isActive: true,
                          );

                          await _productRepo.saveProduct(savedProduct);
                          if (ctx.mounted) Navigator.pop(ctx);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4338CA),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('LƯU MÓN', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản Lý Món Ăn & Đồ Uống'),
      ),
      floatingActionButton: StreamBuilder<List<CategoryModel>>(
        stream: _productRepo.getActiveCategoriesStream(),
        builder: (context, catSnap) {
          final categories = catSnap.data ?? [];
          return FloatingActionButton.extended(
            onPressed: () => _showProductForm(categories: categories),
            icon: const Icon(Icons.add),
            label: const Text('Thêm Món'),
            backgroundColor: const Color(0xFF4338CA),
            foregroundColor: Colors.white,
          );
        },
      ),
      body: StreamBuilder<List<CategoryModel>>(
        stream: _productRepo.getAllCategoriesStream(),
        builder: (context, catSnap) {
          final categories = catSnap.data ?? [];

          return StreamBuilder<List<ProductModel>>(
            stream: _productRepo.getAllProductsStream(),
            builder: (context, prodSnap) {
              final allProducts = prodSnap.data ?? [];

              if (allProducts.isEmpty) {
                return const Center(child: Text('Chưa có sản phẩm nào.'));
              }

              // GOM NHÓM THEO TỪNG DANH MỤC TRỰC QUAN (TASK-5.1)
              return ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                itemCount: categories.length + 1,
                itemBuilder: (context, catIdx) {
                  // Gom các món chưa có danh mục vào nhóm "KHÁC"
                  if (catIdx == categories.length) {
                    final otherProducts = allProducts.where((p) => !categories.any((c) => c.id == p.categoryId)).toList();
                    if (otherProducts.isEmpty) return const SizedBox.shrink();

                    return _buildCategorySection(
                      categoryName: 'MÓN KHÁC',
                      categoryIcon: '📁',
                      products: otherProducts,
                      categories: categories,
                    );
                  }

                  final cat = categories[catIdx];
                  final catProducts = allProducts.where((p) => p.categoryId == cat.id).toList();

                  return _buildCategorySection(
                    categoryName: cat.name,
                    categoryIcon: cat.icon,
                    products: catProducts,
                    categories: categories,
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildCategorySection({
    required String categoryName,
    required String categoryIcon,
    required List<ProductModel> products,
    required List<CategoryModel> categories,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              Text(categoryIcon, style: const TextStyle(fontSize: 22)),
              const SizedBox(width: 8),
              Text(
                categoryName,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${products.length} món',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                ),
              ),
            ],
          ),
        ),
        if (products.isEmpty)
          const Padding(
            padding: EdgeInsets.only(left: 8, bottom: 12),
            child: Text('Chưa có món nào trong nhóm này', style: TextStyle(color: Colors.grey)),
          )
        else
          ...products.map((p) => _buildProductItem(p, categories)),
        const Divider(height: 24, thickness: 1, color: Color(0xFFE2E8F0)),
      ],
    );
  }

  Widget _buildProductItem(ProductModel p, List<CategoryModel> categories) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: p.imageUrl != null && p.imageUrl!.isNotEmpty
            ? ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: p.imageUrl!,
                  width: 50,
                  height: 50,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Text(p.icon, style: const TextStyle(fontSize: 28)),
                ),
              )
            : Text(p.icon, style: const TextStyle(fontSize: 28)),
        title: Text(
          p.name,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: p.isActive ? Colors.black : Colors.grey,
            decoration: p.isActive ? null : TextDecoration.lineThrough,
          ),
        ),
        subtitle: Text(
          'Tại quán: ${MoneyFormat.formatVND(p.priceDineIn)} • Mang về: ${MoneyFormat.formatVND(p.priceTakeAway)}\n'
          'Tồn: ${p.stockQuantity} ${p.unit} ${p.unitsPerCase != null ? "(${p.unitsPerCase}/thùng)" : ""} • Quản lý kho: ${p.trackStock ? "Có" : "Không"}',
        ),
        isThreeLine: true,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.blue),
              onPressed: () => _showProductForm(product: p, categories: categories),
            ),
            if (p.isActive)
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                onPressed: () => _productRepo.softDeleteProduct(p.id),
              ),
          ],
        ),
      ),
    );
  }
}
