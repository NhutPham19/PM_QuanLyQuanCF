// File generated for pm-quanlyquancf
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Cấu hình Firebase mặc định cho cả 2 nền tảng:
/// - Android: Ứng dụng POS cho Ba Mẹ
/// - Web: Ứng dụng Quản trị Admin cho Con trên Safari iPhone
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyD8oykL4CBRYnfnRbheKF279nlPmuX3dLw',
    appId: '1:588131334524:web:05eb9656cf1da5a6a68cf9',
    messagingSenderId: '588131334524',
    projectId: 'pm-quanlyquancf',
    authDomain: 'pm-quanlyquancf.firebaseapp.com',
    storageBucket: 'pm-quanlyquancf.firebasestorage.app',
    measurementId: 'G-QLD6FXG4XF',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAFI_w2bJsHwL_gIhNrd_CBoQ-Fx3A8u5M',
    appId: '1:588131334524:android:06843627d445cb11a68cf9',
    messagingSenderId: '588131334524',
    projectId: 'pm-quanlyquancf',
    storageBucket: 'pm-quanlyquancf.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyD8oykL4CBRYnfnRbheKF279nlPmuX3dLw',
    appId: '1:588131334524:web:05eb9656cf1da5a6a68cf9',
    messagingSenderId: '588131334524',
    projectId: 'pm-quanlyquancf',
    authDomain: 'pm-quanlyquancf.firebaseapp.com',
    storageBucket: 'pm-quanlyquancf.firebasestorage.app',
  );
}
