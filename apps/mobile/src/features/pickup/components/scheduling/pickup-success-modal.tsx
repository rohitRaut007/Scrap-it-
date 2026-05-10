import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAppTheme } from "@/lib/theme";

export interface PickupSuccessModalProps {
  visible: boolean;
  pickupCode: string;
  onTrack: () => void;
}

const springIn = {
  damping: 20,
  stiffness: 260,
  mass: 0.85,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
} as const;

export function PickupSuccessModal({
  visible,
  pickupCode,
  onTrack,
}: PickupSuccessModalProps) {
  const { colors } = useAppTheme();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardTranslateY = useRef(new Animated.Value(28)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      cardTranslateY.setValue(28);
      iconScale.setValue(0);
      iconRotate.setValue(0);
      contentOpacity.setValue(0);
      contentTranslateY.setValue(12);
      buttonOpacity.setValue(0);
      buttonTranslateY.setValue(10);
      return;
    }

    const entrance = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(45),
        Animated.parallel([
          Animated.spring(cardScale, { toValue: 1, ...springIn, useNativeDriver: true }),
          Animated.spring(cardTranslateY, {
            toValue: 0,
            damping: 22,
            stiffness: 240,
            mass: 0.9,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(160),
        Animated.parallel([
          Animated.spring(iconScale, {
            toValue: 1,
            damping: 14,
            stiffness: 320,
            mass: 0.55,
            useNativeDriver: true,
          }),
          Animated.timing(iconRotate, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(contentTranslateY, {
            toValue: 0,
            damping: 24,
            stiffness: 220,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(320),
        Animated.parallel([
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(buttonTranslateY, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    entrance.start();
    return () => {
      entrance.stop();
    };
  }, [
    visible,
    backdropOpacity,
    buttonOpacity,
    buttonTranslateY,
    cardOpacity,
    cardScale,
    cardTranslateY,
    contentOpacity,
    contentTranslateY,
    iconRotate,
    iconScale,
  ]);

  const iconSpin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-18deg", "0deg"],
  });

  const backdropStyle: ViewStyle = {
    opacity: backdropOpacity,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  };

  const cardAnimatedStyle = {
    opacity: cardOpacity,
    transform: [
      { translateY: cardTranslateY },
      { scale: cardScale },
    ],
  };

  const iconWrapStyle = {
    transform: [{ scale: iconScale }, { rotate: iconSpin }],
  };

  const contentBlockStyle = {
    opacity: contentOpacity,
    transform: [{ translateY: contentTranslateY }],
  };

  const buttonWrapStyle = {
    opacity: buttonOpacity,
    transform: [{ translateY: buttonTranslateY }],
    alignSelf: "stretch" as const,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onTrack}
    >
      <View className="flex-1 justify-center px-6">
        <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]} />
        <View className="items-center" pointerEvents="box-none">
          <Animated.View style={cardAnimatedStyle}>
            <View className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lg shadow-black/20 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40">
              <View className="items-center">
                <Animated.View style={iconWrapStyle} className="mb-4">
                  <View className="size-16 items-center justify-center rounded-full bg-primary/15 dark:bg-emerald-400/15">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                </Animated.View>

                <Animated.View style={contentBlockStyle} className="items-center">
                  <Text variant="subtitle" className="mb-2 text-center">
                    Pickup scheduled!
                  </Text>
                  <Text
                    variant="muted"
                    className="mb-6 text-center text-[14px] leading-relaxed"
                  >
                    Your pickup{" "}
                    <Text className="font-semibold text-foreground dark:text-neutral-100">
                      #{pickupCode}
                    </Text>{" "}
                    has been confirmed. We&apos;ll notify you when the driver is
                    on the way.
                  </Text>
                </Animated.View>

                <Animated.View style={buttonWrapStyle}>
                  <Button className="w-full rounded-full" onPress={onTrack}>
                    Track pickup
                  </Button>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
