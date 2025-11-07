import { Platform } from 'react-native';
import {
  initConnection,
  getProducts,
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  flushFailedPurchasesCachedAsPendingAndroid,
} from 'react-native-iap';

// Apple Product IDs (müssen in App Store Connect konfiguriert werden)
const PRODUCT_IDS = [
    '001_coin',
    '005_coins',
    '010_coins',
    '020_coins',
    '030_coins',
    '050_coins',
    '100_coins',
    '200_coins',
    '300_coins',
    '500_coins',
  ];

class PurchaseService {
  constructor() {
    this.isInitialized = false;
    this.products = [];
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('IAP already initialized');
        return;
      }

      console.log('Initializing IAP connection...');
      // Verbindung zu Store initialisieren
      await initConnection();
      this.isInitialized = true;

      // Android: Flush pending purchases
      if (Platform.OS === 'android') {
        try {
          await flushFailedPurchasesCachedAsPendingAndroid();
          console.log('Flushed pending Android purchases');
        } catch (err) {
          console.log('No pending purchases to flush');
        }
      }

      // Purchase Listeners setzen
      this.setupPurchaseListeners();

      console.log('IAP Service initialized successfully on', Platform.OS);
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      console.error('IAP Error details:', error.message, error.code);
      // Nicht werfen - Fallback verwenden
      this.isInitialized = false;
    }
  }

  setupPurchaseListeners() {
    // Purchase Updates hören
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase) => {
        console.log('Purchase updated:', purchase);
        
        // Transaction beenden
        await finishTransaction({
          purchase,
          isConsumable: true,
        });
      }
    );

    // Purchase Errors hören
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error) => {
        console.error('Purchase error:', error);
      }
    );
  }

  async loadProducts(skus = PRODUCT_IDS) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Nur laden wenn IAP verfügbar ist
      if (!this.isInitialized) {
        console.log('IAP not available, returning empty products');
        return [];
      }

      // Android: Convert all product IDs to lowercase only, keep underscores
      const processedSkus = Platform.OS === 'android' 
        ? skus.map(sku => sku.toLowerCase())
        : skus;
      
      console.log('Loading products with SKUs:', processedSkus);

      // Separate coins and subscriptions
      const isSubscription = (sku) => sku.includes('_week') || sku.includes('_month');
      const coinSkus = processedSkus.filter(sku => !isSubscription(sku));
      const subscriptionSkus = processedSkus.filter(sku => isSubscription(sku));

      let allProducts = [];

      // Load coins (consumables)
      if (coinSkus.length > 0) {
        console.log('Requesting coins from store:', coinSkus);
        const coins = await getProducts({ skus: coinSkus });
        console.log('Coins loaded:', coins.length, coins.map(p => p.productId).join(', '));
        allProducts = [...allProducts, ...coins];
      }

      // Load subscriptions
      if (subscriptionSkus.length > 0) {
        console.log('Requesting subscriptions from store:', subscriptionSkus);
        const subscriptions = await getSubscriptions({ skus: subscriptionSkus });
        console.log('Subscriptions loaded:', subscriptions.length, subscriptions.map(p => p.productId).join(', '));
        allProducts = [...allProducts, ...subscriptions];
      }

      this.products = allProducts;

      console.log('Total products loaded:', allProducts.length);
      console.log('Product IDs:', allProducts.map(p => p.productId).join(', '));
      
      if (allProducts.length === 0) {
        console.warn('WARNING: No products loaded from store! Check Play Console:');
        console.warn('1. Are products created and ACTIVE?');
        console.warn('2. Product IDs on Android:', processedSkus.join(', '));
        console.warn('3. Is app uploaded to Internal Testing?');
        console.warn('4. Is your account added as License Tester?');
      }
      
      return allProducts;
    } catch (error) {
      console.error('Failed to load products:', error);
      return [];
    }
  }

  async purchaseProduct(productId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Nur kaufen wenn IAP verfügbar ist
      if (!this.isInitialized) {
        throw new Error('IAP_NOT_AVAILABLE');
      }

      // Android: Convert product ID to lowercase only, keep underscores
      const processedProductId = Platform.OS === 'android' 
        ? productId.toLowerCase()
        : productId;
      
      console.log('Starting purchase for:', processedProductId, 'on platform:', Platform.OS);
      console.log('IAP initialized status:', this.isInitialized);
      console.log('Current products count:', this.products.length);
      
      // Reload products if empty or product not found
      if (this.products.length === 0) {
        console.log('No products loaded, loading now...');
        await this.loadProducts();
        console.log('Products after reload:', this.products.length);
      }
      
      console.log('Available products:', this.products.map(p => p.productId).join(', '));
      
      // Find product details
      const product = this.products.find(p => p.productId === processedProductId);
      console.log('Product found:', product ? product.productId : 'NOT FOUND');
      
      if (!product) {
        throw new Error(`Product ${processedProductId} not found in loaded products. Available: ${this.products.map(p => p.productId).join(', ')}`);
      }
      
      // Check if this is a subscription or a consumable
      const isSubscription = processedProductId.includes('_week') || processedProductId.includes('_month');
      
      console.log('Product type:', isSubscription ? 'SUBSCRIPTION' : 'CONSUMABLE');
      
      // Purchase request senden
      let purchase;
      
      if (isSubscription) {
        // Subscription purchase
        if (Platform.OS === 'android') {
          // Android: Use subscriptionOffers with offerToken
          console.log('Android subscription:', processedProductId);
          console.log('Product details:', JSON.stringify(product, null, 2));
          
          // Extract offer token
          const offerToken = product.subscriptionOfferDetails?.[0]?.offerToken;
          
          if (!offerToken) {
            throw new Error(`No offer token found for subscription ${processedProductId}. Product: ${JSON.stringify(product)}`);
          }
          
          console.log('Using offer token:', offerToken);
          
          purchase = await requestSubscription({
            sku: processedProductId,
            subscriptionOffers: [
              {
                sku: processedProductId,
                offerToken: offerToken,
              }
            ]
          });
        } else {
          // iOS: Use sku string for subscriptions
          console.log('iOS subscription with sku string:', processedProductId);
          purchase = await requestSubscription({
            sku: processedProductId,
          });
        }
      } else {
        // Consumable purchase (coins)
        if (Platform.OS === 'android') {
          // Android: Use skus array for consumable products
          console.log('Android purchase with skus array:', [processedProductId]);
          purchase = await requestPurchase({
            skus: [processedProductId],
          });
        } else {
          // iOS: Use sku string
          console.log('iOS purchase with sku string');
          purchase = await requestPurchase({
            sku: processedProductId,
            andDangerouslyFinishTransactionAutomaticallyIOS: false,
          });
        }
      }
      
      console.log('Purchase params sent');

      console.log('Purchase successful:', purchase);
      return purchase;
    } catch (error) {
      console.error('Purchase failed:', error);
      console.error('Purchase error code:', error.code);
      console.error('Purchase error message:', error.message);
      throw error;
    }
  }

  async finishPurchase(purchase) {
    try {
      await finishTransaction({
        purchase,
        isConsumable: true,
      });
      console.log('Purchase finished successfully');
    } catch (error) {
      console.error('Failed to finish purchase:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }
  }

  getProducts() {
    return this.products;
  }
}

export default new PurchaseService(); 