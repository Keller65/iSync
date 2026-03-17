import { Switch, Text, TouchableOpacity, View } from 'react-native';

export type SettingItemProps = BaseProps & (ToggleProps | ActionProps | InfoProps);

interface BaseProps {
  title: string;
  subtitle?: string;
  iconLeft?: React.ReactNode;
  rightContent?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  testID?: string;
}

interface ToggleProps {
  kind: 'toggle';
  value: boolean;
  onChange: (v: boolean) => void;
}

interface ActionProps {
  kind: 'action';
  onPress: () => void | Promise<void>;
}

interface InfoProps {
  kind: 'info';
}

export const SettingItem: React.FC<SettingItemProps> = (p) => {
  const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (p.kind === 'action') {
      return (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.6}
            disabled={p.disabled}
          onPress={p.onPress}
          testID={p.testID}
          className={`flex-row items-center py-3 ${p.disabled ? 'opacity-50' : ''}`}
        >
          {children}
        </TouchableOpacity>
      );
    }
    return (
      <View className={`flex-row items-center py-3 ${p.disabled ? 'opacity-50' : ''}`} testID={p.testID}>
        {children}
      </View>
    );
  };

  return (
    <Container>
      {p.iconLeft}
      <View className="flex-1">
        <Text className={`font-[Poppins-SemiBold] text-sm tracking-[-0.3px] ${p.danger ? 'text-red-600' : 'text-gray-800'}`}>{p.title}</Text>
        {!!p.subtitle && (
          <Text className="text-[11px] text-gray-500 font-[Poppins-Regular] tracking-[-0.2px]" numberOfLines={2}>{p.subtitle}</Text>
        )}
      </View>
      {p.kind === 'toggle' && (
        <Switch
          value={p.value}
          onValueChange={(v) => p.onChange(v)}
        />
      )}
      {p.kind !== 'toggle' && p.rightContent}
    </Container>
  );
};

export const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View className="mb-5">
    <Text className="text-xs font-[Poppins-SemiBold] text-gray-500 mb-1 uppercase tracking-wider">{title}</Text>
    <View className="bg-white rounded-2xl px-4 divide-y divide-gray-100">
      {children}
    </View>
  </View>
);

export default SettingItem;
