import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface TabBarProps {
  tabs: string[];
  activeTab: number;
  onTabPress: (index: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.tab, activeTab === index && styles.activeTab]}
          onPress={() => onTabPress(index)}
          activeOpacity={0.8}>
          <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    padding: 4,
    ...SHADOWS.LIGHT,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.PADDING_MEDIUM,
    alignItems: 'center',
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM - 2,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
  },
  activeTabText: {
    color: COLORS.WHITE,
  },
});

export default TabBar;
