import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/category_model.dart';
import '../models/expense_category_model.dart';
import '../models/product_model.dart';

class ProductRepository {
  final FirebaseFirestore _firestore;

  ProductRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  // ================= CATEGORIES =================

  /// Stream danh mục đang hoạt động (cho POS và Admin)
  Stream<List<CategoryModel>> getActiveCategoriesStream() {
    return _firestore
        .collection('categories')
        .where('isActive', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs
          .map((doc) => CategoryModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
      return list;
    });
  }

  /// Stream toàn bộ danh mục cho Admin quản lý
  Stream<List<CategoryModel>> getAllCategoriesStream() {
    return _firestore
        .collection('categories')
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs
          .map((doc) => CategoryModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
      return list;
    });
  }

  /// Thêm hoặc cập nhật danh mục
  Future<void> saveCategory(CategoryModel category) async {
    final ref = _firestore.collection('categories').doc(category.id);
    await ref.set(category.toMap(), SetOptions(merge: true));
  }

  /// Xóa mềm danh mục
  Future<void> softDeleteCategory(String categoryId) async {
    await _firestore
        .collection('categories')
        .doc(categoryId)
        .update({'isActive': false});
  }

  // ================= PRODUCTS =================

  /// Stream danh sách sản phẩm đang bán (cho POS)
  Stream<List<ProductModel>> getActiveProductsStream({String? categoryId}) {
    Query query = _firestore
        .collection('products')
        .where('isActive', isEqualTo: true);

    if (categoryId != null && categoryId.isNotEmpty) {
      query = query.where('categoryId', isEqualTo: categoryId);
    }

    return query.snapshots().map((snapshot) {
      final list = snapshot.docs
          .map((doc) => ProductModel.fromMap(doc.data() as Map<String, dynamic>, doc.id))
          .toList();
      list.sort((a, b) {
        final catCompare = a.categoryId.compareTo(b.categoryId);
        if (catCompare != 0) return catCompare;
        return a.sortOrder.compareTo(b.sortOrder);
      });
      return list;
    });
  }

  /// Stream toàn bộ sản phẩm cho Admin
  Stream<List<ProductModel>> getAllProductsStream() {
    return _firestore.collection('products').snapshots().map((snapshot) {
      final list = snapshot.docs
          .map((doc) => ProductModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) {
        final catCompare = a.categoryId.compareTo(b.categoryId);
        if (catCompare != 0) return catCompare;
        return a.sortOrder.compareTo(b.sortOrder);
      });
      return list;
    });
  }

  /// Lấy 1 sản phẩm theo ID
  Future<ProductModel?> getProductById(String productId) async {
    final doc = await _firestore.collection('products').doc(productId).get();
    if (!doc.exists || doc.data() == null) return null;
    return ProductModel.fromMap(doc.data()!, doc.id);
  }

  /// Thêm hoặc cập nhật sản phẩm
  Future<void> saveProduct(ProductModel product) async {
    final ref = _firestore.collection('products').doc(product.id);
    final map = product.toMap();
    map['updatedAt'] = FieldValue.serverTimestamp();
    await ref.set(map, SetOptions(merge: true));
  }

  /// Xóa mềm sản phẩm
  Future<void> softDeleteProduct(String productId) async {
    await _firestore.collection('products').doc(productId).update({
      'isActive': false,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Cập nhật số lượng tồn kho trực tiếp
  Future<void> updateStockDirect(String productId, int newQuantity) async {
    await _firestore.collection('products').doc(productId).update({
      'stockQuantity': newQuantity,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  // ================= EXPENSE CATEGORIES =================

  /// Stream danh mục chi phí đồ dùng quán
  Stream<List<ExpenseCategoryModel>> getExpenseCategoriesStream() {
    return _firestore
        .collection('expense_categories')
        .where('isActive', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs
          .map((doc) => ExpenseCategoryModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
      return list;
    });
  }

  /// Thêm/sửa danh mục chi phí
  Future<void> saveExpenseCategory(ExpenseCategoryModel cat) async {
    final ref = _firestore.collection('expense_categories').doc(cat.id);
    await ref.set(cat.toMap(), SetOptions(merge: true));
  }

  // ================= SEED INITIAL DATA =================

  /// Nạp sẵn dữ liệu mẫu ban đầu nếu cơ sở dữ liệu trống
  Future<void> seedInitialDataIfEmpty() async {
    try {
      final catSnapshot = await _firestore.collection('categories').limit(1).get();
      if (catSnapshot.docs.isNotEmpty) {
        return; // Đã có dữ liệu, không ghi đè
      }

    final batch = _firestore.batch();

    // 1. Seed Categories
    final categories = [
      const CategoryModel(id: 'cat_tu_pha', name: 'NƯỚC TỰ PHA', icon: '☕', orderIndex: 1),
      const CategoryModel(id: 'cat_nuoc_ngot', name: 'NƯỚC NGỌT', icon: '🥫', orderIndex: 2),
      const CategoryModel(id: 'cat_mia_cam_dua', name: 'MÍA / CAM / DỪA', icon: '🎋', orderIndex: 3),
    ];
    for (final c in categories) {
      batch.set(_firestore.collection('categories').doc(c.id), c.toMap());
    }

    // 2. Seed Expense Categories
    final expCats = [
      const ExpenseCategoryModel(id: 'exp_da', name: 'Mua Đá Lạnh', orderIndex: 1),
      const ExpenseCategoryModel(id: 'exp_ly', name: 'Mua Ly / Ống Hút / Túi Xách', orderIndex: 2),
      const ExpenseCategoryModel(id: 'exp_chanh', name: 'Mua Chanh / Tắc / Đường', orderIndex: 3),
      const ExpenseCategoryModel(id: 'exp_khac', name: 'Chi Khác...', orderIndex: 4),
    ];
    for (final ec in expCats) {
      batch.set(_firestore.collection('expense_categories').doc(ec.id), ec.toMap());
    }

    // 3. Seed Sample Products
    final products = [
      const ProductModel(
        id: 'prod_cf_den',
        name: 'CÀ PHÊ ĐEN',
        categoryId: 'cat_tu_pha',
        icon: '☕',
        priceDineIn: 12000,
        priceTakeAway: 12000,
        unit: 'ly',
        trackStock: false,
        sortOrder: 1,
      ),
      const ProductModel(
        id: 'prod_cf_sua',
        name: 'CÀ PHÊ SỮA',
        categoryId: 'cat_tu_pha',
        icon: '🥛',
        priceDineIn: 15000,
        priceTakeAway: 15000,
        unit: 'ly',
        trackStock: false,
        sortOrder: 2,
      ),
      const ProductModel(
        id: 'prod_bac_xiu',
        name: 'BẠC XỈU',
        categoryId: 'cat_tu_pha',
        icon: '🥤',
        priceDineIn: 17000,
        priceTakeAway: 17000,
        unit: 'ly',
        trackStock: false,
        sortOrder: 3,
      ),
      const ProductModel(
        id: 'prod_sting_dau',
        name: 'STING DÂU',
        categoryId: 'cat_nuoc_ngot',
        icon: '🍓',
        priceDineIn: 12000,
        priceTakeAway: 12000,
        stockQuantity: 48,
        unit: 'lon',
        unitsPerCase: 24,
        trackStock: true,
        sortOrder: 1,
      ),
      const ProductModel(
        id: 'prod_coca',
        name: 'COCA COLA',
        categoryId: 'cat_nuoc_ngot',
        icon: '🥫',
        priceDineIn: 12000,
        priceTakeAway: 12000,
        stockQuantity: 36,
        unit: 'lon',
        unitsPerCase: 24,
        trackStock: true,
        sortOrder: 2,
      ),
      const ProductModel(
        id: 'prod_nuoc_mia',
        name: 'NƯỚC MÍA SIÊU SẠCH',
        categoryId: 'cat_mia_cam_dua',
        icon: '🎋',
        priceDineIn: 10000,
        priceTakeAway: 10000,
        unit: 'ly',
        trackStock: false,
        sortOrder: 1,
      ),
      const ProductModel(
        id: 'prod_cam_vat',
        name: 'CAM VẮT NGUYÊN CHẤT',
        categoryId: 'cat_mia_cam_dua',
        icon: '🍊',
        priceDineIn: 17000,
        priceTakeAway: 17000,
        unit: 'ly',
        trackStock: false,
        sortOrder: 2,
      ),
      const ProductModel(
        id: 'prod_trai_dua',
        name: 'TRÁI DỪA XIÊM',
        categoryId: 'cat_mia_cam_dua',
        icon: '🥥',
        priceDineIn: 20000,
        priceTakeAway: 20000,
        stockQuantity: 15,
        unit: 'trái',
        trackStock: true,
        sortOrder: 3,
      ),
    ];

    for (final p in products) {
      final map = p.toMap();
      map['updatedAt'] = FieldValue.serverTimestamp();
      batch.set(_firestore.collection('products').doc(p.id), map);
    }

    await batch.commit();
    } catch (_) {
      // Bỏ qua ngoại lệ an toàn nếu mạng offline hoặc chưa đăng nhập
    }
  }
}
