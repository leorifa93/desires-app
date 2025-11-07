import { Alert } from 'react-native';

class PhoneVerificationService {
  /**
   * Send verification code to phone number
   * @param {string} phoneNumber - Phone number with country code
   * @returns {Promise<boolean>} - Success status
   */
  async sendVerificationCode(phoneNumber) {
    try {
      console.log('PhoneVerificationService: Sending verification code to:', phoneNumber);
      
      const response = await fetch('https://sendverificationcode-ytbcdg7bga-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
        }),
      });

      console.log('PhoneVerificationService: Response status:', response.status);
      console.log('PhoneVerificationService: Response headers:', response.headers);

      if (response.ok) {
        console.log('PhoneVerificationService: Verification code sent successfully');
        return true;
      } else {
        let errorMessage = 'Failed to send verification code';
        try {
          const errorText = await response.text();
          console.log('PhoneVerificationService: Error response text:', errorText);
          
          if (errorText && errorText.trim()) {
            try {
              const error = JSON.parse(errorText);
              errorMessage = error.message || error.error || errorMessage;
            } catch (jsonError) {
              errorMessage = errorText;
            }
          }
        } catch (parseError) {
          console.log('PhoneVerificationService: Could not parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        // For 500 errors, provide more helpful message
        if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('PhoneVerificationService: Error sending verification code:', error);
      throw error;
    }
  }

  /**
   * Verify SMS code
   * @param {string} phoneNumber - Phone number with country code
   * @param {string} code - 6-digit verification code
   * @returns {Promise<boolean>} - Verification success status
   */
  async verifySMSCode(phoneNumber, code) {
    try {
      console.log('PhoneVerificationService: Verifying SMS code');
      console.log('  Phone:', phoneNumber);
      console.log('  Code:', code, 'Type:', typeof code, 'Length:', code?.length);
      
      const response = await fetch('https://verifysmscode-ytbcdg7bga-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          code: code,
        }),
      });

      console.log('PhoneVerificationService: Response status:', response.status);
      const result = await response.text();
      console.log('PhoneVerificationService: Response text:', result);
      
      if (!response.ok) {
        console.log('PhoneVerificationService: Server error - status:', response.status);
        if (response.status === 500) {
          throw new Error('Server error. The verification code may have expired or there was a server issue. Please request a new code.');
        }
        throw new Error(`Verification failed: ${result}`);
      }
      
      const isValid = result === 'true';
      console.log('PhoneVerificationService: Is valid?', isValid);
      
      return isValid;
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      throw error;
    }
  }

  /**
   * Normalize to E.164: keep leading +, strip spaces/formatting
   * If no leading + is present, prepend + to the digit-only string
   * @param {string} phoneNumber
   * @returns {string}
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    const trimmed = String(phoneNumber).trim();
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/[^\d]/g, '');
    return hasPlus ? `+${digits}` : `+${digits}`;
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - Is valid phone number
   */
  isValidPhoneNumber(phoneNumber) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Validate verification code format
   * @param {string} code - Verification code to validate
   * @returns {boolean} - Is valid verification code
   */
  isValidVerificationCode(code) {
    return /^\d{6}$/.test(code);
  }

  /**
   * Get city name from coordinates using reverse geocoding (like old project)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} - City name
   */
  async getCityFromLatLng(lat, lng) {
    try {
      // Use the same Google Maps API endpoint as the old project
      const uri = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBxdsntNvOw3i8qUwDC_rqpEDOMvlQJgIQ`;
      
      const response = await fetch(encodeURI(uri));
      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        const data = this.formatAddress(result.results[0]);
        
        // Build city name like in old project
        let cityName = '';
        if (data.locality) {
          cityName = data.locality;
        }
        if (data.state) {
          // Shorten German state names
          const shortState = this.shortenGermanState(data.state);
          cityName += cityName ? `, ${shortState}` : shortState;
        }
        if (data.country) {
          cityName += cityName ? `, ${data.country}` : data.country;
        }
        
        return cityName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  /**
   * Format address from Google Maps API response (like old project)
   * @param {object} googleAddr - Google address object
   * @returns {object} - Formatted address data
   */
  formatAddress(googleAddr) {
    let properAddress = {
      latitude: '',
      longitude: '',
      locality: '',
      state: '',
      country: ''
    };

    if (googleAddr.address_components) {
      for (let component of googleAddr.address_components) {
        if (component.types.includes('locality')) {
          properAddress.locality = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          properAddress.state = component.long_name;
        }
        if (component.types.includes('country')) {
          properAddress.country = component.long_name;
        }
      }
    }

    return properAddress;
  }

  /**
   * Shorten German state names
   * @param {string} state - Full state name
   * @returns {string} - Shortened state name
   */
  shortenGermanState(state) {
    const stateMap = {
      'Nordrhein-Westfalen': 'NRW',
      'Bayern': 'BY',
      'Baden-Württemberg': 'BW',
      'Niedersachsen': 'NI',
      'Hessen': 'HE',
      'Sachsen': 'SN',
      'Rheinland-Pfalz': 'RP',
      'Berlin': 'BE',
      'Schleswig-Holstein': 'SH',
      'Brandenburg': 'BB',
      'Sachsen-Anhalt': 'ST',
      'Thüringen': 'TH',
      'Hamburg': 'HH',
      'Mecklenburg-Vorpommern': 'MV',
      'Bremen': 'HB',
      'Saarland': 'SL'
    };

    return stateMap[state] || state;
  }
}

export default new PhoneVerificationService();
