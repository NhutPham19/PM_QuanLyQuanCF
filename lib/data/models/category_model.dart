class CategoryModel {
  final String id;
  final String name;
  final String icon;
  final int orderIndex;
  final bool isActive;

  const CategoryModel({
    required this.id,
    required this.name,
    this.icon = '☕',
    this.orderIndex = 1,
    this.isActive = true,
  });

  factory CategoryModel.fromMap(Map<String, dynamic> map, String docId) {
    return CategoryModel(
      id: docId,
      name: (map['name'] as String?)?.trim() ?? 'DANH MỤC',
      icon: (map['icon'] as String?)?.trim() ?? '☕',
      orderIndex: (map['orderIndex'] as num?)?.toInt() ?? 1,
      isActive: (map['isActive'] as bool?) ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'icon': icon,
      'orderIndex': orderIndex,
      'isActive': isActive,
    };
  }

  CategoryModel copyWith({
    String? id,
    String? name,
    String? icon,
    int? orderIndex,
    bool? isActive,
  }) {
    return CategoryModel(
      id: id ?? this.id,
      name: name ?? this.name,
      icon: icon ?? this.icon,
      orderIndex: orderIndex ?? this.orderIndex,
      isActive: isActive ?? this.isActive,
    );
  }
}
