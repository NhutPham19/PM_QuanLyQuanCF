class ExpenseCategoryModel {
  final String id;
  final String name;
  final int orderIndex;
  final bool isActive;

  const ExpenseCategoryModel({
    required this.id,
    required this.name,
    this.orderIndex = 1,
    this.isActive = true,
  });

  factory ExpenseCategoryModel.fromMap(Map<String, dynamic> map, String docId) {
    return ExpenseCategoryModel(
      id: docId,
      name: (map['name'] as String?)?.trim() ?? 'LOẠI CHI PHÍ',
      orderIndex: (map['orderIndex'] as num?)?.toInt() ?? 1,
      isActive: (map['isActive'] as bool?) ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'orderIndex': orderIndex,
      'isActive': isActive,
    };
  }

  ExpenseCategoryModel copyWith({
    String? id,
    String? name,
    int? orderIndex,
    bool? isActive,
  }) {
    return ExpenseCategoryModel(
      id: id ?? this.id,
      name: name ?? this.name,
      orderIndex: orderIndex ?? this.orderIndex,
      isActive: isActive ?? this.isActive,
    );
  }
}
