import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Eye, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const API_BASE = "http://207.154.227.250:8080/api"; // Backend URL

// Rangli teglar
const documentTypeColors: Record<string, string> = {
  PASSPORT: "bg-blue-500",
  AGREEMENT: "bg-green-500",
  PAYMENT_RECEIPT: "bg-yellow-500",
  VISA: "bg-purple-500",
  OTHER: "bg-gray-500",
};

interface DocumentItem {
  id: number;
  fileName: string;
  fileType: string;
  documentType: string;
  uploadDate: string | null;
  clientId: number;
  clientFullName: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  // 📥 Ma’lumotlarni olish
  useEffect(() => {
    fetch(`${API_BASE}/documents`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          setDocuments(data.data);
        } else {
          toast.error("Failed to fetch documents");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Server error while fetching documents");
      })
      .finally(() => setLoading(false));
  }, []);

  // 🔍 Qidiruv
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.clientFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📄 Preview ochish
  const handlePreview = (doc: DocumentItem) => {
    const previewUrl = `${API_BASE.replace("/api", "")}/clients/${doc.clientId}/files/${doc.id}/preview`;
    setPreviewFile(previewUrl);
    setPreviewType(doc.fileType);
  };

  if (loading) return <p className="p-6 text-gray-500">Loading documents...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Manage all uploaded client documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name, document type or file name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc, i) => (
                  <TableRow key={doc.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{doc.clientFullName || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`${documentTypeColors[doc.documentType] || "bg-gray-400"} text-white`}>
                        {doc.documentType?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.fileName}</TableCell>
                    <TableCell>{doc.uploadDate || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* 🔽 Download */}
                        <a
                          href={`${API_BASE.replace(
                            "/api",
                            ""
                          )}/clients/${doc.clientId}/files/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>

                        {/* 👁 Preview */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Preview"
                              onClick={() => handlePreview(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-5xl">
                            <DialogHeader>
                              <DialogTitle>Preview: {doc.fileName}</DialogTitle>
                            </DialogHeader>

                            <div className="flex justify-center items-center h-[600px] bg-muted rounded-md p-4 overflow-hidden">
                              {previewFile && previewType?.includes("pdf") ? (
                                <iframe
                                  src={previewFile}
                                  title={doc.fileName}
                                  className="w-full h-full border-none"
                                />
                              ) : previewFile && previewType?.startsWith("image") ? (
                                <img
                                  src={previewFile}
                                  alt={doc.fileName}
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <div className="text-center text-gray-500">
                                  <FileText className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                                  <p>No preview available for this file type</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredDocuments.length === 0 && (
              <p className="text-center text-gray-500 py-4">No documents found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
