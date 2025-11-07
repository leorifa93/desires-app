import { Platform } from 'react-native';
import { Membership } from '../constants/User';
import i18next from 'i18next';
let ChangeIcon = null;
try {
  // Some environments may not have the native module linked/available
  // Use a guarded dynamic require to avoid crashes
  // eslint-disable-next-line global-require
  const RNChangeIcon = require('react-native-change-icon');
  // Support both default and named exports
  ChangeIcon = RNChangeIcon && RNChangeIcon.default ? RNChangeIcon.default : RNChangeIcon;
} catch (e) {
  ChangeIcon = null;
}

class AppIconService {
  constructor() {
    this.isSupported = false;
    this.currentIcon = null;
    this.initialize();
  }

  /**
   * Map icon names to Android activity-alias names
   */
  getAndroidActivityName(iconName) {
    if (!iconName || iconName === 'Default') return null;
    
    // The library adds "packageName.MainActivity" + iconName
    // So we just need to return the capitalized suffix
    // Example: "cl" → "Cl" (library will make it "com.dating.desires.MainActivityCl")
    return iconName.charAt(0).toUpperCase() + iconName.slice(1);
  }

  /**
   * Map Android activity-alias name back to icon name
   */
  getIconNameFromActivity(activityName) {
    if (!activityName || activityName === '.MainActivity' || activityName === 'com.dating.desires.MainActivity') return null;
    
    // Example: "com.dating.desires.MainActivityCl" → "cl"
    const match = activityName.match(/MainActivity(.+)$/);
    if (match) {
      return match[1].toLowerCase();
    }
    return null;
  }

  async initialize() {
    try {
      // Check if module is present
      if (!ChangeIcon) {
        this.isSupported = false;
        console.log('[AppIcon] Dynamic icons not supported: Module not loaded', {
          platform: Platform.OS,
          hasModule: !!ChangeIcon,
        });
        return;
      }

      // Some module versions may not expose supports*; fall back to presence of changeIcon
      const hasSupportsFn = typeof ChangeIcon.supportsDynamicAppIcon === 'function' || typeof ChangeIcon.supportsDynamicAppIcons === 'function';
      const hasChangeFn = typeof ChangeIcon.changeIcon === 'function';

      if (hasSupportsFn) {
        const supportsFn = ChangeIcon.supportsDynamicAppIcon || ChangeIcon.supportsDynamicAppIcons;
        this.isSupported = await supportsFn();
      } else {
        this.isSupported = hasChangeFn;
      }
      console.log('[AppIcon] supportsDynamicAppIcon =', this.isSupported);
      
      if (this.isSupported) {
        // Get current icon name (if available) - try both function names
        let currentIcon = null;
        if (typeof ChangeIcon.getCurrentIcon === 'function') {
          currentIcon = await ChangeIcon.getCurrentIcon();
        } else if (typeof ChangeIcon.getIcon === 'function') {
          currentIcon = await ChangeIcon.getIcon();
        }
        this.currentIcon = currentIcon;
        console.log('[AppIcon] currentIcon =', this.currentIcon);
      } else {
        console.log('[AppIcon] Not supported on this device/runtime');
      }
    } catch (error) {
      console.error('Error initializing AppIcon service:', error);
      this.isSupported = false;
    }
  }

  /**
   * Check if app icon changing is supported
   */
  async checkSupport() {
    try {
      if (!ChangeIcon) {
        console.error('[AppIcon] ChangeIcon module not loaded');
        return false;
      }
      
      console.log('[AppIcon] ChangeIcon module available:', {
        supportsDynamicAppIcon: typeof ChangeIcon.supportsDynamicAppIcon,
        supportsDynamicAppIcons: typeof ChangeIcon.supportsDynamicAppIcons,
        changeIcon: typeof ChangeIcon.changeIcon,
        getIcon: typeof ChangeIcon.getIcon,
        getCurrentIcon: typeof ChangeIcon.getCurrentIcon,
      });
      
      // If changeIcon function exists, assume support (some versions don't have supports* check)
      if (typeof ChangeIcon.changeIcon === 'function') {
        console.log('[AppIcon] changeIcon function exists, assuming support');
        
        // Try to call supports function if available
        if (typeof ChangeIcon.supportsDynamicAppIcon === 'function' || typeof ChangeIcon.supportsDynamicAppIcons === 'function') {
          const supportsFn = ChangeIcon.supportsDynamicAppIcon || ChangeIcon.supportsDynamicAppIcons;
          const supported = await supportsFn();
          console.log('[AppIcon] supportsDynamicAppIcon/Icons result:', supported);
          
          // Even if it returns false, try anyway if we're on iOS and have the function
          if (!supported) {
            console.log('[AppIcon] Support check returned false, but will try anyway on iOS');
          }
          return true; // Force true on iOS if changeIcon exists
        }
        
        return true; // changeIcon exists, assume it works
      }
      
      console.error('[AppIcon] changeIcon function not available');
      return false;
    } catch (error) {
      console.error('[AppIcon] Error checking AppIcon support:', error);
      // On iOS with changeIcon function, assume it works even if check fails
      if (Platform.OS === 'ios' && ChangeIcon && typeof ChangeIcon.changeIcon === 'function') {
        console.log('[AppIcon] Error in support check but changeIcon exists, assuming support');
        return true;
      }
      return false;
    }
  }

  /**
   * Get current app icon name
   */
  async getCurrentIcon() {
    try {
      if (!ChangeIcon) {
        return null;
      }
      
      // Try getCurrentIcon first, then getIcon (different versions use different names)
      let currentIcon = null;
      if (typeof ChangeIcon.getCurrentIcon === 'function') {
        currentIcon = await ChangeIcon.getCurrentIcon();
      } else if (typeof ChangeIcon.getIcon === 'function') {
        currentIcon = await ChangeIcon.getIcon();
      }
      
      // On Android, library returns either 'Default' or the suffix (e.g., 'Cl')
      if (Platform.OS === 'android' && currentIcon) {
        if (currentIcon === 'Default') {
          // Treat default as standard
          return 'standard';
        }
        // If it's a simple suffix like 'Cl', normalize to lowercase
        if (!currentIcon.includes('.')) {
          return String(currentIcon).toLowerCase();
        }
        // Fallback: convert activity class to icon name
        return this.getIconNameFromActivity(currentIcon);
      }
      
      return currentIcon;
    } catch (error) {
      console.error('Error getting current icon:', error);
      return null;
    }
  }

  /**
   * Change app icon
   * @param {string} iconName - Name of the icon to change to
   */
  async changeIcon(iconName) {
    try {
      console.log('[AppIcon] Attempting to change icon to:', iconName);
      
      const supported = await this.checkSupport();
      console.log('[AppIcon] Support check result:', supported);
      
      if (!supported) {
        console.log('[AppIcon] Not supported on this device');
        // No alert - let the caller handle the error
        return false;
      }

      if (!ChangeIcon || typeof ChangeIcon.changeIcon !== 'function') {
        console.error('[AppIcon] ChangeIcon module or changeIcon function not available');
        // No alert - let the caller handle the error
        return false;
      }

      // On Android, use suffix (e.g., 'Cl'); on iOS, use icon name directly
      const iconParameter = Platform.OS === 'android' 
        ? this.getAndroidActivityName(iconName)
        : iconName;
      
      console.log('[AppIcon] Calling ChangeIcon.changeIcon with:', iconParameter, '(original:', iconName, ')');
      const result = await ChangeIcon.changeIcon(iconParameter);
      console.log('[AppIcon] changeIcon result:', result);
      
      // Success conditions: 'done', true, the icon name itself, suffix, or 'Default'
      const isSuccess = result === 'done' || result === true || result === iconName || result === iconParameter || result === 'Default';
      
      if (isSuccess) {
        this.currentIcon = iconName;
        
        // Try to verify the change (getCurrentIcon may not exist in all versions)
        try {
          if (typeof ChangeIcon.getIcon === 'function') {
            const newIcon = await ChangeIcon.getIcon();
            console.log('[AppIcon] Current icon after change (getIcon):', newIcon);
          } else if (typeof ChangeIcon.getCurrentIcon === 'function') {
            const newIcon = await ChangeIcon.getCurrentIcon();
            console.log('[AppIcon] Current icon after change (getCurrentIcon):', newIcon);
          }
        } catch (verifyError) {
          console.log('[AppIcon] Could not verify icon change:', verifyError);
        }
        
        // No alert here - let the caller show the alert
        console.log('[AppIcon] Successfully changed icon to:', iconName);
        return true;
      } else {
        console.error('[AppIcon] changeIcon returned unexpected result:', result);
        // No alert - let the caller handle the error
        return false;
      }
    } catch (error) {
      console.error('[AppIcon] Error changing app icon:', error);
      console.error('[AppIcon] Error details:', JSON.stringify(error));
      // No alert - let the caller handle the error
      return false;
    }
  }

  /**
   * Reset app icon to default
   */
  async resetIcon() {
    try {
      console.log('[AppIcon] Attempting to reset icon to default');
      
      if (!ChangeIcon) {
        console.error('[AppIcon] ChangeIcon module not available');
        return false;
      }
      
      // On Android, reset means switching to alias suffix 'Standard' (not 'Default')
      if (Platform.OS === 'android') {
        if (typeof ChangeIcon.changeIcon !== 'function') {
          console.error('[AppIcon] ChangeIcon.changeIcon function not available');
          return false;
        }
        
        // Check current icon first
        const currentIcon = await this.getCurrentIcon();
        console.log('[AppIcon] Current icon before reset:', currentIcon);
        
        // If already on standard/default, just return success
        if (!currentIcon || currentIcon === 'standard' || currentIcon === 'Standard') {
          console.log('[AppIcon] Already on default icon, no change needed');
          this.currentIcon = 'standard';
          return true;
        }
        
        console.log('[AppIcon] Calling ChangeIcon.changeIcon with: Standard (reset to default)');
        const result = await ChangeIcon.changeIcon('Standard');
        console.log('[AppIcon] changeIcon result:', result);
        
        if (result === 'done' || result === true || result === 'Standard' || result === 'standard') {
          this.currentIcon = 'standard';
          console.log('[AppIcon] Successfully reset to standard icon');
          return true;
        }
        return false;
      }
      
      // iOS: Use resetIcon function
      if (typeof ChangeIcon.resetIcon !== 'function') {
        console.error('[AppIcon] ChangeIcon.resetIcon function not available');
        return false;
      }
      
      console.log('[AppIcon] Calling ChangeIcon.resetIcon');
      const result = await ChangeIcon.resetIcon();
      console.log('[AppIcon] resetIcon result:', result);
      
      // Success conditions: 'done', true, null (meaning default), or any truthy value
      const isSuccess = result === 'done' || result === true || result === null || result === 'Default';
      
      if (isSuccess) {
        this.currentIcon = null;
        
        // Try to verify the change
        try {
          const newIcon = await this.getCurrentIcon();
          console.log('[AppIcon] Current icon after reset:', newIcon);
        } catch (verifyError) {
          console.log('[AppIcon] Could not verify icon reset:', verifyError);
        }
        
        // No alert on success - just log
        console.log('[AppIcon] Successfully reset icon to default');
        return true;
      } else {
        console.error('[AppIcon] resetIcon returned unexpected result:', result);
        // No alert - let the caller handle the error
        return false;
      }
    } catch (error) {
      console.error('[AppIcon] Error resetting app icon:', error);
      console.error('[AppIcon] Error details:', JSON.stringify(error));
      // No alert - let the caller handle the error
      return false;
    }
  }

  /**
   * Get display name for icon
   * @param {string} iconName - Icon name
   */
  getIconDisplayName(iconName) {
    const displayNames = {
      'vip': 'Desires VIP',
      'vipblack': 'Desires VIP Black',
      'cl': i18next.t('ICON_CHAMPIONS_LEAGUE') || 'Champions League',
      'flight': i18next.t('ICON_FLIGHT_RADAR') || 'Flight Radar',
      'gym': i18next.t('ICON_GYM_TIPS') || 'Gym Tips',
      'healthcare': i18next.t('ICON_HEALTH_CARE') || 'Health Care',
      'mlsnews': i18next.t('ICON_MLS_NEWS') || 'MLS News',
      'navigator': i18next.t('ICON_NAVIGATOR') || 'Navigator',
      'nflnews': i18next.t('ICON_NHL_NEWS') || 'NHL News',
      'nfl': i18next.t('ICON_NFL') || 'NFL',
      'taxi': i18next.t('ICON_TAXI') || 'Taxi',
      'wifi': i18next.t('ICON_FREE_WIFI') || 'Free WiFi'
    };
    return displayNames[iconName] || iconName;
  }

  /**
   * Check if user can access VIP icons
   * @param {Object} user - User object
   */
  canAccessVipIcons(user) {
    if (!user) return false;
    // VIP members (membership === 3) can access VIP icons
    return user.membership === Membership.VIP;
  }

  /**
   * Check if user can access stealth icons
   * @param {Object} user - User object
   * @param {string} iconName - Specific icon name to check
   */
  canAccessStealthIcon(user, iconName) {
    if (!user) return false;
    // Phantom (4), Celebrity (5), VIP (6) members get all icons for free
    if ([Membership.Phantom, Membership.Celebrity, Membership.VIP].includes(user.membership)) {
      return true;
    }
    
    // Check if user has purchased this specific icon
    return user._stealthModes?.includes(iconName) || false;
  }

  /**
   * Get VIP icons data
   */
  getVipIcons() {
    return [
      {
        name: 'vip',
        title: 'Desires VIP',
        description: 'Red',
        icon: require('../assets/icons/vip.png')
      },
      {
        name: 'vipblack',
        title: 'Desires VIP',
        description: 'Black',
        icon: require('../assets/icons/vip-black.png')
      }
    ];
  }

  /**
   * Get stealth mode icons data
   */
  getStealthIcons() {
    return [
      {
        name: 'cl',
        titleKey: 'ICON_CHAMPIONS_LEAGUE',
        icon: require('../assets/icons/cl.png')
      },
      {
        name: 'flight',
        titleKey: 'ICON_FLIGHT_RADAR',
        icon: require('../assets/icons/flight.png')
      },
      {
        name: 'gym',
        titleKey: 'ICON_GYM_TIPS',
        icon: require('../assets/icons/gym.png')
      },
      {
        name: 'healthcare',
        titleKey: 'ICON_HEALTH_CARE',
        icon: require('../assets/icons/health_care.png')
      },
      {
        name: 'mlsnews',
        titleKey: 'ICON_MLS_NEWS',
        icon: require('../assets/icons/mls_news.png')
      },
      {
        name: 'navigator',
        titleKey: 'ICON_NAVIGATOR',
        icon: require('../assets/icons/navigator.png')
      },
      {
        name: 'nflnews',
        titleKey: 'ICON_NHL_NEWS',
        icon: require('../assets/icons/nfl_news.png')
      },
      {
        name: 'nfl',
        titleKey: 'ICON_NFL',
        icon: require('../assets/icons/nfl.png')
      },
      {
        name: 'taxi',
        titleKey: 'ICON_TAXI',
        icon: require('../assets/icons/taxi.png')
      },
      {
        name: 'wifi',
        titleKey: 'ICON_FREE_WIFI',
        icon: require('../assets/icons/wifi.png')
      }
    ];
  }
}

export default new AppIconService();
