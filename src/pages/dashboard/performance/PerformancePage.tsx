import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCcw, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function PerformancePage() {
  const [loading, setLoading] = useState(false);
  const [performances, setPerformances] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [employeeStats, setEmployeeStats] = useState<any[]>([]);
  const [bonusAmount, setBonusAmount] = useState<number>(100000);

  // 🔹 Bugungi natijalarni olish
  const fetchToday = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/performance/today`);
      setPerformances(res.data.data || []);
    } catch (err) {
      toast.error("Bugungi natijalarni yuklashda xatolik");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Oylik natijalarni olish (grafik uchun)
  const fetchMonthly = async () => {
    try {
      const res = await axios.get(`${API_BASE}/performance/monthly`);
      const grouped = groupByEmployee(res.data.data || []);
      setChartData(grouped);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Hodimlar bo‘yicha oylik tahlil
  const fetchEmployeeStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/performance/stats/monthly`);
      setEmployeeStats(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Oylik hodimlar statistikasi yuklanmadi");
    }
  };

  // 🔹 Bonus formulani o‘zgartirish
  const updateBonusFormula = async () => {
    try {
      await axios.put(`${API_BASE}/performance/bonus/formula?newBonus=${bonusAmount}`);
      toast.success("Bonus formulasi yangilandi");
      fetchToday();
    } catch (err) {
      toast.error("Bonusni yangilashda xatolik");
      console.error(err);
    }
  };

  // 🔹 Bugungi hisobni qayta yangilash
  const recalcToday = async () => {
    try {
      await axios.post(`${API_BASE}/performance/update?bonus=${bonusAmount}`);
      toast.success("Bugungi hisob qayta yangilandi");
      fetchToday();
    } catch (err) {
      toast.error("Hisobni yangilashda xatolik");
    }
  };

  // 🔹 Hodim bo‘yicha umumiy bonusni grafik uchun guruhlash
  const groupByEmployee = (data: any[]) => {
    const map: Record<string, number> = {};
    data.forEach((d) => {
      const name = d.employee?.fullName || "Noma’lum";
      map[name] = (map[name] || 0) + (d.totalBonus || 0);
    });
    return Object.keys(map).map((name) => ({ name, totalBonus: map[name] }));
  };

  useEffect(() => {
    fetchToday();
    fetchMonthly();
    fetchEmployeeStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">💼 Sales Performance & Bonus Dashboard</h1>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            className="w-32"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(Number(e.target.value))}
            placeholder="Bonus/Payment"
          />
          <Button onClick={updateBonusFormula}>Update Formula</Button>
          <Button variant="outline" onClick={recalcToday}>
            <RefreshCcw className="w-4 h-4 mr-1" /> Recalculate
          </Button>
        </div>
      </div>

      {/* 🧾 Bugungi hodimlar jadvali */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Bugungi Hodimlar Faoliyati</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : performances.length === 0 ? (
            <p className="text-center text-muted-foreground">Ma’lumot yo‘q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="p-3">👤 Hodim</th>
                    <th className="p-3">📈 Convert (Lead→Client)</th>
                    <th className="p-3">💳 To‘lovlar</th>
                    <th className="p-3">🏆 Bonusga haqli</th>
                    <th className="p-3">💰 Umumiy Bonus</th>
                    <th className="p-3">🕓 Yangilangan</th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/40">
                      <td className="p-3 font-medium">{p.employee?.fullName || "Noma’lum"}</td>
                      <td className="p-3">{p.convertedCount}</td>
                      <td className="p-3">{p.paidClientsCount}</td>
                      <td className="p-3">
                        {p.qualifiedForBonus ? (
                          <span className="text-green-600 font-semibold">✅ Ha</span>
                        ) : (
                          <span className="text-red-500 font-semibold">❌ Yo‘q</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-green-600">
                        {p.totalBonus?.toLocaleString()} so‘m
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {p.updatedAt?.replace("T", " ").substring(0, 16)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 📊 Oylik umumiy bonus grafigi */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>📆 Oylik Bonus Statistikasi</CardTitle>
          <TrendingUp className="text-green-500" />
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground">Oylik ma’lumot yo‘q</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalBonus" fill="#22c55e" name="Umumiy Bonus" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 🧮 Hodimlar bo‘yicha oylik tahlil */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>👨‍💼 Oylik Hodimlar Statistikasi</CardTitle>
          <BarChart3 className="text-blue-500" />
        </CardHeader>
        <CardContent>
          {employeeStats.length === 0 ? (
            <p className="text-center text-muted-foreground">Ma’lumot yo‘q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="p-3">👤 Hodim</th>
                    <th className="p-3">📜 Shartnoma soni</th>
                    <th className="p-3">💳 To‘lov qilgan</th>
                    <th className="p-3">⛔️ To‘lov qilmagan</th>
                    <th className="p-3">📊 Foiz (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeStats.map((s) => (
                    <tr key={s.employeeId} className="border-b hover:bg-muted/40">
                      <td className="p-3 font-medium">{s.fullName}</td>
                      <td className="p-3">{s.contracts}</td>
                      <td className="p-3 text-green-600 font-semibold">{s.paid}</td>
                      <td className="p-3 text-yellow-600 font-semibold">{s.unpaid}</td>
                      <td className="p-3 font-bold">{s.successRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
