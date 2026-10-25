class ProductModel {
  final String id;
  final String name;
  final String categoryId;
  final String icon;
  final String? imageUrl;
  final int priceDineIn;
  final int priceTakeAway;
  final int stockQuantity;
  final String unit;
  final int? unitsPerCase;
  final bool trackStock; // false cho món bán lẻ như Điếu thuốc Jet
  final int lowStockAt;
  final int sortOrder;
  final bool isActive;
  final DateTime? updatedAt;

  const ProductModel({
    required this.id,
    required this.name,
    required this.categoryId,
    this.icon = '🥤',
    this.imageUrl,
    required this.priceDineIn,
    required this.priceTakeAway,
    this.stockQuantity = 0,
    this.unit = 'ly',
    this.unitsPerCase,
    this.trackStock = true,
    this.lowStockAt = 5,
    this.sortOrder = 1,
    this.isActive = true,
    this.updatedAt,
  });

  /// Lấy đơn giá theo chế độ bán (Tại quán vs Mang về)
  int getPrice({required bool isDineIn}) {
    return isDineIn ? priceDineIn : priceTakeAway;
  }

  factory ProductModel.fromMap(Map<String, dynamic> map, String docId) {
    return ProductModel(
      id: docId,
      name: (map['name'] as String?)?.trim() ?? 'SẢN PHẨM',
      categoryId: (map['categoryId'] as String?)?.trim() ?? '',
      icon: (map['icon'] as String?)?.trim() ?? '🥤',
      imageUrl: map['imageUrl'] as String?,
      priceDineIn: (map['priceDineIn'] as num?)?.toInt() ?? 0,
      priceTakeAway: (map['priceTakeAway'] as num?)?.toInt() ?? 0,
      stockQuantity: (map['stockQuantity'] as num?)?.toInt() ?? 0,
      unit: (map['unit'] as String?)?.trim() ?? 'ly',
      unitsPerCase: (map['unitsPerCase'] as num?)?.toInt(),
      trackStock: (map['trackStock'] as bool?) ?? true,
      lowStockAt: (map['lowStockAt'] as num?)?.toInt() ?? 5,
      sortOrder: (map['sortOrder'] as num?)?.toInt() ?? 1,
      isActive: (map['isActive'] as bool?) ?? true,
      updatedAt: map['updatedAt'] != null ? DateTime.tryParse(map['updatedAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'categoryId': categoryId,
      'icon': icon,
      'imageUrl': imageUrl,
      'priceDineIn': priceDineIn,
      'priceTakeAway': priceTakeAway,
      'stockQuantity': stockQuantity,
      'unit': unit,
      'unitsPerCase': unitsPerCase,
      'trackStock': trackStock,
      'lowStockAt': lowStockAt,
      'sortOrder': sortOrder,
      'isActive': isActive,
    };
  }

  ProductModel copyWith({
    String? id,
    String? name,
    String? categoryId,
    String? icon,
    String? imageUrl,
    int? priceDineIn,
    int? priceTakeAway,
    int? stockQuantity,
    String? unit,
    int? unitsPerCase,
    bool? trackStock,
    int? lowStockAt,
    int? sortOrder,
    bool? isActive,
    DateTime? updatedAt,
  }) {
    return ProductModel(
      id: id ?? this.id,
      name: name ?? this.name,
      categoryId: categoryId ?? this.categoryId,
      icon: icon ?? this.icon,
      imageUrl: imageUrl ?? this.imageUrl,
      priceDineIn: priceDineIn ?? this.priceDineIn,
      priceTakeAway: priceTakeAway ?? this.priceTakeAway,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      unit: unit ?? this.unit,
      unitsPerCase: unitsPerCase ?? this.unitsPerCase,
      trackStock: trackStock ?? this.trackStock,
      lowStockAt: lowStockAt ?? this.lowStockAt,
      sortOrder: sortOrder ?? this.sortOrder,
      isActive: isActive ?? this.isActive,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
