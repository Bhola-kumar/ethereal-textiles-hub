import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Package, Truck, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCheck className="h-5 w-5 text-green-500" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  order: <Package className="h-5 w-5 text-primary" />,
  shipping: <Truck className="h-5 w-5 text-indigo-500" />,
};

interface NotificationSheetContentProps {
  onClose: () => void;
}

export default function NotificationSheetContent({ onClose }: NotificationSheetContentProps) {
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleNotificationClick = (notificationId: string, link: string | null) => {
    markRead.mutate(notificationId);
    if (link) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Actions */}
      {unreadCount > 0 && (
        <div className="pb-3 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => markAllRead.mutate()}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="flex-1 py-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-accent/50' : 'bg-muted/30'
                }`}
                onClick={() => handleNotificationClick(notification.id, notification.link)}
              >
                {notification.link ? (
                  <Link
                    to={notification.link}
                    onClick={() => handleNotificationClick(notification.id, notification.link)}
                    className="block"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {typeIcons[notification.type] || typeIcons.info}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {typeIcons[notification.type] || typeIcons.info}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
