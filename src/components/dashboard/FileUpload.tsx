import React, { useState, ChangeEvent, DragEvent, useRef } from "react";
import { Upload, X } from "lucide-react";
import { FileUploadComponentProps } from "@/interfaces/interface";



const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileChange,
  onUpload,
  isUploading,
  acceptedFileTypes = [".log", ".txt"],
  currentFile, // Get the file state from parent
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Use the file from props instead of local state
  const file = currentFile;

  // This handles the input change event and calls the parent's onFileChange with the file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add this function
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0] || null;
    if (droppedFile && isAcceptedFileType(droppedFile.name)) {
      onFileChange(droppedFile);
    }
  };

  const isAcceptedFileType = (fileName: string): boolean => {
    return acceptedFileTypes.some((type) => fileName.endsWith(type));
  };

  const clearFile = (): void => {
    onFileChange(null);
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg text-black font-semibold mb-4">Upload Log File</h2>

      {/* Drag and drop area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-4 transition-all flex flex-col items-center justify-center cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <Upload className="w-12 h-12 text-blue-500 mb-3" />
        <p className="text-gray-600 text-center">
          Drag and drop your log file here or{" "}
          <span className="text-blue-600 font-medium">browse</span>
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Supports {acceptedFileTypes.join(", ")} files
        </p>
        <input
          id="fileInput"
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* File info and upload button */}
      {file && (
        <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
          <div className="flex-grow">
            <p className="font-medium text-gray-800 mb-1">{file.name}</p>
            <p className="text-sm text-gray-500">
              {formatFileSize(file.size)} MB
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearFile}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              title="Remove file"
              type="button"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={onUpload}
              disabled={isUploading}
              className={`px-4 py-2 rounded-lg text-white ${
                isUploading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
              } transition-colors`}
              type="button"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
