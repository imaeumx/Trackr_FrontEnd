import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Common colors
export const colors = {
  primary: '#00D084',
  secondary: '#FF6B35',
  background: '#141517',
  card: '#1A1B1D',
  border: '#2A2B2D',
  text: '#F5F5F5',
  textSecondary: '#7B7C7D',
  error: '#E53935',
  warning: '#FFC700',
};

// Common spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Platform-specific styles
export const platformStyles = {
  container: Platform.select({
    web: {
      height: '100vh',
      overflow: 'hidden',
    },
    default: {},
  }),
  header: Platform.select({
    web: {
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    },
    default: {},
  }),
  scrollView: Platform.select({
    web: {
      height: 'calc(100vh - 80px)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    },
    default: {},
  }),
  scrollContent: Platform.select({
    web: {
      minHeight: '100%',
    },
    default: {},
  }),
  headerPadding: Platform.select({
    web: 20,
    default: 50,
  }),
};

// Movie card dimensions
export const cardDimensions = {
  width: (screenWidth - 80) / 9,
  height: ((screenWidth - 80) / 9) * 1.4,
};

// Global styles
export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...platformStyles.container,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: platformStyles.headerPadding,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...platformStyles.header,
  },

  logo: {
    marginLeft: spacing.sm,
    fontSize: 25,
    fontWeight: 'bold',
    color: colors.primary,
  },

  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },

  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  menuText: {
    marginLeft: spacing.lg,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },

  activeMenuText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    maxWidth: 180,
    marginRight: spacing.md,
  },

  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 36,
    color: colors.text,
    fontSize: 12,
  },

  searchButton: {
    position: 'absolute',
    left: 10,
    padding: 4,
  },

  // Profile styles
  profileButton: {
    marginLeft: 0,
  },

  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  usernameText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
  },

  signInText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },

  // ScrollView styles
  scrollView: {
    flex: 1,
    ...platformStyles.scrollView,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    ...platformStyles.scrollContent,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    fontSize: 16,
  },

  // Error styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1B1D',
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },

  errorText: {
    color: colors.text,
    marginLeft: spacing.sm,
    fontSize: 14,
    flex: 1,
  },

  // Welcome styles
  welcomeContainer: {
    backgroundColor: colors.card,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },

  welcomeSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Section styles
  section: {
    marginBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    color: colors.text,
  },

  // Grid styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  // Movie card styles
  movieCard: {},

  movieImageContainer: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },

  movieImage: {
    width: '100%',
    borderRadius: 6,
  },

  movieImagePlaceholder: {
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  typeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  localBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  localBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  movieTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
    lineHeight: 15,
  },

  movieYear: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 3,
    textAlign: 'center',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rating: {
    marginLeft: 2,
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },

  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },

  bottomPadding: {
    height: 100,
  },
});

// Components for reuse
export const Card = {
  width: cardDimensions.width,
  height: cardDimensions.height,
  styles: {
    movieCard: {
      width: cardDimensions.width,
    },
    movieImage: {
      width: '100%',
      height: cardDimensions.height,
    },
    movieImagePlaceholder: {
      width: '100%',
      height: cardDimensions.height,
    },
  },
};