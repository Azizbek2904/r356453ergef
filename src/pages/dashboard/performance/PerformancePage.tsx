import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
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
  const [bonus, setBonus] = useState<number>(100);
  const [chartData, setChartData] = useState<any[]>([]);

  // 🔹 Bugungi performance ma’lumotlarini olish
  const fetchPerformances = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/performance/today`);
      setPerformances(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Ma’lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Oylik chart uchun ma’lumotlar
  const fetchMonthly = async () => {
    try {
      const res = await axios.get(`${API_BASE}/performance/monthly`);
      const grouped = groupByEmployee(res.data.data || []);
      setChartData(grouped);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Bonus formulani yangilash
  const updateBonus = async () => {
    try {
      await axios.put(`${API_BASE}/performance/bonus?amount=${bonus}`);
      toast.success("Bonus formulasi yangilandi");
      fetchPerformances();
    } catch (err) {
      toast.error("Bonusni yangilashda xatolik");
    }
  };

  // 🔹 Hodim bo‘yicha ma’lumotni guruhlash (grafik uchun)
  const groupByEmployee = (data: any[]) => {
    const map: Record<string, number> = {};
    data.forEach((d) => {
      const name = d.employee?.fullName || "Noma’lum";
      map[name] = (map[name] || 0) + (d.totalBonus || 0);
    });
    return Object.keys(map).map((name) => ({ name, totalBonus: map[name] }));
  };

  useEffect(() => {
    fetchPerformances();
    fetchMonthly();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">💰 Sales Performance & Bonus Panel</h1>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            className="w-32"
            value={bonus}
            onChange={(e) => setBonus(Number(e.target.value))}
          />
          <Button onClick={updateBonus}>Update Bonus</Button>
        </div>
      </div>

      {/* 🔹 Hodimlar jadvali */}
      <Card>
        <CardHeader>
          <CardTitle>Bugungi Hodimlar Faoliyati</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : performances.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Hozircha ma’lumot yo‘q
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="p-3">👤 Hodim</th>
                    <th className="p-3">📈 Lead → Client</th>
                    <th className="p-3">💳 To‘lovlar</th>
                    <th className="p-3">💵 Bonus (so‘m)</th>
                    <th className="p-3">🕓 Yangilangan</th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/40">
                      <td className="p-3 font-medium">
                        {p.employee?.fullName || "Noma’lum"}
                      </td>
                      <td className="p-3">{p.convertedCount}</td>
                      <td className="p-3">{p.paidClientsCount}</td>
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

      {/* 🔹 Oylik grafik */}
      <Card>
        <CardHeader>
          <CardTitle>Oylik Bonus Statistikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalBonus" fill="#22c55e" name="Umumiy Bonus" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
