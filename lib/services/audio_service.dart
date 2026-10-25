import 'package:flutter/services.dart';
import 'package:audioplayers/audioplayers.dart';

class AudioService {
  static final AudioService _instance = AudioService._internal();
  factory AudioService() => _instance;
  AudioService._internal();

  AudioPlayer? _beepPlayer;
  AudioPlayer? _successPlayer;

  void init() {
    try {
      _beepPlayer = AudioPlayer()..setReleaseMode(ReleaseMode.stop);
      _successPlayer = AudioPlayer()..setReleaseMode(ReleaseMode.stop);
    } catch (_) {
      // Bỏ qua lỗi nếu thiết bị không hỗ trợ audio
    }
  }

  /// Phát tiếng "Tít" khi chạm chọn món + Rung nhẹ
  Future<void> playBeep() async {
    HapticFeedback.lightImpact();
    try {
      if (_beepPlayer != null) {
        await _beepPlayer!.stop();
        await _beepPlayer!.play(AssetSource('sounds/beep.mp3'), mode: PlayerMode.lowLatency);
      } else {
        SystemSound.play(SystemSoundType.click);
      }
    } catch (_) {
      SystemSound.play(SystemSoundType.click);
    }
  }

  /// Phát tiếng "Ting" ngân vang khi lưu đơn thành công + Rung vừa
  Future<void> playSuccess() async {
    HapticFeedback.mediumImpact();
    try {
      if (_successPlayer != null) {
        await _successPlayer!.stop();
        await _successPlayer!.play(AssetSource('sounds/success.mp3'), mode: PlayerMode.lowLatency);
      } else {
        SystemSound.play(SystemSoundType.alert);
      }
    } catch (_) {
      SystemSound.play(SystemSoundType.alert);
    }
  }

  void dispose() {
    _beepPlayer?.dispose();
    _successPlayer?.dispose();
  }
}
