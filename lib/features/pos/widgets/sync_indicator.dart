import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/constants/app_colors.dart';

class SyncIndicator extends StatelessWidget {
  const SyncIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    // Lắng nghe snapshot metadata của collection daily_summaries để biết có pending writes không
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('daily_summaries').limit(1).snapshots(includeMetadataChanges: true),
      builder: (context, snapshot) {
        final hasPending = snapshot.hasData && snapshot.data!.metadata.hasPendingWrites;

        if (hasPending) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.syncPendingBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.syncPendingText, width: 1.5),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '⏳',
                  style: TextStyle(fontSize: 14),
                ),
                SizedBox(width: 6),
                Text(
                  'Đang chờ mạng',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.syncPendingText,
                  ),
                ),
              ],
            ),
          );
        }

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.syncSuccessBg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.syncSuccessText, width: 1.5),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '✔',
                style: TextStyle(fontSize: 14, color: AppColors.syncSuccessText, fontWeight: FontWeight.bold),
              ),
              SizedBox(width: 6),
              Text(
                'Đã lưu lên mạng',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.syncSuccessText,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
