const db = require('../config/connection');
const collections = require('../config/collections');
const { ObjectId } = require('mongodb');

module.exports = {
    /**
     * Initialize search indexes for better performance
     * This should be called during application startup
     */
    initializeSearchIndexes: async () => {
        try {
            const productCollection = db.get().collection(collections.PRODUCT_COLLECTION);
            
            // Create text index for full-text search
            await productCollection.createIndex({
                productName: "text",
                productDescription: "text",
                tags: "text",
                Category: "text"
            }, {
                weights: {
                    productName: 10,
                    tags: 5,
                    Category: 3,
                    productDescription: 1
                },
                name: "product_text_index"
            });

            // Create compound indexes for filtering
            await productCollection.createIndex({ Category: 1, productPrice: 1 });
            await productCollection.createIndex({ productPrice: 1, stock: 1 });
            await productCollection.createIndex({ "ratings.average": -1, productPrice: 1 });
            await productCollection.createIndex({ createdAt: -1 });
            await productCollection.createIndex({ tags: 1 });

            console.log('Search indexes created successfully');
        } catch (error) {
            console.error('Error creating search indexes:', error);
        }
    },

    /**
     * Advanced Product Search with multiple filters and text search
     * Demonstrates: $text, $regex, compound queries, faceted search
     */
    advancedProductSearch: (searchParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                const {
                    query = '',
                    category = '',
                    minPrice = 0,
                    maxPrice = Number.MAX_VALUE,
                    minRating = 0,
                    sortBy = 'relevance',
                    page = 1,
                    limit = 20,
                    inStock = false
                } = searchParams;

                let searchQuery = {};
                let sortQuery = {};

                // Text search if query provided
                if (query) {
                    searchQuery.$text = { $search: query };
                }

                // Category filter
                if (category) {
                    searchQuery.Category = category;
                }

                // Price range filter
                if (minPrice > 0 || maxPrice < Number.MAX_VALUE) {
                    searchQuery.productPrice = {
                        $gte: parseFloat(minPrice),
                        $lte: parseFloat(maxPrice)
                    };
                }

                // Rating filter
                if (minRating > 0) {
                    searchQuery['ratings.average'] = { $gte: parseFloat(minRating) };
                }

                // Stock filter
                if (inStock) {
                    searchQuery.stock = { $gt: 0 };
                }

                // Active products only
                searchQuery.isActive = { $ne: false };

                // Sort logic
                switch (sortBy) {
                    case 'price_low':
                        sortQuery = { productPrice: 1 };
                        break;
                    case 'price_high':
                        sortQuery = { productPrice: -1 };
                        break;
                    case 'rating':
                        sortQuery = { 'ratings.average': -1 };
                        break;
                    case 'newest':
                        sortQuery = { createdAt: -1 };
                        break;
                    case 'relevance':
                    default:
                        if (query) {
                            sortQuery = { score: { $meta: "textScore" } };
                        } else {
                            sortQuery = { createdAt: -1 };
                        }
                }

                const skip = (page - 1) * limit;

                // Use aggregation for complex search with facets
                const results = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                    { $match: searchQuery },
                    {
                        $facet: {
                            // Main search results
                            products: [
                                ...(query ? [{ $addFields: { score: { $meta: "textScore" } } }] : []),
                                { $sort: sortQuery },
                                { $skip: skip },
                                { $limit: parseInt(limit) },
                                {
                                    $project: {
                                        productName: 1,
                                        productDescription: 1,
                                        productPrice: 1,
                                        Category: 1,
                                        stock: 1,
                                        tags: 1,
                                        images: 1,
                                        ratings: 1,
                                        createdAt: 1,
                                        ...(query ? { score: 1 } : {})
                                    }
                                }
                            ],
                            
                            // Facets for filtering
                            facets: [
                                {
                                    $facet: {
                                        categories: [
                                            { $group: { _id: "$Category", count: { $sum: 1 } } },
                                            { $sort: { count: -1 } }
                                        ],
                                        priceRanges: [
                                            {
                                                $bucket: {
                                                    groupBy: "$productPrice",
                                                    boundaries: [0, 500, 1000, 2500, 5000, 10000],
                                                    default: "10000+",
                                                    output: { count: { $sum: 1 } }
                                                }
                                            }
                                        ],
                                        ratingRanges: [
                                            {
                                                $bucket: {
                                                    groupBy: "$ratings.average",
                                                    boundaries: [0, 1, 2, 3, 4, 5],
                                                    default: "unrated",
                                                    output: { count: { $sum: 1 } }
                                                }
                                            }
                                        ],
                                        stockStatus: [
                                            {
                                                $group: {
                                                    _id: { $cond: [{ $gt: ["$stock", 0] }, "inStock", "outOfStock"] },
                                                    count: { $sum: 1 }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            
                            // Total count for pagination
                            totalCount: [
                                { $count: "count" }
                            ]
                        }
                    }
                ]).toArray();

                const searchResults = results[0];
                const totalCount = searchResults.totalCount.length > 0 ? searchResults.totalCount[0].count : 0;

                resolve({
                    products: searchResults.products,
                    facets: searchResults.facets[0],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalCount / limit),
                        totalResults: totalCount,
                        hasNext: page * limit < totalCount,
                        hasPrev: page > 1
                    },
                    searchParams
                });

            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Autocomplete suggestions based on product names and tags
     * Demonstrates: $regex, $addFields, text matching
     */
    getAutocompleteSuggestions: (query, limit = 10) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (!query || query.length < 2) {
                    resolve([]);
                    return;
                }

                const suggestions = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                    {
                        $match: {
                            $or: [
                                { productName: { $regex: query, $options: 'i' } },
                                { tags: { $regex: query, $options: 'i' } },
                                { Category: { $regex: query, $options: 'i' } }
                            ],
                            isActive: { $ne: false }
                        }
                    },
                    {
                        $addFields: {
                            suggestions: {
                                $concatArrays: [
                                    [{ type: 'product', text: '$productName', category: '$Category' }],
                                    {
                                        $map: {
                                            input: '$tags',
                                            as: 'tag',
                                            in: { type: 'tag', text: '$$tag', category: '$Category' }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    { $unwind: '$suggestions' },
                    {
                        $match: {
                            'suggestions.text': { $regex: query, $options: 'i' }
                        }
                    },
                    {
                        $group: {
                            _id: '$suggestions.text',
                            type: { $first: '$suggestions.type' },
                            category: { $first: '$suggestions.category' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1, _id: 1 } },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 0,
                            text: '$_id',
                            type: 1,
                            category: 1,
                            count: 1
                        }
                    }
                ]).toArray();

                resolve(suggestions);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Search Analytics - Track search terms and patterns
     * Demonstrates: upsert operations, search analytics
     */
    trackSearchQuery: (userId, query, resultsCount) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Store in user's search history
                if (userId) {
                    await db.get().collection(collections.USER_COLLECTION).updateOne(
                        { _id: ObjectId(userId) },
                        {
                            $push: {
                                searchHistory: {
                                    $each: [{ term: query, timestamp: new Date(), resultsCount }],
                                    $slice: -50 // Keep only last 50 searches
                                }
                            }
                        }
                    );
                }

                // Store global search analytics
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                await db.get().collection('search_analytics').updateOne(
                    {
                        date: today,
                        term: query
                    },
                    {
                        $inc: { 
                            searchCount: 1,
                            totalResults: resultsCount
                        },
                        $setOnInsert: {
                            createdAt: new Date()
                        },
                        $set: {
                            updatedAt: new Date()
                        }
                    },
                    { upsert: true }
                );

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Get popular search terms and analytics
     * Demonstrates: aggregation for analytics
     */
    getSearchAnalytics: (days = 30) => {
        return new Promise(async (resolve, reject) => {
            try {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);

                const analytics = await db.get().collection('search_analytics').aggregate([
                    {
                        $match: {
                            date: { $gte: startDate }
                        }
                    },
                    {
                        $facet: {
                            // Most popular search terms
                            popularTerms: [
                                {
                                    $group: {
                                        _id: '$term',
                                        totalSearches: { $sum: '$searchCount' },
                                        avgResults: { $avg: '$totalResults' },
                                        days: { $sum: 1 }
                                    }
                                },
                                { $sort: { totalSearches: -1 } },
                                { $limit: 20 }
                            ],
                            
                            // Search trends by date
                            dailyTrends: [
                                {
                                    $group: {
                                        _id: '$date',
                                        totalSearches: { $sum: '$searchCount' },
                                        uniqueTerms: { $sum: 1 }
                                    }
                                },
                                { $sort: { '_id': 1 } }
                            ],
                            
                            // Zero result searches (need attention)
                            zeroResults: [
                                {
                                    $match: {
                                        totalResults: 0
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$term',
                                        searchCount: { $sum: '$searchCount' }
                                    }
                                },
                                { $sort: { searchCount: -1 } },
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
     * Fuzzy search for handling typos and similar terms
     * Demonstrates: $regex with fuzzy matching logic
     */
    fuzzyProductSearch: (query, maxDistance = 2) => {
        return new Promise(async (resolve, reject) => {
            try {
                // First try exact text search
                let results = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                    $text: { $search: query },
                    isActive: { $ne: false }
                }).limit(10).toArray();

                // If no results, try fuzzy matching with regex
                if (results.length === 0) {
                    const fuzzyPattern = query.split('').join('.*?');
                    results = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                        $or: [
                            { productName: { $regex: fuzzyPattern, $options: 'i' } },
                            { tags: { $regex: fuzzyPattern, $options: 'i' } }
                        ],
                        isActive: { $ne: false }
                    }).limit(10).toArray();
                }

                // If still no results, try partial word matching
                if (results.length === 0 && query.length > 3) {
                    const partialQuery = query.substring(0, Math.floor(query.length * 0.7));
                    results = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                        $or: [
                            { productName: { $regex: partialQuery, $options: 'i' } },
                            { tags: { $regex: partialQuery, $options: 'i' } },
                            { Category: { $regex: partialQuery, $options: 'i' } }
                        ],
                        isActive: { $ne: false }
                    }).limit(10).toArray();
                }

                resolve(results);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Get related/similar products based on tags and category
     * Demonstrates: $in, $ne, complex matching
     */
    getRelatedProducts: (productId, limit = 6) => {
        return new Promise(async (resolve, reject) => {
            try {
                // First get the current product details
                const product = await db.get().collection(collections.PRODUCT_COLLECTION)
                    .findOne({ _id: ObjectId(productId) });

                if (!product) {
                    resolve([]);
                    return;
                }

                // Find related products based on tags and category
                const relatedProducts = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                    {
                        $match: {
                            _id: { $ne: ObjectId(productId) },
                            $or: [
                                { Category: product.Category },
                                { tags: { $in: product.tags || [] } }
                            ],
                            isActive: { $ne: false },
                            stock: { $gt: 0 }
                        }
                    },
                    {
                        $addFields: {
                            relevanceScore: {
                                $add: [
                                    { $cond: [{ $eq: ['$Category', product.Category] }, 3, 0] },
                                    { $size: { $setIntersection: ['$tags', product.tags || []] } }
                                ]
                            }
                        }
                    },
                    { $sort: { relevanceScore: -1, 'ratings.average': -1 } },
                    { $limit: limit },
                    {
                        $project: {
                            productName: 1,
                            productPrice: 1,
                            Category: 1,
                            images: 1,
                            ratings: 1,
                            relevanceScore: 1
                        }
                    }
                ]).toArray();

                resolve(relatedProducts);
            } catch (error) {
                reject(error);
            }
        });
    }
};