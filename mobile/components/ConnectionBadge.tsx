import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ConnectionStatus } from '../constants/types';

interface Props {
  status: ConnectionStatus;
}

const LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Connecting…',
  connected: 'Live',
  disconnected: 'Offline',
};

const COLOR: Record<ConnectionStatus, string> = {
  connecting: '#F59E0B',
  connected: '#10B981',
  disconnected: '#EF4444',
};

export default function ConnectionBadge({ status }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'connected') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    pulse.setValue(1);
  }, [status]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: COLOR[status], opacity: status === 'connected' ? pulse : 1 },
        ]}
      />
      <Text style={[styles.label, { color: COLOR[status] }]}>{LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
