import 'package:flutter/material.dart';
import '../../data/models/category_model.dart';
import '../../data/models/expense_category_model.dart';
import '../../data/repositories/product_repository.dart';

class CategoryManagerScreen extends StatefulWidget {
  const CategoryManagerScreen({super.key});

  @override
  State<CategoryManagerScreen> createState() => _CategoryManagerScreenState();
}

class _CategoryManagerScreenState extends State<CategoryManagerScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _productRepo = ProductRepository();

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

  void _showCategoryDialog({CategoryModel? category}) {
    final isEdit = category != null;
    final nameController = TextEditingController(text: category?.name ?? '');
    final iconController = TextEditingController(text: category?.icon ?? '🥤');
    final orderController = TextEditingController(text: (category?.orderIndex ?? 1).toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isEdit ? 'Sửa Danh Mục' : 'Thêm Danh Mục Món'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Tên danh mục (ví dụ: NƯỚC NGỌT)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: iconController,
              decoration: const InputDecoration(labelText: 'Biểu tượng Emoji (ví dụ: 🥫)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: orderController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Thứ tự hiển thị (1, 2, 3...)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = nameController.text.trim();
              if (name.isEmpty) return;

              final orderIndex = int.tryParse(orderController.text.trim()) ?? 1;
              final icon = iconController.text.trim().isEmpty ? '🥤' : iconController.text.trim();
              final id = isEdit ? category.id : 'cat_${DateTime.now().millisecondsSinceEpoch}';

              final newCategory = CategoryModel(
                id: id,
                name: name.toUpperCase(),
                icon: icon,
                orderIndex: orderIndex,
                isActive: true,
              );

              await _productRepo.saveCategory(newCategory);
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  void _showExpenseCategoryDialog({ExpenseCategoryModel? category}) {
    final isEdit = category != null;
    final nameController = TextEditingController(text: category?.name ?? '');
    final orderController = TextEditingController(text: (category?.orderIndex ?? 1).toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isEdit ? 'Sửa Loại Chi Phí' : 'Thêm Loại Chi Phí Quán'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Tên loại chi (ví dụ: Mua Đá Lạnh)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: orderController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Thứ tự hiển thị'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = nameController.text.trim();
              if (name.isEmpty) return;

              final orderIndex = int.tryParse(orderController.text.trim()) ?? 1;
              final id = isEdit ? category.id : 'exp_${DateTime.now().millisecondsSinceEpoch}';

              final newCat = ExpenseCategoryModel(
                id: id,
                name: name,
                orderIndex: orderIndex,
                isActive: true,
              );

              await _productRepo.saveExpenseCategory(newCat);
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản Lý Danh Mục & Loại Chi'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Danh Mục Món Ăn'),
            Tab(text: 'Loại Chi Phí Quán'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          if (_tabController.index == 0) {
            _showCategoryDialog();
          } else {
            _showExpenseCategoryDialog();
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('Thêm Mới'),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: DANH MỤC MÓN
          StreamBuilder<List<CategoryModel>>(
            stream: _productRepo.getAllCategoriesStream(),
            builder: (context, snapshot) {
              final list = snapshot.data ?? [];
              if (list.isEmpty) {
                return const Center(child: Text('Chưa có danh mục món nào.'));
              }

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final cat = list[index];
                  return Card(
                    child: ListTile(
                      leading: Text(cat.icon, style: const TextStyle(fontSize: 28)),
                      title: Text(
                        cat.name,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          decoration: cat.isActive ? null : TextDecoration.lineThrough,
                          color: cat.isActive ? Colors.black : Colors.grey,
                        ),
                      ),
                      subtitle: Text('Thứ tự: ${cat.orderIndex} • Trạng thái: ${cat.isActive ? "Đang bán" : "Đã ẩn"}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blue),
                            onPressed: () => _showCategoryDialog(category: cat),
                          ),
                          if (cat.isActive)
                            IconButton(
                              icon: const Icon(Icons.visibility_off, color: Colors.orange),
                              onPressed: () => _productRepo.softDeleteCategory(cat.id),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),

          // TAB 2: LOẠI CHI PHÍ
          StreamBuilder<List<ExpenseCategoryModel>>(
            stream: _productRepo.getExpenseCategoriesStream(),
            builder: (context, snapshot) {
              final list = snapshot.data ?? [];
              if (list.isEmpty) {
                return const Center(child: Text('Chưa có loại chi phí nào.'));
              }

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final cat = list[index];
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.shopping_bag_outlined, color: Colors.deepOrange),
                      title: Text(cat.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Thứ tự: ${cat.orderIndex}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        onPressed: () => _showExpenseCategoryDialog(category: cat),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}
