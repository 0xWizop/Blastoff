'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { toast } from 'sonner';
import { Spinner } from './Spinner';

interface ChatMessage {
  id: string;
  walletAddress: string;
  message: string;
  timestamp: Timestamp | null;
}

interface TokenChatProps {
  tokenAddress: string;
  tokenSymbol: string;
}

function formatTimeAgo(timestamp: Timestamp | null): string {
  if (!timestamp) return 'now';
  const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
  
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Generate consistent color from address
function getAddressColor(address: string): string {
  const colors = [
    'text-orange-400',
    'text-blue-400',
    'text-green-400',
    'text-purple-400',
    'text-pink-400',
    'text-yellow-400',
    'text-cyan-400',
    'text-red-400',
  ];
  const index = parseInt(address.slice(-2), 16) % colors.length;
  return colors[index];
}

export function TokenChat({ tokenAddress, tokenSymbol }: TokenChatProps) {
  const { address, isConnected } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to messages
  useEffect(() => {
    const messagesRef = collection(firestore, 'TokenData', tokenAddress, 'chat');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        newMessages.push({
          id: doc.id,
          ...doc.data(),
        } as ChatMessage);
      });
      setMessages(newMessages.reverse());
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [tokenAddress]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !isConnected || !address || isSending) return;

    const messageText = newMessage.trim();
    if (messageText.length > 500) {
      toast.error('Message too long (max 500 characters)');
      return;
    }

    setIsSending(true);
    setNewMessage('');

    try {
      const messagesRef = collection(firestore, 'TokenData', tokenAddress, 'chat');
      await addDoc(messagesRef, {
        walletAddress: address,
        message: messageText,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isConnected, address, tokenAddress, isSending]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full border border-blastoff-border bg-blastoff-surface">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-blastoff-border">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium text-blastoff-text">${tokenSymbol} Chat</span>
        </div>
        <span className="text-[10px] text-blastoff-text-muted">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="md" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="h-8 w-8 text-blastoff-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs text-blastoff-text-muted">No messages yet</p>
            <p className="text-[10px] text-blastoff-text-muted">Be the first to chat!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.walletAddress.toLowerCase() === address?.toLowerCase();
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] ${isOwn ? 'bg-blastoff-orange/20' : 'bg-blastoff-bg'} px-3 py-2`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <a
                        href={`/creator/${msg.walletAddress}`}
                        className={`text-[10px] font-medium ${getAddressColor(msg.walletAddress)} hover:underline`}
                      >
                        {shortenAddress(msg.walletAddress)}
                      </a>
                      <span className="text-[9px] text-blastoff-text-muted">
                        {formatTimeAgo(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-blastoff-text break-words">
                      {msg.message}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-blastoff-border p-2">
        {isConnected ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 bg-blastoff-bg border border-blastoff-border px-3 py-2 text-xs text-blastoff-text placeholder-blastoff-text-muted outline-none focus:border-blastoff-orange"
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="px-3 py-2 bg-blastoff-orange text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blastoff-orange-light transition-colors"
            >
              {isSending ? (
                <Spinner size="xs" color="white" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        ) : (
          <p className="text-xs text-blastoff-text-muted text-center py-2">
            Connect wallet to chat
          </p>
        )}
      </div>
    </div>
  );
}
