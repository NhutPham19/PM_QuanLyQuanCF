enum OrderType { dineIn, takeAway }
enum OrderStatus { active, voided }

class OrderItemModel {
  final String productId;
  final String name;
  final String icon;
  final int price;
  final int quantity;
  final int subtotal;
  final bool trackStock;

  const OrderItemModel({
    required this.productId,
    required this.name,
    this.icon = '🥤',
    required this.price,
    required this.quantity,
    required this.subtotal,
    this.trackStock = true,
  });

  factory OrderItemModel.fromMap(Map<String, dynamic> map) {
    return OrderItemModel(
      productId: (map['productId'] as String?) ?? '',
      name: (map['name'] as String?) ?? 'MÓN',
      icon: (map['icon'] as String?) ?? '🥤',
      price: (map['price'] as num?)?.toInt() ?? 0,
      quantity: (map['quantity'] as num?)?.toInt() ?? 1,
      subtotal: (map['subtotal'] as num?)?.toInt() ?? 0,
      trackStock: (map['trackStock'] as bool?) ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'productId': productId,
      'name': name,
      'icon': icon,
      'price': price,
      'quantity': quantity,
      'subtotal': subtotal,
      'trackStock': trackStock,
    };
  }
}

class OrderModel {
  final String id;
  final OrderType orderType;
  final List<OrderItemModel> items;
  final int totalAmount;
  final OrderStatus status;
  final DateTime? voidedAt;
  final String? voidedBy;
  final String dateString;
  final String monthString;
  final DateTime createdAt;
  final String createdBy;

  const OrderModel({
    required this.id,
    required this.orderType,
    required this.items,
    required this.totalAmount,
    this.status = OrderStatus.active,
    this.voidedAt,
    this.voidedBy,
    required this.dateString,
    required this.monthString,
    required this.createdAt,
    required this.createdBy,
  });

  factory OrderModel.fromMap(Map<String, dynamic> map, String docId) {
    final rawItems = (map['items'] as List<dynamic>?) ?? [];
    final itemsList = rawItems
        .map((item) => OrderItemModel.fromMap(item as Map<String, dynamic>))
        .toList();

    return OrderModel(
      id: docId,
      orderType: (map['orderType'] == 'TAKE_AWAY') ? OrderType.takeAway : OrderType.dineIn,
      items: itemsList,
      totalAmount: (map['totalAmount'] as num?)?.toInt() ?? 0,
      status: (map['status'] == 'VOIDED') ? OrderStatus.voided : OrderStatus.active,
      voidedAt: map['voidedAt'] != null ? DateTime.tryParse(map['voidedAt'].toString()) : null,
      voidedBy: map['voidedBy'] as String?,
      dateString: (map['dateString'] as String?) ?? '',
      monthString: (map['monthString'] as String?) ?? '',
      createdAt: map['createdAt'] != null ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now() : DateTime.now(),
      createdBy: (map['createdBy'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'orderType': orderType == OrderType.takeAway ? 'TAKE_AWAY' : 'DINE_IN',
      'items': items.map((i) => i.toMap()).toList(),
      'totalAmount': totalAmount,
      'status': status == OrderStatus.voided ? 'VOIDED' : 'ACTIVE',
      'voidedAt': voidedAt?.toIso8601String(),
      'voidedBy': voidedBy,
      'dateString': dateString,
      'monthString': monthString,
      'createdBy': createdBy,
    };
  }
}
