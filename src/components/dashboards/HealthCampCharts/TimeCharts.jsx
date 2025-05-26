import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import _ from "lodash";

const COLORS = {
  below25: "#DC2626",
  between25and35: "#FACC15",
  above35: "#10B981",
};

const MONTHSORDER = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March"
];

const TimeMetricsCharts = ({ data, timeframe, selectedMonthYear, availableMonthYears }) => {
  // Safe date access helper function
  const safeGetDate = (camp) => {
    try {
      if (!camp.date || !(camp.date instanceof Date) || isNaN(camp.date.getTime())) {
        console.warn("Invalid date found in camp data:", camp);
        return null;
      }
      return camp.date;
    } catch (error) {
      console.error("Error accessing date:", error);
      return null;
    }
  };

  // Helper to safely get month name
  const safeGetMonthName = (date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return "Unknown Month";
      }
      return date.toLocaleString("default", { month: "long" });
    } catch (error) {
      console.error("Error getting month name:", error);
      return "Unknown Month";
    }
  };

  // Get selected month and year
  const getSelectedMonthYear = () => {
    if (!selectedMonthYear || !availableMonthYears) {
      return { month: new Date().getMonth(), year: new Date().getFullYear() };
    }
    
    const selected = availableMonthYears.find(option => option.key === selectedMonthYear);
    if (!selected) {
      return { month: new Date().getMonth(), year: new Date().getFullYear() };
    }
    
    return { month: selected.month, year: selected.year };
  };

  const { month: selectedMonth, year: selectedYear } = getSelectedMonthYear();

  const getTimeGroupedData = () => {
    // Filter out items with invalid dates first
    const validData = data.filter(camp => safeGetDate(camp) !== null);
    let groupedData;
    
    switch (timeframe) {
      case "mtd":
        // For MTD, we'll group by month for bar charts
        groupedData = _.groupBy(validData, (camp) => {
          const campDate = safeGetDate(camp);
          return campDate ? safeGetMonthName(campDate) : "Unknown";
        });
        
        return _.orderBy(
          Object.entries(groupedData), 
          ([month]) => MONTHSORDER.indexOf(month) !== -1 ? MONTHSORDER.indexOf(month) : 999
        );

      case "ytd":
        groupedData = _.groupBy(validData, (camp) => {
          const campDate = safeGetDate(camp);
          return campDate ? safeGetMonthName(campDate) : "Unknown";
        });
        
        return _.orderBy(
          Object.entries(groupedData), 
          ([month]) => MONTHSORDER.indexOf(month) !== -1 ? MONTHSORDER.indexOf(month) : 999
        );

      case "itd":
        groupedData = _.groupBy(validData, (camp) => {
          const campDate = safeGetDate(camp);
          if (!campDate) return "Unknown Period";
          
          const month = campDate.getMonth();
          const year = campDate.getFullYear();
          const quarter = Math.floor(((month + 9) % 12) / 3) + 1;
          const fiscalYear = month < 3 ? year - 1 : year;
          return `Q${quarter} FY${fiscalYear}`;
        });
        
        return _.orderBy(
          Object.entries(groupedData).filter(([period]) => period !== "Unknown Period"), 
          ([period]) => {
            if (period === "Unknown Period") return 9999;
            const parts = period.split(" ");
            if (parts.length !== 2) return 9998;
            
            const [q, fy] = parts;
            const qNum = parseInt(q.slice(1)) || 0;
            const fyNum = parseInt(fy.slice(2)) || 0;
            return fyNum * 4 + qNum;
          }
        );

      default:
        return [];
    }
  };

  const processData = (groupedData) => {
    return groupedData.map(([period, camps]) => ({
      period,
      campsCount: camps.length,
      unitsSold: _.sumBy(camps, "unitsSold"),
      revenue: _.sumBy(camps, "revenue"),
    }));
  };

  const chartData = processData(getTimeGroupedData());
  
  // For pie chart, if MTD, only use selected month's data
  const getCurrentMonthData = () => {
    if (timeframe === "mtd") {
      // Filter data for the selected month and year
      return data.filter(camp => {
        const campDate = safeGetDate(camp);
        return campDate && 
               campDate.getMonth() === selectedMonth && 
               campDate.getFullYear() === selectedYear;
      });
    }
    return _.flatten(getTimeGroupedData().map(([, camps]) => camps));
  };

  const currentTimeframeCamps = getCurrentMonthData();
  const totalCamps = currentTimeframeCamps.length;

  // Get the selected month display name
  const getSelectedMonthDisplay = () => {
    try {
      if (timeframe === "mtd" && availableMonthYears && selectedMonthYear) {
        const selected = availableMonthYears.find(option => option.key === selectedMonthYear);
        if (selected) return selected.label;
      }
      return new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (error) {
      console.error("Error formatting month display:", error);
      return "Selected Period";
    }
  };

  const selectedMonthDisplay = getSelectedMonthDisplay();

  const distributionData = [
    {
      name: "Below 25",
      value: currentTimeframeCamps.filter((camp) => camp.unitsSold < 25).length,
      percentage: totalCamps > 0 ? (currentTimeframeCamps.filter((camp) => camp.unitsSold < 25).length / totalCamps) * 100 : 0,
      fill: COLORS.below25,
    },
    {
      name: "25-35",
      value: currentTimeframeCamps.filter((camp) => camp.unitsSold >= 25 && camp.unitsSold < 35).length,
      percentage: totalCamps > 0 ? (currentTimeframeCamps.filter((camp) => camp.unitsSold >= 25 && camp.unitsSold < 35).length / totalCamps) * 100 : 0,
      fill: COLORS.between25and35,
    },
    {
      name: "35 & Above",
      value: currentTimeframeCamps.filter((camp) => camp.unitsSold >= 35).length,
      percentage: totalCamps > 0 ? (currentTimeframeCamps.filter((camp) => camp.unitsSold >= 35).length / totalCamps) * 100 : 0,
      fill: COLORS.above35,
    },
  ];

  const renderBarChart = (dataKey, title, formatter) => (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={70} />
            <YAxis />
            <Tooltip formatter={formatter || ((value) => value)} />
            <Legend />
            <Bar dataKey={dataKey} fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderPieChart = () => (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">
          Tests Distribution {timeframe === "mtd" ? `for ${selectedMonthDisplay}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => 
                `${name}: ${value} ${totalCamps > 0 ? `(${((value / totalCamps) * 100).toFixed(1)}%)` : ''}`
              }
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const formatRevenue = (value) => `₹${(value / 1000).toFixed(1)}k`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {renderBarChart("unitsSold", "Tests Done")}
      {renderPieChart()}
      {renderBarChart("campsCount", "Camps Conducted")}
      {renderBarChart("revenue", "Revenue Generated", formatRevenue)}
    </div>
  );
};

export default TimeMetricsCharts;