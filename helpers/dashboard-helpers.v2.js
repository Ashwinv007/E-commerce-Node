var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectId

module.exports = {

    getAdminDashboardData: () => {
        return new Promise(async (resolve, reject) => {
            let response = {};

            try {
                let allOrders = await db.get().collection(collections.ORDER_COLLECTION).find().toArray();

                // Total orders
                response.totalOrders = allOrders.length;

                // Total customers
                let totalCustomers = await db.get().collection(collections.USER_COLLECTION).countDocuments();
                response.totalCustomers = totalCustomers;

                // Order status distribution
                let orderStatus = {};
                allOrders.forEach(order => {
                    if (orderStatus[order.status]) {
                        orderStatus[order.status]++;
                    } else {
                        orderStatus[order.status] = 1;
                    }
                });
                response.orderStatus = Object.keys(orderStatus).map(key => ({ _id: key, count: orderStatus[key] }));

                // Total revenue (platform fees)
                let totalRevenue = 0;
                allOrders.forEach(order => {
                    if (order.status !== 'pending') {
                        if (order.paymentMethod !== 'COD') {
                            totalRevenue += order.platformFee || (order.totalAmount * 0.1);
                        } else {
                            if (order.deliveryDetails && order.deliveryDetails.trackOrder.delivered.status) {
                                totalRevenue += order.platformFee || (order.totalAmount * 0.1);
                            }
                        }
                    }
                });
                response.totalRevenue = totalRevenue;

                // Avg order value
                let totalSalesValue = 0;
                let completedOrders = 0;
                allOrders.forEach(order => {
                    if (order.status !== 'pending') {
                        totalSalesValue += order.totalAmount;
                        completedOrders++;
                    }
                });
                response.avgOrderValue = completedOrders > 0 ? totalSalesValue / completedOrders : 0;

                // Payment methods
                let paymentMethods = {};
                allOrders.forEach(order => {
                    if (paymentMethods[order.paymentMethod]) {
                        paymentMethods[order.paymentMethod]++;
                    } else {
                        paymentMethods[order.paymentMethod] = 1;
                    }
                });
                response.paymentMethods = Object.keys(paymentMethods).map(key => ({ _id: key, count: paymentMethods[key] }));

                // Sales in last 7 days
                let salesLast7Days = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            status: { $ne: 'pending' },
                            date: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) }
                        }
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            total: { $sum: "$totalAmount" }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    }
                ]).toArray();
                response.salesLast7Days = salesLast7Days;

                // Top products
                let topProducts = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    { $unwind: "$products" },
                    { $group: { _id: "$products.item", count: { $sum: "$products.quantity" } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 },
                    { $lookup: { from: collections.PRODUCT_COLLECTION, localField: "_id", foreignField: "_id", as: "product" } },
                    { $unwind: "$product" },
                    { $project: { _id: 0, productName: "$product.productName", count: 1 } }
                ]).toArray();
                response.topProducts = topProducts;

                resolve(response);
            } catch (error) {
                reject(error);
            }
        })
    },

    getSellerDashboardData: (sellerId) => {
        return new Promise(async (resolve, reject) => {
            let response = {};
            try {
                let sellerProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({ sellerId: sellerId }).project({ _id: 1 }).toArray();
                let sellerProductIds = sellerProducts.map(p => p._id);

                let orders = await db.get().collection(collections.ORDER_COLLECTION).find({ "products.item": { $in: sellerProductIds } }).toArray();

                response.totalOrders = orders.length;

                let totalRevenue = 0;
                let totalCustomers = new Set();
                let paymentMethods = {};
                let orderStatus = {};
                let totalSalesValue = 0;
                let completedOrders = 0;

                for (let order of orders) {
                    let sellerOrderValue = 0;
                    let isSellerOrder = false;
                    for (const product of order.products) {
                        if (sellerProductIds.some(id => id.equals(product.item))) {
                            isSellerOrder = true;
                            // This is a simplified calculation. A more accurate calculation would be to sum up the price of the seller's products in the order.
                            // However, without the product price in the order's product list, this is the best we can do.
                        }
                    }

                    if (isSellerOrder) {
                        if (order.status !== 'pending') {
                             if (order.paymentMethod !== 'COD') {
                                totalRevenue += order.sellerShare || (order.totalAmount * 0.9);
                            } else {
                                if (order.deliveryDetails && order.deliveryDetails.trackOrder.delivered.status) {
                                    totalRevenue += order.sellerShare || (order.totalAmount * 0.9);
                                }
                            }
                            totalSalesValue += order.totalAmount;
                            completedOrders++;
                        }
                        
                        totalCustomers.add(order.userId.toString());

                        if (paymentMethods[order.paymentMethod]) {
                            paymentMethods[order.paymentMethod]++;
                        } else {
                            paymentMethods[order.paymentMethod] = 1;
                        }

                        if (orderStatus[order.status]) {
                            orderStatus[order.status]++;
                        } else {
                            orderStatus[order.status] = 1;
                        }
                    }
                }

                response.totalRevenue = totalRevenue;
                response.totalCustomers = totalCustomers.size;
                response.avgOrderValue = completedOrders > 0 ? totalSalesValue / completedOrders : 0;
                response.paymentMethods = Object.keys(paymentMethods).map(key => ({ _id: key, count: paymentMethods[key] }));
                response.orderStatus = Object.keys(orderStatus).map(key => ({ _id: key, count: orderStatus[key] }));

                // Sales in last 7 days for seller
                let salesLast7Days = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    { $match: { "products.item": { $in: sellerProductIds }, status: { $ne: 'pending' }, date: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) } } },
                    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: "$totalAmount" } } },
                    { $sort: { _id: 1 } }
                ]).toArray();
                response.salesLast7Days = salesLast7Days;

                // Top products for seller
                let topProducts = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    { $unwind: "$products" },
                    { $match: { "products.item": { $in: sellerProductIds } } },
                    { $group: { _id: "$products.item", count: { $sum: "$products.quantity" } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 },
                    { $lookup: { from: collections.PRODUCT_COLLECTION, localField: "_id", foreignField: "_id", as: "product" } },
                    { $unwind: "$product" },
                    { $project: { _id: 0, productName: "$product.productName", count: 1 } }
                ]).toArray();
                response.topProducts = topProducts;
                
                resolve(response);
            } catch (error) {
                reject(error);
            }
        })
    }
}
