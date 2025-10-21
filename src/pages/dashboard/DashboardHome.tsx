import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, RefreshCw, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";

const API_BASE = "http://207.154.227.250:8080/dashboard";

interface DashboardStats {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalClients: number;
  todayLeads: number;
  todayClients: number;
  todayPayments: number;
  fullPaidClients: number;
  partiallyPaidClients: number;
  pendingPayments: number;
  totalDocuments: number;
  totalPaymentAmount: number;
  regionStats: { region: string; leads: number; clients: number }[];
}

interface TrendPoint {
  label: string;
  leads: number;
  clients: number;
}

export default function DashboardHome() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendType, setTrendType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  // 🧠 AI tahlil
  const generateInsights = (stats: DashboardStats, trends: TrendPoint[]) => {
    const insights: string[] = [];

    if (!stats || trends.length === 0) return [];

    const last = trends.at(-1);
    const prev = trends.at(-2);

    if (last && prev) {
      const leadDiff = last.leads - prev.leads;
      const clientDiff = last.clients - prev.clients;

      if (leadDiff > 0)
        insights.push(
          `📈 So‘nggi davrda yangi leadlar soni ${leadDiff} taga oshgan (${last.leads} ta lead).`
        );

      if (clientDiff > 0)
        insights.push(
          `💼 ${last.clients} ta lead mijozga aylangan — bu o‘sish ijobiy tendensiyani ko‘rsatadi.`
        );
    }

    if (stats.fullPaidClients > stats.partiallyPaidClients)
      insights.push(
        `💰 Ko‘pchilik mijozlar to‘liq to‘lovni amalga oshirgan (${stats.fullPaidClients} ta).`
      );

    if (stats.pendingPayments > 0)
      insights.push(`⚠️ ${stats.pendingPayments} ta mijoz hali to‘lovni yakunlamagan.`);

    if (stats.conversionRate > 50)
      insights.push(`🚀 Konversiya darajasi yuqori — ${stats.conversionRate.toFixed(1)}%!`);
    else
      insights.push(`📊 Konversiya darajasi past — ${stats.conversionRate.toFixed(1)}%.`);

    setAiInsights(insights);
  };

  // 🔹 Dashboard statistikasi
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/stats`;
      const params: string[] = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length) url += `?${params.join("&")}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json?.data) setData(json.data);
      else toast.error("Dashboard ma'lumotlarini olishda xatolik");
    } catch {
      toast.error("Server bilan bog‘lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Trend statistikasi
  const fetchTrends = async (period: "daily" | "weekly" | "monthly") => {
    try {
      setTrendLoading(true);
      setTrendType(period);
      const res = await fetch(`${API_BASE}/trends?period=${period}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json?.data?.points) setTrendData(json.data.points);
      else toast.error("Trend ma'lumotlarini olishda xatolik");
    } catch {
      toast.error("Trend yuklanmadi");
    } finally {
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchDashboard();
      await fetchTrends("daily");
    })();
  }, []);

  useEffect(() => {
    if (data && trendData.length > 0) generateInsights(data, trendData);
  }, [data, trendData]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            ConnectCRM – Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Barcha bo‘limlar faoliyati, konversiyalar va mijozlar statistikasi
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
          <Button onClick={fetchDashboard}>
            <Calendar className="w-4 h-4 mr-1" /> Filter
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              fetchDashboard();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={data?.totalLeads || 0} color="blue" />
        <StatCard title="Converted Leads" value={data?.convertedLeads || 0} color="green" />
        <StatCard
          title="Conversion Rate"
          value={`${data?.conversionRate?.toFixed(1)}%`}
          color="violet"
        />
        <StatCard title="Total Clients" value={data?.totalClients || 0} color="cyan" />
        <StatCard title="Documents" value={data?.totalDocuments || 0} color="orange" />
        <StatCard title="Today Leads" value={data?.todayLeads || 0} color="purple" />
        <StatCard title="Today Clients" value={data?.todayClients || 0} color="teal" />
        <StatCard title="Today Payments" value={data?.todayPayments || 0} color="emerald" />
      </div>

      {/* AI INSIGHT */}
      {aiInsights.length > 0 && (
        <Card className="border-blue-300 bg-blue-50/70 dark:bg-blue-950/40">
          <CardHeader className="flex items-center gap-2">
            <Sparkles className="text-blue-500" />
            <CardTitle>AI Insight</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {aiInsights.map((txt, i) => (
                <li key={i}>{txt}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* TRENDS */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Trend Analysis (
            {trendType.toUpperCase()})
          </CardTitle>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly"].map((p) => (
              <Button
                key={p}
                variant={trendType === p ? "default" : "outline"}
                onClick={() => fetchTrends(p as any)}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-96">
          {trendLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="clients" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* REGION */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 Region Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {data?.regionStats?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.regionStats}>
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                <Bar dataKey="clients" fill="#10b981" name="Clients" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">
              No regional data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 🔹 Stat Card
const StatCard = ({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color: string;
}) => (
  <Card className={`border-l-4 border-${color}-500`}>
    <CardContent className="pt-4 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-3xl font-semibold mt-1 text-${color}-600`}>{value}</p>
    </CardContent>
  </Card>
);
