document.addEventListener('DOMContentLoaded', function() {
    // Sales Overview Line Chart
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        new Chart(salesCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Today'],
                datasets: [{
                    label: 'Revenue',
                    data: [3500, 3200, 3800, 4200, 4000, 4500, 5000],
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(0, 142, 204, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'var(--primary)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        },
                        grid: {
                            color: 'var(--border)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Payment Methods Pie Chart
    const paymentCtx = document.getElementById('paymentChart');
    if(paymentCtx){
        new Chart(paymentCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Credit Card', 'PayPal', 'Stripe', 'Cash on Delivery'],
                datasets: [{
                    data: [55, 30, 5, 20],
                    backgroundColor: [
                        '#0ea5e9',
                        '#0c4a6e',
                        '#7dd3fc',
                        '#38bdf8'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    // Top Products Bar Chart
    const productsCtx = document.getElementById('productsChart');
    if(productsCtx){
        new Chart(productsCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Wireless Headphones', 'Smartphone', 'Laptop', 'Running Shoes', 'Smart Watch'],
                datasets: [{
                    label: 'Sales',
                    data: [180, 165, 125, 110, 95],
                    backgroundColor: 'var(--primary)',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'var(--border)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Order Status Doughnut Chart
    const orderStatusCtx = document.getElementById('orderStatusChart');
    if(orderStatusCtx){
        new Chart(orderStatusCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Delivered', 'Shipped', 'Placed', 'Cancelled'],
                datasets: [{
                    data: [48, 25, 20, 7],
                    backgroundColor: [
                        '#10b981',
                        'var(--primary)',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
});