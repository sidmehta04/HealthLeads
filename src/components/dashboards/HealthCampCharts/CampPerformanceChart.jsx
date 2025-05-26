import { MetricCard } from './CampDetailsTable';

const formatIndianCurrency = (amount) => {
  const numStr = Math.floor(amount).toString();
  if (numStr.length > 4) {
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    const lastThreeFormatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `₹${lastThreeFormatted},${lastThree}`;
  }
  return `₹${numStr}`;
};

export const MetricsDisplay = ({ metrics, timeframe }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <MetricCard
      title="Total Camps"
      value={metrics.totalCamps}
      description={`Total camps for ${timeframe}`}
      change={timeframe !== "ITD" ? metrics.changes.totalCamps : undefined}
    />
    <MetricCard
      title="Tests Sold"
      value={metrics.unitsSold}
      description={`Total Tests sold in ${timeframe}`}
      change={timeframe !== "ITD" ? metrics.changes.unitsSold : undefined}
    />
    <MetricCard
      title="Total Revenue"
      value={formatIndianCurrency(metrics.totalRevenue)}
      description={`Revenue generated in ${timeframe}`}
      change={timeframe !== "ITD" ? metrics.changes.totalRevenue : undefined}
    />
    <MetricCard
      title="Average Tests/Camp"
      value={metrics.avgUnitsPerCamp.toFixed(1)}
      description="Average units sold per camp"
      change={timeframe !== "ITD" ? metrics.changes.avgUnitsPerCamp : undefined}
    />
  </div>
);