import React, { useState, useEffect, useCallback } from "react";
import { modelAPI, type ModelInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Upload, Trash2, FileText } from "lucide-react";

interface ModelManagerProps {
  onModelSelect?: (filename: string) => void;
  onScalerSelect?: (filename: string) => void;
  selectedModel?: string;
  selectedScaler?: string;
}

export const ModelManager: React.FC<ModelManagerProps> = ({ 
  onModelSelect, 
  onScalerSelect, 
  selectedModel, 
  selectedScaler 
}) => {
  const { user } = useAuth();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState("");

  const fetchModels = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await modelAPI.getUserModels(user.id);
      if (response.success) {
        setModels(response.data);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    try {
      setLoading(true);
      const toastId = toast.loading("Uploading model...");
      
      const response = await modelAPI.uploadModel(selectedFile, user.id, modelName || undefined);
      
      if (response.success) {
        toast.dismiss(toastId);
        toast.success("Model uploaded successfully!");
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setModelName("");
        fetchModels(); // Refresh the list
      }
    } catch (error) {
      console.error("Error uploading model:", error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!user?.id) return;

    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      setLoading(true);
      const toastId = toast.loading("Deleting model...");
      
      const response = await modelAPI.deleteModel(user.id, filename);
      
      if (response.success) {
        toast.dismiss(toastId);
        toast.success("Model deleted successfully!");
        fetchModels(); // Refresh the list
        if (selectedModel === filename && onModelSelect) {
          onModelSelect(""); // Clear selection if deleted model was selected
        }
        if (selectedScaler === filename && onScalerSelect) {
          onScalerSelect(""); // Clear scaler selection if deleted scaler was selected
        }
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Model Manager
            </CardTitle>
            <CardDescription>
              Upload and manage your ML models and scalers for backtesting. Files with "scaler" in the name will be automatically categorized as scalers.
            </CardDescription>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload ML Model</DialogTitle>
                <DialogDescription>
                  Upload a machine learning model file for backtesting. Supported formats: .pkl, .joblib, .h5, .pb, .onnx, .pt, .pth
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name (Optional)</Label>
                  <Input
                    id="model-name"
                    placeholder="Enter a name for your model"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model-file">Model File</Label>
                  <Input
                    id="model-file"
                    type="file"
                    accept=".pkl,.joblib,.h5,.pb,.onnx,.pt,.pth"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.size > 100 * 1024 * 1024) { // 100MB limit
                        toast.error("Model file size must be less than 100MB");
                        e.target.value = "";
                        return;
                      }
                      setSelectedFile(file);
                    }}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || loading}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && models.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading models...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No models uploaded yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload your first model to get started with custom backtesting.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {models.map((model) => {
              const isScaler = model.filename.toLowerCase().includes("scaler");
              return (
                <div
                  key={model.filename}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                    (selectedModel === model.filename && !isScaler) || 
                    (selectedScaler === model.filename && isScaler) 
                      ? "bg-muted border-primary" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{model.filename}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isScaler ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}>
                        {isScaler ? "Scaler" : "Model"}
                      </span>
                      {(onModelSelect || onScalerSelect) && (
                        <div className="flex gap-1">
                          {!isScaler && onModelSelect && (
                            <Button
                              variant={selectedModel === model.filename ? "default" : "outline"}
                              size="sm"
                              onClick={() => onModelSelect(model.filename)}
                            >
                              {selectedModel === model.filename ? "Selected as Model" : "Select as Model"}
                            </Button>
                          )}
                          {isScaler && onScalerSelect && (
                            <Button
                              variant={selectedScaler === model.filename ? "default" : "outline"}
                              size="sm"
                              onClick={() => onScalerSelect(model.filename)}
                            >
                              {selectedScaler === model.filename ? "Selected as Scaler" : "Select as Scaler"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{formatFileSize(model.file_size)}</span>
                      <span>Uploaded: {formatDate(model.created_time)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(model.filename)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
