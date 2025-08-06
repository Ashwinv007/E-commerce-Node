const express = require('express');
const router = express.Router();
const analyticsHelpers = require('../helpers/analytics-helpers');

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        next();
    } else {
        res.status(401).json({ error: 'Admin access required' });
    }
};

/**
 * GET /analytics/dashboard
 * Real-time dashboard with key metrics
 */
router.get('/dashboard', verifyAdmin, async (req, res) => {
    try {
        const dashboardData = await analyticsHelpers.getRealTimeDashboard();
        res.render('admin/analytics-dashboard', { 
            adminExist: true,
            admin: req.session.admin,
            dashboardData: dashboardData,
            title: 'Analytics Dashboard'
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

/**
 * GET /analytics/sales
 * Advanced sales analytics with date range
 */
router.get('/sales', verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
        const end = endDate || new Date(); // Default: today
        
        const salesData = await analyticsHelpers.getAdvancedSalesAnalytics(start, end);
        
        res.render('admin/sales-analytics', {
            adminExist: true,
            admin: req.session.admin,
            salesData: salesData,
            startDate: start,
            endDate: end,
            title: 'Sales Analytics'
        });
    } catch (error) {
        console.error('Sales Analytics Error:', error);
        res.status(500).json({ error: 'Failed to load sales analytics' });
    }
});

/**
 * GET /analytics/products
 * Product performance analytics
 */
router.get('/products', verifyAdmin, async (req, res) => {
    try {
        const productData = await analyticsHelpers.getProductPerformanceAnalytics();
        
        res.render('admin/product-analytics', {
            adminExist: true,
            admin: req.session.admin,
            productData: productData,
            title: 'Product Analytics'
        });
    } catch (error) {
        console.error('Product Analytics Error:', error);
        res.status(500).json({ error: 'Failed to load product analytics' });
    }
});

/**
 * GET /analytics/customers
 * Customer behavior analytics
 */
router.get('/customers', verifyAdmin, async (req, res) => {
    try {
        const customerData = await analyticsHelpers.getCustomerBehaviorAnalytics();
        
        res.render('admin/customer-analytics', {
            adminExist: true,
            admin: req.session.admin,
            customerData: customerData,
            title: 'Customer Analytics'
        });
    } catch (error) {
        console.error('Customer Analytics Error:', error);
        res.status(500).json({ error: 'Failed to load customer analytics' });
    }
});

/**
 * GET /analytics/api/dashboard
 * API endpoint for dashboard data (for AJAX calls)
 */
router.get('/api/dashboard', verifyAdmin, async (req, res) => {
    try {
        const dashboardData = await analyticsHelpers.getRealTimeDashboard();
        res.json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('Dashboard API Error:', error);
        res.status(500).json({ success: false, error: 'Failed to load dashboard data' });
    }
});

/**
 * GET /analytics/api/sales
 * API endpoint for sales data with date range
 */
router.get('/api/sales', verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate || new Date();
        
        const salesData = await analyticsHelpers.getAdvancedSalesAnalytics(start, end);
        res.json({ success: true, data: salesData });
    } catch (error) {
        console.error('Sales API Error:', error);
        res.status(500).json({ success: false, error: 'Failed to load sales data' });
    }
});

/**
 * POST /analytics/snapshot
 * Store analytics snapshot for historical data
 */
router.post('/snapshot', verifyAdmin, async (req, res) => {
    try {
        const { type } = req.body;
        
        let data;
        switch (type) {
            case 'daily_sales':
                data = await analyticsHelpers.getRealTimeDashboard();
                break;
            case 'product_performance':
                data = await analyticsHelpers.getProductPerformanceAnalytics();
                break;
            case 'customer_behavior':
                data = await analyticsHelpers.getCustomerBehaviorAnalytics();
                break;
            default:
                return res.status(400).json({ success: false, error: 'Invalid snapshot type' });
        }
        
        const result = await analyticsHelpers.storeAnalyticsSnapshot(type, data);
        res.json({ success: true, message: 'Analytics snapshot stored successfully', result });
    } catch (error) {
        console.error('Snapshot Error:', error);
        res.status(500).json({ success: false, error: 'Failed to store analytics snapshot' });
    }
});

module.exports = router;