const db = require('../config/connection');
const collections = require('../config/collections');
const { ObjectId } = require('mongodb');

module.exports = {
    /**
     * "Users who bought this also bought" recommendations using $graphLookup
     * Demonstrates: $graphLookup, complex aggregation pipelines, collaborative filtering
     */
    getUsersWhoBoughtAlsoBought: (productId, userId = null, limit = 8) => {
        return new Promise(async (resolve, reject) => {
            try {
                const recommendations = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    // Find orders containing the target product
                    {
                        $match: {
                            'products.item': ObjectId(productId),
                            status: { $in: ['placed', 'processing', 'shipped', 'delivered'] }
                        }
                    },
                    
                    // Get all users who bought this product
                    {
                        $group: {
                            _id: null,
                            userIds: { $addToSet: '$userId' }
                        }
                    },
                    
                    // Use $graphLookup to find all orders by these users
                    {
                        $graphLookup: {
                            from: collections.ORDER_COLLECTION,
                            startWith: '$userIds',
                            connectFromField: 'userIds',
                            connectToField: 'userId',
                            as: 'relatedOrders',
                            restrictSearchWithMatch: {
                                status: { $in: ['placed', 'processing', 'shipped', 'delivered'] }
                            }
                        }
                    },
                    
                    // Unwind the related orders
                    { $unwind: '$relatedOrders' },
                    
                    // Unwind the products in each order
                    { $unwind: '$relatedOrders.products' },
                    
                    // Exclude the original product
                    {
                        $match: {
                            'relatedOrders.products.item': { $ne: ObjectId(productId) }
                        }
                    },
                    
                    // Group by product to count co-occurrences
                    {
                        $group: {
                            _id: '$relatedOrders.products.item',
                            coOccurrenceCount: { $sum: 1 },
                            totalQuantity: { $sum: '$relatedOrders.products.quantity' },
                            avgPrice: { $avg: '$relatedOrders.products.price' },
                            uniqueUsers: { $addToSet: '$relatedOrders.userId' }
                        }
                    },
                    
                    // Calculate recommendation score
                    {
                        $addFields: {
                            recommendationScore: {
                                $multiply: [
                                    '$coOccurrenceCount',
                                    { $size: '$uniqueUsers' },
                                    { $divide: ['$totalQuantity', '$coOccurrenceCount'] }
                                ]
                            }
                        }
                    },
                    
                    // Lookup product details
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: '_id',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    
                    { $unwind: '$product' },
                    
                    // Filter active products with stock
                    {
                        $match: {
                            'product.isActive': { $ne: false },
                            'product.stock': { $gt: 0 }
                        }
                    },
                    
                    // Sort by recommendation score
                    { $sort: { recommendationScore: -1 } },
                    { $limit: limit },
                    
                    // Project final result
                    {
                        $project: {
                            productId: '$_id',
                            productName: '$product.productName',
                            productPrice: '$product.productPrice',
                            category: '$product.Category',
                            images: '$product.images',
                            ratings: '$product.ratings',
                            stock: '$product.stock',
                            coOccurrenceCount: 1,
                            recommendationScore: { $round: ['$recommendationScore', 2] },
                            uniqueUserCount: { $size: '$uniqueUsers' }
                        }
                    }
                ]).toArray();
                
                resolve(recommendations);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Personalized recommendations based on user's purchase history and preferences
     * Demonstrates: Complex user behavior analysis, weighted scoring
     */
    getPersonalizedRecommendations: (userId, limit = 10) => {
        return new Promise(async (resolve, reject) => {
            try {
                const recommendations = await db.get().collection(collections.USER_COLLECTION).aggregate([
                    { $match: { _id: ObjectId(userId) } },
                    
                    // Lookup user's order history
                    {
                        $lookup: {
                            from: collections.ORDER_COLLECTION,
                            localField: '_id',
                            foreignField: 'userId',
                            as: 'orders'
                        }
                    },
                    
                    // Filter successful orders
                    {
                        $addFields: {
                            successfulOrders: {
                                $filter: {
                                    input: '$orders',
                                    cond: { $in: ['$$this.status', ['placed', 'processing', 'shipped', 'delivered']] }
                                }
                            }
                        }
                    },
                    
                    // Extract user preferences
                    {
                        $addFields: {
                            purchasedProducts: {
                                $reduce: {
                                    input: '$successfulOrders',
                                    initialValue: [],
                                    in: { $concatArrays: ['$$value', '$$this.products'] }
                                }
                            },
                            totalSpent: { $sum: '$successfulOrders.totalAmount' },
                            avgOrderValue: { $avg: '$successfulOrders.totalAmount' }
                        }
                    },
                    
                    // Analyze user's category preferences
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: 'purchasedProducts.item',
                            foreignField: '_id',
                            as: 'purchasedProductDetails'
                        }
                    },
                    
                    // Calculate category preferences and price range
                    {
                        $addFields: {
                            categoryPreferences: {
                                $reduce: {
                                    input: '$purchasedProductDetails',
                                    initialValue: {},
                                    in: {
                                        $mergeObjects: [
                                            '$$value',
                                            {
                                                $arrayToObject: [[{
                                                    k: '$$this.Category',
                                                    v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.Category', input: '$$value' } }, 0] }, 1] }
                                                }]]
                                            }
                                        ]
                                    }
                                }
                            },
                            avgPriceRange: { $avg: '$purchasedProductDetails.productPrice' },
                            preferredTags: {
                                $reduce: {
                                    input: '$purchasedProductDetails',
                                    initialValue: [],
                                    in: { $concatArrays: ['$$value', { $ifNull: ['$$this.tags', []] }] }
                                }
                            }
                        }
                    },
                    
                    // Find similar users using $graphLookup
                    {
                        $graphLookup: {
                            from: collections.ORDER_COLLECTION,
                            startWith: '$purchasedProducts.item',
                            connectFromField: 'products.item',
                            connectToField: 'products.item',
                            as: 'similarUserOrders',
                            restrictSearchWithMatch: {
                                userId: { $ne: ObjectId(userId) },
                                status: { $in: ['placed', 'processing', 'shipped', 'delivered'] }
                            }
                        }
                    },
                    
                    // Process similar users' purchases
                    { $unwind: { path: '$similarUserOrders', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$similarUserOrders.products', preserveNullAndEmptyArrays: true } },
                    
                    // Exclude already purchased products
                    {
                        $match: {
                            $expr: {
                                $not: {
                                    $in: ['$similarUserOrders.products.item', '$purchasedProducts.item']
                                }
                            }
                        }
                    },
                    
                    // Group recommendations by product
                    {
                        $group: {
                            _id: {
                                userId: '$_id',
                                productId: '$similarUserOrders.products.item'
                            },
                            originalUser: { $first: '$$ROOT' },
                            similarityScore: { $sum: 1 },
                            avgPrice: { $avg: '$similarUserOrders.products.price' }
                        }
                    },
                    
                    // Lookup product details for recommendations
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: '_id.productId',
                            foreignField: '_id',
                            as: 'recommendedProduct'
                        }
                    },
                    
                    { $unwind: '$recommendedProduct' },
                    
                    // Filter active products
                    {
                        $match: {
                            'recommendedProduct.isActive': { $ne: false },
                            'recommendedProduct.stock': { $gt: 0 }
                        }
                    },
                    
                    // Calculate final recommendation score
                    {
                        $addFields: {
                            categoryMatch: {
                                $cond: [
                                    { $in: ['$recommendedProduct.Category', { $objectToArray: '$originalUser.categoryPreferences' }] },
                                    5,
                                    0
                                ]
                            },
                            priceMatch: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gte: ['$recommendedProduct.productPrice', { $multiply: ['$originalUser.avgPriceRange', 0.7] }] },
                                            { $lte: ['$recommendedProduct.productPrice', { $multiply: ['$originalUser.avgPriceRange', 1.3] }] }
                                        ]
                                    },
                                    3,
                                    0
                                ]
                            },
                            ratingBonus: { $multiply: [{ $ifNull: ['$recommendedProduct.ratings.average', 0] }, 2] },
                            finalScore: {
                                $add: [
                                    '$similarityScore',
                                    '$categoryMatch',
                                    '$priceMatch',
                                    '$ratingBonus'
                                ]
                            }
                        }
                    },
                    
                    // Sort and limit results
                    { $sort: { finalScore: -1 } },
                    { $limit: limit },
                    
                    // Project final result
                    {
                        $project: {
                            productId: '$_id.productId',
                            productName: '$recommendedProduct.productName',
                            productPrice: '$recommendedProduct.productPrice',
                            category: '$recommendedProduct.Category',
                            images: '$recommendedProduct.images',
                            ratings: '$recommendedProduct.ratings',
                            stock: '$recommendedProduct.stock',
                            recommendationReason: {
                                similarityScore: '$similarityScore',
                                categoryMatch: { $gt: ['$categoryMatch', 0] },
                                priceMatch: { $gt: ['$priceMatch', 0] },
                                finalScore: { $round: ['$finalScore', 2] }
                            }
                        }
                    }
                ]).toArray();
                
                resolve(recommendations);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Trending products based on recent purchase patterns
     * Demonstrates: Time-based aggregation, trending algorithms
     */
    getTrendingProducts: (days = 7, limit = 12) => {
        return new Promise(async (resolve, reject) => {
            try {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                
                const trending = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                            status: { $in: ['placed', 'processing', 'shipped', 'delivered'] }
                        }
                    },
                    
                    { $unwind: '$products' },
                    
                    // Group by product and calculate trending metrics
                    {
                        $group: {
                            _id: '$products.item',
                            recentSales: { $sum: '$products.quantity' },
                            recentRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
                            uniqueBuyers: { $addToSet: '$userId' },
                            orderCount: { $sum: 1 },
                            avgPrice: { $avg: '$products.price' },
                            salesDates: { $push: '$createdAt' }
                        }
                    },
                    
                    // Calculate trending score
                    {
                        $addFields: {
                            uniqueBuyerCount: { $size: '$uniqueBuyers' },
                            salesVelocity: { $divide: ['$recentSales', days] },
                            buyerDiversity: { $divide: ['$uniqueBuyerCount', '$orderCount'] },
                            trendingScore: {
                                $multiply: [
                                    { $divide: ['$recentSales', days] }, // Daily sales rate
                                    { $size: '$uniqueBuyers' }, // Unique buyer count
                                    { $divide: ['$recentRevenue', '$recentSales'] } // Average price
                                ]
                            }
                        }
                    },
                    
                    // Lookup product details
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: '_id',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    
                    { $unwind: '$product' },
                    
                    // Filter active products
                    {
                        $match: {
                            'product.isActive': { $ne: false },
                            'product.stock': { $gt: 0 },
                            recentSales: { $gte: 2 } // Minimum sales threshold
                        }
                    },
                    
                    { $sort: { trendingScore: -1 } },
                    { $limit: limit },
                    
                    {
                        $project: {
                            productId: '$_id',
                            productName: '$product.productName',
                            productPrice: '$product.productPrice',
                            category: '$product.Category',
                            images: '$product.images',
                            ratings: '$product.ratings',
                            stock: '$product.stock',
                            trendingMetrics: {
                                recentSales: '$recentSales',
                                uniqueBuyers: '$uniqueBuyerCount',
                                salesVelocity: { $round: ['$salesVelocity', 2] },
                                trendingScore: { $round: ['$trendingScore', 2] }
                            }
                        }
                    }
                ]).toArray();
                
                resolve(trending);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Cross-category recommendations using association rules
     * Demonstrates: Market basket analysis, association rule mining
     */
    getCrossCategoryRecommendations: (userId, limit = 6) => {
        return new Promise(async (resolve, reject) => {
            try {
                const recommendations = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    // Find user's recent orders
                    {
                        $match: {
                            userId: ObjectId(userId),
                            status: { $in: ['placed', 'processing', 'shipped', 'delivered'] }
                        }
                    },
                    
                    // Get user's purchased categories
                    { $unwind: '$products' },
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: 'products.item',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    { $unwind: '$productDetails' },
                    
                    {
                        $group: {
                            _id: '$userId',
                            purchasedCategories: { $addToSet: '$productDetails.Category' }
                        }
                    },
                    
                    // Find frequent category combinations using $graphLookup
                    {
                        $graphLookup: {
                            from: collections.ORDER_COLLECTION,
                            startWith: '$purchasedCategories',
                            connectFromField: 'purchasedCategories',
                            connectToField: 'products.item',
                            as: 'categoryAssociations'
                        }
                    },
                    
                    // Process associations to find cross-category patterns
                    { $unwind: '$categoryAssociations' },
                    { $unwind: '$categoryAssociations.products' },
                    
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: 'categoryAssociations.products.item',
                            foreignField: '_id',
                            as: 'associatedProduct'
                        }
                    },
                    { $unwind: '$associatedProduct' },
                    
                    // Exclude categories user already bought from
                    {
                        $match: {
                            $expr: {
                                $not: {
                                    $in: ['$associatedProduct.Category', '$purchasedCategories']
                                }
                            }
                        }
                    },
                    
                    // Group by category and calculate association strength
                    {
                        $group: {
                            _id: '$associatedProduct.Category',
                            associationCount: { $sum: 1 },
                            products: { $addToSet: '$associatedProduct' },
                            avgPrice: { $avg: '$associatedProduct.productPrice' }
                        }
                    },
                    
                    // Select best products from each recommended category
                    {
                        $addFields: {
                            topProducts: {
                                $slice: [
                                    {
                                        $sortArray: {
                                            input: '$products',
                                            sortBy: { 'ratings.average': -1 }
                                        }
                                    },
                                    2
                                ]
                            }
                        }
                    },
                    
                    { $unwind: '$topProducts' },
                    
                    // Filter active products with stock
                    {
                        $match: {
                            'topProducts.isActive': { $ne: false },
                            'topProducts.stock': { $gt: 0 }
                        }
                    },
                    
                    { $sort: { associationCount: -1 } },
                    { $limit: limit },
                    
                    {
                        $project: {
                            productId: '$topProducts._id',
                            productName: '$topProducts.productName',
                            productPrice: '$topProducts.productPrice',
                            category: '$topProducts.Category',
                            images: '$topProducts.images',
                            ratings: '$topProducts.ratings',
                            stock: '$topProducts.stock',
                            recommendationReason: {
                                type: 'cross-category',
                                associationStrength: '$associationCount',
                                newCategory: '$_id'
                            }
                        }
                    }
                ]).toArray();
                
                resolve(recommendations);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Seasonal and time-based recommendations
     * Demonstrates: Time-based patterns, seasonal analysis
     */
    getSeasonalRecommendations: (limit = 8) => {
        return new Promise(async (resolve, reject) => {
            try {
                const currentMonth = new Date().getMonth() + 1;
                const currentSeason = Math.ceil(currentMonth / 3);
                
                // Get data from same season in previous years
                const recommendations = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $addFields: {
                            orderMonth: { $month: '$createdAt' },
                            orderSeason: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
                        }
                    },
                    
                    {
                        $match: {
                            orderSeason: currentSeason,
                            status: { $in: ['placed', 'processing', 'shipped', 'delivered'] }
                        }
                    },
                    
                    { $unwind: '$products' },
                    
                    {
                        $group: {
                            _id: '$products.item',
                            seasonalSales: { $sum: '$products.quantity' },
                            seasonalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
                            yearsSold: { $addToSet: { $year: '$createdAt' } },
                            avgSeasonalPrice: { $avg: '$products.price' }
                        }
                    },
                    
                    // Calculate seasonal strength
                    {
                        $addFields: {
                            seasonalStrength: {
                                $multiply: [
                                    '$seasonalSales',
                                    { $size: '$yearsSold' }
                                ]
                            }
                        }
                    },
                    
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: '_id',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    
                    { $unwind: '$product' },
                    
                    {
                        $match: {
                            'product.isActive': { $ne: false },
                            'product.stock': { $gt: 0 },
                            seasonalSales: { $gte: 3 }
                        }
                    },
                    
                    { $sort: { seasonalStrength: -1 } },
                    { $limit: limit },
                    
                    {
                        $project: {
                            productId: '$_id',
                            productName: '$product.productName',
                            productPrice: '$product.productPrice',
                            category: '$product.Category',
                            images: '$product.images',
                            ratings: '$product.ratings',
                            stock: '$product.stock',
                            seasonalInfo: {
                                season: currentSeason,
                                seasonalSales: '$seasonalSales',
                                yearsSold: { $size: '$yearsSold' },
                                seasonalStrength: { $round: ['$seasonalStrength', 2] }
                            }
                        }
                    }
                ]).toArray();
                
                resolve(recommendations);
            } catch (error) {
                reject(error);
            }
        });
    }
};