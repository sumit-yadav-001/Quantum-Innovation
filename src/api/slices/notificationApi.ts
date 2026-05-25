import { baseApi } from '../baseApi'
import { ENDPOINTS } from '../endpoints'
import type { SystemNotification } from '../../types'

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<SystemNotification[], void>({
      query: () => ENDPOINTS.NOTIFICATIONS,
      transformResponse: (raw: unknown) =>
        Array.isArray(raw) ? raw : ((raw as any)?.data ?? []),
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    markAsRead: build.mutation<SystemNotification, string>({
      query: (id) => ({
        url: `${ENDPOINTS.NOTIFICATIONS}/${id}/read`,
        method: 'PATCH',
      }),
      // Optimistic update — flip read flag immediately without waiting for server
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          notificationApi.util.updateQueryData('getNotifications', undefined, (draft) => {
            const notif = draft.find((n) => n.id === id)
            if (notif) notif.read = true
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    announce: build.mutation<SystemNotification, { title: string; message: string; senderName: string }>({
      query: (body) => ({
        url: ENDPOINTS.NOTIFICATIONS_ANNOUNCE,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useAnnounceMutation,
} = notificationApi
