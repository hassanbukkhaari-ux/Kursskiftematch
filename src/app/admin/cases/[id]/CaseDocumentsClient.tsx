'use client'

import { useState, useEffect, useRef } from 'react'

interface CaseDoc {
  id: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  description: string | null
  uploaded_at: string
  profiles?: { full_name: string } | null
}

function fileIcon(mime: string | null) {
  if (!mime) return '📎'
  if (mime === 'application/pdf') return '📄'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.includes('word')) return '📝'
  return '📎'
}

function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CaseDocumentsClient({ caseId }: { caseId: string }) {
  const [docs, setDocs] = useState<CaseDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [description, setDescription] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadDocs() {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/cases/${caseId}/documents`)
      const j = await r.json()
      setDocs(j.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocs() }, [caseId])

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError('')
    try {
      // 1. Get signed upload URL
      const urlRes = await fetch(`/api/admin/cases/${caseId}/documents/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, mime_type: file.type }),
      })
      const urlData = await urlRes.json()
      if (!urlRes.ok) { setUploadError(urlData.error ?? 'Kunne ikke oprette upload-URL'); return }

      // 2. Upload file to storage
      const putRes = await fetch(urlData.data.upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!putRes.ok) { setUploadError('Upload fejlede. Prøv igen.'); return }

      // 3. Register document in DB
      const regRes = await fetch(`/api/admin/cases/${caseId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          description: description.trim() || null,
          storage_path: urlData.data.storage_path,
        }),
      })
      if (!regRes.ok) { setUploadError('Fil uploadet men kunne ikke registreres'); return }

      setDescription('')
      if (fileRef.current) fileRef.current.value = ''
      await loadDocs()
    } catch {
      setUploadError('Uventet fejl ved upload.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(docId: string, fileName: string) {
    const r = await fetch(`/api/admin/cases/${caseId}/documents/${docId}/download`)
    const j = await r.json()
    if (!j.data?.url) return
    const a = document.createElement('a')
    a.href = j.data.url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  async function handleDelete(docId: string, fileName: string) {
    if (!confirm(`Slet "${fileName}"?`)) return
    await fetch(`/api/admin/cases/${caseId}/documents?docId=${docId}`, { method: 'DELETE' })
    await loadDocs()
  }

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          className="hidden"
          id={`doc-upload-${caseId}`}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleUpload(f)
          }}
          disabled={uploading}
        />
        <input
          type="text"
          placeholder="Beskrivelse (valgfri)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-[#D1C9B8] bg-[#FDFAF6] text-sm text-[#1A1F1C] placeholder:text-[#9B9589] focus:outline-none focus:border-[#1C3829]"
          disabled={uploading}
        />
        <label
          htmlFor={`doc-upload-${caseId}`}
          className={`flex items-center justify-center gap-2 w-full h-9 rounded-xl border-2 border-dashed border-[#C5BCA8] text-sm font-medium text-[#6B7569] hover:border-[#1C3829] hover:text-[#1C3829] transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 border-2 border-[#6B7569] border-t-transparent rounded-full animate-spin" />
              Uploader…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload dokument (PDF, billede, Word)
            </>
          )}
        </label>
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="text-xs text-[#6B7569]">Henter dokumenter…</div>
      ) : docs.length === 0 ? (
        <div className="text-xs text-[#9B9589] text-center py-3">Ingen dokumenter endnu</div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-start gap-2 bg-[#F6F3EE] rounded-xl px-3 py-2">
              <span className="text-base mt-0.5 shrink-0">{fileIcon(doc.mime_type)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[#1A1F1C] truncate">{doc.file_name}</div>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {doc.description && <span className="text-xs text-[#6B7569]">{doc.description}</span>}
                  <span className="text-[10px] text-[#9B9589]">{fmtDate(doc.uploaded_at)}</span>
                  {doc.size_bytes && <span className="text-[10px] text-[#9B9589]">{fmtSize(doc.size_bytes)}</span>}
                  {doc.profiles?.full_name && <span className="text-[10px] text-[#9B9589]">{doc.profiles.full_name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(doc.id, doc.file_name)}
                  className="p-1.5 rounded-lg hover:bg-[#E8E2D6] text-[#6B7569] hover:text-[#1C3829] transition-colors"
                  title="Download"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(doc.id, doc.file_name)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[#9B9589] hover:text-red-600 transition-colors"
                  title="Slet"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
