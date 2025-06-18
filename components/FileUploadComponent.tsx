
import React, { useRef, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadIcon, PhotoIcon } from './Icons';
import { cn } from '../utils/cn';

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-white dark:bg-neutral-900 flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex flex-shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-100 dark:bg-neutral-950 shadow-[0px_0px_1px_1px_rgba(0,0,0,0.03)_inset] dark:shadow-[0px_0px_1px_1px_rgba(255,255,255,0.03)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}

const formatFileSize = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface FileUploadComponentProps {
  file: File | null;
  fileSrc: string | null;
  onFileChange: (file: File | null, fileSrc: string | null) => void;
  title: string;
  dropzoneText?: string;
  dropzoneSubText?: string;
  isLoading?: boolean;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  file,
  fileSrc,
  onFileChange,
  title,
  dropzoneText = "將檔案拖曳至此處",
  dropzoneSubText = "或點擊下方按鈕上傳",
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If fileSrc is cleared (e.g., component reset or parent explicitly clears it),
    // reset the native file input's value. This ensures it can correctly
    // trigger onChange if the same file is selected again, or if the component was
    // disabled and re-enabled.
    if (!fileSrc && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [fileSrc]);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileChange(selectedFile, reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      onFileChange(null, null);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (isLoading) return;
      if (rejectedFiles.length > 0) {
        console.warn('File rejected:', rejectedFiles);
        alert(`檔案 ${rejectedFiles[0].file.name} 無法上傳。原因: ${rejectedFiles[0].errors[0].message}`);
        return;
      }
      if (acceptedFiles.length > 0) {
        handleFileSelect(acceptedFiles[0]);
      }
    },
    [onFileChange, isLoading] // Added handleFileSelect to dependencies, though its definition is stable. More for completeness.
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false,
    noClick: true, 
    disabled: isLoading,
  });

  const triggerFileInput = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "w-full p-3 border border-gray-200 rounded-lg relative cursor-default transition-all duration-200 ease-in-out",
          isDragActive ? "border-blue-500 ring-2 ring-blue-300 bg-blue-50" : "hover:border-gray-400",
          isLoading ? "opacity-60 cursor-not-allowed" : ""
        )}
        aria-label={`拖曳區域 ${title}`}
      >
        <input
          {...getInputProps()}
          ref={fileInputRef}
          id={`file-upload-${title.replace(/\s+/g, '-')}`} // Make ID more robust
          className="hidden"
          disabled={isLoading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelect(e.target.files[0]);
            } else {
              // Handle case where user cancels file dialog after selecting a file previously.
              // This might be necessary if we want to clear the selection explicitly.
              // However, standard browser behavior might handle this.
              // For now, we only act if files are present.
            }
          }}
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white_70%,transparent_100%)] opacity-50 group-hover/file:opacity-100 transition-opacity duration-300">
          <GridPattern />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[150px] p-4">
          {fileSrc ? (
            // @ts-ignore TODO: Investigate framer-motion type definition issue for layout, initial, animate, exit props.
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center"
            >
              <img
                src={fileSrc}
                alt={title + " preview"}
                className="w-full h-48 object-contain rounded-md"
              />
              {file && (
                <>
                  <p className="text-xs text-gray-700 font-medium truncate max-w-[90%] mt-2">{file.name}</p>
                  <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                </>
              )}
            </motion.div>
          ) : (
            // @ts-ignore TODO: Investigate framer-motion type definition issue for layoutId, initial, animate, exit props.
            <motion.div
              layoutId={`file-placeholder-${title.replace(/\s+/g, '-')}`}
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isDragActive ? (
                <>
                  <UploadIcon className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-blue-600">將檔案放置於此</p>
                </>
              ) : (
                <>
                  <PhotoIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">{dropzoneText}</p>
                  <p className="text-xs text-gray-500 mt-1">{dropzoneSubText}</p>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UploadIcon className="w-3.5 h-3.5 mr-1.5" />
        {fileSrc ? `更換圖片 (${title})` : `上傳圖片 (${title})`}
      </button>
    </div>
  );
};
