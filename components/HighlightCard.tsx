import React from 'react';
import { Text, View } from 'react-native';

interface HighlightCardProps {
  total: number;
  name: string;
  period: string;
  percent: number;
  diff: number;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  total,
  name,
  period,
  percent,
  diff,
}) => {
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-4 min-w-[260px] shadow-sm">
      <View className="flex-row justify-between items-start">
        <Text className="text-gray-500 text-[15px] font-['Poppins-Regular']">
          {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Text className="text-green-700 text-[18px] font-['Poppins-Bold']">▲</Text>
      </View>
      <Text className="text-[22px] font-bold text-gray-900 mt-0.5 font-['Poppins-SemiBold']">
        {name}
      </Text>
      <Text className="text-gray-400 text-[15px] mb-2 font-['Poppins-Regular']">
        {period}
      </Text>
      <View className="flex-row items-center mb-0.5">
        <Text className="text-green-700 text-[16px] mr-1 font-['Poppins-Medium']">
          +{percent.toFixed(2)} %
        </Text>
      </View>
      <Text className="text-green-700 text-[28px] mt-0 font-['Poppins-Bold']">
        +{diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
};

export default HighlightCard;
