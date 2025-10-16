import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  TrendingDown,
  Calendar,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const API_BASE = "http://localhost:8080"; // backend manzili
const token = localStorage.getItem("token");

const Finance = () => {
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Ma'lumotlarni olish
  const fetchFinanceData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/finance/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFinanceData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Finance data fetch error:", err);
      toast.error("Failed to load finance data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading finance data...</p>;
  }

  if (!financeData) {
    return <p className="text-center mt-10 text-red-500">No finance data available</p>;
  }

  // 💰 Backend’dan kelgan qiymatlar
  const {
    dailyIncome,
    weeklyIncome,
    monthlyIncome,
    yearlyIncome,
    monthlyGrowth,
    yearlyGrowth,
    totalProfit,
    averagePayment,
  } = financeData;

  // ✅ Backenddan real qiymatlar bilan kartalar
  const incomeStats = [
    {
      title: "Daily Income",
      value: `$${dailyIncome?.toLocaleString()}`,
      icon: Calendar,
      trend: `${monthlyGrowth > 0 ? "+" : ""}${monthlyGrowth?.toFixed(1)}% from yesterday`,
      color: monthlyGrowth >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Weekly Income",
      value: `$${weeklyIncome?.toLocaleString()}`,
      icon: CalendarDays,
      trend: "vs previous 7 days",
      color: "text-green-600",
    },
    {
      title: "Monthly Income",
      value: `$${monthlyIncome?.toLocaleString()}`,
      icon: CalendarRange,
      trend: `${monthlyGrowth > 0 ? "+" : ""}${monthlyGrowth?.toFixed(1)}% from last month`,
      color: monthlyGrowth >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Annual Income",
      value: `$${yearlyIncome?.toLocaleString()}`,
      icon: TrendingUp,
      trend: `${yearlyGrowth > 0 ? "+" : ""}${yearlyGrowth?.toFixed(1)}% from last year`,
      color: yearlyGrowth >= 0 ? "text-green-600" : "text-red-600",
    },
  ];

  const expenseStats = [
    {
      title: "Average Payment",
      value: `$${averagePayment?.toLocaleString()}`,
      icon: CreditCard,
      trend: "Per client average",
      color: "text-blue-600",
    },
    {
      title: "Total Profit",
      value: `$${totalProfit?.toLocaleString()}`,
      icon: DollarSign,
      trend: "Total (TotalPayment - InitialPayment)",
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="text-muted-foreground">
          Real-time financial summary from client payments
        </p>
      </div>

      <Tabs defaultValue="income" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Profit & Analysis</TabsTrigger>
        </TabsList>

        {/* INCOME */}
        <TabsContent value="income" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {incomeStats.map((stat) => (
              <Card key={stat.title} className="border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${stat.color}`}>{stat.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PROFIT */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {expenseStats.map((stat) => (
              <Card key={stat.title} className="border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500">{stat.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 🔍 Region va Country breakdown */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Income by Region</h2>
            <div className="grid md:grid-cols-3 gap-2">
              {Object.entries(financeData.incomeByRegion || {}).map(([region, val]) => (
                <Card key={region}>
                  <CardContent className="py-3">
                    <p className="text-sm text-gray-500">{region || "Unknown"}</p>
                    <p className="text-xl font-semibold">${val.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-2">Income by Country</h2>
            <div className="grid md:grid-cols-3 gap-2">
              {Object.entries(financeData.incomeByCountry || {}).map(([country, val]) => (
                <Card key={country}>
                  <CardContent className="py-3">
                    <p className="text-sm text-gray-500">{country || "Unknown"}</p>
                    <p className="text-xl font-semibold">${val.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance;
