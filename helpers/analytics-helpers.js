const db = require('../config/connection');
const collections = require('../config/collections');
const { ObjectId } = require('mongodb');

module.exports = {
    /**
     * Advanced Sales Analytics using $facet for multiple aggregations in one query
     * Demonstrates: $facet, $bucket, $dateToString, $cond, $sum, $avg
     */
    getAdvancedSalesAnalytics: (startDate, endDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                const analytics = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate)
                            },
                            status: { $in: ['placed', 'processing', 'shipped', 'delivered'] }
                        }
                    },
                    {
                        // $facet allows multiple aggregation pipelines in parallel
                        $facet: {
                            // Sales by date buckets
                            salesByDate: [
                                {
                                    $group: {
                                        _id: {
                                            $dateToString: {
                                                format: "%Y-%m-%d",
                                                date: "$createdAt"
                                            }
                                        },
                                        totalSales: { $sum: "$totalAmount" },
                                        orderCount: { $sum: 1 },
                                        avgOrderValue: { $avg: "$totalAmount" }
                                    }
                                },
                                { $sort: { "_id": 1 } }
                            ],
                            
                            // Sales by price buckets
                            salesByPriceBucket: [
                                {
                                    $bucket: {
                                        groupBy: "$totalAmount",
                                        boundaries: [0, 500, 1000, 2500, 5000, 10000],
                                        default: "10000+",
                                        output: {
                                            count: { $sum: 1 },
                                            totalSales: { $sum: "$totalAmount" },
                                            avgOrderValue: { $avg: "$totalAmount" },
                                            orders: {
                                                $push: {
                                                    orderId: "$_id",
                                                    amount: "$totalAmount",
                                                    date: "$createdAt"
                                                }
                                            }
                                        }
                                    }
                                }
                            ],
                            
                            // Payment method analysis
                            paymentMethodAnalysis: [
                                {
                                    $group: {
                                        _id: "$paymentMethod",
                                        count: { $sum: 1 },
                                        totalAmount: { $sum: "$totalAmount" },
                                        avgAmount: { $avg: "$totalAmount" },
                                        successRate: {
                                            $avg: {
                                                $cond: [
                                                    { $eq: ["$paymentStatus", "completed"] },
                                                    1,
                                                    0
                                                ]
                                            }
                                        }
                                    }
                                },
                                { $sort: { totalAmount: -1 } }
                            ],
                            
                            // Geographic distribution
                            geographicDistribution: [
                                {
                                    $group: {
                                        _id: "$deliveryDetails.state",
                                        orderCount: { $sum: 1 },
                                        totalSales: { $sum: "$totalAmount" },
                                        avgOrderValue: { $avg: "$totalAmount" },
                                        cities: { $addToSet: "$deliveryDetails.city" }
                                    }
                                },
                                { $sort: { totalSales: -1 } },
                                { $limit: 10 }
                            ],
                            
                            // Order status distribution
                            statusDistribution: [
                                {
                                    $group: {
                                        _id: "$status",
                                        count: { $sum: 1 },
                                        totalValue: { $sum: "$totalAmount" }
                                    }
                                }
                            ],
                            
                            // Overall summary
                            overallSummary: [
                                {
                                    $group: {
                                        _id: null,
                                        totalOrders: { $sum: 1 },
                                        totalRevenue: { $sum: "$totalAmount" },
                                        avgOrderValue: { $avg: "$totalAmount" },
                                        maxOrderValue: { $max: "$totalAmount" },
                                        minOrderValue: { $min: "$totalAmount" },
                                        uniqueCustomers: { $addToSet: "$userId" }
                                    }
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        totalOrders: 1,
                                        totalRevenue: 1,
                                        avgOrderValue: { $round: ["$avgOrderValue", 2] },
                                        maxOrderValue: 1,
                                        minOrderValue: 1,
                                        uniqueCustomerCount: { $size: "$uniqueCustomers" }
                                    }
                                }
                            ]
                        }
                    }
                ]).toArray();
                
                resolve(analytics[0]);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Product Performance Analytics with advanced aggregation
     * Demonstrates: $unwind, $lookup, $addFields, $bucket, $sortByCount
     */
    getProductPerformanceAnalytics: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const analytics = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            status: { $in: ['placed', 'processing', 'shipped', 'delivered'] }
                        }
                    },
                    {
                        $unwind: "$products"
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: "products.item",
                            foreignField: "_id",
                            as: "productDetails"
                        }
                    },
                    {
                        $unwind: "$productDetails"
                    },
                    {
                        $addFields: {
                            revenue: { $multiply: ["$products.quantity", "$products.price"] }
                        }
                    },
                    {
                        $facet: {
                            // Top performing products
                            topProducts: [
                                {
                                    $group: {
                                        _id: "$products.item",
                                        productName: { $first: "$productDetails.productName" },
                                        category: { $first: "$productDetails.Category" },
                                        totalQuantitySold: { $sum: "$products.quantity" },
                                        totalRevenue: { $sum: "$revenue" },
                                        orderCount: { $sum: 1 },
                                        avgOrderQuantity: { $avg: "$products.quantity" }
                                    }
                                },
                                { $sort: { totalRevenue: -1 } },
                                { $limit: 20 }
                            ],
                            
                            // Category performance
                            categoryPerformance: [
                                {
                                    $group: {
                                        _id: "$productDetails.Category",
                                        totalProducts: { $addToSet: "$products.item" },
                                        totalQuantitySold: { $sum: "$products.quantity" },
                                        totalRevenue: { $sum: "$revenue" },
                                        avgPrice: { $avg: "$products.price" }
                                    }
                                },
                                {
                                    $project: {
                                        category: "$_id",
                                        uniqueProductCount: { $size: "$totalProducts" },
                                        totalQuantitySold: 1,
                                        totalRevenue: 1,
                                        avgPrice: { $round: ["$avgPrice", 2] }
                                    }
                                },
                                { $sort: { totalRevenue: -1 } }
                            ],
                            
                            // Revenue distribution by buckets
                            revenueDistribution: [
                                {
                                    $group: {
                                        _id: "$products.item",
                                        productName: { $first: "$productDetails.productName" },
                                        totalRevenue: { $sum: "$revenue" }
                                    }
                                },
                                {
                                    $bucket: {
                                        groupBy: "$totalRevenue",
                                        boundaries: [0, 1000, 5000, 10000, 25000, 50000],
                                        default: "50000+",
                                        output: {
                                            count: { $sum: 1 },
                                            products: {
                                                $push: {
                                                    name: "$productName",
                                                    revenue: "$totalRevenue"
                                                }
                                            }
                                        }
                                    }
                                }
                            ],
                            
                            // Low performing products (need attention)
                            lowPerformingProducts: [
                                {
                                    $group: {
                                        _id: "$products.item",
                                        productName: { $first: "$productDetails.productName" },
                                        category: { $first: "$productDetails.Category" },
                                        totalQuantitySold: { $sum: "$products.quantity" },
                                        totalRevenue: { $sum: "$revenue" }
                                    }
                                },
                                { $sort: { totalRevenue: 1 } },
                                { $limit: 10 }
                            ]
                        }
                    }
                ]).toArray();
                
                resolve(analytics[0]);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Customer Behavior Analytics
     * Demonstrates: $graphLookup, complex grouping, user journey analysis
     */
    getCustomerBehaviorAnalytics: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const analytics = await db.get().collection(collections.USER_COLLECTION).aggregate([
                    {
                        $lookup: {
                            from: collections.ORDER_COLLECTION,
                            localField: "_id",
                            foreignField: "userId",
                            as: "orders"
                        }
                    },
                    {
                        $addFields: {
                            orderCount: { $size: "$orders" },
                            totalSpent: { $sum: "$orders.totalAmount" },
                            avgOrderValue: { $avg: "$orders.totalAmount" },
                            lastOrderDate: { $max: "$orders.createdAt" },
                            firstOrderDate: { $min: "$orders.createdAt" }
                        }
                    },
                    {
                        $facet: {
                            // Customer segmentation by spending
                            customerSegmentation: [
                                {
                                    $bucket: {
                                        groupBy: "$totalSpent",
                                        boundaries: [0, 1000, 5000, 10000, 25000],
                                        default: "VIP",
                                        output: {
                                            count: { $sum: 1 },
                                            avgOrderValue: { $avg: "$avgOrderValue" },
                                            avgOrderCount: { $avg: "$orderCount" },
                                            customers: {
                                                $push: {
                                                    username: "$username",
                                                    totalSpent: "$totalSpent",
                                                    orderCount: "$orderCount"
                                                }
                                            }
                                        }
                                    }
                                }
                            ],
                            
                            // Customer lifetime analysis
                            lifetimeAnalysis: [
                                {
                                    $addFields: {
                                        customerLifetime: {
                                            $divide: [
                                                { $subtract: ["$lastOrderDate", "$firstOrderDate"] },
                                                86400000 // milliseconds in a day
                                            ]
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        avgCustomerLifetime: { $avg: "$customerLifetime" },
                                        avgTotalSpent: { $avg: "$totalSpent" },
                                        avgOrderCount: { $avg: "$orderCount" },
                                        totalCustomers: { $sum: 1 }
                                    }
                                }
                            ],
                            
                            // Repeat customer analysis
                            repeatCustomerAnalysis: [
                                {
                                    $group: {
                                        _id: {
                                            $switch: {
                                                branches: [
                                                    { case: { $eq: ["$orderCount", 1] }, then: "One-time" },
                                                    { case: { $lte: ["$orderCount", 3] }, then: "Occasional" },
                                                    { case: { $lte: ["$orderCount", 10] }, then: "Regular" }
                                                ],
                                                default: "Loyal"
                                            }
                                        },
                                        count: { $sum: 1 },
                                        avgSpent: { $avg: "$totalSpent" },
                                        totalRevenue: { $sum: "$totalSpent" }
                                    }
                                }
                            ]
                        }
                    }
                ]).toArray();
                
                resolve(analytics[0]);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Real-time Dashboard Data
     * Demonstrates: $dateFromString, $dateTrunc, recent data analysis
     */
    getRealTimeDashboard: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const today = new Date();
                const last30Days = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
                
                const dashboard = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $facet: {
                            // Today's stats
                            todayStats: [
                                {
                                    $match: {
                                        createdAt: {
                                            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        todayOrders: { $sum: 1 },
                                        todayRevenue: { $sum: "$totalAmount" },
                                        avgOrderValue: { $avg: "$totalAmount" }
                                    }
                                }
                            ],
                            
                            // Last 30 days trend
                            monthlyTrend: [
                                {
                                    $match: {
                                        createdAt: { $gte: last30Days }
                                    }
                                },
                                {
                                    $group: {
                                        _id: {
                                            $dateToString: {
                                                format: "%Y-%m-%d",
                                                date: "$createdAt"
                                            }
                                        },
                                        orders: { $sum: 1 },
                                        revenue: { $sum: "$totalAmount" }
                                    }
                                },
                                { $sort: { "_id": 1 } }
                            ],
                            
                            // Pending orders requiring attention
                            pendingOrders: [
                                {
                                    $match: {
                                        status: { $in: ["pending", "processing"] }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: collections.USER_COLLECTION,
                                        localField: "userId",
                                        foreignField: "_id",
                                        as: "customer"
                                    }
                                },
                                {
                                    $project: {
                                        orderId: "$_id",
                                        customerName: { $arrayElemAt: ["$customer.username", 0] },
                                        totalAmount: 1,
                                        status: 1,
                                        createdAt: 1,
                                        daysSinceOrder: {
                                            $divide: [
                                                { $subtract: [new Date(), "$createdAt"] },
                                                86400000
                                            ]
                                        }
                                    }
                                },
                                { $sort: { createdAt: 1 } },
                                { $limit: 20 }
                            ]
                        }
                    }
                ]).toArray();
                
                resolve(dashboard[0]);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Store analytics data for future reference
     * Demonstrates: upsert operations and data archiving
     */
    storeAnalyticsSnapshot: (type, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const result = await db.get().collection('analytics').updateOne(
                    {
                        type: type,
                        date: today
                    },
                    {
                        $set: {
                            data: data,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    { upsert: true }
                );
                
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
};