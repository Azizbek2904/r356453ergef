import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCcw, TrendingUp } from "lucide-react";
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

// API manzili
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// 🧩 Tiplash (ESLint uchun)
interface Employee {
    fullName: string;
}

interface Performance {
    id: number;
    employee: Employee;
    convertedCount: number;
    paidClientsCount: number;
    qualifiedForBonus: boolean;
    totalBonus: number;
    updatedAt: string;
}

interface ChartData {
    name: string;
    totalBonus: number;
}

export default function PerformancePage() {
    const [loading, setLoading] = useState<boolean>(false);
    const [performances, setPerformances] = useState<Performance[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [bonusAmount, setBonusAmount] = useState<number>(100000);

    // 🔹 Bugungi natijalarni olish
    const fetchToday = async () => {
        try {
            setLoading(true);
            const res = await axios.get<{ data: Performance[] }>(
                `${API_BASE}/performance/today`
            );
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
            const res = await axios.get<{ data: Performance[] }>(
                `${API_BASE}/performance/monthly`
            );
            const grouped = groupByEmployee(res.data.data || []);
            setChartData(grouped);
        } catch (err) {
            console.error(err);
        }
    };

    // 🔹 Bonus formulani o‘zgartirish (faqat admin)
    const updateBonusFormula = async () => {
        try {
            await axios.put(
                `${API_BASE}/performance/bonus/formula?newBonus=${bonusAmount}`
            );
            toast.success("Bonus formulasi yangilandi");
            fetchToday();
        } catch (err) {
            toast.error("Bonusni yangilashda xatolik");
            console.error(err);
        }
    };

    // 🔹 Bugungi hisobni yangilash (Admin trigger)
    const recalcToday = async () => {
        try {
            await axios.post(`${API_BASE}/performance/update?bonus=${bonusAmount}`);
            toast.success("Bugungi hisob qayta yangilandi");
            fetchToday();
        } catch (err) {
            toast.error("Hisobni yangilashda xatolik");
        }
    };

    // 🔹 Hodimlar bo‘yicha umumiy bonusni hisoblash (grafik uchun)
    const groupByEmployee = (data: Performance[]): ChartData[] => {
        const map: Record<string, number> = {};
        data.forEach((d) => {
            const name = d.employee?.fullName || "Noma’lum";
            map[name] = (map[name] || 0) + (d.totalBonus || 0);
        });
        return Object.keys(map).map((name) => ({
            name,
            totalBonus: map[name],
        }));
    };

    useEffect(() => {
        fetchToday();
        fetchMonthly();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">
                    💼 Sales Performance & Bonus Dashboard
                </h1>
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
                                        <td className="p-3 font-medium">
                                            {p.employee?.fullName || "Noma’lum"}
                                        </td>
                                        <td className="p-3">{p.convertedCount}</td>
                                        <td className="p-3">{p.paidClientsCount}</td>
                                        <td className="p-3">
                                            {p.qualifiedForBonus ? (
                                                <span className="text-green-600 font-semibold">
                            ✅ Ha
                          </span>
                                            ) : (
                                                <span className="text-red-500 font-semibold">
                            ❌ Yo‘q
                          </span>
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

            {/* 📊 Oylik bonus grafigi */}
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>📆 Oylik Bonus Statistikasi</CardTitle>
                    <TrendingUp className="text-green-500" />
                </CardHeader>
                <CardContent>
                    {chartData.length === 0 ? (
                        <p className="text-center text-muted-foreground">
                            Oylik ma’lumot yo‘q
                        </p>
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
        </div>
    );
}
