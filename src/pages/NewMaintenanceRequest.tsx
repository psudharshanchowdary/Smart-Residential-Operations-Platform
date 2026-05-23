import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRequest } from "@/lib/api";
import { Building2, Bell, User, Upload, Send, Shield, Clock, Home, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = ["Plumbing", "Electrical", "HVAC", "Appliances", "Other"];
const priorities = ["Low", "Medium", "High"] as const;

const NewMaintenanceRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload a PNG, JPG, or JPEG image.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 10MB.", variant: "destructive" });
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64("");
    setImageName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "Request Submitted!", description: `Ticket #${data._id.slice(-6).toUpperCase()} created` });
      navigate("/maintenance");
    },
    onError: () => {
      toast({ title: "Submission failed", description: "Could not submit request. Check if the server is running.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!category || !description) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    mutation.mutate({
      title: `${category} Issue`,
      category,
      priority,
      description,
      unit: `Apt ${user?.unit} - Wing B`,
      status: "Pending" as const,
      image: imageBase64 || "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-card-foreground">Skyline Towers</span>
        </div>
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground">New Maintenance Request</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit your repair or maintenance needs and track the status in real-time.</p>

        <div className="bg-card rounded-xl p-5 mt-6 shadow-sm border border-border space-y-5">
          {/* Apartment Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Apartment Number</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-input bg-muted text-muted-foreground text-sm">
              <Home className="w-4 h-4" />
              Apt {user?.unit} - Wing B
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Issue Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Priority Level</label>
            <div className="flex gap-2">
              {priorities.map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`px-5 py-2 rounded-lg border text-sm font-medium transition-colors ${priority === p ? "bg-primary text-primary-foreground border-primary" : "border-input text-foreground hover:bg-muted"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Issue Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Describe the problem in detail (e.g., location, when it started, any specific observations)..."
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Upload Photo <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="photo-upload"
            />

            {imagePreview ? (
              /* Image Preview */
              <div className="relative rounded-xl overflow-hidden border border-input">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full max-h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-black text-xs font-medium px-3 py-1.5 rounded-lg mr-2"
                  >
                    Change Photo
                  </button>
                </div>
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-90 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 py-2 bg-muted flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">{imageName}</span>
                </div>
              </div>
            ) : (
              /* Drop Zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
                  <Upload className={`w-6 h-6 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? "Drop your image here" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button onClick={handleSubmit} disabled={mutation.isPending}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {mutation.isPending ? "Submitting..." : "Submit Request"}
          </button>
          <button onClick={() => navigate(-1)} className="w-full py-3.5 border border-input text-foreground rounded-xl font-medium text-sm hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">Quick Response</p>
              <p className="text-xs text-muted-foreground">Our team usually responds to medium priority issues within 24 hours.</p>
            </div>
          </div>
          <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">Verified Personnel</p>
              <p className="text-xs text-muted-foreground">All maintenance staff carry official ID badges for your safety.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMaintenanceRequest;
