import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

export function useNotifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            if (!user) return [];
            const res = await apiFetch('/api/notifications');
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!user,
        refetchInterval: 60000, // Check every minute
    });

    const { mutate: markAsRead } = useMutation({
        mutationFn: async (notificationId?: string) => {
            if (!user) return;
            await apiFetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });
        },
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            const previousNotifications = queryClient.getQueryData(['notifications']);

            queryClient.setQueryData(['notifications'], (old: any[]) => {
                if (!old) return [];
                if (notificationId) {
                    return old.map((n) => n.id === notificationId ? { ...n, isRead: true } : n);
                }
                return old.map((n) => ({ ...n, isRead: true }));
            });

            return { previousNotifications };
        },
        onError: (err, newTodo, context: any) => {
            queryClient.setQueryData(['notifications'], context.previousNotifications);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    return {
        notifications,
        markAsRead,
        hasUnread: notifications.some((n: any) => !n.isRead),
    };
}
