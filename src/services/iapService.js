import {
  initConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
} from 'react-native-iap';

// Product IDs für die verschiedenen Coin-Pakete
export const PRODUCT_IDS = {
  COIN_1: '001_coin',
  COIN_5: '005_coins',
  COIN_10: '010_coins',
  COIN_20: '020_coins',
  COIN_30: '030_coins',
  COIN_50: '050_coins',
  COIN_100: '100_coins',
  COIN_200: '200_coins',
  COIN_300: '300_coins',
  COIN_500: '500_coins',
};

export const ALL_PRODUCT_IDS = Object.values(PRODUCT_IDS);

class IAPService {
  constructor() {
    this.isInitialized = false;
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
  }

  // Initialisiere die IAP-Verbindung
  async initialize() {
    try {
      if (this.isInitialized) return true;
      
      const result = await initConnection();
      this.isInitialized = true;
      console.log('IAP initialized:', result);
      return true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      return false;
    }
  }

  // Hole alle verfügbaren Produkte
  async getProducts() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const products = await getProducts({ skus: ALL_PRODUCT_IDS });
      console.log('Available products:', products);
      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  // Kaufe ein Produkt
  async purchaseProduct(productId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Attempting to purchase:', productId);
      const purchase = await requestPurchase({ sku: productId });
      console.log('Purchase successful:', purchase);
      return purchase;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  // Beende eine Transaktion
  async finishTransaction(purchase) {
    try {
      await finishTransaction({ purchase });
      console.log('Transaction finished:', purchase);
    } catch (error) {
      console.error('Failed to finish transaction:', error);
      throw error;
    }
  }

  // Hole verfügbare Käufe (für Wiederherstellung)
  async getAvailablePurchases() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const purchases = await getAvailablePurchases();
      console.log('Available purchases:', purchases);
      return purchases;
    } catch (error) {
      console.error('Failed to get available purchases:', error);
      return [];
    }
  }

  // Setze Purchase-Listener
  setupPurchaseListeners(onPurchaseUpdate, onPurchaseError) {
    this.purchaseUpdateSubscription = purchaseUpdatedListener(onPurchaseUpdate);
    this.purchaseErrorSubscription = purchaseErrorListener(onPurchaseError);
  }

  // Entferne Purchase-Listener
  removePurchaseListeners() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
  }

  // Cleanup
  cleanup() {
    this.removePurchaseListeners();
    this.isInitialized = false;
  }
}

export default new IAPService(); 