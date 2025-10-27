// Hey team, this is the main metrics page.
// It's got all our charts and key numbers.
import React, { useState, useEffect, useRef } from 'react';

// This is the main Chart.js library
import { Chart, registerables } from 'chart.js';
// We just need the 'adminApiGet' helper for this page
import { adminApiGet, adminApiDelete } from '../../utils/apiHelper';

// **This is SUPER important!**
// We have to "register" all the parts of Chart.js we want to use
// (like bar charts, line charts, scales, tooltips, etc.).
// This line tells it to just load everything.
Chart.register(...registerables);

// --- Reusable UI Components --------------------------------------------------
// I broke out all the UI into smaller, reusable pieces.
// This keeps our main `MetricsDashboard` component at the bottom *way* cleaner.

/**
 * MetricCard Component
 * This is our first reusable piece. It's the little card that 
 * just shows one big number (like 'Total Cars' or 'Total Revenue').
 */
const MetricCard = ({ title, value, icon, loading, format = val => val }) => (
    // 'format' is a cool prop. It's an optional function we can pass in
    // to format the 'value' (like adding a '$' sign or commas).
    // If we don't pass one, it just shows the raw value.
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform hover:scale-105">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            {/* This is a ternary operator. It checks if 'loading' is true. */}
            {/* If it is, we show a shimmering "pulse" skeleton. */}
            {/* If not, we show the actual formatted value. */}
            {loading ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700a rounded-md animate-pulse mt-1" />
            ) : (
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{format(value)}</p>
            )}
        </div>
    </div>
);

/**
 * CarStatusWidget Component
 * This component is just for the 'Fleet Status' box. 
 * It shows the progress bars for Available, Rented, and Maintenance.
 */
const CarStatusWidget = ({ data, loading }) => {
    // This is some fancy destructuring.
    // It safely pulls the values out of the 'data' prop.
    // The '|| {}' stops the app from crashing if 'data' is null.
    // The '= 0' sets a default if, say, 'total' is missing from the data.
    const { total = 0, available = 0, rented = 0, maintenance = 0 } = data || {};
    const statuses = [
        { label: 'Available', count: available, color: 'bg-green-500' },
        { label: 'Rented', count: rented, color: 'bg-yellow-500' },
        { label: 'Maintenance', count: maintenance, color: 'bg-red-500' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Fleet Status</h3>
            {loading ? (
                // Show a pulse animation for each bar while loading
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                </div>
            ) : (
                <div className="space-y-4">
                {/* We just map over our 'statuses' array to create the three bars.
                    This is way cleaner than writing the HTML three times. */}
                    {statuses.map(({ label, count, color }) => (
                        <div key={label}>
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                                <span>{label}</span>
                                <span>{count} / {total}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                {/* This is how we set the progress bar width.
                                    We calculate the percentage and set it as an inline style. */}
                                <div className={`${color} h-2.5 rounded-full`} style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}></div>
                            </div>
              _</div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * ChartCard Component
 * This is our most complex reusable component. It's a generic "box"
 * that can render *any* chart we give it. It's tricky because
 * Chart.js isn't a native React library, so we have to use 'useRef'
 * and 'useEffect' to connect them.
 */
const ChartCard = ({ title, chartType, chartData, loading }) => {
    // 'chartRef' is a direct link to the <canvas> element in our HTML.
    // We need this so Chart.js knows *where* to draw.
    const chartRef = useRef(null);
    // 'chartInstance' is a *second* ref. This one is super important.
    // We use it to store the Chart.js *object* itself after we create it.
    // We need this so we can *destroy* the old chart before drawing a new one.
    const chartInstance = useRef(null);

    useEffect(() => {
        // This 'useEffect' is where the magic happens.
        // It runs *after* the component renders, and again if 'chartData' changes.
        
        // Safety check: if we don't have the canvas or any data, just stop.
        if (!chartRef.current || !chartData || chartData.datasets[0].data.length === 0) return;

        // **THIS IS THE KEY!**
        // Before we draw a new chart, we check if a chart *instance*
        // already exists on our ref. If it does, we destroy it.
        // If we don't do this, we get memory leaks and weird flickering charts.
        chartInstance.current?.destroy();
        
        // We check if the user is in dark mode...
        const isDark = document.documentElement.classList.contains('dark');
        // ...so we can set the chart's text and grid lines to be readable.
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: isDark ? '#e5e7eb' : '#374151' }, // light text in dark mode
                    grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                },
                y: {
                    ticks: { color: isDark ? '#e5e7eb' : '#374151' },
                    grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                }
            },
            ...chartData.options // This merges any *custom* options we pass in (like for the horizontal bar chart)
        };

        // Here's where we finally create the chart!
        // We pass it the canvas (chartRef.current) and all our data/options.
        // Then we save the new chart object to our 'chartInstance' ref.
        chartInstance.current = new Chart(chartRef.current, {
            type: chartType,
            data: chartData,
            options: options,
        });

        // This is the 'cleanup function' for our useEffect.
        // It runs when the component is *unmounted* (e.g., we navigate to another page).
        // This makes sure the chart is destroyed and doesn't cause memory leaks.
        return () => chartInstance.current?.destroy();
    }, [chartData, chartType]); // Re-run this effect *only* if the data or chart type changes

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
            <div className="h-80 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500">Loading Chart...</p>
                    </div>
                ) : (
                    // And here's the actual <canvas> element that our
                    // 'chartRef' points to. Chart.js draws on this.
                    <canvas ref={chartRef}></canvas>
                )}
            </div>
        </div>
    );
};


// --- Main Dashboard Component ------------------------------------------------
// And finally, this is our main page component that puts all the pieces together.
export default function MetricsDashboard() {
    // We need separate state for all our different data sources
    const [metrics, setMetrics] = useState(null); // For the top-level metric cards
    const [revenueData, setRevenueData] = useState([]); // For the revenue bar chart
    const [popularData, setPopularData] = useState([]); // For the popular cars bar chart
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // This useEffect runs once on mount to fetch *all* our data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // This 'Promise.all' is super efficient. It fires all three
                // API requests at the *same time* and waits for them all
                // to come back. This is *much* faster than awaiting them
                // one by one.
                const [metricsJson, revenueJson, popularJson] = await Promise.all([
                    adminApiGet('http://localhost:3001/api/admin/dashboard/metrics'),
                    adminApiGet('http://localhost:3001/api/admin/metrics/revenue-by-month'),
                    adminApiGet('http://localhost:3001/api/admin/metrics/popular-car-types'),
                ]);

                // Once they all return, we set our state
                setMetrics(metricsJson.metrics);
                setRevenueData(revenueJson.data || []); // '|| []' prevents errors if data is null
                setPopularData(popularJson.data || []);
            } catch (err) {
                console.error(err);
                setError(err.message || 'Could not load metrics. Check API server.');
            } finally {
                // The 'finally' block *always* runs, even if the API
                // calls fail. This is perfect for setting loading to false.
                setLoading(false);
            }
        };

        fetchData();
    }, []); // The empty array `[]` means this effect only runs once on mount

    // --- Memoized Chart Data ---
    // This 'useMemo' hook is another performance trick.
    // We're formatting our 'revenueData' into the *exact*
    // object structure that Chart.js needs.
    const monthlyRevenueChartData = React.useMemo(() => ({
        labels: revenueData.map(d => d.month),
        datasets: [{
            label: 'Monthly Revenue',
            data: revenueData.map(d => d.revenue || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            borderRadius: 4,
            hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
        }]
    }), [revenueData]); // This 'dependency array' tells React:
                        // "Don't re-run this code unless 'revenueData' changes."
                        // This stops us from re-formatting the data on *every single render*.

    // We do the same thing for the popular car types chart.
    const popularCarTypesChartData = React.useMemo(() => ({
        labels: popularData.map(d => d.type_name),
        datasets: [{
            label: 'Number of Rentals',
            data: popularData.map(d => d.rental_count || 0),
            backgroundColor: 'rgba(139, 92, 246, 0.7)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 2,
            borderRadius: 4,
            hoverBackgroundColor: 'rgba(139, 92, 246, 1)',
        }],
        options: {
            // This custom option is what turns it into a horizontal bar chart!
            indexAxis: 'y', 
        }
    }), [popularData]); // This only re-runs if 'popularData' changes.

    // --- Render ---

    // If we had an error, just show the error message and stop.
    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
  S         </div>
        );
    }
    
    // Otherwise, show the full dashboard!
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Business Analytics</h1>
            
            {/* --- Top Metric Cards --- */}
            {/* This is where we use our reusable components.
                It makes our code so much cleaner to read. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard 
                    title="Total Cars" 
                    // 'metrics?.carStatus?.total' uses optional chaining.
                    // It's a safe way to get a nested value without
                    // crashing if 'metrics' or 'carStatus' is still null.
                    value={metrics?.carStatus?.total || 0}
                    loading={loading}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
                <MetricCard 
                    title="Total Revenue" 
                    value={metrics?.revenue?.totalRevenue || 0}
                    loading={loading}
                    // Here's where we pass in our 'format' function!
                    format={(val) => `$${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                    />
                <div className="sm:col-span-2">
                    <CarStatusWidget data={metrics?.carStatus} loading={loading} />
                </div>
            </div>

            {/* --- Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard 
                    title="Revenue by Month" 
                    chartType="bar"
                    // We pass in our 'memoized' chart data
                    chartData={monthlyRevenueChartData}
                    loading={loading}
                />
                <ChartCard
                    title="Most Popular Car Types"
                    chartType="bar"
                    chartData={popularCarTypesChartData}
                    loading={loading}
                />
            </div>
        </div>
    );
}