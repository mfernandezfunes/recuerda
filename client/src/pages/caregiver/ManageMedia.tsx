import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { mediaApi } from '../../api/media.api'
import { ACTIVITY_META } from '../../types'
import type { ActivityType } from '../../types'

export function ManageMedia() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function loadFiles() {
    if (!patientId) return
    try {
      const res = await mediaApi.list(patientId)
      setFiles(Array.isArray(res.data) ? res.data : [])
    } catch {
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [patientId])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!patientId || acceptedFiles.length === 0) return
      setUploading(true)
      setUploadError('')
      try {
        for (const file of acceptedFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('patientId', patientId)
          await mediaApi.upload(fd)
        }
        await loadFiles()
      } catch {
        setUploadError('No se pudo subir el archivo. Intentá de nuevo.')
      } finally {
        setUploading(false)
      }
    },
    [patientId]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [], 'audio/*': [] },
    onDrop,
    disabled: uploading,
  })

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este archivo?')) return
    try {
      await mediaApi.delete(id)
      setFiles((prev) => prev.filter((f) => f.id !== id))
    } catch {
      // ignore
    }
  }

  const isImage = (mimeType: string) => mimeType.startsWith('image/')
  const isAudio = (mimeType: string) => mimeType.startsWith('audio/')

  const images = files.filter((f) => isImage(f.mimeType))
  const audios = files.filter((f) => isAudio(f.mimeType))

  return (
    <div className="space-y-6 pb-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-[#8D7061] font-bold text-sm hover:text-[#5C4033]"
      >
        ← Volver
      </button>

      <div>
        <h2 className="text-2xl font-black text-[#5C4033]">Fotos y audios</h2>
        <p className="text-sm text-[#8D7061] font-semibold">
          Archivos del paciente para las actividades
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`rounded-2xl border-4 border-dashed p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-[#8FBC8F] bg-green-50'
            : 'border-[#FFCBA4] bg-[#FFF8F0] hover:border-[#8FBC8F]'
        } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
      >
        <input {...getInputProps()} />
        <p className="text-4xl mb-2">{isDragActive ? '📂' : '☁️'}</p>
        {uploading ? (
          <p className="font-bold text-[#5C4033]">Subiendo archivos…</p>
        ) : isDragActive ? (
          <p className="font-bold text-[#8FBC8F]">Soltá los archivos aquí</p>
        ) : (
          <>
            <p className="font-black text-[#5C4033]">Arrastrá archivos aquí</p>
            <p className="text-sm text-[#8D7061] font-semibold mt-1">
              o tocá para seleccionar desde la galería
            </p>
            <p className="text-xs text-[#8D7061] mt-2">Imágenes y audios aceptados</p>
          </>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold">
          {uploadError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-[#8D7061] font-semibold text-sm">
          Cargando archivos…
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-2">🖼️</p>
          <p className="font-bold text-[#5C4033]">Sin archivos todavía</p>
          <p className="text-sm text-[#8D7061] mt-1">Usá el área de arriba para subir fotos o audios</p>
        </div>
      ) : (
        <>
          {/* Images */}
          {images.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-black text-[#5C4033] text-sm uppercase tracking-wide">
                Fotos ({images.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {images.map((file) => (
                  <MediaCard
                    key={file.id}
                    file={file}
                    onDelete={handleDelete}
                    isImage
                  />
                ))}
              </div>
            </div>
          )}

          {/* Audios */}
          {audios.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-black text-[#5C4033] text-sm uppercase tracking-wide">
                Audios ({audios.length})
              </h3>
              <div className="space-y-2">
                {audios.map((file) => (
                  <MediaCard
                    key={file.id}
                    file={file}
                    onDelete={handleDelete}
                    isImage={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MediaCard({
  file,
  onDelete,
  isImage,
}: {
  file: MediaFile
  onDelete: (id: string) => void
  isImage: boolean
}) {
  const activityLabel =
    file.activityType && ACTIVITY_META[file.activityType]
      ? ACTIVITY_META[file.activityType].label
      : null

  if (isImage) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="aspect-square relative">
          <img
            src={file.url}
            alt={file.filename}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onDelete(file.id)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-black shadow-md"
          >
            ✕
          </button>
        </div>
        <div className="p-2">
          <p className="text-xs font-bold text-[#5C4033] truncate">{file.filename}</p>
          {activityLabel ? (
            <span className="inline-block bg-[#8FBC8F] text-white text-xs font-bold px-2 py-0.5 rounded-lg mt-1">
              {activityLabel}
            </span>
          ) : (
            <span className="inline-block bg-gray-100 text-[#8D7061] text-xs font-semibold px-2 py-0.5 rounded-lg mt-1">
              Sin asignar
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="w-12 h-12 bg-[#D8B4FE] rounded-xl flex items-center justify-center text-2xl shrink-0">
        🎵
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#5C4033] truncate">{file.filename}</p>
        {activityLabel ? (
          <span className="inline-block bg-[#8FBC8F] text-white text-xs font-bold px-2 py-0.5 rounded-lg mt-1">
            {activityLabel}
          </span>
        ) : (
          <span className="inline-block bg-gray-100 text-[#8D7061] text-xs font-semibold px-2 py-0.5 rounded-lg mt-1">
            Sin asignar
          </span>
        )}
        <audio controls src={file.url} className="w-full mt-1 h-8" />
      </div>
      <button
        onClick={() => onDelete(file.id)}
        className="bg-red-100 text-red-600 font-bold rounded-xl px-2 py-1.5 text-xs shrink-0"
      >
        ✕
      </button>
    </div>
  )
}

interface MediaFile {
  id: string
  url: string
  filename: string
  mimeType: string
  activityType?: ActivityType
  patientId: string
}
