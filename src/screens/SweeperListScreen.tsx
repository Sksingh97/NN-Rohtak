import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRightIcon,
  UserIcon,
  MagnifyingGlassIcon,
} from 'react-native-heroicons/outline';
import { RootState, AppDispatch } from '../store';
import { MySweeper, AllSweeper } from '../types';
import {
  fetchMySweepers,
  fetchAllSweepers,
  setSearchQuery,
} from '../store/slices/sweeperSlice';
import { withLoader } from '../components/Loader';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface SweeperListScreenProps {
  navigation: any;
  showAll?: boolean; // true for All Sweepers, false for My Sweepers
}

const SweeperListScreen: React.FC<SweeperListScreenProps> = ({ 
  showAll = false 
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    mySweepers,
    allSweepers,
    isLoading,
    error,
    searchQuery,
  } = useSelector((state: RootState) => state.sweepers);

  useEffect(() => {
    if (showAll) {
      dispatch(fetchAllSweepers());
    } else {
      dispatch(fetchMySweepers());
    }
  }, [dispatch, showAll]);

  const filteredSweepers = useMemo(() => {
    const sweepers = showAll ? allSweepers : mySweepers;
    if (!searchQuery.trim()) return sweepers;
    
    if (showAll) {
      return (sweepers as AllSweeper[]).filter((sweeper: AllSweeper) =>
        sweeper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sweeper.sites.some((site: string) => 
          site.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      return (sweepers as MySweeper[]).filter((sweeper: MySweeper) =>
        sweeper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sweeper.sites.some((site: string) => 
          site.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [showAll, allSweepers, mySweepers, searchQuery]);

  const onRefresh = () => {
    if (showAll) {
      dispatch(fetchAllSweepers());
    } else {
      dispatch(fetchMySweepers());
    }
  };

  const handleSweeperPress = (sweeper: MySweeper | AllSweeper) => {
    // Navigate to sweeper detail screen (to be implemented)
    Alert.alert('Sweeper Details', `Name: ${sweeper.name}\nSites: ${sweeper.sites.join(', ')}`);
  };

  const renderSweeperItem = ({ item }: { item: MySweeper | AllSweeper }) => {
    const isAllSweeper = 'mobile' in item; // AllSweeper has mobile field
    
    return (
      <TouchableOpacity
        style={styles.sweeperCard}
        onPress={() => handleSweeperPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sweeperContent}>
          <View style={styles.iconContainer}>
            <UserIcon size={24} color={COLORS.PRIMARY} />
          </View>
          
          <View style={styles.sweeperInfo}>
            <Text style={styles.sweeperName}>{item.name}</Text>
            
            {isAllSweeper && (
              <Text style={styles.sweeperMobile}>
                Mobile: {(item as AllSweeper).mobile}
              </Text>
            )}
            
            <Text style={styles.sitesLabel}>
              Sites ({item.sites.length}):
            </Text>
            <View style={styles.sitesContainer}>
              {item.sites.slice(0, 2).map((site, index) => (
                <Text key={index} style={styles.siteText}>
                  • {site}
                </Text>
              ))}
              {item.sites.length > 2 && (
                <Text style={styles.moreSites}>
                  +{item.sites.length - 2} more sites
                </Text>
              )}
            </View>
            
            {isAllSweeper && (
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: (item as AllSweeper).is_active ? COLORS.SUCCESS : COLORS.ERROR }
                ]}>
                  <Text style={styles.statusText}>
                    {(item as AllSweeper).is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          <ChevronRightIcon size={20} color={COLORS.GRAY_MEDIUM} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <UserIcon size={48} color={COLORS.GRAY_LIGHT} />
      <Text style={styles.emptyStateTitle}>
        {showAll ? 'No sweepers found' : 'No assigned sweepers'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {showAll 
          ? 'There are no sweepers in the system yet.' 
          : 'You have no sweepers assigned to your sites.'
        }
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (error && filteredSweepers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MagnifyingGlassIcon size={20} color={COLORS.GRAY_MEDIUM} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${showAll ? 'all sweepers' : 'my sweepers'}...`}
            value={searchQuery}
            onChangeText={(text) => dispatch(setSearchQuery(text))}
            placeholderTextColor={COLORS.GRAY_MEDIUM}
          />
        </View>
      </View>

      {/* Sweepers List */}
      <FlatList
        data={filteredSweepers}
        renderItem={renderSweeperItem}
        keyExtractor={(item) => showAll ? (item as AllSweeper).id : (item as MySweeper).user_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  searchContainer: {
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    paddingVertical: SIZES.PADDING_SMALL,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.PADDING_SMALL,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.BLACK,
  },
  listContainer: {
    padding: SIZES.PADDING_MEDIUM,
  },
  sweeperCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    marginBottom: SIZES.PADDING_MEDIUM,
    ...SHADOWS.LIGHT,
  },
  sweeperContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING_MEDIUM,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING_MEDIUM,
  },
  sweeperInfo: {
    flex: 1,
  },
  sweeperName: {
    fontSize: SIZES.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  sweeperMobile: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.GRAY_DARK,
    marginBottom: 6,
  },
  sitesLabel: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '600',
    color: COLORS.GRAY_DARK,
    marginBottom: 4,
  },
  sitesContainer: {
    marginBottom: 8,
  },
  siteText: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.GRAY_DARK,
    marginBottom: 2,
  },
  moreSites: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginTop: 2,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING_LARGE * 2,
  },
  emptyStateTitle: {
    fontSize: SIZES.FONT_SIZE_EXTRA_LARGE,
    fontWeight: 'bold',
    color: COLORS.GRAY_DARK,
    marginTop: SIZES.PADDING_MEDIUM,
    marginBottom: SIZES.PADDING_SMALL,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.GRAY_MEDIUM,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING_LARGE * 2,
  },
  errorText: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.ERROR,
    textAlign: 'center',
    marginBottom: SIZES.PADDING_MEDIUM,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZES.PADDING_LARGE * 2,
    paddingVertical: SIZES.PADDING_MEDIUM,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '600',
  },
});

export default withLoader(SweeperListScreen);
