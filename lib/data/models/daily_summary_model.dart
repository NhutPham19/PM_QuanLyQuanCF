class DailySummaryModel {
  final String dateString; // YYYY-MM-DD
  final int totalRevenue;
  final int totalExpense;
  final int totalOrders;
  final String monthString; // YYYY-MM
  final DateTime? lastUpdated;

  const DailySummaryModel({
    required this.dateString,
    this.totalRevenue = 0,
    this.totalExpense = 0,
    this.totalOrders = 0,
    required this.monthString,
    this.lastUpdated,
  });

  /// Dòng tiền còn lại (Bán - Chi)
  int get netCash => totalRevenue - totalExpense;

  factory DailySummaryModel.fromMap(Map<String, dynamic> map, String docId) {
    return DailySummaryModel(
      dateString: docId,
      totalRevenue: (map['totalRevenue'] as num?)?.toInt() ?? 0,
      totalExpense: (map['totalExpense'] as num?)?.toInt() ?? 0,
      totalOrders: (map['totalOrders'] as num?)?.toInt() ?? 0,
      monthString: (map['monthString'] as String?) ?? '',
      lastUpdated: map['lastUpdated'] != null ? DateTime.tryParse(map['lastUpdated'].toString()) : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'totalRevenue': totalRevenue,
      'totalExpense': totalExpense,
      'totalOrders': totalOrders,
      'dateString': dateString,
      'monthString': monthString,
    };
  }
}
