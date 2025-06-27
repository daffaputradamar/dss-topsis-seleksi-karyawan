import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface UploadSectionProps {
  onUploadSuccess: (candidates: any[]) => void;
}

export default function UploadSection({ onUploadSuccess }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Tipe File tidak Valid",
        description: "Mohon unggah file excel (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File terlalu Besar",
        description: "Maksimal ukuran file adalah 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const candidates = XLSX.utils.sheet_to_json(worksheet);

        if (candidates.length === 0) {
          throw new Error("File Excel kosong");
        }

        toast({
          title: "Upload Berhasil",
          description: `Berhasil memproses ${candidates.length} kandidat`,
        });

        onUploadSuccess(candidates);
      };

      reader.readAsArrayBuffer(file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Gagal",
        description: error instanceof Error ? error.message : "Gagal mengunggah file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          "Nama Lengkap": "Reza",
          "Pengalaman (tahun)": 5,
          "Pendidikan (1-5)": 4,
          "Wawancara (0-100)": 85,
          "Usia": 30
        },
        {
          "Nama Lengkap": "Teuku",
          "Pengalaman (tahun)": 3,
          "Pendidikan (1-5)": 5,
          "Wawancara (0-100)": 92,
          "Usia": 28
        }
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData, {
        header: [
          "Nama Lengkap",
          "Pengalaman (tahun)",
          "Pendidikan (1-5)",
          "Wawancara (0-100)",
          "Usia"
        ]
      });
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template Kandidat");

      const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
      const blob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-kandidat.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Template Berhasil Diunduh",
        description: "File Template Excel kandidat telah diunduh",
      });
    } catch (error) {
      toast({
        title: "Download Gagal",
        description: "Gagal mengunduh template",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Data Kandidat</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-slate-300 hover:border-primary"
                }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mb-4">
                <i className="fas fa-cloud-upload-alt text-4xl text-slate-400"></i>
              </div>
              <p className="text-lg font-medium text-slate-900 mb-2">
                {isUploading ? "Processing..." : "Drag and drop your Excel file here"}
              </p>
              <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
              <Button disabled={isUploading} className="bg-primary hover:bg-blue-700">
                <i className="fas fa-file-excel mr-2"></i>
                {isUploading ? "Uploading..." : "Choose File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div className="mt-4 text-sm text-slate-600">
              <p><strong>Format:</strong> .xlsx, .xls</p>
              <p><strong>Ukuran Max file:</strong> 10MB</p>
            </div>
          </div>

          {/* Template Download */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Download Template</h2>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="text-center mb-4">
                <i className="fas fa-file-download text-3xl text-green-600 mb-3"></i>
                <h3 className="font-medium text-slate-900 mb-2">Excel Template</h3>
                <p className="text-sm text-slate-600 mb-4">Download format yang sudah disediakan</p>
              </div>
              <Button
                onClick={handleDownloadTemplate}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <i className="fas fa-download mr-2"></i>
                Download Template
              </Button>
            </div>
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">Required Columns:</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• <strong>Nama</strong> - Nama kandidat</li>
                <li>• <strong>Pengalaman</strong> - Pengalaman kerja</li>
                <li>• <strong>Pendidikan</strong> - Tingkat pendidikan (1-5)</li>
                <li>• <strong>Wawancara</strong> - Skor hasil wawancara (0-100)</li>
                <li>• <strong>Usia</strong> - Usia kandidat</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
