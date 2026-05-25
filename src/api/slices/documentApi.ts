import { baseApi } from '../baseApi'
import { ENDPOINTS } from '../endpoints'
import type { DocumentRecord, DocumentCategory } from '../../types'

export interface DocumentListParams {
  category?: string
  employeeId?: string
}

export interface UploadDocumentPayload {
  name: string
  category: DocumentCategory
  fileType: string
  size: string
  employeeId?: string
}

export const documentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDocuments: build.query<DocumentRecord[], DocumentListParams>({
      query: (params) => ({ url: ENDPOINTS.DOCUMENTS, params }),
      transformResponse: (raw: unknown) =>
        Array.isArray(raw) ? raw : ((raw as any)?.data ?? []),
      providesTags: [{ type: 'Document', id: 'LIST' }],
    }),

    uploadDocument: build.mutation<DocumentRecord, UploadDocumentPayload>({
      query: (body) => ({
        url: ENDPOINTS.DOCUMENTS_UPLOAD,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Document', id: 'LIST' }],
    }),

    deleteDocument: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `${ENDPOINTS.DOCUMENTS}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Document', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} = documentApi
