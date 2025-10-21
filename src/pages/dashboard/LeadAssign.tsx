import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Trash2,
  Search,
  Calendar,
  RefreshCcw,
  Info,
  Filter,
  Clock,
  FilePlus2,
} from "lucide-react";

const API_BASE = "http://207.154.227.250:8080";

export default function LeadAssign() {
  const [salesManagers, setSalesManagers] = useState([]);
  const [unassignedLeads, setUnassignedLeads] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  const token = localStorage.getItem("token") || "";
  const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });

  // 🚀 Fetch data
  const fetchSalesManagers = async () => {
    const res = await axiosInstance.get("/lead-assign/sales-managers");
    setSalesManagers(res.data?.data || []);
  };

  const fetchUnassignedLeads = async () => {
    const res = await axiosInstance.get("/lead-assign/unassigned");
    setUnassignedLeads(res.data?.data || []);
  };

  const fetchAssignments = async () => {
    const res = await axiosInstance.get("/lead-assign/history");
    setAssignments(res.data?.data || []);
  };

  const reloadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSalesManagers(),
        fetchUnassignedLeads(),
        fetchAssignments(),
      ]);
    } catch (err) {
      toast.error("❌ Ma'lumotlarni yuklashda xato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAll();
  }, []);

  // ✅ Assign qilish
  const handleAssignLeads = async () => {
    if (!selectedManagerId || selectedLeads.length === 0)
      return toast.warning("⚠️ Manager va lead(lar)ni tanlang!");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) return toast.error("Auth user topilmadi (login kerak)");

    try {
      setLoading(true);
      await axiosInstance.post("/lead-assign", {
        salesManagerId: Number(selectedManagerId),
        leadIds: selectedLeads.map(Number),
        assignedById: user.id,
      });
      toast.success("✅ Leadlar muvaffaqiyatli biriktirildi!");
      setSelectedLeads([]);
      setSelectedManagerId("");
      reloadAll();
    } catch (err) {
      toast.error("❌ Biriktirishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

 const handleDeleteAssignment = async (id) => {
  const choice = window.prompt(
    "🗑️ Amalni tanlang:\n\n👉 'restore' — umumiy ro‘yxatga qaytarish\n👉 'delete' — butunlay o‘chirish"
  );

  if (!choice) {
    toast.info("Bekor qilindi");
    return;
  }

  const action = choice.trim().toLowerCase();
  if (action !== "restore" && action !== "delete") {
    toast.warning("⚠️ Faqat 'restore' yoki 'delete' kiriting!");
    return;
  }

  try {
    setLoading(true);
    const url =
      action === "restore"
        ? `/lead-assign/${id}?restoreToGeneralList=true`
        : `/lead-assign/${id}?restoreToGeneralList=false`;

    await axiosInstance.delete(url);

    toast.success(
      action === "restore"
        ? "♻️ Leadlar qayta umumiy ro‘yxatga qo‘shildi!"
        : "🗑️ Leadlar butunlay o‘chirildi!"
    );

    await reloadAll();
  } catch (err) {
    console.error(err);
    toast.error("❌ O‘chirishda xatolik!");
  } finally {
    setLoading(false);
  }
};


  // ✅ Tafsilotlar
  const handleViewDetails = async (assignmentId) => {
    try {
      const res = await axiosInstance.get(
        `/lead-assign/${assignmentId}/details`
      );
      setSelectedDetail(res.data?.data);
    } catch {
      toast.error("❌ Tafsilotlarni yuklashda xato");
    }
  };

  // ✅ Sana oralig‘ida filterlash
  const handleFilterByDate = async () => {
    if (!dateFilter.start || !dateFilter.end)
      return toast.warning("⚠️ Sana oralig‘ini tanlang!");
    try {
      const res = await axiosInstance.get(
        `/lead-assign/history/by-date?start=${dateFilter.start}T00:00:00&end=${dateFilter.end}T23:59:59`
      );
      setAssignments(res.data?.data || []);
      toast.success("📅 Sana oralig‘ida filterlandi!");
    } catch {
      toast.error("❌ Sana oralig‘ida qidirishda xato!");
    }
  };

  // ✅ Activity qo‘shish
  const handleAddActivity = async (leadId) => {
    const action = prompt("⚡ Action (e.g. CALL, UPDATED, CONTACTED):");
    const note = prompt("📝 Izoh kiriting:");
    if (!action) return toast.info("Bekor qilindi");

    try {
      await axiosInstance.post(`/lead-assign/leads/${leadId}/activity`, null, {
        params: { action, note },
      });
      toast.success("📝 Activity qo‘shildi!");
    } catch {
      toast.error("❌ Activity qo‘shishda xato!");
    }
  };

  // 🔍 Qidiruv
  const filteredAssignments = assignments.filter((a) =>
    a.salesManager?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-muted-foreground">
        Ma’lumotlar yuklanmoqda...
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Assignment</h1>
          <p className="text-muted-foreground">
            Leadlarni sotuvi managerlariga taqsimlang, kuzating va tarixini
            boshqaring.
          </p>
        </div>
        <Button variant="outline" onClick={reloadAll}>
          <RefreshCcw className="h-4 w-4 mr-2" /> Reload
        </Button>
      </div>

      {/* Filter by date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Sana oralig‘ida qidirish
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 items-end">
          <div>
            <Label>Boshlanish sana</Label>
            <Input
              type="date"
              value={dateFilter.start}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, start: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Tugash sana</Label>
            <Input
              type="date"
              value={dateFilter.end}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, end: e.target.value })
              }
            />
          </div>
          <Button onClick={handleFilterByDate}>
            <Clock className="h-4 w-4 mr-1" /> Filter
          </Button>
        </CardContent>
      </Card>

      {/* Assign Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Leadlarni biriktirish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label>Sales Manager tanlang</Label>
          <Select
            value={selectedManagerId}
            onValueChange={setSelectedManagerId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Manager tanlang" />
            </SelectTrigger>
            <SelectContent>
              {salesManagers.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.fullName} ({m.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Bo‘sh (unassigned) leadlar</Label>
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Target Country</TableHead>
                  <TableHead>+ Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedLeads.length > 0 ? (
                  unassignedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() =>
                            setSelectedLeads((prev) =>
                              prev.includes(lead.id)
                                ? prev.filter((id) => id !== lead.id)
                                : [...prev, lead.id]
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>{lead.fullName}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.region}</TableCell>
                      <TableCell>{lead.targetCountry}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddActivity(lead.id)}
                        >
                          <FilePlus2 className="h-4 w-4 text-green-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-3"
                    >
                      Bo‘sh leadlar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Button
            onClick={handleAssignLeads}
            disabled={selectedLeads.length === 0 || !selectedManagerId}
            className="w-full"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Tanlangan leadlarni biriktirish
          </Button>
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle>Biriktirish tarixi</CardTitle>
          <div className="mt-3 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Manager bo‘yicha qidiruv..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-y-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((a, i) => (
                    <TableRow key={a.assignmentId}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{a.salesManager}</TableCell>
                      <TableCell className="space-x-1">
                        {a.leads.map((lead, idx) => (
                          <Badge key={idx} variant="secondary">
                            {lead}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>{a.leads.length}</TableCell>
                      <TableCell>
                        <Calendar className="h-4 w-4 inline text-muted-foreground mr-1" />
                        {new Date(a.assignedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{a.assignedBy}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(a.assignmentId)}
                        >
                          <Info className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDeleteAssignment(a.assignmentId)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-4"
                    >
                      Tarix bo‘sh
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {selectedDetail && (
            <div className="mt-6 border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">
                {selectedDetail.salesManager} - Tafsilotlar
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                Biriktirilgan:{" "}
                {new Date(selectedDetail.assignedAt).toLocaleString()} | Leadlar:{" "}
                {selectedDetail.totalLeads}
              </p>
              <div className="space-y-2">
                <h3 className="font-medium">Activity Log:</h3>
                {selectedDetail.activities.length > 0 ? (
                  selectedDetail.activities.map((act) => (
                    <div
                      key={act.id}
                      className="text-sm p-2 border rounded-lg bg-gray-50"
                    >
                      <span className="font-semibold">{act.action}</span> —{" "}
                      {act.note}{" "}
                      <span className="text-gray-400 ml-2">
                        ({new Date(act.createdAt).toLocaleString()})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Activity topilmadi
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
