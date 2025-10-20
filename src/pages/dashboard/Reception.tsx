import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Check, X } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Reception() {
  const [visits, setVisits] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  // 🔹 Hodimlar
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`, { headers });
      setEmployees(res.data.data || []);
    } catch {
      toast.error("❌ Hodimlarni yuklab bo‘lmadi");
    }
  };

  // 🔹 Bugungi attendance
  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reception/attendance/today`, { headers });
      setAttendance(res.data || []);
    } catch {
      toast.error("❌ Bugungi attendance yuklab bo‘lmadi");
    }
  };

  // 🔹 Leadlar
  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API_BASE}/leads`, { headers });
      setLeads(res.data.data || []);
    } catch {
      toast.error("❌ Leadlarni yuklab bo‘lmadi");
    }
  };

  // 🔹 Reception tashriflar
  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/reception/visits/planned`, { headers });
      setVisits(res.data);
    } catch {
      toast.error("❌ Tashriflarni yuklab bo‘lmadi");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Check-in / Check-out
  const handleCheckIn = async (userId: number) => {
    try {
      await axios.post(`${API_BASE}/api/reception/attendance/${userId}/check-in`, {}, { headers });
      toast.success("✅ Hodim ishga kirdi");
      fetchAttendance();
    } catch {
      toast.error("❌ Check-in amalga oshmadi");
    }
  };

  const handleCheckOut = async (userId: number) => {
    try {
      await axios.post(`${API_BASE}/api/reception/attendance/${userId}/check-out`, {}, { headers });
      toast.success("✅ Hodim ishni tugatdi");
      fetchAttendance();
    } catch {
      toast.error("❌ Check-out amalga oshmadi");
    }
  };

  // 🔹 Reception tashrif statuslari
  const handleMarkCame = async (id: number) => {
    try {
      await axios.put(`${API_BASE}/api/reception/visits/${id}/came`, {}, { headers });
      toast.success("✅ Kelgan sifatida belgilandi");
      fetchVisits();
    } catch {
      toast.error("❌ Belgilashda xatolik");
    }
  };

  const handleMarkMissed = async (id: number) => {
    try {
      await axios.put(`${API_BASE}/api/reception/visits/${id}/missed`, {}, { headers });
      toast.success("❌ Kelmagan sifatida belgilandi");
      fetchVisits();
    } catch {
      toast.error("❌ Belgilashda xatolik");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchLeads();
    fetchVisits();
  }, []);

  // 🔹 Attendance status ko‘rsatish
  const getAttendanceStatus = (userId: number) => {
    const att = attendance.find((a) => a.user?.id === userId);
    if (!att) return { status: "Not checked in", color: "bg-gray-200 text-gray-700" };
    if (att.checkIn && !att.checkOut)
      return { status: "Checked in", color: "bg-green-100 text-green-700" };
    if (att.checkOut)
      return { status: "Checked out", color: "bg-blue-100 text-blue-700" };
    return { status: "Not checked in", color: "bg-gray-200 text-gray-700" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reception Dashboard</h1>
        <p className="text-muted-foreground">
          Manage employees, attendance, visits, and leads.
        </p>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        {/* 🧍 EMPLOYEES TAB */}
        <TabsContent value="employees">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e, i) => {
                  const attStatus = getAttendanceStatus(e.id);
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{e.fullName}</TableCell>
                      <TableCell>{e.role}</TableCell>
                      <TableCell>
                        <Badge className={attStatus.color}>{attStatus.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!attendance.find((a) => a.user?.id === e.id) && (
                          <Button size="sm" variant="outline" onClick={() => handleCheckIn(e.id)}>
                            <Check className="w-4 h-4 mr-1" /> Check-in
                          </Button>
                        )}
                        {attendance.find((a) => a.user?.id === e.id && !a.checkOut) && (
                          <Button size="sm" variant="outline" onClick={() => handleCheckOut(e.id)}>
                            <X className="w-4 h-4 mr-1" /> Check-out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 📅 ATTENDANCE TAB */}
        <TabsContent value="attendance">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((a, i) => (
                  <TableRow key={a.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{a.user?.fullName}</TableCell>
                    <TableCell>{a.date}</TableCell>
                    <TableCell className="text-green-600">
                      {a.checkIn ? new Date(a.checkIn).toLocaleTimeString("uz-UZ") : "—"}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {a.checkOut ? new Date(a.checkOut).toLocaleTimeString("uz-UZ") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 🕒 VISITS TAB */}
        <TabsContent value="visits">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v, i) => {
                  const person = v.lead || v.client;
                  return (
                    <TableRow key={v.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{person?.fullName}</TableCell>
                      <TableCell>{person?.phone}</TableCell>
                      <TableCell>{v.lead ? "Lead" : "Client"}</TableCell>
                      <TableCell>
                        <Calendar className="inline w-4 h-4 text-muted-foreground mr-2" />
                        {new Date(v.scheduledDateTime).toLocaleString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            v.status === "PLANNED"
                              ? "bg-blue-100 text-blue-700"
                              : v.status === "CAME"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {v.status === "PLANNED" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600"
                              onClick={() => handleMarkCame(v.id)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Came
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleMarkMissed(v.id)}
                            >
                              <X className="h-4 w-4 mr-1" /> Missed
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 💼 LEADS TAB */}
        <TabsContent value="leads">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meeting</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No leads found.
                    </TableCell>
                  </TableRow>
                )}
                {leads.map((lead, i) => (
                  <TableRow key={lead.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{lead.fullName}</TableCell>
                    <TableCell>{lead.phone || "—"}</TableCell>
                    <TableCell>{lead.region || "—"}</TableCell>
                    <TableCell>
                      <Badge>{lead.statusName || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      {lead.meetingStatus ? (
                        <Badge
                          className={
                            lead.meetingStatus === "BELGILANDI"
                              ? "bg-blue-100 text-blue-700"
                              : lead.meetingStatus === "KELDI"
                              ? "bg-green-100 text-green-700"
                              : lead.meetingStatus === "KELMADI"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {lead.meetingStatus}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{lead.assignedTo || "Unassigned"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

