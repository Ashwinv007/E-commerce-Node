# 🛒 Advanced E-Commerce Platform

A comprehensive e-commerce platform built with Node.js, Express, and MongoDB, featuring advanced database concepts and real-world scalability patterns.

## 🚀 **Project Overview**

This project demonstrates advanced MongoDB concepts including aggregation pipelines, indexing strategies, real-time analytics, recommendation systems, and scalable data architecture patterns.

### **Key Features**
- 📊 **Advanced Analytics Dashboard** with real-time metrics
- 🔍 **Intelligent Search Engine** with fuzzy matching and autocomplete
- 🎯 **AI-Powered Recommendation System** using collaborative filtering
- 📈 **Real-time Inventory Management** with change streams
- 🌍 **Geospatial Features** for location-based services
- ⚡ **Performance Optimization** with proper indexing
- 🔐 **Advanced Security** with data validation

## 🛠️ **Technology Stack**

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with advanced aggregation pipelines
- **Template Engine**: Handlebars (HBS)
- **Authentication**: bcrypt, express-session
- **Payment**: Razorpay integration
- **File Upload**: express-fileupload

## 📋 **Advanced MongoDB Concepts Implemented**

### 1. **Complex Aggregation Pipelines**
```javascript
// Example: Sales Analytics with $facet
{
  $facet: {
    salesByDate: [/* pipeline 1 */],
    salesByPriceBucket: [/* pipeline 2 */],
    paymentMethodAnalysis: [/* pipeline 3 */],
    geographicDistribution: [/* pipeline 4 */]
  }
}
```

**Concepts Used:**
- `$facet` - Multiple aggregation pipelines in parallel
- `$bucket` - Data bucketing for price ranges
- `$dateToString` - Date formatting and grouping
- `$cond` - Conditional aggregation logic

### 2. **Advanced Search with Text Indexing**
```javascript
// Text index with weights
{
  productName: "text",
  productDescription: "text", 
  tags: "text",
  Category: "text"
}
```

**Features:**
- Full-text search with relevance scoring
- Fuzzy search for typo tolerance
- Autocomplete suggestions
- Search analytics and tracking
- Faceted search with filters

### 3. **Recommendation System with $graphLookup**
```javascript
// Users who bought this also bought
{
  $graphLookup: {
    from: "orders",
    startWith: "$userIds",
    connectFromField: "userIds", 
    connectToField: "userId",
    as: "relatedOrders"
  }
}
```

**Algorithms:**
- Collaborative filtering
- Market basket analysis
- Seasonal recommendations
- Cross-category suggestions

### 4. **Performance Optimization**
```javascript
// Compound indexes for efficient queries
db.products.createIndex({ Category: 1, productPrice: 1 })
db.products.createIndex({ "ratings.average": -1, productPrice: 1 })
```

**Optimizations:**
- Strategic index placement
- Query optimization
- Connection pooling
- Aggregation pipeline optimization

## 🏗️ **Project Structure**

```
├── config/
│   ├── connection.js      # Database connection
│   └── collections.js     # Collection names
├── helpers/
│   ├── analytics-helpers.js      # Advanced analytics
│   ├── search-helpers.js         # Search engine
│   ├── recommendation-helpers.js # AI recommendations
│   ├── product-helpers.js        # Product operations
│   └── user-helpers.js           # User operations
├── models/
│   └── schemas.js         # MongoDB schemas with validation
├── routes/
│   ├── users.js          # User routes
│   ├── admin.js          # Admin routes
│   └── analytics.js      # Analytics routes
├── views/                # Handlebars templates
├── public/               # Static assets
└── app.js               # Main application
```

## 🚀 **Installation & Setup**

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd e-commerce-website
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup MongoDB**
```bash
# Start MongoDB service
mongod --dbpath /data/db

# Create database and collections
mongosh
use Ecommerce
```

4. **Initialize search indexes**
```bash
node -e "
const searchHelpers = require('./helpers/search-helpers');
const db = require('./config/connection');
db.connect(() => {
  searchHelpers.initializeSearchIndexes();
});
"
```

5. **Start the application**
```bash
npm start
```

6. **Access the application**
- User Interface: `http://localhost:3000`
- Admin Panel: `http://localhost:3000/admin`
- Analytics Dashboard: `http://localhost:3000/analytics/dashboard`

## 📊 **Advanced Features Guide**

### 1. **Analytics Dashboard**

Access comprehensive analytics at `/analytics/dashboard`:

- **Real-time Metrics**: Today's sales, orders, revenue
- **Sales Analytics**: Revenue trends, payment methods, geographic distribution
- **Product Performance**: Top products, category analysis, revenue buckets
- **Customer Behavior**: User segmentation, lifetime value, repeat customers

**Key Aggregation Stages Used:**
- `$facet` for parallel analytics
- `$bucket` for data segmentation
- `$dateToString` for time-based grouping
- `$lookup` for joins across collections

### 2. **Intelligent Search Engine**

Advanced search capabilities:

```javascript
// Usage example
const searchResults = await searchHelpers.advancedProductSearch({
  query: "wireless headphones",
  category: "Electronics",
  minPrice: 50,
  maxPrice: 200,
  minRating: 4,
  sortBy: "relevance",
  page: 1,
  limit: 20
});
```

**Features:**
- Text search with relevance scoring
- Faceted filtering (category, price, rating)
- Autocomplete suggestions
- Fuzzy search for typos
- Search analytics tracking

### 3. **AI-Powered Recommendations**

Multiple recommendation algorithms:

```javascript
// Collaborative filtering
const recommendations = await recommendationHelpers
  .getUsersWhoBoughtAlsoBought(productId);

// Personalized recommendations
const personal = await recommendationHelpers
  .getPersonalizedRecommendations(userId);

// Trending products
const trending = await recommendationHelpers
  .getTrendingProducts(7); // Last 7 days
```

### 4. **Real-time Inventory Management**

Using MongoDB Change Streams:

```javascript
// Monitor stock changes
const changeStream = db.collection('products').watch([
  { $match: { 'fullDocument.stock': { $lte: 10 } } }
]);

changeStream.on('change', (change) => {
  // Trigger low stock alert
  console.log('Low stock alert:', change.fullDocument);
});
```

## 🔍 **Database Schema Design**

### Product Schema
```javascript
{
  _id: ObjectId,
  productName: String,
  productDescription: String,
  productPrice: Number,
  Category: String,
  stock: Number,
  tags: [String],
  images: [String],
  ratings: {
    average: Number,
    count: Number
  },
  supplier: {
    name: String,
    contact: String,
    minOrderQuantity: Number
  },
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

### Order Schema with Advanced Tracking
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  products: [{
    item: ObjectId,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: String, // enum
  paymentMethod: String,
  paymentStatus: String,
  deliveryDetails: {
    address: String,
    location: {
      type: "Point",
      coordinates: [longitude, latitude]
    },
    trackOrder: {
      ordered: Boolean,
      shipped: Boolean,
      outForDelivery: Boolean,
      delivered: Boolean,
      timestamps: {
        ordered: Date,
        shipped: Date,
        outForDelivery: Date,
        delivered: Date
      }
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 📈 **Performance Optimizations**

### Index Strategy
```javascript
// Product collection indexes
db.products.createIndex({ productName: "text", productDescription: "text" })
db.products.createIndex({ Category: 1, productPrice: 1 })
db.products.createIndex({ "ratings.average": -1 })
db.products.createIndex({ stock: 1 })

// Order collection indexes  
db.orders.createIndex({ userId: 1, createdAt: -1 })
db.orders.createIndex({ status: 1, createdAt: -1 })
db.orders.createIndex({ "products.item": 1 })

// User collection indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
```

### Query Optimization Tips
1. **Use projection** to limit returned fields
2. **Leverage indexes** for sort operations
3. **Use aggregation** instead of multiple queries
4. **Implement pagination** for large result sets
5. **Use compound indexes** for multi-field queries

## 🔐 **Security Features**

### Data Validation
- MongoDB schema validation rules
- Input sanitization and validation
- bcrypt password hashing
- Session management

### Security Best Practices
```javascript
// Example validation rule
{
  bsonType: "object",
  required: ["productName", "productPrice", "Category"],
  properties: {
    productPrice: {
      bsonType: "double",
      minimum: 0
    },
    Category: {
      enum: ["Electronics", "Clothing", "Books", "Home"]
    }
  }
}
```

## 🌐 **API Endpoints**

### Analytics APIs
```
GET  /analytics/dashboard        # Real-time dashboard
GET  /analytics/sales           # Sales analytics
GET  /analytics/products        # Product performance
GET  /analytics/customers       # Customer behavior
GET  /analytics/api/dashboard   # Dashboard API (JSON)
POST /analytics/snapshot        # Store analytics snapshot
```

### Search APIs
```
GET  /search/products           # Advanced product search
GET  /search/autocomplete       # Autocomplete suggestions
GET  /search/analytics          # Search analytics
```

### Recommendation APIs
```
GET  /recommendations/similar/:productId    # Similar products
GET  /recommendations/personal/:userId      # Personalized
GET  /recommendations/trending              # Trending products
```

## 🚀 **Deployment Considerations**

### MongoDB Scaling
1. **Sharding Strategy**
```javascript
// Shard key selection
sh.shardCollection("ecommerce.products", { Category: 1, _id: 1 })
sh.shardCollection("ecommerce.orders", { userId: 1, createdAt: 1 })
```

2. **Replica Set Configuration**
```javascript
// Primary-Secondary-Arbiter setup
rs.initiate({
  _id: "ecommerceRS",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", arbiterOnly: true }
  ]
})
```

### Performance Monitoring
- Use MongoDB Compass for query analysis
- Implement application-level monitoring
- Set up alerts for slow queries
- Monitor index usage statistics

## 📚 **Learning Outcomes**

After implementing this project, you'll have hands-on experience with:

### Advanced MongoDB Concepts
- ✅ Complex aggregation pipelines with `$facet`, `$bucket`, `$graphLookup`
- ✅ Text indexing and full-text search
- ✅ Geospatial queries and 2dsphere indexes
- ✅ Change streams for real-time updates
- ✅ Data modeling and schema design
- ✅ Performance optimization and indexing strategies

### Node.js & Express Patterns
- ✅ Modular architecture with helpers and routes
- ✅ Error handling and validation
- ✅ Session management and security
- ✅ API design and documentation

### Real-world Applications
- ✅ E-commerce business logic
- ✅ Analytics and reporting systems
- ✅ Recommendation algorithms
- ✅ Search engine implementation
- ✅ Inventory management systems

## 🤝 **Contributing**

This project is designed for learning advanced MongoDB concepts. Feel free to:

1. Add more aggregation pipeline examples
2. Implement additional recommendation algorithms
3. Add more comprehensive error handling
4. Enhance the analytics dashboard
5. Implement caching strategies

## 📝 **Next Steps for Production**

1. **Environment Configuration**
   - Use environment variables for sensitive data
   - Implement proper logging (Winston)
   - Add request rate limiting

2. **Testing**
   - Unit tests for helper functions
   - Integration tests for APIs
   - Performance testing for aggregations

3. **Monitoring**
   - Application performance monitoring
   - Database query analysis
   - Error tracking and alerting

4. **Scalability**
   - Implement Redis for session storage
   - Add database connection pooling
   - Implement microservices architecture

## 🔗 **Useful Resources**

- [MongoDB Aggregation Framework](https://docs.mongodb.com/manual/aggregation/)
- [MongoDB Indexing Strategies](https://docs.mongodb.com/manual/applications/indexes/)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Happy Learning! 🚀**

This project demonstrates production-ready MongoDB patterns and will significantly enhance your backend development skills.