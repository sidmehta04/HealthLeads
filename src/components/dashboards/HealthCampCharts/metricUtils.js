export const getFilteredData = (data, timeFrame, selectedMonthYear, selectedYear) => {
  switch (timeFrame) {
    case "mtd": {
      if (!selectedMonthYear) return { currentData: [], previousData: [] };
      
      // Parse the month-year key (format: "month-year")
      const [monthStr, yearStr] = selectedMonthYear.split("-");
      const selectedMonth = parseInt(monthStr);
      const selectedYear = parseInt(yearStr);
      
      // Calculate previous month (handle year boundary)
      let previousMonth = selectedMonth - 1;
      let previousYear = selectedYear;
      
      if (previousMonth < 0) {
        previousMonth = 11;
        previousYear -= 1;
      }
      
      // Filter data for current and previous months
      const currentMonthData = data.filter(camp => 
        camp.date.getMonth() === selectedMonth && 
        camp.date.getFullYear() === selectedYear
      );
      
      const lastMonthData = data.filter(camp => 
        camp.date.getMonth() === previousMonth && 
        camp.date.getFullYear() === previousYear
      );
      
      return { currentData: currentMonthData, previousData: lastMonthData };
    }
    
    case "ytd": {
      if (!selectedYear) return { currentData: [], previousData: [] };
      
      // Extract start year from fiscal year format (FY2024-2025)
      const [, startYearStr] = selectedYear.match(/FY(\d{4})-\d{4}/);
      const startYear = parseInt(startYearStr);
      
      // Define fiscal year boundaries
      const fyStart = new Date(startYear, 3, 1); // April 1st 
      const fyEnd = new Date(startYear + 1, 2, 31); // March 31st
      const lastFyStart = new Date(startYear - 1, 3, 1);
      const lastFyEnd = new Date(startYear, 2, 31);
      
      // Filter data for current and previous fiscal years
      const currentYTDData = data.filter(camp => 
        camp.date >= fyStart && camp.date <= fyEnd
      );
      
      const lastYTDData = data.filter(camp => 
        camp.date >= lastFyStart && camp.date <= lastFyEnd
      );
      
      return { currentData: currentYTDData, previousData: lastYTDData };
    }
    
    case "itd":
      return { currentData: data, previousData: [] };
      
    default:
      return { currentData: [], previousData: [] };
  }
};

export const calculateMetrics = (currentData, previousData) => {
  const current = {
    totalCamps: currentData.length,
    unitsSold: currentData.reduce((sum, camp) => sum + camp.unitsSold, 0),
    totalRevenue: currentData.reduce((sum, camp) => sum + camp.revenue, 0),
    avgUnitsPerCamp: currentData.length > 0 
      ? (currentData.reduce((sum, camp) => sum + camp.unitsSold, 0) / currentData.length)
      : 0
  };
  
  const previous = {
    totalCamps: previousData.length,
    unitsSold: previousData.reduce((sum, camp) => sum + camp.unitsSold, 0),
    totalRevenue: previousData.reduce((sum, camp) => sum + camp.revenue, 0),
    avgUnitsPerCamp: previousData.length > 0
      ? (previousData.reduce((sum, camp) => sum + camp.unitsSold, 0) / previousData.length)
      : 0
  };
  
  const calculateChange = (current, previous) => 
    previous ? Number(((current - previous) / previous * 100).toFixed(1)) : undefined;
  
  return {
    ...current,
    changes: {
      totalCamps: calculateChange(current.totalCamps, previous.totalCamps),
      unitsSold: calculateChange(current.unitsSold, previous.unitsSold),
      totalRevenue: calculateChange(current.totalRevenue, previous.totalRevenue),
      avgUnitsPerCamp: calculateChange(current.avgUnitsPerCamp, previous.avgUnitsPerCamp)
    }
  };
};