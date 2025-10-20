import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Archive,
  RotateCcw,
  XCircle,
  Edit,
  Eye,
  Download,
  FileDown,
  FileUp,
  Save,
  X,
  Plus,
} from "lucide-react";

const API_BASE = "http://localhost:8080";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
const [filterCountry, setFilterCountry] = useState("");
const [regions, setRegions] = useState([]);
const [countries, setCountries] = useState([]);
const [statuses, setStatuses] = useState([]);
const [filterStatus, setFilterStatus] = useState("");
const [newStatus, setNewStatus] = useState({ name: "", color: "" });
const [showAddStatusDialog, setShowAddStatusDialog] = useState(false);

  const [editingComment, setEditingComment] = useState({ clientId: null, index: null, value: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    fullName: "",
    phone1: "",
    phone2: "",
    targetCountry: "",
    initialPayment: "",
    initialPaymentDate: "",
    contractNumber: "",
      statusId: "", // ✅ qo‘shiladi

  });
  const [importFile, setImportFile] = useState(null);
  const [docType, setDocType] = useState("OTHER");

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchClients = async (type = "active") => {
  try {
    const params = new URLSearchParams({ type });
    if (filterRegion) params.append("region", filterRegion);
    if (filterCountry) params.append("country", filterCountry);
    if (filterStatus) params.append("statusId", filterStatus);
    const res = await axiosInstance.get(`/clients/filters?${params.toString()}`);
    const data = res.data.data || [];
    setClients(data);

    // 🔹 Bazadagi mavjud region va davlatlarni aniqlash (unique qilib)
    const uniqueRegions = [...new Set(data.map((c) => c.region).filter(Boolean))];
    const uniqueCountries = [...new Set(data.map((c) => c.targetCountry).filter(Boolean))];
    setRegions(uniqueRegions);
    setCountries(uniqueCountries);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    toast.error("Failed to fetch clients");
  }
};
// Rangning yorqinligini hisoblab, qora yoki oq matn tanlaydi
const getTextColor = (bgColor) => {
  if (!bgColor) return "#fff";
  const rgb = parseInt(bgColor.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
};

useEffect(() => {
  fetchClients(activeTab);
  fetchStatuses(); // ✅ Statuslarni ham yuklash
}, [activeTab, filterRegion, filterCountry]);


// ✅ STATUS API funksiyalari
const fetchStatuses = async () => {
  try {
    const res = await axiosInstance.get(`/client-statuses`);
    const data = res.data?.data ?? res.data;
    setStatuses(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("❌ Statuslarni olishda xato:", err);
    toast.error("Statuslarni olishda xato");
  }
};
// 🚀 Update client status
// 🚀 Update client status
const handleStatusChange = async (clientId, statusId) => {
  try {
    const res = await axiosInstance.put(`/clients/${clientId}/status/${statusId}`);
    toast.success(res.data?.message || "Status updated successfully ✅");

    // Tanlangan statusni topamiz
    const selectedStatus = statuses.find((s) => s.id === Number(statusId));

    // Frontenddagi client ro‘yxatini yangilaymiz
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              statusId: selectedStatus?.id,
              statusName: selectedStatus?.name,
              statusColor: selectedStatus?.color,
            }
          : c
      )
    );
  } catch (err) {
    console.error("❌ Failed to update status:", err);
    toast.error("Failed to update status");
  }
};






const handleAddStatus = async () => {
  if (!newStatus.name.trim()) return toast.error("Status nomi kerak!");
  try {
    const formData = new URLSearchParams();
    formData.append("name", newStatus.name);
    if (newStatus.color) formData.append("color", newStatus.color);

    await axiosInstance.post(`/client-statuses`, formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    toast.success("✅ Yangi status yaratildi");
    setNewStatus({ name: "", color: "" });
    setShowAddStatusDialog(false);
    fetchStatuses();
  } catch (err) {
    console.error("❌ Status yaratishda xato:", err);
    toast.error("Status yaratilmadi");
  }
};


useEffect(() => {
  fetchClients(activeTab);
  fetchStatuses(); // ✅ yangi qo‘shilgan
}, [activeTab, filterRegion, filterCountry]);


  // 🚀 Upload file
  const handleFileUpload = async (clientId) => {
    if (!selectedFile) return toast.error("No file selected");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("type", docType);
    try {
      await axiosInstance.post(`/clients/${clientId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("File uploaded successfully");
      setSelectedFile(null);
      fetchClients(activeTab);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed");
    }
  };

  // 🚀 Add new client
  const handleAddClient = async () => {
    if (!newClient.fullName || !newClient.phone1)
      return toast.error("Full name and phone are required");
    try {
      await axiosInstance.post(`/clients`, newClient);
      toast.success("Client added successfully");
      setShowAddDialog(false);
      setNewClient({
        fullName: "",
        phone1: "",
        phone2: "",
        targetCountry: "",
        initialPayment: "",
        initialPaymentDate: "",
        contractNumber: "",
        statusId: "", // ✅ qo‘shiladi

      });
      fetchClients(activeTab);
    } catch (err) {
      console.error("Add client error:", err);
      toast.error("Failed to add client");
    }
  };

  // 🚀 Add comment
  const handleAddComment = async (id) => {
    if (!comment.trim()) return toast.error("Comment cannot be empty");
    try {
      await axiosInstance.post(`/clients/${id}/comments?comment=${comment}`);
      toast.success("Comment added");
      setComment("");
      fetchClients(activeTab);
    } catch (err) {
      console.error("Comment error:", err);
      toast.error("Failed to add comment");
    }
  };

  // 🚀 Update comment
  const handleUpdateComment = async (clientId, index) => {
    try {
      await axiosInstance.put(
        `/clients/${clientId}/comments/${index}?newComment=${editingComment.value}`
      );
      toast.success("Comment updated");
      setEditingComment({ clientId: null, index: null, value: "" });
      fetchClients(activeTab);
    } catch (err) {
      console.error("Update comment error:", err);
      toast.error("Failed to update comment");
    }
  };

  // 🚀 Edit client
  const handleEdit = async () => {
    if (!editClient) return toast.error("No client selected");

    try {
      const payload = {
        fullName: editClient.fullName,
        phone1: editClient.phone1,
        phone2: editClient.phone2,
        targetCountry: editClient.targetCountry,
        initialPayment: editClient.initialPayment,
        initialPaymentDate: editClient.initialPaymentDate,
        contractNumber: editClient.contractNumber,
      };

      await axiosInstance.patch(`/clients/${editClient.id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Client updated successfully ✅");
      setShowEditDialog(false);
      setEditClient(null);
      fetchClients(activeTab);
    } catch (err) {
      console.error("❌ Edit error:", err.response?.data || err);
      toast.error("Failed to update client");
    }
  };

  // 🚀 Archive / Delete / Restore / Permanent Delete
  const handleAction = async (id, action) => {
    try {
      if (action === "archive") await axiosInstance.put(`/clients/${id}/archive`);
      else if (action === "delete") await axiosInstance.delete(`/clients/${id}/soft`);
      else if (action === "restore") await axiosInstance.put(`/clients/${id}/restore`);
      else if (action === "permanent") await axiosInstance.delete(`/clients/${id}/permanent`);
      toast.success(`Client ${action}d successfully`);
      fetchClients(activeTab);
    } catch (err) {
      console.error("Action error:", err);
      toast.error(`Failed to ${action} client`);
    }
  };
// 🚀 Delete file
const handleFileDelete = async (clientId, fileId) => {
  if (!window.confirm("❗ Faylni o‘chirmoqchimisiz?")) return;

  try {
    await axiosInstance.delete(`/clients/${clientId}/files/${fileId}`);
    toast.success("🗑️ Fayl muvaffaqiyatli o‘chirildi");
    fetchClients(activeTab);
  } catch (err) {
    console.error("❌ Faylni o‘chirishda xato:", err);
    toast.error("Faylni o‘chirishda xato yuz berdi");
  }
};

  // 🚀 Import / Export
  const handleImport = async () => {
    if (!importFile) return toast.error("Select file first");
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      await axiosInstance.post(`/clients/import-export/import`, formData);
      toast.success("Clients imported successfully");
      fetchClients(activeTab);
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Import failed");
    }
  };
// 🚀 Convert Client to Main Payment
const handleConvert = async (clientId) => {
  try {
    const res = await axiosInstance.put(`/clients/${clientId}/convert`);
    toast.success(res.data.message || "Client moved to Main Payment ✅");
    fetchClients(activeTab); // jadvalni yangilaydi
  } catch (err) {
    console.error("❌ Convert error:", err);
    toast.error("Failed to convert client");
  }
};

  const handleExport = async (type = "excel") => {
    try {
      const url =
        type === "csv"
          ? `${API_BASE}/clients/filter/export/csv`
          : `${API_BASE}/clients/filter/export/excel`;
      const res = await axiosInstance.get(url, { responseType: "blob" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.download = type === "csv" ? "clients.csv" : "clients.xlsx";
      link.click();
      toast.success(`Exported ${type.toUpperCase()} successfully`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export failed");
    }
  };

  const filteredClients = clients.filter((c) =>
    c.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Clients</h1>
      <p className="text-gray-500 mb-4">Manage converted clients and their documents</p>
{/* 🧭 Filter by Region & Country */}
<div className="flex gap-2 mb-3">
  {/* Viloyat */}
  <select
    value={filterRegion}
    onChange={(e) => setFilterRegion(e.target.value)}
    className="border p-2 rounded text-sm"
  >
    <option value="">All Regions</option>
    {regions.map((r) => (
      <option key={r} value={r}>{r}</option>
    ))}
  </select>

  {/* Davlat */}
  <select
    value={filterCountry}
    onChange={(e) => setFilterCountry(e.target.value)}
    className="border p-2 rounded text-sm"
  >
    <option value="">All Countries</option>
    {countries.map((c) => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>
  {/* Status */}
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="border p-2 rounded text-sm"
  >
    <option value="">All Statuses</option>
    {statuses.map((s) => (
      <option key={s.id} value={s.id}>
        {s.name}
      </option>
    ))}
  </select>

  {/* Status yaratish tugmasi */}
  <Button
    size="sm"
    variant="outline"
    onClick={() => setShowAddStatusDialog(true)}
    title="Add new status"
  >
    + Add Status
  </Button>

  <Button
    size="sm"
    onClick={() => fetchClients(activeTab)}
    className="bg-blue-600 text-white"
  >
    Apply
  </Button>
</div>

      {/* 🔍 Search / Add / Import / Export */}
      <div className="flex justify-between mb-4">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3"
        />
        <div className="flex gap-2 items-center">
          {/* Add Client */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Input placeholder="Full name" value={newClient.fullName} onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })} />
                <Input placeholder="Phone 1" value={newClient.phone1} onChange={(e) => setNewClient({ ...newClient, phone1: e.target.value })} />
                <Input placeholder="Phone 2" value={newClient.phone2} onChange={(e) => setNewClient({ ...newClient, phone2: e.target.value })} />
                <Input placeholder="Target country" value={newClient.targetCountry} onChange={(e) => setNewClient({ ...newClient, targetCountry: e.target.value })} />
                <Input type="number" placeholder="Initial payment" value={newClient.initialPayment} onChange={(e) => setNewClient({ ...newClient, initialPayment: e.target.value })} />
                <Input type="date" value={newClient.initialPaymentDate} onChange={(e) => setNewClient({ ...newClient, initialPaymentDate: e.target.value })} />
                <Input placeholder="Contract number" value={newClient.contractNumber} onChange={(e) => setNewClient({ ...newClient, contractNumber: e.target.value })} />
                
                <Button onClick={handleAddClient}>Save</Button>
              </div>
           
            </DialogContent>
          </Dialog>

          <input type="file" accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files[0])} className="text-sm border rounded p-1" />
          <Button onClick={handleImport}><FileUp className="w-4 h-4 mr-1" /> Import</Button>
          <Button onClick={() => handleExport("excel")}><FileDown className="w-4 h-4 mr-1" /> Export Excel</Button>
          <Button onClick={() => handleExport("csv")}><FileDown className="w-4 h-4 mr-1" /> Export CSV</Button>
        </div>
      </div>

      {/* ✅ Tabs & Table */}
      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="overflow-x-auto border rounded-lg mt-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone 1</TableHead>
                  <TableHead>Phone 2</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Initial Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Converted By</TableHead>

                  <TableHead>Files</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{c.fullName}</TableCell>
                      <TableCell>{c.phone1 || "-"}</TableCell>
                      <TableCell>{c.phone2 || "-"}</TableCell>
                      <TableCell>{c.targetCountry || "-"}</TableCell>
                      <TableCell>{c.initialPayment || "-"}</TableCell>
                      <TableCell>{c.initialPaymentDate || "-"}</TableCell>
                      <TableCell>{c.contractNumber || "-"}</TableCell>
                      {/* ✅ STATUS SELECT per client */}
<TableCell>
 <select
  value={c.statusId || ""}
  onChange={(e) => handleStatusChange(c.id, e.target.value)}
  className="border p-1 rounded text-sm font-medium"
  style={{
    backgroundColor: c.statusColor || "#e5e7eb",
    color: getTextColor(c.statusColor || "#e5e7eb"),
    transition: "0.3s",
  }}
>
  <option value="">No status</option>
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
<TableCell>{c.convertedBy || "-"}</TableCell>


                      {/* 📁 Files */}
                      <TableCell>
                        {c.files?.length ? (
                          c.files.map((f) => (
                            <div key={f.id} className="flex items-center gap-2 text-xs text-blue-600">
                              <a href={`${API_BASE}${f.previewUrl}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-3 h-3" /> {f.fileName}
                              </a>
                              <a href={`${API_BASE}${f.downloadUrl}`} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3 text-gray-600" />
                              </a>
                                    <button
        onClick={() => handleFileDelete(c.id, f.id)}
        title="Delete"
        className="text-red-500 hover:text-red-700 transition"
      >
        <Trash2 className="w-3 h-3" />
      </button>

                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No files</span>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="mt-2">
                              <Upload className="w-4 h-4 mr-1" /> Upload
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                            <select className="border p-2 w-full mb-2" onChange={(e) => setDocType(e.target.value)}>
                              <option value="OTHER">Other</option>
                              <option value="PASSPORT">Passport</option>
                              <option value="AGREEMENT">Agreement</option>
                              <option value="PAYMENT_RECEIPT">Payment Receipt</option>
                              <option value="VISA">Visa</option>
                            </select>
                            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="border p-2 w-full" />
                            <Button onClick={() => handleFileUpload(c.id)}>Upload</Button>
                          </DialogContent>
                        </Dialog>
                      </TableCell>

                      {/* 💬 Comments */}
                      <TableCell>
                        {c.comments?.map((cm, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs mb-1">
                            {editingComment.clientId === c.id && editingComment.index === idx ? (
                              <>
                                <Input value={editingComment.value} onChange={(e) => setEditingComment({ ...editingComment, value: e.target.value })} className="h-7 text-xs" />
                                <Button size="icon" onClick={() => handleUpdateComment(c.id, idx)} className="h-7 w-7 bg-green-600"><Save className="w-3 h-3" /></Button>
                                <Button size="icon" onClick={() => setEditingComment({ clientId: null, index: null, value: "" })} className="h-7 w-7 bg-gray-300"><X className="w-3 h-3" /></Button>
                              </>
                            ) : (
                              <>
                                <span>• {cm}</span>
                                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setEditingComment({ clientId: c.id, index: idx, value: cm })}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-1 mt-2">
                          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add comment..." className="h-7 text-xs" />
                          <Button size="sm" className="h-7" onClick={() => handleAddComment(c.id)}>Add</Button>
                        </div>
                      </TableCell>

                      {/* ⚙️ Actions */}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditClient(c); setShowEditDialog(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {activeTab === "active" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleAction(c.id, "archive")}>
                                <Archive className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAction(c.id, "delete")}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {activeTab === "archived" && (
                            <Button size="sm" variant="outline" onClick={() => handleAction(c.id, "restore")}>
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          {activeTab === "deleted" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleAction(c.id, "restore")}>
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAction(c.id, "permanent")}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
  size="sm"
  variant="outline"
  onClick={() => handleConvert(c.id)}
  title="Convert to Main Payment"
>
  🔁 Convert
</Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-gray-400">No clients found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ✏️ Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
          {editClient && (
            <div className="space-y-3">
              <Input value={editClient.fullName || ""} onChange={(e) => setEditClient({ ...editClient, fullName: e.target.value })} placeholder="Full name" />
              <Input value={editClient.phone1 || ""} onChange={(e) => setEditClient({ ...editClient, phone1: e.target.value })} placeholder="Phone 1" />
              <Input value={editClient.phone2 || ""} onChange={(e) => setEditClient({ ...editClient, phone2: e.target.value })} placeholder="Phone 2" />
              <Input value={editClient.targetCountry || ""} onChange={(e) => setEditClient({ ...editClient, targetCountry: e.target.value })} placeholder="Target country" />
              <Input type="number" value={editClient.initialPayment || ""} onChange={(e) => setEditClient({ ...editClient, initialPayment: e.target.value })} placeholder="Initial Payment" />
              <Input type="date" value={editClient.initialPaymentDate || ""} onChange={(e) => setEditClient({ ...editClient, initialPaymentDate: e.target.value })} />
              <Input value={editClient.contractNumber || ""} onChange={(e) => setEditClient({ ...editClient, contractNumber: e.target.value })} placeholder="Contract number" />
              <Button onClick={handleEdit}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    {/* ✅ CREATE STATUS DIALOG (color picker bilan) */}
<Dialog open={showAddStatusDialog} onOpenChange={setShowAddStatusDialog}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Create New Status</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 mt-2">
      {/* Status nomi */}
      <div>
        <label className="text-sm font-medium">Status name</label>
        <Input
          placeholder="Enter status name"
          value={newStatus.name}
          onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
        />
      </div>

      {/* Rang tanlash */}
      <div>
        <label className="text-sm font-medium">Choose color</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={newStatus.color || "#0080ff"}
            onChange={(e) =>
              setNewStatus({ ...newStatus, color: e.target.value })
            }
            className="w-10 h-10 border rounded cursor-pointer"
          />
          <span className="text-sm text-gray-600">{newStatus.color}</span>
        </div>
      </div>

      {/* Tugmalar */}
      <div className="flex justify-end gap-2 pt-3">
        <Button variant="outline" onClick={() => setShowAddStatusDialog(false)}>
          Cancel
        </Button>
        <Button
          className="bg-blue-600 text-white"
          onClick={handleAddStatus}
        >
          Save
        </Button>
        
      </div>
    </div>
  </DialogContent>
</Dialog>


    </div>
  );
}
