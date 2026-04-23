import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import React, { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

export type ModalBottomSheetProps = {
  /** Snap points (e.g. [320] or [0.35 * height]). Controls sheet height. */
  snapPoints: (string | number)[];
  /** Content rendered inside the sheet. */
  children: React.ReactNode;
  /** Called when the sheet is closed (backdrop tap or pan down). */
  onClose?: () => void;
  /** Whether user can drag the sheet down to close. Default true. */
  enablePanDownToClose?: boolean;
  /** Optional style overrides for the sheet background. */
  backgroundStyle?: object;
  /** Optional style overrides for the handle indicator. */
  handleIndicatorStyle?: object;
};

/**
 * Reusable bottom sheet wrapper for auth and non-auth flows.
 * Parent controls open/close via ref (e.g. ref.current?.snapToIndex(0) to open, ref.current?.close() to close).
 * Pass different snapPoints and children per screen for flexible height and content.
 */
const ModalBottomSheet = forwardRef<BottomSheet, ModalBottomSheetProps>(
  function ModalBottomSheet(
    {
      snapPoints,
      children,
      onClose,
      enablePanDownToClose = true,
      backgroundStyle,
      handleIndicatorStyle,
    },
    ref
  ) {
    return (
      <BottomSheet
        ref={ref}
        index={-1}
        animateOnMount={false}
        enableDynamicSizing={false}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        onClose={onClose}
        style={styles.sheet}
        backgroundStyle={[styles.background, backgroundStyle]}
        handleIndicatorStyle={[styles.handle, handleIndicatorStyle]}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
            opacity={0.85}
          />
        )}>
        <View style={styles.content}>{children}</View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheet: {
    zIndex: 1000,
    elevation: 1000,
  },
  background: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  handle: {
    width: 40,
    backgroundColor: colors.sheetHandle,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
});

export default ModalBottomSheet;
