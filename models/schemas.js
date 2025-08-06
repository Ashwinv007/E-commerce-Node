const { ObjectId } = require('mongodb');

// Product Schema with validation
const productSchema = {
    bsonType: "object",
    required: ["productName", "productPrice", "Category", "stock", "createdAt"],
    properties: {
        _id: { bsonType: "objectId" },
        productName: {
            bsonType: "string",
            minLength: 2,
            maxLength: 100,
            description: "Product name is required and must be 2-100 characters"
        },
        productDescription: {
            bsonType: "string",
            maxLength: 1000,
            description: "Product description must not exceed 1000 characters"
        },
        productPrice: {
            bsonType: "double",
            minimum: 0,
            description: "Product price must be a positive number"
        },
        Category: {
            bsonType: "string",
            enum: ["Electronics", "Clothing", "Books", "Home", "Sports", "Beauty", "Automotive"],
            description: "Category must be one of the predefined categories"
        },
        stock: {
            bsonType: "int",
            minimum: 0,
            description: "Stock must be a non-negative integer"
        },
        tags: {
            bsonType: "array",
            items: { bsonType: "string" },
            description: "Product tags for search and categorization"
        },
        images: {
            bsonType: "array",
            items: { bsonType: "string" },
            description: "Array of image URLs"
        },
        ratings: {
            bsonType: "object",
            properties: {
                average: { bsonType: "double", minimum: 0, maximum: 5 },
                count: { bsonType: "int", minimum: 0 }
            }
        },
        supplier: {
            bsonType: "object",
            properties: {
                name: { bsonType: "string" },
                contact: { bsonType: "string" },
                minOrderQuantity: { bsonType: "int", minimum: 1 }
            }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        isActive: { bsonType: "bool", description: "Whether product is active for sale" }
    }
};

// User Schema with validation
const userSchema = {
    bsonType: "object",
    required: ["username", "email", "Password", "createdAt"],
    properties: {
        _id: { bsonType: "objectId" },
        username: {
            bsonType: "string",
            minLength: 3,
            maxLength: 30,
            pattern: "^[a-zA-Z0-9_]+$",
            description: "Username must be 3-30 characters, alphanumeric and underscore only"
        },
        email: {
            bsonType: "string",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            description: "Must be a valid email address"
        },
        Password: {
            bsonType: "string",
            minLength: 60,
            maxLength: 60,
            description: "Hashed password (bcrypt)"
        },
        profile: {
            bsonType: "object",
            properties: {
                firstName: { bsonType: "string", maxLength: 50 },
                lastName: { bsonType: "string", maxLength: 50 },
                phone: { bsonType: "string", pattern: "^[0-9]{10,15}$" },
                dateOfBirth: { bsonType: "date" },
                gender: { bsonType: "string", enum: ["male", "female", "other"] }
            }
        },
        addresses: {
            bsonType: "array",
            items: {
                bsonType: "object",
                properties: {
                    type: { bsonType: "string", enum: ["home", "work", "other"] },
                    address: { bsonType: "string", maxLength: 200 },
                    city: { bsonType: "string", maxLength: 50 },
                    state: { bsonType: "string", maxLength: 50 },
                    pincode: { bsonType: "string", pattern: "^[0-9]{6}$" },
                    location: {
                        type: { bsonType: "string", enum: ["Point"] },
                        coordinates: {
                            bsonType: "array",
                            items: { bsonType: "double" },
                            minItems: 2,
                            maxItems: 2
                        }
                    }
                }
            }
        },
        preferences: {
            bsonType: "object",
            properties: {
                categories: { bsonType: "array", items: { bsonType: "string" } },
                priceRange: {
                    bsonType: "object",
                    properties: {
                        min: { bsonType: "double", minimum: 0 },
                        max: { bsonType: "double", minimum: 0 }
                    }
                }
            }
        },
        searchHistory: {
            bsonType: "array",
            items: {
                bsonType: "object",
                properties: {
                    term: { bsonType: "string" },
                    timestamp: { bsonType: "date" }
                }
            }
        },
        createdAt: { bsonType: "date" },
        lastLogin: { bsonType: "date" },
        isActive: { bsonType: "bool" }
    }
};

// Order Schema with validation
const orderSchema = {
    bsonType: "object",
    required: ["userId", "products", "totalAmount", "status", "createdAt"],
    properties: {
        _id: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        products: {
            bsonType: "array",
            minItems: 1,
            items: {
                bsonType: "object",
                required: ["item", "quantity", "price"],
                properties: {
                    item: { bsonType: "objectId" },
                    quantity: { bsonType: "int", minimum: 1 },
                    price: { bsonType: "double", minimum: 0 }
                }
            }
        },
        totalAmount: { bsonType: "double", minimum: 0 },
        status: {
            bsonType: "string",
            enum: ["pending", "placed", "processing", "shipped", "delivered", "cancelled", "returned"]
        },
        paymentMethod: {
            bsonType: "string",
            enum: ["COD", "razorpay", "card", "wallet"]
        },
        paymentStatus: {
            bsonType: "string",
            enum: ["pending", "completed", "failed", "refunded"]
        },
        deliveryDetails: {
            bsonType: "object",
            required: ["address", "pincode", "mobile"],
            properties: {
                address: { bsonType: "string", maxLength: 200 },
                city: { bsonType: "string", maxLength: 50 },
                state: { bsonType: "string", maxLength: 50 },
                pincode: { bsonType: "string", pattern: "^[0-9]{6}$" },
                mobile: { bsonType: "string", pattern: "^[0-9]{10}$" },
                location: {
                    type: { bsonType: "string", enum: ["Point"] },
                    coordinates: {
                        bsonType: "array",
                        items: { bsonType: "double" },
                        minItems: 2,
                        maxItems: 2
                    }
                },
                trackOrder: {
                    bsonType: "object",
                    properties: {
                        ordered: { bsonType: "bool" },
                        shipped: { bsonType: "bool" },
                        outForDelivery: { bsonType: "bool" },
                        delivered: { bsonType: "bool" },
                        timestamps: {
                            bsonType: "object",
                            properties: {
                                ordered: { bsonType: "date" },
                                shipped: { bsonType: "date" },
                                outForDelivery: { bsonType: "date" },
                                delivered: { bsonType: "date" }
                            }
                        }
                    }
                }
            }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
    }
};

// Analytics Schema for storing aggregated data
const analyticsSchema = {
    bsonType: "object",
    required: ["type", "date", "data"],
    properties: {
        _id: { bsonType: "objectId" },
        type: {
            bsonType: "string",
            enum: ["daily_sales", "product_performance", "user_behavior", "inventory_alert"]
        },
        date: { bsonType: "date" },
        data: { bsonType: "object" },
        createdAt: { bsonType: "date" }
    }
};

module.exports = {
    productSchema,
    userSchema,
    orderSchema,
    analyticsSchema
};