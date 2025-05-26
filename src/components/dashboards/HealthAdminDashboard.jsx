import React, { useState, useEffect } from "react";
import { database } from "../../firebase/config";
import { ref, onValue } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export default function AdminHealthCampDashboard() {
  const [healthCampData, setHealthCampData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyMetrics, setMonthlyMetrics] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString());
  const [campCounts, setCampCounts] = useState({
    overdueCamps: 0,
    todayCamps: 0,
    upcomingCamps: 0,
    overdueReports: 0,
  });
  const isOverdue = (campDate, status, reportStatus) => {
    const today = new Date();
    const campDateTime = new Date(campDate);

    if (status !== "completed" && status !== "cancelled") {
      // Skip overdue check if it's the current day
      if (
        today.getDate() === campDateTime.getDate() &&
        today.getMonth() === campDateTime.getMonth() &&
        today.getFullYear() === campDateTime.getFullYear()
      ) {
        return false;
      }

      // Check if camp date has passed and it's not completed
      const nextDay = new Date(campDateTime);
      nextDay.setDate(nextDay.getDate() + 1);
      return today >= nextDay;
    }

    // For pending closure camps
    if (status === "completed" && !reportStatus) {
      // Check if it's been more than 3 days since camp date
      const threeDaysAfterCamp = new Date(campDateTime);
      threeDaysAfterCamp.setDate(threeDaysAfterCamp.getDate() + 3);
      return today > threeDaysAfterCamp;
    }

    return false;
  };

  const isCurrentDay = (campDate) => {
    const today = new Date();
    const campDateTime = new Date(campDate);
    return (
      today.getDate() === campDateTime.getDate() &&
      today.getMonth() === campDateTime.getMonth() &&
      today.getFullYear() === campDateTime.getFullYear()
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const healthCampRef = ref(database, "healthCamps");
      onValue(healthCampRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const formattedData = Object.entries(data)
            .map(([id, camp]) => {
              if (!camp || typeof camp !== "object") return null;

              try {
                const dateStr = camp.date;
                if (!dateStr) return null;

                const fixedDateStr =
                  typeof dateStr === "string"
                    ? dateStr.replace(/2304/, "2024")
                    : dateStr;

                const campDate = new Date(fixedDateStr);
                if (isNaN(campDate.getTime())) return null;

                const status = camp.status?.toLowerCase() || "";
                const reportStatus = camp.reportStatus?.toLowerCase() || "";

                let unitsSold =
                  camp.partnerName === "HUMANA"
                    ? parseInt(camp.unitsSold || 0) +
                      parseInt(camp.partnerAdjustedCount || 0)
                    : parseInt(camp.unitsSold || 0);

                return {
                  id,
                  ...camp,
                  date: campDate,
                  unitsSold,
                  status,
                  isOverdue: isOverdue(campDate, status, reportStatus),
                  isToday: isCurrentDay(campDate),
                  isUpcoming: campDate > new Date(),
                };
              } catch (error) {
                console.error(`Error processing camp ID ${id}:`, error);
                return null;
              }
            })
            .filter((camp) => camp !== null);

          const overdueCamps = formattedData.filter(
            (camp) => camp.isOverdue
          ).length;
          const todayCamps = formattedData.filter(
            (camp) => camp.isToday
          ).length;
          const upcomingCamps = formattedData.filter(
            (camp) => camp.isUpcoming
          ).length;
          const overdueReports = formattedData.filter(
            (camp) =>
              camp.status === "completed" &&
              !camp.reportStatus &&
              isOverdue(camp.date, camp.status, camp.reportStatus)
          ).length;

          const completedCamps = formattedData.filter(
            (camp) => camp.status === "completed"
          );
          const totalTests = completedCamps.reduce(
            (sum, camp) => sum + camp.unitsSold,
            0
          );
          const avgTests =
            completedCamps.length > 0
              ? Math.round(totalTests / completedCamps.length)
              : 2;

          setCampCounts({
            overdueCamps,
            todayCamps,
            upcomingCamps,
            overdueReports,
          });

          setHealthCampData(formattedData);
          processMonthlyData(formattedData);
        }
        setLoading(false);
      });
    };

    fetchData();
  }, []);

  const processMonthlyData = (data) => {
    const today = new Date();
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.unshift(d);
    }

    const monthlyStats = months.map((month) => {
      const monthData = data.filter(
        (camp) =>
          camp.status === "completed" &&
          camp.date.getMonth() === month.getMonth() &&
          camp.date.getFullYear() === month.getFullYear()
      );

      const totalTests = monthData.reduce(
        (sum, camp) => sum + (camp.unitsSold || 0),
        0
      );
      const campsConducted = monthData.length;
      const avgTests =
        campsConducted > 0
          ? Number((totalTests / campsConducted).toFixed(1))
          : 0;
      const successfulCamps = monthData.filter(
        (camp) => (camp.unitsSold || 0) >= 35
      ).length;
      const successRate =
        campsConducted > 0 ? (successfulCamps / campsConducted) * 100 : 0;

      return {
        month: month.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        }),
        date: month.toISOString(),
        totalTests,
        avgTests,
        campsConducted,
        successfulCamps,
        successRate: Math.round(successRate),
      };
    });

    setMonthlyMetrics(monthlyStats);
    setSelectedMonth(monthlyStats[monthlyStats.length - 1].date);
  };

  const getCurrentAndPreviousData = () => {
    const currentIndex = monthlyMetrics.findIndex(
      (m) => m.date === selectedMonth
    );
    const currentData = monthlyMetrics[currentIndex] || {
      totalTests: 0,
      avgTests: 0,
      campsConducted: 0,
      successfulCamps: 0,
      successRate: 0,
    };
    const previousData = monthlyMetrics[currentIndex - 1] || {
      totalTests: 0,
      avgTests: 0,
      campsConducted: 0,
      successfulCamps: 0,
      successRate: 0,
    };

    const calculateChange = (current, previous) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current: currentData,
      changes: {
        totalTests: calculateChange(
          currentData.totalTests,
          previousData.totalTests
        ),
        avgTests: calculateChange(currentData.avgTests, previousData.avgTests),
        campsConducted: calculateChange(
          currentData.campsConducted,
          previousData.campsConducted
        ),
        successRate: calculateChange(
          currentData.successRate,
          previousData.successRate
        ),
      },
    };
  };

  const { current: selectedMonthData, changes } = getCurrentAndPreviousData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col space-y-6 p-8 bg-slate-50">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">
          Health Camp Statistics
        </h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {new Date(selectedMonth).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {monthlyMetrics.map((metric) => (
              <SelectItem key={metric.date} value={metric.date}>
                {new Date(metric.date).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-purple-900">
              Camps Conducted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-purple-700">
                {selectedMonthData.campsConducted}
              </div>
              {changes.campsConducted !== 0 && (
                <div
                  className={`flex items-center gap-1 ${
                    changes.campsConducted > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {changes.campsConducted > 0 ? (
                    <TrendingUp size={20} />
                  ) : (
                    <TrendingDown size={20} />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(changes.campsConducted).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-blue-900">
              Total Tests Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-blue-700">
                {selectedMonthData.totalTests}
              </div>
              {changes.totalTests !== 0 && (
                <div
                  className={`flex items-center gap-1 ${
                    changes.totalTests > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {changes.totalTests > 0 ? (
                    <TrendingUp size={20} />
                  ) : (
                    <TrendingDown size={20} />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(changes.totalTests).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-green-900">
              Avg Tests/Camp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-green-700">
                {selectedMonthData.avgTests}
              </div>
              {changes.avgTests !== 0 && (
                <div
                  className={`flex items-center gap-1 ${
                    changes.avgTests > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {changes.avgTests > 0 ? (
                    <TrendingUp size={20} />
                  ) : (
                    <TrendingDown size={20} />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(changes.avgTests).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-teal-900">
              Successful Camps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="text-3xl font-bold text-teal-700">
                  {selectedMonthData.successRate}%
                </div>
                <div className="text-sm text-teal-600">
                  ({selectedMonthData.successfulCamps} of{" "}
                  {selectedMonthData.campsConducted})
                </div>
              </div>
              {changes.successRate !== 0 && (
                <div
                  className={`flex items-center gap-1 ${
                    changes.successRate > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {changes.successRate > 0 ? (
                    <TrendingUp size={20} />
                  ) : (
                    <TrendingDown size={20} />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(changes.successRate).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-amber-900">
              Today's Camps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">
              {campCounts.todayCamps}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-red-900">
              Overdue Scheduled Camps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {campCounts.overdueCamps}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-orange-900">
              Overdue Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">
              {campCounts.overdueReports}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-indigo-900">
              Upcoming Camps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">
              {campCounts.upcomingCamps}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">
              Total Tests by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyMetrics}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#374151" />
                  <YAxis stroke="#374151" />
                  <Tooltip />
                  <Bar dataKey="totalTests" fill="#2563eb" name="Total Tests">
                    <LabelList
                      dataKey="totalTests"
                      position="top"
                      fill="#374151"
                      offset={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">
              Camps Conducted by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyMetrics}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#374151" />
                  <YAxis stroke="#374151" />
                  <Tooltip />
                  <Bar
                    dataKey="campsConducted"
                    fill="#2563eb"
                    name="Camps Conducted"
                  >
                    <LabelList
                      dataKey="campsConducted"
                      position="top"
                      fill="#374151"
                      offset={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
