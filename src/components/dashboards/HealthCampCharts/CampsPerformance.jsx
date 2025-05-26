import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Scatter, BarChart, Bar, LabelList
} from "recharts";
import _ from "lodash";

const PerformanceAnalysis = ({ data, timeframe = "mtd", selectedMonthYear, availableMonthYears, selectedYear }) => {
  const INCEPTION_DATE = new Date('2024-04-01');
  
  const getColorByUnits = (units) => {
    if (timeframe === 'mtd') {
      return units < 30 ? "#DC2626" : "#10B981";
    }
    return units < 30 ? "#DC2626" : "#10B981";
  };

  const getDaysSinceInception = (date) => {
    return Math.ceil((date - INCEPTION_DATE) / (1000 * 60 * 60 * 24));
  };

  const parseFiscalYear = (fiscalYearStr) => {
    if (!fiscalYearStr || typeof fiscalYearStr !== 'string') {
      console.error("Invalid fiscal year string:", fiscalYearStr);
      return null;
    }
    
    // Handle both "FY2023-2024" and "2023-2024" formats
    const match = fiscalYearStr.match(/(?:FY)?(\d{4})-(\d{4})/);
    if (match && match.length === 3) {
      const startYear = parseInt(match[1], 10);
      const endYear = parseInt(match[2], 10);
      
      // Validate year sequence
      if (endYear !== startYear + 1) {
        console.error("Invalid fiscal year range:", fiscalYearStr);
        return null;
      }
      
      return {
        start: startYear,
        end: endYear
      };
    }
    
    console.error("Failed to parse fiscal year:", fiscalYearStr);
    return null;
  };
  const getMovingAverageData = () => {
    const sortedData = _.orderBy(data, ['date'], ['asc']);
    
    switch (timeframe) {
      case "mtd": {
        // Find the selected month and year from the availableMonthYears
        const selectedOption = availableMonthYears?.find(option => option.key === selectedMonthYear);
        
        if (!selectedOption) {
          return [];
        }
        
        const selectedMonth = selectedOption.month;
        const selectedYear = selectedOption.year;
        
        // Filter data for the selected month and year
        const filteredData = sortedData.filter(camp => {
          return camp.date.getMonth() === selectedMonth && 
                 camp.date.getFullYear() === selectedYear;
        });
        
        let totalCamps = 0;
        let totalUnits = 0;
        return filteredData.map(camp => {
          totalUnits += camp.unitsSold;
          totalCamps += 1;
          const runningAverage = totalUnits / totalCamps;
          return {
            period: camp.date.toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short'
            }),
            date: camp.date,
            unitsSold: runningAverage,
            actualUnits: camp.unitsSold,
            totalUnits: totalUnits,
            totalCamps: totalCamps,
            color: getColorByUnits(camp.unitsSold)
          };
        });
      }
      case "ytd": {
        // Parse the selected fiscal year
        const fiscalYear = parseFiscalYear(selectedYear);
        
        if (!fiscalYear) {
          console.error("Invalid fiscal year format:", selectedYear);
          return [];
        }
        
        // Create date range for the selected fiscal year (April 1st to March 31st)
        const startDate = new Date(fiscalYear.start, 3, 1); // April 1st of start year
        const endDate = new Date(fiscalYear.end, 2, 31); // March 31st of end year
        
        // Filter data for the selected fiscal year
        const ytdData = sortedData.filter(camp => 
          camp.date >= startDate && camp.date <= endDate
        );
        
        // If no data found for selected fiscal year, return empty array
        if (ytdData.length === 0) {
          console.warn(`No data found for fiscal year ${selectedYear}`);
          return [];
        }
        
        let totalCamps = 0;
        let totalUnits = 0;
        const result = ytdData.map(camp => {
          totalUnits += camp.unitsSold;
          totalCamps += 1;
          const runningAverage = totalUnits / totalCamps;
          return {
            period: camp.date.toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short'
            }),
            date: camp.date,
            unitsSold: runningAverage,
            actualUnits: camp.unitsSold,
            totalUnits: totalUnits,
            totalCamps: totalCamps,
            color: getColorByUnits(camp.unitsSold)
          };
        });
        
        return result;
      }
      case "itd": {
        const itdData = sortedData.filter(camp => 
          camp.date >= INCEPTION_DATE
        );
        
        let totalCamps = 0;
        let totalUnits = 0;
        return itdData.map(camp => {
          totalUnits += camp.unitsSold;
          totalCamps += 1;
          const runningAverage = totalUnits / totalCamps;
          const daysSinceInception = getDaysSinceInception(camp.date);
          return {
            period: `Day ${daysSinceInception}`,
            date: camp.date,
            unitsSold: runningAverage,
            actualUnits: camp.unitsSold,
            totalUnits: totalUnits,
            totalCamps: totalCamps,
            days: daysSinceInception,
            color: getColorByUnits(camp.unitsSold)
          };
        });
      }
      default:
        return [];
    }
  };

  const movingAverageData = getMovingAverageData();
  
  // Modified recent camps data to focus only on units sold
  const recentCamps = _.chain(data)
    .orderBy(['date'], ['desc'])
    .take(50)
    .map((camp) => ({
      campLabel: camp.campCode || camp.id,
      date: camp.date,
      unitsSold: parseInt(camp.unitsSold),
    }))
    .reverse()
    .value();

  const getChartTitle = () => {
    if (timeframe === "mtd") {
      // Find the selected month and year from the availableMonthYears
      const selectedOption = availableMonthYears?.find(option => option.key === selectedMonthYear);
      if (selectedOption) {
        return selectedOption.label;
      }
      return "Month to Date";
    } else if (timeframe === "ytd") {
      // Use the selected fiscal year for the title
      return `Year to Date (${selectedYear || "Current Fiscal Year"})`;
    } else if (timeframe === "itd") {
      return `Since April 2024 (${getDaysSinceInception(new Date())} Days)`;
    }
    return "Performance Analysis";
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Tests Done Average ({getChartTitle()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart
                data={movingAverageData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period"
                  tick={false}
                  label={{ value: "Time →", position: "bottom", offset: 0 }}
                />
                <YAxis />
                <Tooltip
                  content={({ payload, label }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-medium">{data.period}</p>
                          <p>Current Test: {data.actualUnits}</p>
                          <p>Total Tests: {data.totalUnits}</p>
                          <p>Total Camps: {data.totalCamps}</p>
                          <p>Running Average: {data.unitsSold.toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="unitsSold"
                  stroke="#4f46e5"
                  dot={false}
                />
                <Scatter dataKey="actualUnits">
                  {movingAverageData.map((entry, index) => (
                    <Scatter key={index} fill={entry.color} />
                  ))}
                </Scatter>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Last 50 Camps - Tests Done
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart
                data={recentCamps}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                barSize={6}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="campLabel" tick={false} />
                <YAxis />
                <Tooltip
                  content={({ payload, label }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p>{label}</p>
                          <p>Date: {data.date.toLocaleDateString()}</p>
                          <p>Tests: {data.unitsSold}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="unitsSold" fill="#4f46e5">
                  <LabelList
                    dataKey="unitsSold"
                    position="top"
                    content={({ x, y, value }) => (
                      <text
                        x={x}
                        y={y - 6}
                        fill="#666"
                        textAnchor="middle"
                        fontSize={9}
                      >
                        {value}
                      </text>
                    )}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAnalysis;