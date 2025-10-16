import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Archive, Lock, Unlock, Key, RotateCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const API_BASE = "http://localhost:8080";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [view, setView] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // form for new employee
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "ADMIN",
    department: "",
  });

  const token = localStorage.getItem("token");
  const getHeaders = () => ({
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  });

  // ✅ Fetch employees by view
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/users`;
      if (view === "archived") url = `${API_BASE}/users/archived`;
      else if (view === "deleted") url = `${API_BASE}/users/deleted`;
      else if (view === "blocked") url = `${API_BASE}/users/blocked`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      setEmployees(data.data || []);
    } catch {
      toast.error("❌ Hodimlarni olishda xato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [view]);

  // ✅ Create employee
  const handleAddEmployee = async () => {
    try {
      await fetch(`${API_BASE}/users/create`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      toast.success("✅ Hodim qo‘shildi");
      setIsAddDialogOpen(false);
      setForm({ fullName: "", email: "", password: "", role: "ADMIN", department: "" });
      fetchEmployees();
    } catch {
      toast.error("❌ Hodimni qo‘shishda xato");
    }
  };

  // ✅ Delete / Archive / Restore / Block
  const handleSoftDelete = async (id) => {
    await fetch(`${API_BASE}/users/${id}/soft`, { method: "DELETE", headers: getHeaders() });
    toast.success("🗑 Hodim vaqtincha o‘chirildi");
    fetchEmployees();
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm("Butunlay o‘chirmoqchimisiz?")) {
      await fetch(`${API_BASE}/users/${id}/permanent`, { method: "DELETE", headers: getHeaders() });
      toast.success("❌ Hodim butunlay o‘chirildi");
      fetchEmployees();
    }
  };

  const handleArchive = async (id) => {
    await fetch(`${API_BASE}/users/${id}/archive`, { method: "PUT", headers: getHeaders() });
    toast.success("📦 Hodim arxivlandi");
    fetchEmployees();
  };

  const handleRestore = async (id) => {
    await fetch(`${API_BASE}/users/${id}/restore`, { method: "PUT", headers: getHeaders() });
    toast.success("♻️ Hodim tiklandi");
    fetchEmployees();
  };

  const handleToggleStatus = async (id, active) => {
    await fetch(`${API_BASE}/users/${id}/status?active=${!active}`, { method: "PUT", headers: getHeaders() });
    toast.success(!active ? "🔓 Faollashtirildi" : "🔒 Bloklandi");
    fetchEmployees();
  };

  // ✅ Search
  const handleSearch = () => {
    if (!searchTerm.trim()) return fetchEmployees();
    const filtered = employees.filter((e) =>
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setEmployees(filtered);
  };

  // ✅ Permissions modal
  const openPermissions = (user) => {
    setSelectedUser(user);
    setPermissions(Array.from(user.permissions || []));
    setIsPermissionDialogOpen(true);
  };

  const togglePermission = (perm) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const savePermissions = async () => {
    try {
      await fetch(`${API_BASE}/users/${selectedUser.id}/permissions`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ permissions }),
      });
      toast.success("✅ Permissions updated!");
      setIsPermissionDialogOpen(false);
      fetchEmployees();
    } catch {
      toast.error("❌ Permissionsni yangilashda xato");
    }
  };

 const ALL_PERMISSIONS = [
  // ================= LEAD ASSIGN =================
  "LEAD_ASSIGN_CREATE",
  "LEAD_ASSIGN_VIEW",
  "LEAD_ASSIGN_DELETE",
  "LEAD_ASSIGN_REASSIGN",

  // ================= LEAD ACTIVITY =================
  "LEAD_ACTIVITY_ADD",
  "LEAD_ACTIVITY_VIEW",
  "LEAD_ACTIVITY_DELETE",

  // ================= CLIENT =================
  "CLIENT_VIEW",
  "CLIENT_CREATE",
  "CLIENT_UPDATE",
  "CLIENT_DELETE",
  "CLIENT_IMPORT",
  "CLIENT_EXPORT",

  // ================= LEAD =================
  "LEAD_VIEW",
  "LEAD_CREATE",
  "LEAD_UPDATE",
  "LEAD_DELETE",
  "LEAD_CONVERT_TO_CLIENT",

  // ================= LEAD STATUS =================
  "LEAD_STATUS_CREATE",
  "LEAD_STATUS_VIEW",
  "LEAD_STATUS_DELETE",

  // ================= LEAD IMPORT/EXPORT =================
  "LEAD_IMPORT",
  "LEAD_EXPORT",

  // ================= USER =================
  "USER_VIEW",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
  "USER_ASSIGN_ROLES",
  "USER_MANAGE_PERMISSIONS",

  // ================= DOCUMENTS =================
  "DOCUMENT_UPLOAD",
  "DOCUMENT_VIEW",

  // ================= PAYMENTS =================
  "PAYMENT_UPLOAD",
  "PAYMENT_VIEW",

  // ================= RECEPTION / ATTENDANCE =================
  "RECEPTION_CHECK_IN",
  "RECEPTION_CHECK_OUT",
  "RECEPTION_VIEW_ATTENDANCE",
  "RECEPTION_DAILY_REPORT",
  "RECEPTION_WEEKLY_REPORT",
  "RECEPTION_MONTHLY_REPORT",

  // ================= RECEPTION / VISITS =================
  "RECEPTION_SCHEDULE_LEAD",
  "RECEPTION_SCHEDULE_CLIENT",
  "RECEPTION_MARK_CAME",
  "RECEPTION_MARK_MISSED",
  "RECEPTION_VIEW_PLANNED",
  "RECEPTION_VIEW_VISITS",
];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👥 Employees</h1>
          <p className="text-muted-foreground">Manage your team members and permissions</p>
        </div>

        {/* ADD EMPLOYEE */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SALES_MANAGER">Sales Manager</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="DOCUMENTS">Documents</SelectItem>
                    <SelectItem value="MANAGER_CONSULTANT">Manager Consultant</SelectItem>
                    <SelectItem value="RECEPTION">Reception</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddEmployee}>Save Employee</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH + TABS */}
      <Tabs defaultValue="active" value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2 my-3">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={handleSearch}>Search</Button>
        </div>

        <TabsContent value={view}>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.id}</TableCell>
                    <TableCell>{e.fullName}</TableCell>
                    <TableCell>{e.email}</TableCell>
                    <TableCell>{e.department}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {e.active ? (
                        <Badge className="bg-green-500 text-white">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(e.id, e.active)}>
                          {e.active ? <Lock className="h-4 w-4 text-red-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openPermissions(e)}>
                          <Key className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleArchive(e.id)}>
                          <Archive className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSoftDelete(e.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        {(view === "archived" || view === "deleted" || view === "blocked") && (
                          <Button variant="ghost" size="icon" onClick={() => handleRestore(e.id)}>
                            <RotateCw className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {loading && <p className="text-center py-4">⏳ Yuklanmoqda...</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* 🟢 PERMISSION MODAL */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔑 Manage Permissions — {selectedUser?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.includes(perm)}
                  onChange={() => togglePermission(perm)}
                />
                {perm}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button onClick={savePermissions}>💾 Save</Button>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
