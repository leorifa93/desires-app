import Geolocation from '@react-native-community/geolocation';
import { geohashForLocation } from 'geofire-common';
import { Platform, PermissionsAndroid } from 'react-native';

class LocationService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Request location permissions
   */
  async requestLocationPermissions() {
    try {
      if (Platform.OS === 'ios') {
        // For @react-native-community/geolocation@3.4.0, requestAuthorization takes no arguments
        Geolocation.requestAuthorization();
        return true;
      }

      // Android
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location with permission handling
   */
  async getCurrentLocation() {
    try {
      // First request permissions
      const hasPermission = await this.requestLocationPermissions();
      
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              hash: geohashForLocation([position.coords.latitude, position.coords.longitude])
            };
            console.log('Current location obtained:', location);
            resolve(location);
          },
          (error) => {
            console.error('Error getting current location:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });
    } catch (error) {
      console.error('Error in getCurrentLocation:', error);
      throw error;
    }
  }

  /**
   * Watch location changes
   */
  watchPosition(callback, errorCallback) {
    return Geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          hash: geohashForLocation([position.coords.latitude, position.coords.longitude])
        };
        callback(location);
      },
      errorCallback,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }

  /**
   * Stop watching location
   */
  stopWatching(watchId) {
    Geolocation.clearWatch(watchId);
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled() {
    try {
      const hasPermission = await this.requestLocationPermissions();
      return hasPermission;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  /**
   * Get location with fallback to user's stored location
   */
  async detectCurrentLocation(user = null) {
    try {
      // Try to get current location first
      const currentLocation = await this.getCurrentLocation();
      return currentLocation;
    } catch (error) {
      console.warn('Could not get current location, using fallback');
      
      // If user has a stored location, use it with some randomization
      if (user && user.currentLocation) {
        const randomLocation = this.randomGeoLocation(
          user.currentLocation.lat,
          user.currentLocation.lng,
          5000 // 5km radius
        );
        
        return {
          lat: randomLocation.latitude,
          lng: randomLocation.longitude,
          hash: geohashForLocation([randomLocation.latitude, randomLocation.longitude])
        };
      }
      
      // Last resort: throw error
      throw new Error('Unable to determine location');
    }
  }

  /**
   * Generate random location within radius
   */
  randomGeoLocation(lat, lng, radiusInMeters) {
    // Convert radius from meters to degrees
    const radiusInDegrees = radiusInMeters / 111000; // Rough conversion
    
    // Generate random offset
    const randomLat = lat + (Math.random() - 0.5) * 2 * radiusInDegrees;
    const randomLng = lng + (Math.random() - 0.5) * 2 * radiusInDegrees;
    
    return {
      latitude: randomLat,
      longitude: randomLng
    };
  }

  /**
   * Get city name from coordinates using reverse geocoding (like old Ionic project)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} - City name formatted as "locality, state"
   */
  async getCityFromLatLng(lat, lng) {
    try {
      const uri = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBxdsntNvOw3i8qUwDC_rqpEDOMvlQJgIQ`;
      
      const response = await fetch(encodeURI(uri));
      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        let locality = null;
        let state = null;
        
        // Parse address components like in old project
        for (const res of result.results) {
          const formatted = this.formatAddress(res);
          
          if (formatted.locality && !locality) {
            locality = formatted.locality;
          }
          
          if (formatted.state && !state) {
            state = formatted.state;
          }
          
          // Break if we have both
          if (locality && state) break;
        }
        
        // Build city name like in old project: "locality, state"
        if (locality && state) {
          return `${locality}, ${state}`;
        } else if (locality) {
          return locality;
        } else if (state) {
          return state;
        }
      }
      
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  /**
   * Format address from Google Maps API response (like old Ionic project)
   * @param {object} googleAddr - Google address object from geocoding API
   * @returns {object} - Formatted address with locality, state, country
   */
  formatAddress(googleAddr) {
    const data = {
      locality: null,
      state: null,
      country: null
    };

    if (googleAddr.address_components) {
      for (const component of googleAddr.address_components) {
        const types = component.types;

        if (types.includes('locality')) {
          data.locality = component.long_name;
        }

        if (types.includes('administrative_area_level_1')) {
          data.state = component.short_name;
        }

        if (types.includes('country')) {
          data.country = component.short_name;
        }
      }
    }

    return data;
  }
}

export default new LocationService();
