# 🚀 **Implementation Guide - Advanced MongoDB Features**

## 📋 **2-Week Implementation Plan**

### **Week 1 - Foundation & Core Features** ✅ COMPLETED
- [x] **Advanced Analytics Dashboard** with `$facet`, `$bucket`, complex aggregations
- [x] **Intelligent Search Engine** with text indexing, fuzzy search, autocomplete
- [x] **AI-Powered Recommendation System** using `$graphLookup` and collaborative filtering
- [x] **Proper Schema Design** with validation rules

### **Week 2 - Advanced Features & Production Ready**

---

## 🔄 **Real-time Inventory Management with Change Streams**

### Implementation:

```javascript
// helpers/inventory-helpers.js
const db = require('../config/connection');
const collections = require('../config/collections');

module.exports = {
    // Initialize change streams for real-time monitoring
    initializeChangeStreams: () => {
        // Monitor low stock products
        const lowStockStream = db.get().collection(collections.PRODUCT_COLLECTION).watch([
            {
                $match: {
                    $or: [
                        { 'fullDocument.stock': { $lte: 10 } },
                        { 'updateDescription.updatedFields.stock': { $lte: 10 } }
                    ]
                }
            }
        ]);

        lowStockStream.on('change', (change) => {
            console.log('🚨 Low Stock Alert:', {
                productId: change.fullDocument._id,
                productName: change.fullDocument.productName,
                currentStock: change.fullDocument.stock
            });
            
            // Trigger automatic reorder if needed
            this.checkAutoReorder(change.fullDocument);
        });

        // Monitor order fulfillment
        const orderStream = db.get().collection(collections.ORDER_COLLECTION).watch([
            {
                $match: {
                    'updateDescription.updatedFields.status': 'placed'
                }
            }
        ]);

        orderStream.on('change', (change) => {
            console.log('📦 New Order Placed:', change.fullDocument._id);
            this.updateInventoryForOrder(change.fullDocument);
        });
    },

    // Automatic reorder logic
    checkAutoReorder: async (product) => {
        if (product.supplier && product.stock <= product.supplier.minOrderQuantity) {
            const reorderQuantity = product.supplier.minOrderQuantity * 3;
            
            console.log(`🔄 Auto-reordering ${reorderQuantity} units of ${product.productName}`);
            
            // Create purchase order (simplified)
            await db.get().collection('purchase_orders').insertOne({
                productId: product._id,
                supplierId: product.supplier.name,
                quantity: reorderQuantity,
                status: 'pending',
                createdAt: new Date()
            });
        }
    },

    // Update inventory when order is placed
    updateInventoryForOrder: async (order) => {
        const bulkOps = order.products.map(product => ({
            updateOne: {
                filter: { _id: product.item },
                update: { 
                    $inc: { stock: -product.quantity },
                    $set: { updatedAt: new Date() }
                }
            }
        }));

        await db.get().collection(collections.PRODUCT_COLLECTION).bulkWrite(bulkOps);
    }
};
```

---

## 🌍 **Geospatial Features**

### Implementation:

```javascript
// helpers/location-helpers.js
const db = require('../config/connection');
const collections = require('../config/collections');

module.exports = {
    // Initialize geospatial indexes
    initializeGeoIndexes: async () => {
        await db.get().collection(collections.USER_COLLECTION)
            .createIndex({ "addresses.location": "2dsphere" });
        
        await db.get().collection('warehouses')
            .createIndex({ location: "2dsphere" });
        
        await db.get().collection(collections.ORDER_COLLECTION)
            .createIndex({ "deliveryDetails.location": "2dsphere" });
    },

    // Find nearest warehouse
    findNearestWarehouse: (userLocation) => {
        return new Promise(async (resolve, reject) => {
            try {
                const nearestWarehouse = await db.get().collection('warehouses').findOne({
                    location: {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: userLocation // [longitude, latitude]
                            },
                            $maxDistance: 50000 // 50km radius
                        }
                    }
                });
                resolve(nearestWarehouse);
            } catch (error) {
                reject(error);
            }
        });
    },

    // Calculate delivery zones and pricing
    calculateDeliveryPricing: (userLocation) => {
        return new Promise(async (resolve, reject) => {
            try {
                const deliveryZones = await db.get().collection('delivery_zones').aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: userLocation
                            },
                            distanceField: "distance",
                            maxDistance: 100000, // 100km
                            spherical: true
                        }
                    },
                    {
                        $project: {
                            zoneName: 1,
                            basePrice: 1,
                            pricePerKm: 1,
                            distance: 1,
                            totalDeliveryCharge: {
                                $add: [
                                    "$basePrice",
                                    { $multiply: ["$pricePerKm", { $divide: ["$distance", 1000] }] }
                                ]
                            }
                        }
                    },
                    { $sort: { distance: 1 } },
                    { $limit: 1 }
                ]).toArray();

                resolve(deliveryZones[0]);
            } catch (error) {
                reject(error);
            }
        });
    },

    // Store locator
    findNearbyStores: (userLocation, radius = 25000) => {
        return new Promise(async (resolve, reject) => {
            try {
                const stores = await db.get().collection('stores').aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: userLocation
                            },
                            distanceField: "distance",
                            maxDistance: radius,
                            spherical: true
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            address: 1,
                            phone: 1,
                            hours: 1,
                            distance: { $round: [{ $divide: ["$distance", 1000] }, 2] }
                        }
                    },
                    { $sort: { distance: 1 } }
                ]).toArray();

                resolve(stores);
            } catch (error) {
                reject(error);
            }
        });
    }
};
```

---

## ⚡ **Performance Optimization & Monitoring**

### Implementation:

```javascript
// helpers/performance-helpers.js
const db = require('../config/connection');

module.exports = {
    // Create all necessary indexes
    createOptimalIndexes: async () => {
        const productCollection = db.get().collection('product');
        const orderCollection = db.get().collection('order');
        const userCollection = db.get().collection('user');

        // Product indexes
        await productCollection.createIndex({ productName: "text", productDescription: "text", tags: "text" });
        await productCollection.createIndex({ Category: 1, productPrice: 1 });
        await productCollection.createIndex({ "ratings.average": -1, productPrice: 1 });
        await productCollection.createIndex({ stock: 1, isActive: 1 });
        await productCollection.createIndex({ createdAt: -1 });

        // Order indexes
        await orderCollection.createIndex({ userId: 1, createdAt: -1 });
        await orderCollection.createIndex({ status: 1, createdAt: -1 });
        await orderCollection.createIndex({ "products.item": 1 });
        await orderCollection.createIndex({ "deliveryDetails.location": "2dsphere" });

        // User indexes
        await userCollection.createIndex({ email: 1 }, { unique: true });
        await userCollection.createIndex({ username: 1 }, { unique: true });
        await userCollection.createIndex({ "addresses.location": "2dsphere" });

        console.log('✅ All indexes created successfully');
    },

    // Monitor query performance
    analyzeSlowQueries: async () => {
        // Enable profiling for slow queries
        await db.get().runCommand({
            profile: 2,
            slowms: 100 // Log queries slower than 100ms
        });

        // Get profiler data
        const slowQueries = await db.get().collection('system.profile')
            .find({ ts: { $gt: new Date(Date.now() - 3600000) } }) // Last hour
            .sort({ ts: -1 })
            .limit(10)
            .toArray();

        return slowQueries;
    },

    // Index usage statistics
    getIndexStats: async (collectionName) => {
        const stats = await db.get().collection(collectionName).aggregate([
            { $indexStats: {} }
        ]).toArray();

        return stats;
    }
};
```

---

## 🔒 **Advanced Order Processing with Transactions**

### Implementation:

```javascript
// helpers/transaction-helpers.js
const db = require('../config/connection');
const collections = require('../config/collections');
const { ObjectId } = require('mongodb');

module.exports = {
    // Process order with multi-document transaction
    processOrderWithTransaction: async (orderData, userId) => {
        const session = db.get().client.startSession();
        
        try {
            const result = await session.withTransaction(async () => {
                // 1. Validate and reserve inventory
                const inventoryUpdates = [];
                for (const item of orderData.products) {
                    const product = await db.get().collection(collections.PRODUCT_COLLECTION)
                        .findOne({ _id: ObjectId(item.productId) }, { session });
                    
                    if (!product || product.stock < item.quantity) {
                        throw new Error(`Insufficient stock for ${product?.productName || 'product'}`);
                    }
                    
                    inventoryUpdates.push({
                        updateOne: {
                            filter: { _id: ObjectId(item.productId) },
                            update: { 
                                $inc: { stock: -item.quantity },
                                $set: { updatedAt: new Date() }
                            }
                        }
                    });
                }

                // 2. Update inventory
                await db.get().collection(collections.PRODUCT_COLLECTION)
                    .bulkWrite(inventoryUpdates, { session });

                // 3. Create order
                const order = {
                    userId: ObjectId(userId),
                    products: orderData.products.map(item => ({
                        item: ObjectId(item.productId),
                        quantity: item.quantity,
                        price: item.price
                    })),
                    totalAmount: orderData.totalAmount,
                    status: 'placed',
                    paymentStatus: 'pending',
                    deliveryDetails: orderData.deliveryDetails,
                    createdAt: new Date()
                };

                const orderResult = await db.get().collection(collections.ORDER_COLLECTION)
                    .insertOne(order, { session });

                // 4. Update user's order history
                await db.get().collection(collections.USER_COLLECTION)
                    .updateOne(
                        { _id: ObjectId(userId) },
                        { 
                            $push: { orderHistory: orderResult.insertedId },
                            $set: { lastOrderDate: new Date() }
                        },
                        { session }
                    );

                // 5. Clear user's cart
                await db.get().collection(collections.CART_COLLECTION)
                    .deleteOne({ user: ObjectId(userId) }, { session });

                return orderResult.insertedId;
            });

            return result;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        } finally {
            await session.endSession();
        }
    },

    // Handle partial payments
    processPartialPayment: async (orderId, paymentAmount, paymentMethod) => {
        const session = db.get().client.startSession();
        
        try {
            const result = await session.withTransaction(async () => {
                // Get order details
                const order = await db.get().collection(collections.ORDER_COLLECTION)
                    .findOne({ _id: ObjectId(orderId) }, { session });

                if (!order) {
                    throw new Error('Order not found');
                }

                const paidAmount = (order.paidAmount || 0) + paymentAmount;
                const remainingAmount = order.totalAmount - paidAmount;

                // Update order with payment info
                const updateData = {
                    $inc: { paidAmount: paymentAmount },
                    $push: {
                        paymentHistory: {
                            amount: paymentAmount,
                            method: paymentMethod,
                            timestamp: new Date(),
                            transactionId: `txn_${Date.now()}`
                        }
                    },
                    $set: { updatedAt: new Date() }
                };

                // Update payment status based on amount paid
                if (remainingAmount <= 0) {
                    updateData.$set.paymentStatus = 'completed';
                    updateData.$set.status = 'processing';
                } else {
                    updateData.$set.paymentStatus = 'partial';
                }

                await db.get().collection(collections.ORDER_COLLECTION)
                    .updateOne({ _id: ObjectId(orderId) }, updateData, { session });

                return { paidAmount, remainingAmount };
            });

            return result;
        } catch (error) {
            console.error('Payment processing failed:', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }
};
```

---

## 🗄️ **Database Scaling Preparation**

### Sharding Strategy:

```javascript
// scripts/setup-sharding.js
// Run this in MongoDB shell for production setup

// 1. Enable sharding on database
sh.enableSharding("Ecommerce")

// 2. Shard product collection by category and _id
sh.shardCollection("Ecommerce.product", { "Category": 1, "_id": 1 })

// 3. Shard order collection by userId and createdAt
sh.shardCollection("Ecommerce.order", { "userId": 1, "createdAt": 1 })

// 4. Shard user collection by _id (hash-based)
sh.shardCollection("Ecommerce.user", { "_id": "hashed" })

// 5. Create zones for geographic distribution
sh.addShardToZone("shard0000", "US-EAST")
sh.addShardToZone("shard0001", "US-WEST")
sh.addShardToZone("shard0002", "EUROPE")

// 6. Update zone ranges
sh.updateZoneKeyRange("Ecommerce.order", 
    { "userId": MinKey, "createdAt": MinKey }, 
    { "userId": MaxKey, "createdAt": ISODate("2024-01-01") }, 
    "US-EAST"
)
```

### Replica Set Configuration:

```javascript
// scripts/setup-replica-set.js
rs.initiate({
    _id: "ecommerceRS",
    members: [
        { _id: 0, host: "mongo-primary:27017", priority: 2 },
        { _id: 1, host: "mongo-secondary1:27017", priority: 1 },
        { _id: 2, host: "mongo-secondary2:27017", priority: 1 },
        { _id: 3, host: "mongo-arbiter:27017", arbiterOnly: true }
    ]
})

// Set read preferences for different operations
// Analytics queries can read from secondaries
db.orders.find().readPref("secondary")

// Critical operations read from primary
db.orders.find().readPref("primary")
```

---

## 📊 **Implementation Checklist**

### **Week 2 - Day 1-2: Real-time Features**
- [ ] Implement change streams for inventory
- [ ] Set up low stock alerts
- [ ] Create automatic reorder system
- [ ] Test real-time updates

### **Week 2 - Day 3-4: Geospatial Features**
- [ ] Create geospatial indexes
- [ ] Implement store locator
- [ ] Add delivery zone calculation
- [ ] Integrate with order system

### **Week 2 - Day 5-6: Performance & Transactions**
- [ ] Create all performance indexes
- [ ] Implement transaction-based ordering
- [ ] Add partial payment support
- [ ] Performance monitoring setup

### **Week 2 - Day 7: Scaling Preparation**
- [ ] Document sharding strategy
- [ ] Set up replica set configuration
- [ ] Create deployment scripts
- [ ] Performance testing

---

## 🚀 **Deployment Commands**

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
export MONGODB_URL="mongodb://localhost:27017"
export SESSION_SECRET="your-secure-session-secret"
export RAZORPAY_KEY_ID="your-razorpay-key"
export RAZORPAY_KEY_SECRET="your-razorpay-secret"

# 3. Initialize database
node scripts/init-database.js

# 4. Create indexes
node scripts/create-indexes.js

# 5. Start application
npm start
```

---

## 🎯 **Learning Outcomes Summary**

By completing this implementation, you'll have mastered:

### **Advanced MongoDB Concepts:**
✅ **Aggregation Pipelines** - `$facet`, `$bucket`, `$graphLookup`, `$geoNear`
✅ **Text Search** - Full-text indexing, relevance scoring, fuzzy matching
✅ **Change Streams** - Real-time data monitoring and triggers
✅ **Geospatial Queries** - 2dsphere indexes, location-based features
✅ **Transactions** - Multi-document ACID transactions
✅ **Sharding & Replication** - Horizontal scaling strategies
✅ **Performance Optimization** - Strategic indexing, query optimization

### **Production-Ready Skills:**
✅ **Error Handling** - Comprehensive error management
✅ **Security** - Input validation, secure sessions, environment variables
✅ **Architecture** - Modular design, separation of concerns
✅ **Documentation** - API docs, code comments, deployment guides

---

**🎉 Congratulations!** You've built a production-ready e-commerce platform with advanced MongoDB features that would impress any senior developer or interviewer!