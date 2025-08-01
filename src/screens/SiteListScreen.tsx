import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  ChevronRightIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
} from 'react-native-heroicons/outline';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RootState, AppDispatch } from '../store';
import { Site } from '../types';
import {
  fetchAllSites,
  fetchMySites,
  setSearchQuery,
} from '../store/slices/siteSlice';
import { logout, logoutUser } from '../store/slices/authSlice';
import { withLoader } from '../components/Loader';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { STRINGS } from '../constants/strings';

type SiteListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SiteList'>;

interface SiteListScreenProps {
  navigation: SiteListScreenNavigationProp;
}

const SiteListScreen: React.FC<SiteListScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(0); // 0 for My Sites, 1 for All Sites
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { allSites, mySites, isLoading, searchQuery } = useSelector(
    (state: RootState) => state.sites
  );

  const showTabs = user?.role === 2;

  useEffect(() => {
    if (showTabs && user) {
      // Supervisor: Load both my sites and all sites
      dispatch(fetchMySites());
      dispatch(fetchAllSites());
    } else if (user) {
      // Worker: Load only my sites
      dispatch(fetchMySites());
    }
  }, [dispatch, showTabs, user]);

  const currentSites = useMemo(() => {
    const sites = activeTab === 0 ? mySites : allSites;
    if (!searchQuery) return sites;
    
    return sites.filter((site: Site) =>
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, mySites, allSites, searchQuery]);

  const handleLogout = () => {
    Alert.alert(
      STRINGS.LOGOUT,
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => dispatch(logoutUser()) },
      ]
    );
  };

  const handleRefresh = () => {
    if (user) {
      if (activeTab === 0) {
        // Refresh my sites
        dispatch(fetchMySites());
      } else {
        // Refresh all sites
        dispatch(fetchAllSites());
      }
    }
  };

  const renderSiteItem = ({ item }: { item: Site }) => (
    <TouchableOpacity
      style={styles.siteCard}
      onPress={() => navigation.navigate('SiteDetail', { 
        site: item,
        sourceTab: activeTab // Pass the current tab (0 = My Sites, 1 = All Sites)
      })}
      activeOpacity={0.8}>
      <Image 
        source={require('../assets/siteIcon.png')} 
        style={styles.siteIcon}
        resizeMode="contain"
      />
      <View style={styles.siteInfo}>
        <Text style={styles.siteName}>{item.name}</Text>
        <Text style={styles.siteAddress}>{item.address}</Text>
      </View>
      <ChevronRightIcon size={24} color={COLORS.GRAY_MEDIUM} />
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MapPinIcon size={64} color={COLORS.GRAY_MEDIUM} />
      <Text style={styles.emptyText}>{STRINGS.NO_SITES_FOUND}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{STRINGS.SITE_LIST}</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ArrowRightOnRectangleIcon size={24} color={COLORS.ERROR} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MagnifyingGlassIcon size={20} color={COLORS.GRAY_MEDIUM} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={STRINGS.SEARCH_SITES}
          placeholderTextColor={COLORS.GRAY_MEDIUM}
          value={searchQuery}
          onChangeText={(text) => dispatch(setSearchQuery(text))}
        />
      </View>

      {/* Tabs */}
      {showTabs && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => setActiveTab(0)}>
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              {STRINGS.MY_SITES}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => setActiveTab(1)}>
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              {STRINGS.ALL_SITES}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Site List */}
      <FlatList
        data={currentSites}
        renderItem={renderSiteItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING_LARGE,
    paddingVertical: SIZES.PADDING_MEDIUM,
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.LIGHT,
  },
  headerTitle: {
    fontSize: SIZES.FONT_SIZE_TITLE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  logoutButton: {
    padding: SIZES.PADDING_SMALL,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SIZES.MARGIN_MEDIUM,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    ...SHADOWS.LIGHT,
  },
  searchIcon: {
    marginRight: SIZES.MARGIN_SMALL,
  },
  searchInput: {
    flex: 1,
    height: SIZES.INPUT_HEIGHT,
    fontSize: SIZES.FONT_SIZE_LARGE,
    color: COLORS.TEXT_PRIMARY,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.MARGIN_MEDIUM,
    marginBottom: SIZES.MARGIN_MEDIUM,
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
  listContainer: {
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    paddingBottom: SIZES.PADDING_LARGE,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING_LARGE,
    marginVertical: SIZES.MARGIN_SMALL,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    ...SHADOWS.LIGHT,
  },
  siteIcon: {
    width: 40,
    height: 40,
    marginRight: SIZES.MARGIN_MEDIUM,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: SIZES.FONT_SIZE_LARGE,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SMALL,
  },
  siteAddress: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING_EXTRA_LARGE * 2,
  },
  emptyText: {
    fontSize: SIZES.FONT_SIZE_LARGE,
    color: COLORS.GRAY_MEDIUM,
    marginTop: SIZES.MARGIN_LARGE,
  },
});

export default withLoader(SiteListScreen);
