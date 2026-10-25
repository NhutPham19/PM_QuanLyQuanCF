enum ExpenseType { restock, supplies, other }

class ExpenseModel {
  final String id;
  final ExpenseType expenseType;
  final String categoryName;
  final String? productId;
  final String? productName;
  final int? quantity;
  final int amount;
  final String? note;
  final String dateString;
  final String monthString;
  final DateTime createdAt;
  final String createdBy;

  const ExpenseModel({
    required this.id,
    required this.expenseType,
    required this.categoryName,
    this.productId,
    this.productName,
    this.quantity,
    required this.amount,
    this.note,
    required this.dateString,
    required this.monthString,
    required this.createdAt,
    required this.createdBy,
  });

  factory ExpenseModel.fromMap(Map<String, dynamic> map, String docId) {
    ExpenseType parseType(String? t) {
      if (t == 'RESTOCK') return ExpenseType.restock;
      if (t == 'SUPPLIES') return ExpenseType.supplies;
      return ExpenseType.other;
    }

    return ExpenseModel(
      id: docId,
      expenseType: parseType(map['expenseType'] as String?),
      categoryName: (map['categoryName'] as String?) ?? 'Chi phí',
      productId: map['productId'] as String?,
      productName: map['productName'] as String?,
      quantity: (map['quantity'] as num?)?.toInt(),
      amount: (map['amount'] as num?)?.toInt() ?? 0,
      note: map['note'] as String?,
      dateString: (map['dateString'] as String?) ?? '',
      monthString: (map['monthString'] as String?) ?? '',
      createdAt: map['createdAt'] != null ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now() : DateTime.now(),
      createdBy: (map['createdBy'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    String typeString() {
      switch (expenseType) {
        case ExpenseType.restock:
          return 'RESTOCK';
        case ExpenseType.supplies:
          return 'SUPPLIES';
        case ExpenseType.other:
          return 'OTHER';
      }
    }

    return {
      'expenseType': typeString(),
      'categoryName': categoryName,
      'productId': productId,
      'productName': productName,
      'quantity': quantity,
      'amount': amount,
      'note': note,
      'dateString': dateString,
      'monthString': monthString,
      'createdBy': createdBy,
    };
  }
}
