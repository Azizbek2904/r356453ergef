import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, Upload, Download, Edit, Save, Archive, Trash2, X } from "lucide-react";

const API_BASE = "http://localhost:8080";

export default function MainPayment() {
  const [clients, setClients] = useState([]);
  const [archivedClients, setArchivedClients] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState("OTHER");
  const [editClient, setEditClient] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
const [filterRegion, setFilterRegion] = useState("");
const [filterCountry, setFilterCountry] = useState("");
const [filterStatus, setFilterStatus] = useState("");
const [regions, setRegions] = useState([]);
const [countries, setCountries] = useState([]);

  const token = localStorage.getItem("token");
  const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchClients = async () => {
  try {
    const params = new URLSearchParams();

    if (filterRegion) params.append("region", filterRegion);
    if (filterCountry) params.append("country", filterCountry);
    if (filterStatus) params.append("status", filterStatus);

    const res = await axiosInstance.get(`/clients/main-payments?${params.toString()}`);
    const data = res.data.data || [];
    setClients(data);

    // 🔹 Frontendda mavjud region va davlatlarni avtomatik aniqlash
    const uniqueRegions = [...new Set(data.map((c) => c.region).filter(Boolean))];
    const uniqueCountries = [...new Set(data.map((c) => c.targetCountry).filter(Boolean))];
    setRegions(uniqueRegions);
    setCountries(uniqueCountries);
  } catch (err) {
    console.error("Fetch error:", err);
    toast.error("Failed to fetch main payments");
  }
};


  useEffect(() => {
    fetchClients();
  }, []);

  // 📁 File upload
  const handleFileUpload = async (clientId) => {
    if (!selectedFile) return toast.error("Select a file first");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("type", docType);
    try {
      await axiosInstance.post(`/clients/${clientId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("File uploaded ✅");
      setSelectedFile(null);
      fetchClients();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload");
    }
  };

  // 💬 Add payment comment
  const handleAddPaymentComment = async (clientId) => {
    const updated = [...clients];
    const target = updated.find((c) => c.id === clientId);
    if (!target.newPaymentComment.trim()) return toast.error("Comment cannot be empty");
    try {
      await axiosInstance.post(
        `/clients/${clientId}/payment-comments?comment=${encodeURIComponent(target.newPaymentComment)}`
      );
      target.paymentComments.push(target.newPaymentComment);
      target.newPaymentComment = "";
      setClients(updated);
      toast.success("Comment added ✅");
    } catch (err) {
      console.error("Add error:", err);
      toast.error("Failed to add comment");
    }
  };

  // ✏️ Edit payment comment
  const handleSaveEditPaymentComment = async (clientId, index) => {
    const updated = [...clients];
    const target = updated.find((c) => c.id === clientId);
    try {
      await axiosInstance.patch(
        `/clients/${clientId}/payment-comments/${index}?newComment=${encodeURIComponent(target.editingCommentValue)}`
      );
      target.paymentComments[index] = target.editingCommentValue;
      target.editingCommentIndex = null;
      target.editingCommentValue = "";
      setClients(updated);
      toast.success("Comment updated ✅");
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update comment");
    }
  };

  // 🗑 Delete payment comment
  const handleDeletePaymentComment = async (clientId, index) => {
    if (!window.confirm("Delete this comment?")) return;
    const updated = [...clients];
    const target = updated.find((c) => c.id === clientId);
    try {
      await axiosInstance.delete(`/clients/${clientId}/payment-comments/${index}`);
      target.paymentComments.splice(index, 1);
      setClients(updated);
      toast.success("Comment deleted ✅");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete comment");
    }
  };

  // 💰 Update payment info
  const handleUpdateClient = async () => {
    if (!editClient) return toast.error("No client selected");
    try {
      await axiosInstance.patch(`/clients/${editClient.id}/payment`, {
        totalPayment: editClient.totalPayment,
        totalPaymentDate: editClient.totalPaymentDate,
        paymentStatus: editClient.paymentStatus,
      });
      toast.success("Payment updated ✅");
      setShowEditDialog(false);
      fetchClients();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update payment");
    }
  };
// 🚀 Export (Excel / CSV)
const handleExport = async (type = "excel") => {
  try {
    const url =
      type === "csv"
        ? `${API_BASE}/clients/main-payments/export/csv`
        : `${API_BASE}/clients/main-payments/export/excel`;

    const res = await axiosInstance.get(url, { responseType: "blob" });

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(new Blob([res.data]));
    link.download = type === "csv" ? "main_payments.csv" : "main_payments.xlsx";
    link.click();

    toast.success(`Exported ${type.toUpperCase()} successfully`);
  } catch (err) {
    console.error("Export error:", err);
    toast.error("Failed to export data");
  }
};

  // 🗃 Virtual archive
  const handleArchive = (id) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    setArchivedClients([...archivedClients, client]);
    setClients(clients.filter((c) => c.id !== id));
    toast.success("Moved to archive (virtual)");
  };

  const handleRestore = (id) => {
    const client = archivedClients.find((c) => c.id === id);
    if (!client) return;
    setClients([...clients, client]);
    setArchivedClients(archivedClients.filter((c) => c.id !== id));
    toast.success("Restored");
  };

  // 🔍 Filter
  const filteredClients = (activeTab === "active" ? clients : archivedClients).filter((c) =>
    c.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">💳 Main Payment Clients</h1>
      <p className="text-gray-500 mb-4">Manage total payments and payment comments</p>

      {/* Search */}
      <Input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-1/3"
      />
{/* 🧭 Filters */}
<div className="flex flex-wrap gap-3 mb-4">
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

  {/* Payment Status */}
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="border p-2 rounded text-sm"
  >
    <option value="">All Status</option>
    <option value="PENDING">Pending</option>
    <option value="PARTIALLY_PAID">Partially Paid</option>
    <option value="FULLY_PAID">Fully Paid</option>
  </select>

  <Button
    size="sm"
    onClick={fetchClients}
    className="bg-blue-600 text-white"
  >
    Apply Filters
  </Button>
</div>
<div className="flex gap-2 mt-2">
  <Button onClick={() => handleExport("excel")}>
    📦 Export Excel
  </Button>
  <Button onClick={() => handleExport("csv")}>
    📄 Export CSV
  </Button>
</div>


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        {/* ACTIVE */}
        <TabsContent value="active">
          <div className="overflow-x-auto border rounded-lg mt-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Total Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Payment Comments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length ? (
                  filteredClients.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{c.fullName}</TableCell>
                      <TableCell>{c.phone1}</TableCell>
                      <TableCell>{c.targetCountry}</TableCell>
                      <TableCell>{c.totalPayment || "-"}</TableCell>
                      <TableCell>{c.totalPaymentDate || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            c.paymentStatus === "FULLY_PAID"
                              ? "bg-green-500"
                              : c.paymentStatus === "PARTIALLY_PAID"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          } text-white`}
                        >
                          {c.paymentStatus || "PENDING"}
                        </Badge>
                      </TableCell>

                      {/* FILES */}
                      <TableCell>
                        {c.files?.length ? (
                          c.files.map((f) => (
                            <div key={f.id} className="flex gap-2 items-center text-xs text-blue-600">
                              <a href={`${API_BASE}${f.previewUrl}`} target="_blank">
                                <Eye className="w-3 h-3" /> {f.fileName}
                              </a>
                              <a href={`${API_BASE}${f.downloadUrl}`} target="_blank">
                                <Download className="w-3 h-3 text-gray-600" />
                              </a>
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
                            <DialogHeader><DialogTitle>Upload File</DialogTitle></DialogHeader>
                            <select
                              className="border p-2 w-full mb-2"
                              onChange={(e) => setDocType(e.target.value)}
                            >
                              <option value="OTHER">Other</option>
                              <option value="PAYMENT_RECEIPT">Payment Receipt</option>
                              <option value="PASSPORT">Passport</option>
                            </select>
                            <input
                              type="file"
                              onChange={(e) => setSelectedFile(e.target.files[0])}
                              className="border p-2 w-full"
                            />
                            <Button onClick={() => handleFileUpload(c.id)}>Upload</Button>
                          </DialogContent>
                        </Dialog>
                      </TableCell>

                      {/* PAYMENT COMMENTS */}
                      <TableCell>
                        {c.paymentComments?.map((pc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs mb-1">
                            {c.editingCommentIndex === idx ? (
                              <>
                                <Input
                                  value={c.editingCommentValue}
                                  onChange={(e) => {
                                    const updated = [...clients];
                                    const target = updated.find((x) => x.id === c.id);
                                    target.editingCommentValue = e.target.value;
                                    setClients(updated);
                                  }}
                                  className="h-7 text-xs flex-1"
                                />
                                <Button
                                  size="icon"
                                  className="h-7 w-7 bg-green-600 text-white"
                                  onClick={() => handleSaveEditPaymentComment(c.id, idx)}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  className="h-7 w-7 bg-gray-300"
                                  onClick={() => {
                                    const updated = [...clients];
                                    const target = updated.find((x) => x.id === c.id);
                                    target.editingCommentIndex = null;
                                    target.editingCommentValue = "";
                                    setClients(updated);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span>• {pc}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    const updated = [...clients];
                                    const target = updated.find((x) => x.id === c.id);
                                    target.editingCommentIndex = idx;
                                    target.editingCommentValue = pc;
                                    setClients(updated);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-6 w-6"
                                  onClick={() => handleDeletePaymentComment(c.id, idx)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                        {/* Add new comment */}
                        <div className="flex gap-1 mt-1">
                          <Input
                            value={c.newPaymentComment}
                            onChange={(e) => {
                              const updated = [...clients];
                              const target = updated.find((x) => x.id === c.id);
                              target.newPaymentComment = e.target.value;
                              setClients(updated);
                            }}
                            placeholder="Add payment comment..."
                            className="h-7 text-xs flex-1"
                          />
                          <Button size="sm" className="h-7" onClick={() => handleAddPaymentComment(c.id)}>
                            ➕
                          </Button>
                        </div>
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditClient(c);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleArchive(c.id)}>
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-400">
                      No main payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ARCHIVED */}
        <TabsContent value="archived">
          <div className="overflow-x-auto border rounded-lg mt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedClients.length ? (
                  archivedClients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.fullName}</TableCell>
                      <TableCell>{c.targetCountry}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleRestore(c.id)}>
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400">
                      No archived clients
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ✏️ Edit payment info */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Payment Info</DialogTitle></DialogHeader>
          {editClient && (
            <div className="space-y-3">
              <Label>Total Payment</Label>
              <Input
                type="number"
                value={editClient.totalPayment || ""}
                onChange={(e) => setEditClient({ ...editClient, totalPayment: e.target.value })}
              />
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={editClient.totalPaymentDate || ""}
                onChange={(e) => setEditClient({ ...editClient, totalPaymentDate: e.target.value })}
              />
              <Label>Status</Label>
              <Select
                value={editClient.paymentStatus || "PENDING"}
                onValueChange={(val) => setEditClient({ ...editClient, paymentStatus: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleUpdateClient}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
