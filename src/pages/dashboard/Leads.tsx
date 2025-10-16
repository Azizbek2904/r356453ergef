import { useEffect, useState } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Filter, Edit, Trash2, RotateCw, UserPlus, Tag, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [view, setView] = useState("active");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [filterRegion, setFilterRegion] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

 const [form, setForm] = useState<{
  fullName: string;
  phone: string;
  region: string;
  targetCountry: string;
  meetingDateTime: string;
  meetingStatus: string;
  statusId: string | number; // ✅ muhim o‘zgarish
}>({
  fullName: "",
  phone: "",
  region: "",
  targetCountry: "",
  meetingDateTime: "",
  meetingStatus: "",
  statusId: "", // default
});


  const [selectedLead, setSelectedLead] = useState(null);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#1bb143");

const getTextColor = (bgColor) => {
  if (!bgColor) return "#fff";
  const rgb = parseInt(bgColor.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
};


  // ✅ LEADS
  const fetchLeads = async () => {
    setLoading(true);
    try {
      let res;
      if (view === "deleted") res = await api.get("/leads/deleted");
      else if (view === "permanent") res = await api.get("/leads/permanent");
      else if (search.trim()) res = await api.get(`/leads/search?query=${search}`);
      else if (filterRegion || filterCountry || filterStatus || filterStart || filterEnd) {
        res = await api.get("/leads/filter", {
          params: {
            region: filterRegion,
            targetCountry: filterCountry,
            statusId: filterStatus,
            start: filterStart,
            end: filterEnd,
          },
        });
      } else {
        res = await api.get("/leads");
      }
      setLeads(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Leadlarni olishda xato");
    } finally {
      setLoading(false);
    }
  };

  // ✅ STATUSES
  const fetchStatuses = async () => {
    try {
      const res = await api.get("/lead-statuses");
      setStatuses(res.data.data || []);
    } catch {
      toast.error("❌ Statuslarni olishda xato");
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchStatuses();
  }, [view]);

  // ✅ ADD LEAD
  const handleAddLead = async () => {
    if (!form.fullName || !form.phone) return toast.error("Ism va telefon kerak!");
    try {
      await api.post("/leads", form);
      toast.success("✅ Lead qo‘shildi");
      setIsAddOpen(false);
      fetchLeads();
    } catch {
      toast.error("❌ Lead qo‘shishda xato");
    }
  };

  // ✅ UPDATE LEAD (Status & Meeting)
  const updateLead = async (id, payload) => {
    try {
      const lead = leads.find((l) => l.id === id);
      const updatedLead = {
        fullName: lead.fullName,
        phone: lead.phone,
        region: lead.region,
        targetCountry: lead.targetCountry,
        lastContactDate: lead.lastContactDate || null,
        meetingDateTime: payload.meetingDateTime || lead.meetingDateTime,
        meetingStatus: payload.meetingStatus || lead.meetingStatus,
        statusId: payload.statusId || lead.status?.id || null,
        assignedToId: lead.assignedTo?.id || null,
      };
      await api.put(`/leads/${id}`, updatedLead);
      fetchLeads();
    } catch {
      toast.error("❌ Yangilashda xato");
    }
  };

  // ✅ EDIT LEAD
  const handleEditLead = async () => {
    await updateLead(selectedLead.id, form);
    toast.success("✅ Tahrir saqlandi");
    setIsEditOpen(false);
  };

  // ✅ DELETE / RESTORE / CONVERT
  const handleSoftDelete = async (id) => {
    await api.delete(`/leads/${id}/soft`);
    toast.success("🗑 Lead vaqtincha o‘chirildi");
    fetchLeads();
  };

  const handleRestore = async (id) => {
    await api.put(`/leads/${id}/restore`);
    toast.success("♻️ Lead tiklandi");
    fetchLeads();
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm("Butunlay o‘chirmoqchimisiz?")) {
      await api.delete(`/leads/${id}/permanent`);
      toast.success("❌ Lead butunlay o‘chirildi");
      fetchLeads();
    }
  };

  const handleConvert = async (id) => {
    await api.put(`/leads/${id}/convert`);
    toast.success("👥 Clientga o‘tkazildi");
    fetchLeads();
  };

  // ✅ ADD NEW STATUS
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return toast.error("Status nomini kiriting!");
    try {
await api.post(
  `/lead-statuses?name=${encodeURIComponent(newStatusName)}&color=${encodeURIComponent(newStatusColor)}`
);
      toast.success("✅ Status qo‘shildi!");
      setNewStatusName("");
      fetchStatuses();
    } catch {
      toast.error("❌ Status yaratishda xato");
    }
  };

  const handleDeleteStatus = async (id) => {
    await api.delete(`/lead-statuses/${id}`);
    toast.success("🗑 Status o‘chirildi");
    fetchStatuses();
  };

  // ✅ IMPORT LEADS
  const handleImport = async (file) => {
    if (!file) return toast.error("❌ Fayl tanlang!");
    const formData = new FormData();
    formData.append("file", file);
    await api.post("/leads/import-export/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("✅ Leadlar import qilindi!");
    fetchLeads();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={fetchLeads}>Search</Button>
        </div>

        <div className="flex gap-2">
          {/* IMPORT */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>📥 Import Excel</DialogTitle>
              </DialogHeader>
              <Input type="file" accept=".xlsx" onChange={(e) => handleImport(e.target.files[0])} />
            </DialogContent>
          </Dialog>

          {/* STATUS */}
          <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tag className="mr-2 h-4 w-4" /> Lead Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>🏷️ Manage Lead Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Status nomi"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                />
                <Input type="color" value={newStatusColor} onChange={(e) => setNewStatusColor(e.target.value)} />
                <Button onClick={handleAddStatus}>Qo‘shish</Button>
                <div className="pt-3">
                  {statuses.map((s) => (
                    <div key={s.id} className="flex justify-between items-center border p-2 rounded mb-2">
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }}></div>
                        {s.name}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStatus(s.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* ADD LEAD */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>➕ Add Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {["fullName", "phone", "region", "targetCountry"].map((f) => (
                  <div key={f}>
                    <Label>{f}</Label>
                    <Input value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                  </div>
                ))}
                <Label>Meeting Date</Label>
                <Input
                  type="datetime-local"
                  value={form.meetingDateTime}
                  onChange={(e) => setForm({ ...form, meetingDateTime: e.target.value })}
                />
                <Label>Meeting Status</Label>
                <select
                  value={form.meetingStatus}
                  onChange={(e) => setForm({ ...form, meetingStatus: e.target.value })}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Tanlanmagan</option>
                  <option value="BELGILANDI">Belgilandi</option>
                  <option value="KELDI">Keldi</option>
                  <option value="KELMADI">Kelmadi</option>
                  <option value="KECH_KELDI">Kech keldi</option>
                </select>
                <select
  value={form.statusId}
  onChange={(e) => setForm({ ...form, statusId: Number(e.target.value) })}
  className="border rounded px-2 py-1 w-full"
>
  <option value="">No Status</option>
  {statuses.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name}
    </option>
  ))}
</select>

                <Button className="w-full mt-2" onClick={handleAddLead}>
                  💾 Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Region" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} />
        <Input placeholder="Country" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All Status</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
        <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
        <Button onClick={fetchLeads}>
          <Filter className="mr-2 h-4 w-4" /> Apply
        </Button>
      </div>

      {/* TABLE */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" onClick={() => setView("active")}>Active</TabsTrigger>
          <TabsTrigger value="deleted" onClick={() => setView("deleted")}>Deleted</TabsTrigger>
          <TabsTrigger value="permanent" onClick={() => setView("permanent")}>Permanent</TabsTrigger>
        </TabsList>
        <TabsContent value={view}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meeting Time</TableHead>
                <TableHead>Meeting Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, i) => (
                <TableRow key={lead.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{lead.fullName}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.region}</TableCell>
                  <TableCell>{lead.targetCountry}</TableCell>
                  <TableCell>
<select
  value={lead.statusId || ""}
  onChange={(e) => updateLead(lead.id, { statusId: Number(e.target.value) })}
  className="border rounded px-2 py-1 font-medium transition-colors"
  style={{
    backgroundColor:
      statuses.find((s) => s.id === lead.statusId)?.color || "#6b7280", // default: kulrang
    color: getTextColor(
      statuses.find((s) => s.id === lead.statusId)?.color || "#6b7280"
    ),
  }}
>
  <option value="">No Status</option>
  {statuses.map((s) => (
    <option
      key={s.id}
      value={s.id}
      style={{
        backgroundColor: s.color,
        color: getTextColor(s.color),
      }}
    >
      {s.name}
    </option>
  ))}
</select>

                  </TableCell>
                  <TableCell>
                    <Input
                      type="datetime-local"
                      value={lead.meetingDateTime || ""}
                      onChange={(e) => updateLead(lead.id, { meetingDateTime: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      value={lead.meetingStatus || ""}
                      onChange={(e) => updateLead(lead.id, { meetingStatus: e.target.value })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">Tanlanmagan</option>
                      <option value="BELGILANDI">Belgilandi</option>
                      <option value="KELDI">Keldi</option>
                      <option value="KELMADI">Kelmadi</option>
                      <option value="KECH_KELDI">Kech keldi</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    {view === "active" && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLead(lead);
                            setForm({
                              fullName: lead.fullName,
                              phone: lead.phone,
                              region: lead.region,
                              targetCountry: lead.targetCountry,
                              meetingDateTime: lead.meetingDateTime,
                              meetingStatus: lead.meetingStatus,
                              statusId: lead.status?.id || "",
                            });
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSoftDelete(lead.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleConvert(lead.id)}>
                          <UserPlus className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    )}
                    {view === "deleted" && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleRestore(lead.id)}>
                          <RotateCw className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePermanentDelete(lead.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loading && <p className="text-center py-4">⏳ Yuklanmoqda...</p>}
        </TabsContent>
      </Tabs>

      {/* 🟢 EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✏️ Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {["fullName", "phone", "region", "targetCountry"].map((f) => (
              <div key={f}>
                <Label>{f}</Label>
                <Input value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
              </div>
            ))}
            <Label>Meeting Date</Label>
            <Input
              type="datetime-local"
              value={form.meetingDateTime}
              onChange={(e) => setForm({ ...form, meetingDateTime: e.target.value })}
            />
            <Label>Meeting Status</Label>
            <select
              value={form.meetingStatus}
              onChange={(e) => setForm({ ...form, meetingStatus: e.target.value })}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">Tanlanmagan</option>
              <option value="BELGILANDI">Belgilandi</option>
              <option value="KELDI">Keldi</option>
              <option value="KELMADI">Kelmadi</option>
              <option value="KECH_KELDI">Kech keldi</option>
            </select>
            <Label>Status</Label>
            <select
              value={form.statusId}
              onChange={(e) => setForm({ ...form, statusId: Number(e.target.value) })}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">No Status</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button className="w-full mt-2" onClick={handleEditLead}>
              💾 Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
