import { X, UploadCloud, FileType, CheckCircle2, FolderPlus } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { useState, useEffect } from 'react'
import { cn, formatFileSize, FILE_TYPES_ACCEPTED, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useRequestPresignedUploadUrl, useConfirmUpload } from '@/hooks/useDocuments'
import { useFolders } from '@/hooks/useFolders'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { ConfirmUploadRequest } from '@/types/api'

export function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen, uploadTargetFolderId } = useUiStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle')
  const [progress, setProgress] = useState(0)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')

  const { data: folders = [] } = useFolders(activeWorkspaceId)
  const requestUrlMutation = useRequestPresignedUploadUrl(activeWorkspaceId!)
  const confirmUploadMutation = useConfirmUpload(activeWorkspaceId!)

  useEffect(() => {
    if (uploadModalOpen) {
      if (uploadTargetFolderId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedFolderId(uploadTargetFolderId)
      } else if (folders.length === 1) {
        setSelectedFolderId(folders[0].id)
      } else {
        setSelectedFolderId('')
      }
    }
  }, [uploadModalOpen, uploadTargetFolderId, folders])

  if (!uploadModalOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File) => {
    setError(null)
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!FILE_TYPES_ACCEPTED.includes(ext)) {
      setError(`File type not supported. Please upload ${FILE_TYPES_ACCEPTED.join(', ')}`)
      return false
    }
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
      return false
    }
    
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return;
    if (!activeWorkspaceId) {
      setError('Workspace is not selected. Please refresh the page and try again.');
      return;
    }
    if (!selectedFolderId) {
      setError('Please select a destination folder to upload into.');
      return;
    }
    
    setStatus('uploading')
    
    try {
      // 1. Request presigned URL
      const presignResponse = await requestUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
        folderId: selectedFolderId
      })

      // 2. Real upload progress using XMLHttpRequest
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setProgress(percentComplete)
          }
        }
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`))
          }
        }
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'))
        }
        
        xhr.open('PUT', presignResponse.uploadUrl, true)
        
        if (presignResponse.requiredHeaders) {
          Object.entries(presignResponse.requiredHeaders).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value as string)
          })
        } else {
          xhr.setRequestHeader('Content-Type', file.type)
        }
        
        xhr.send(file)
      })

      // 3. Confirm upload
      await confirmUploadMutation.mutateAsync({
        documentId: presignResponse.documentId,
        data: {
          fileSizeBytes: file.size,
          contentType: file.type
        } as ConfirmUploadRequest
      })

      setStatus('success')
    } catch (e) {
      console.error(e)
      setError('An error occurred during upload.')
      setStatus('idle')
      setProgress(0)
    }
  }

  const resetAndClose = () => {
    setUploadModalOpen(false)
    setTimeout(() => {
      setFile(null)
      setError(null)
      setStatus('idle')
      setProgress(0)
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      
      <div className="relative bg-surface-0 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-surface-900">Upload Document</h2>
          <button 
            onClick={resetAndClose}
            className="p-1.5 text-surface-500 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success-500" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-2">Upload complete</h3>
              <p className="text-surface-600 dark:text-surface-300 max-w-sm mb-6">
                "{file?.name}" has been securely uploaded. The AI processing pipeline is now extracting text and generating summaries in the background.
              </p>
              <button 
                onClick={resetAndClose}
                className="px-6 py-2.5 bg-surface-100 text-surface-900 font-medium rounded-lg hover:bg-surface-200 transition-colors"
              >
                Done
              </button>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-4">
                <FolderPlus className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">No folders available</h3>
              <p className="text-surface-500 max-w-sm mb-6 text-sm">
                You must create a folder before uploading documents. This helps keep your workspace neatly organized.
              </p>
              <button 
                onClick={() => {
                  setUploadModalOpen(false)
                  setTimeout(() => useUiStore.getState().openCreateFolderModal(), 300)
                }}
                className="px-5 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary)]/90 transition-colors shadow-sm"
              >
                Create a folder
              </button>
            </div>
          ) : (
            <>
              {!uploadTargetFolderId && (
                <div className="mb-4">
                  <Label className="mb-1.5 block text-sm font-medium text-surface-700">Destination Folder</Label>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a folder..." />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!file ? (
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors bg-surface-50",
                    dragActive ? "border-primary-500 bg-primary-50" : "border-surface-300 hover:border-surface-400 hover:bg-surface-100",
                    error && "border-danger-500 bg-danger-50"
                  )}
                >
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept={FILE_TYPES_ACCEPTED.join(',')}
                  />
                  <div className="w-12 h-12 mb-4 rounded-full bg-surface-200 flex items-center justify-center text-surface-500">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-surface-900 mb-1">Click or drag file to upload</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs mb-4">
                    Supports PDF, DOCX, TXT, and Markdown up to {MAX_FILE_SIZE_MB}MB
                  </p>
                  
                  {error && (
                    <div className="px-3 py-1.5 bg-danger-100 text-danger-700 text-sm font-medium rounded-md">
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-surface-50">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                      <FileType className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-surface-900 truncate">{file.name}</div>
                      <div className="text-xs text-surface-500">{formatFileSize(file.size)}</div>
                    </div>
                    <button 
                      onClick={() => setFile(null)}
                      disabled={status === 'uploading'}
                      className="p-1.5 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {error && (
                    <div className="px-3 py-1.5 bg-danger-100 text-danger-700 text-sm font-medium rounded-md">
                      {error}
                    </div>
                  )}

                  {status === 'uploading' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-surface-700">Uploading to private secure vault...</span>
                        <span className="text-primary-600">{progress}%</span>
                      </div>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-4">
                    <button 
                      onClick={resetAndClose}
                      disabled={status === 'uploading'}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpload}
                      disabled={status === 'uploading'}
                      className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {status === 'uploading' && (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      )}
                      {status === 'uploading' ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {status !== 'success' && (
          <div className="px-6 py-3 bg-surface-50 border-t border-border flex items-center gap-2 text-xs text-surface-500">
            <span className="w-2 h-2 rounded-full bg-success-500" />
            File is securely uploaded and workspace permissions will be enforced before processing.
          </div>
        )}
      </div>
    </div>
  )
}
