import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MessageCircle, User, Store, Check, CheckCheck } from 'lucide-react';
import { useOrderChats, useSendOrderChat, useMarkChatsRead } from '@/hooks/useOrderChats';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  userType: 'customer' | 'seller';
}

export function OrderChatModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  userType,
}: OrderChatModalProps) {
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: chats, isLoading } = useOrderChats(orderId);
  const sendChat = useSendOrderChat();
  const markRead = useMarkChatsRead();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats]);

  // Mark messages as read when opening
  useEffect(() => {
    if (isOpen && orderId) {
      markRead.mutate({ orderId, senderType: userType });
    }
  }, [isOpen, orderId, userType]);

  const handleSend = async () => {
    if (!message.trim() || !user?.id) return;

    await sendChat.mutateAsync({
      orderId,
      senderId: user.id,
      senderType: userType,
      message: message.trim(),
    });

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[80vh] max-h-[600px] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-primary" />
            Chat - Order #{orderNumber}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {userType === 'customer' 
              ? 'Chat with the seller about your order'
              : 'Chat with the customer about their order'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chats && chats.length > 0 ? (
            <div className="space-y-3">
              {chats.map((chat) => {
                const isOwn = chat.sender_type === userType;
                return (
                  <div
                    key={chat.id}
                    className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwn && (
                      <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        {chat.sender_type === 'seller' ? (
                          <Store className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isOwn ? 'text-right' : ''}`}>
                      <div
                        className={`rounded-lg px-3 py-2 text-sm ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {chat.message}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{format(new Date(chat.created_at), 'HH:mm')}</span>
                        {isOwn && (
                          chat.is_read ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                    {isOwn && (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {userType === 'seller' ? (
                          <Store className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a conversation about this order
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Quick Messages */}
        {chats && chats.length === 0 && (
          <div className="px-4 py-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Quick messages:</p>
            <div className="flex flex-wrap gap-1.5">
              {userType === 'customer' ? (
                <>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted text-xs"
                    onClick={() => setMessage('When will my order be shipped?')}
                  >
                    Shipping status?
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted text-xs"
                    onClick={() => setMessage('I have a question about the product.')}
                  >
                    Product query
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted text-xs"
                    onClick={() => setMessage('Can I change my delivery address?')}
                  >
                    Change address
                  </Badge>
                </>
              ) : (
                <>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted text-xs"
                    onClick={() => setMessage('Your order has been shipped!')}
                  >
                    Order shipped
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted text-xs"
                    onClick={() => setMessage('Thank you for your order!')}
                  >
                    Thank you
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted text-xs"
                    onClick={() => setMessage('Please provide more details.')}
                  >
                    More details
                  </Badge>
                </>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 text-sm"
              disabled={sendChat.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendChat.isPending}
              size="icon"
              className="shrink-0"
            >
              {sendChat.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
