import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { usePOSAmount } from '@/hooks/usePosPrice';

interface POSDiscountInputProps {
  onAmountChange?: (value: number) => void;
  maxAmount?: number;
  disabled?: boolean;
}

const POSDiscountInput: React.FC<POSDiscountInputProps> = ({
  onAmountChange,
  maxAmount = 200,
  disabled = false,
}) => {
  const {
    displayAmount,
    rawDigits,
    inputRef,
    handleChangeText,
    focusInput,
    numericValue,
    rawLength,
  } = usePOSAmount(maxAmount);

  const handleTextChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 5);

    // Convertimos a número tipo POS (ej: 20000 → 200.00)
    const value = parseInt(clean || '0', 10) / 100;

    // Clamp al máximo permitido
    if (value > maxAmount) {
      const maxRaw = Math.round(maxAmount * 100).toString();
      handleChangeText(maxRaw);
      return;
    }

    handleChangeText(clean);
  };

  useEffect(() => {
    if (onAmountChange) {
      onAmountChange(numericValue);
    }
  }, [numericValue]);

  const renderDigits = () => {
    const chars = displayAmount.split('');
    const activeIndices: number[] = [];

    // Formato "000.00" → índices 0,1,2 = enteros, 3 = punto, 4,5 = decimales
    if (rawLength >= 1) activeIndices.push(5);
    if (rawLength >= 2) activeIndices.push(4);
    if (rawLength >= 3) activeIndices.push(2);
    if (rawLength >= 4) activeIndices.push(1);
    if (rawLength >= 5) activeIndices.push(0);

    return chars.map((char, index) => {
      const isPoint = char === '.';
      const isActive =
        activeIndices.includes(index) || (isPoint && rawLength >= 3);

      return (
        <Text
          key={index}
          style={[styles.amountText, !isActive && styles.inactiveDigit]}
        >
          {char}
        </Text>
      );
    });
  };

  return (
    <View style={[styles.container, disabled && styles.disabledContainer]}>
      <TouchableOpacity style={styles.displayArea} onPress={disabled ? undefined : focusInput} disabled={disabled}>
        <View style={styles.amountWrapper}>
          {renderDigits().map((digit, i) =>
            disabled ? <Text key={i} style={styles.disabledDigit}>{digit.props.children}</Text> : digit
          )}
        </View>
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        keyboardType="number-pad"
        value={rawDigits}
        onChangeText={handleTextChange}
        autoFocus={false}
        caretHidden
        contextMenuHidden
        editable={!disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayArea: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginTop: 4,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Poppins-Bold',
    lineHeight: 30,
  },
  inactiveDigit: {
    color: '#000000',
  },
  disabledContainer: {
    opacity: 0.4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  disabledDigit: {
    fontSize: 18,
    color: '#9ca3af',
    fontFamily: 'Poppins-Bold',
    lineHeight: 30,
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default POSDiscountInput;
