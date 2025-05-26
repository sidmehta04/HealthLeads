import React, { useState, useEffect } from "react";
import { database } from "../../firebase/config";
import { ref, onValue } from "firebase/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsDisplay } from "./HealthCampCharts/CampPerformanceChart";
import { PeriodSelector } from "./HealthCampCharts/PeriodSelector";
import {
  getFilteredData,
  calculateMetrics,
} from "./HealthCampCharts/metricUtils";
import StaffPerformanceDashboard from "./HealthCampCharts/Performance";
import PerformanceAnalysis from "./HealthCampCharts/CampsPerformance";
import TimeMetricsCharts from "./HealthCampCharts/TimeCharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HealthCampDashboard() {
  const [healthCampData, setHealthCampData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonthYears, setAvailableMonthYears] = useState([]);
  const [activeView, setActiveView] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      const healthCampRef = ref(database, "healthCamps");
      onValue(healthCampRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const formattedData = Object.entries(data)
            .map(([id, camp]) => {
              // Validate camp data
              if (!camp || typeof camp !== "object") {
                console.warn(`Invalid camp data for ID ${id}`);
                return null;
              }

              try {
                // Safely handle date conversion
                const dateStr = camp.date;
                if (!dateStr) {
                  console.warn(`Missing date for camp ID ${id}`);
                  return null;
                }

                // Handle the date string, replacing 2304 with 2024 if present
                const fixedDateStr =
                  typeof dateStr === "string"
                    ? dateStr.replace(/2304/, "2024")
                    : dateStr;

                const date = new Date(fixedDateStr);

                // Validate date
                if (isNaN(date.getTime())) {
                  console.warn(`Invalid date for camp ID ${id}: ${dateStr}`);
                  return null;
                }

                // Safe parsing of numeric values
                const unitsSold =
                  camp.partnerName === "HUMANA"
                    ? parseInt(camp.unitsSold || 0) +
                      parseInt(camp.partnerAdjustedCount || 0)
                    : parseInt(camp.unitsSold || 0);

                const revenue = parseFloat(camp.revenue || 0);

                return {
                  id,
                  ...camp,
                  date,
                  unitsSold,
                  revenue,
                };
              } catch (error) {
                console.error(`Error processing camp ID ${id}:`, error);
                return null;
              }
            })
            .filter(
              (camp) =>
                camp !== null && // Remove any invalid entries
                (camp.status?.toLowerCase() === "completed" ||
                  camp.status?.toLowerCase() === "closed")
            );

          // Generate month-year combinations for all available data
          const monthYearOptions = [];
          formattedData.forEach((camp) => {
            const month = camp.date.getMonth();
            const year = camp.date.getFullYear();
            const monthYearKey = `${month}-${year}`;

            if (
              !monthYearOptions.some((option) => option.key === monthYearKey)
            ) {
              monthYearOptions.push({
                key: monthYearKey,
                month,
                year,
                label: `${new Date(year, month).toLocaleString("default", {
                  month: "long",
                })} ${year}`,
                date: new Date(year, month, 1),
              });
            }
          });

          // Sort by date, most recent first
          monthYearOptions.sort((a, b) => b.date - a.date);

          setAvailableMonthYears(monthYearOptions);
          // Set default to most recent month-year
          setSelectedMonthYear(
            monthYearOptions.length > 0 ? monthYearOptions[0].key : ""
          );

          // Calculate fiscal years
          const years = [
            ...new Set(
              formattedData.map((camp) => {
                const fiscalYear =
                  camp.date.getMonth() < 3
                    ? `FY${
                        camp.date.getFullYear() - 1
                      }-${camp.date.getFullYear()}`
                    : `FY${camp.date.getFullYear()}-${
                        camp.date.getFullYear() + 1
                      }`;
                return fiscalYear;
              })
            ),
          ]
            .sort()
            .reverse();

          setAvailableYears(years);
          setSelectedYear(years[0]);
          setHealthCampData(formattedData);
        }
        setLoading(false);
      });
    };

    fetchData();
  }, []);

  const getMonthlyData = (data, selectedMonthYear) => {
    if (!selectedMonthYear || !availableMonthYears.length) {
      return { currentData: [], previousData: [] };
    }

    // Find the selected month-year option
    const selectedOption = availableMonthYears.find(
      (option) => option.key === selectedMonthYear
    );
    if (!selectedOption) {
      return { currentData: [], previousData: [] };
    }

    const selectedMonth = selectedOption.month;
    const selectedYear = selectedOption.year;

    // Get data for the selected month and year
    const currentData = data.filter((camp) => {
      const campDate = camp.date;
      return (
        campDate.getMonth() === selectedMonth &&
        campDate.getFullYear() === selectedYear
      );
    });

    // Calculate previous month (handling year change if necessary)
    let previousMonth = selectedMonth - 1;
    let previousYear = selectedYear;

    if (previousMonth < 0) {
      previousMonth = 11;
      previousYear -= 1;
    }

    // Get data for the previous month and year
    const previousData = data.filter((camp) => {
      const campDate = camp.date;
      return (
        campDate.getMonth() === previousMonth &&
        campDate.getFullYear() === previousYear
      );
    });

    return { currentData, previousData };
  };

  const getWeeklyData = (data) => {
    const currentDate = new Date();
    const lastSaturday = new Date(currentDate);
    lastSaturday.setDate(
      currentDate.getDate() - ((currentDate.getDay() + 1) % 7)
    );
    lastSaturday.setHours(23, 59, 59, 999);

    const weekPeriods = [];
    for (let i = 0; i < 6; i++) {
      const endDate = new Date(lastSaturday);
      endDate.setDate(lastSaturday.getDate() - i * 7);
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      weekPeriods.push({ startDate, endDate });
    }

    const currentData = data.filter((camp) => {
      const campDate = camp.date;
      return (
        campDate >= weekPeriods[5].startDate &&
        campDate <= weekPeriods[0].endDate
      );
    });

    const previousStartDate = new Date(weekPeriods[5].startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 7 * 6);
    const previousEndDate = new Date(weekPeriods[0].endDate);
    previousEndDate.setDate(previousEndDate.getDate() - 7 * 6);

    const previousData = data.filter((camp) => {
      const campDate = camp.date;
      return campDate >= previousStartDate && campDate <= previousEndDate;
    });

    return { currentData, previousData, weekPeriods };
  };

  // Function to get filtered data based on timeframe
  const getFilteredDataForTimeframe = (timeframe) => {
    if (timeframe === "mtd") {
      const monthlyData = getMonthlyData(healthCampData, selectedMonthYear);
      return monthlyData.currentData;
    } else {
      const filteredData = getFilteredData(
        healthCampData,
        timeframe,
        null,
        selectedYear
      );
      return filteredData.currentData;
    }
  };

  const renderOverviewContent = (timeframe) => {
    let currentData, previousData, weekPeriods;

    if (timeframe === "mtd") {
      const monthlyData = getMonthlyData(healthCampData, selectedMonthYear);
      currentData = monthlyData.currentData;
      previousData = monthlyData.previousData;

      // Get weekly data for other components
      const weeklyData = getWeeklyData(healthCampData);
      weekPeriods = weeklyData.weekPeriods;
    } else {
      const filteredData = getFilteredData(
        healthCampData,
        timeframe,
        null,
        selectedYear
      );
      currentData = filteredData.currentData;
      previousData = filteredData.previousData;
    }

    const metrics = calculateMetrics(currentData, previousData);

    // Get the selected month-year display label
    const selectedMonthYearLabel =
      availableMonthYears.find((option) => option.key === selectedMonthYear)
        ?.label || "";

    return (
      <div className="space-y-4">
        <MetricsDisplay
          metrics={metrics}
          timeframe={
            timeframe === "mtd"
              ? selectedMonthYearLabel
              : timeframe.toUpperCase()
          }
        />
        <TimeMetricsCharts
          data={timeframe === "mtd" ? healthCampData : currentData}
          timeframe={timeframe}
          selectedMonthYear={selectedMonthYear}
          availableMonthYears={availableMonthYears}
        />
        <PerformanceAnalysis
          data={timeframe === "mtd" ? healthCampData : currentData}
          timeframe={timeframe}
          selectedMonthYear={selectedMonthYear}
          availableMonthYears={availableMonthYears}
          selectedYear={selectedYear} // Make sure this is passed
        />
      </div>
    );
  };

  const renderStaffContent = (timeframe) => {
    // Get properly filtered data for staff performance dashboard
    const filteredData = getFilteredDataForTimeframe(timeframe);

    return (
      <div className="space-y-4">
        <StaffPerformanceDashboard
          healthCampData={filteredData}
          timeframe={timeframe}
          selectedMonthYear={selectedMonthYear}
          availableMonthYears={availableMonthYears}
          selectedYear={selectedYear}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col space-y-2 p-8 bg-gray-50">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">
          Health Camp Analytics
        </h2>
        <div className="space-x-4">
          <button
            onClick={() => setActiveView("overview")}
            className={`px-4 py-2 rounded ${
              activeView === "overview"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView("staff")}
            className={`px-4 py-2 rounded ${
              activeView === "staff" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Staff Details
          </button>
        </div>
      </div>

      <div className="space-y-10">
        <Tabs defaultValue="ytd" className="w-full">
          <div className="flex items-center justify-between gap-4 mb-4">
            <TabsList className="grid w-2/3 grid-cols-3">
              <TabsTrigger value="mtd">Month-To-Date</TabsTrigger>
              <TabsTrigger value="ytd">Year to Date (Apr-Mar)</TabsTrigger>
              <TabsTrigger value="itd">Inception to Date</TabsTrigger>
            </TabsList>
            <div className="w-2/3">
              <TabsContent value="mtd" className="m-0">
                <Select
                  value={selectedMonthYear}
                  onValueChange={(value) => setSelectedMonthYear(value)}
                >
                  <SelectTrigger className="w-[40%]">
                    <SelectValue>
                      {availableMonthYears.find(
                        (option) => option.key === selectedMonthYear
                      )?.label || "Select Month"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonthYears.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="ytd" className="m-0">
                <PeriodSelector
                  timeframe="ytd"
                  value={selectedYear}
                  onChange={setSelectedYear}
                  options={availableYears}
                />
              </TabsContent>
            </div>
          </div>
          <TabsContent value="mtd" className="mt-6">
            {activeView === "overview"
              ? renderOverviewContent("mtd")
              : renderStaffContent("mtd")}
          </TabsContent>
          <TabsContent value="ytd" className="mt-6">
            {activeView === "overview"
              ? renderOverviewContent("ytd")
              : renderStaffContent("ytd")}
          </TabsContent>
          <TabsContent value="itd" className="mt-6">
            {activeView === "overview"
              ? renderOverviewContent("itd")
              : renderStaffContent("itd")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
