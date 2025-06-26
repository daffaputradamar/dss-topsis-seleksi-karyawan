import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UploadSectionProps {
  onUploadSuccess: () => void;
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/candidates/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Upload Successful",
        description: `Processed ${result.count} candidates successfully`,
      });

      onUploadSuccess();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/template/download', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'candidate-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Template Downloaded",
        description: "Excel template has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download template",
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
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Candidate Data</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-300 hover:border-primary'
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
                {isUploading ? 'Processing...' : 'Drop your Excel file here'}
              </p>
              <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
              <Button disabled={isUploading} className="bg-primary hover:bg-blue-700">
                <i className="fas fa-file-excel mr-2"></i>
                {isUploading ? 'Uploading...' : 'Choose File'}
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
              <p><strong>Supported format:</strong> .xlsx, .xls</p>
              <p><strong>Max file size:</strong> 10MB</p>
            </div>
          </div>

          {/* Template Download */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Download Template</h2>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="text-center mb-4">
                <i className="fas fa-file-download text-3xl text-green-600 mb-3"></i>
                <h3 className="font-medium text-slate-900 mb-2">Excel Template</h3>
                <p className="text-sm text-slate-600 mb-4">Download the required format for candidate data</p>
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
                <li>• <strong>Nama</strong> - Candidate name</li>
                <li>• <strong>Pengalaman</strong> - Years of experience</li>
                <li>• <strong>Pendidikan</strong> - Education level (1-5)</li>
                <li>• <strong>Wawancara</strong> - Interview score (0-100)</li>
                <li>• <strong>Usia</strong> - Age in years</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
