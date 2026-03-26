import { useState, useRef } from 'react';
import { TextInput } from 'react-native';

interface UsePOSAmountReturn {
  displayAmount: string;
  rawDigits: string;
  inputRef: React.RefObject<TextInput | null>;
  handleChangeText: (text: string) => void;
  focusInput: () => void;
  reset: () => void;
  numericValue: number;
  rawLength: number;
}

export const usePOSAmount = (maxPercent: number = 99.99): UsePOSAmountReturn => {
  const [displayAmount, setDisplayAmount] = useState<string>('000.00');
  const [rawDigits, setRawDigits] = useState<string>('');
  const [rawLength, setRawLength] = useState<number>(0);
  const inputRef = useRef<TextInput>(null);

  const formatCurrency = (digits: string): string => {
    const numberValue = parseInt(digits, 10);
    if (isNaN(numberValue) || numberValue === 0) return '000.00';

    const value = numberValue / 100;
    const finalValue = value > maxPercent ? maxPercent : value;

    return finalValue.toFixed(2).padStart(6, '0');
  };

  const handleChangeText = (text: string): void => {
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly.length > 5) return;

    setRawDigits(digitsOnly);
    setRawLength(digitsOnly.length);
    setDisplayAmount(formatCurrency(digitsOnly));
  };

  const reset = (): void => {
    setDisplayAmount('000.00');
    setRawDigits('');
    setRawLength(0);
  };

  const focusInput = () => inputRef.current?.focus();

  return {
    displayAmount,
    rawDigits,
    inputRef,
    handleChangeText,
    focusInput,
    reset,
    numericValue: parseFloat(displayAmount),
    rawLength
  };
};