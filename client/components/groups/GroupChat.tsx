import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupMessages, useSendMessage } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, Send, Image as ImageIcon, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Message } from "@shared/api";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface GroupChatProps {
  groupId: string;
}

const SCROLL_THRESHOLD = 150; // pixels from bottom

export default function GroupChat({ groupId }: GroupChatProps) {
  const { userProfile } = useAuth();
  const { messages, loading } = useGroupMessages(groupId);
  const { sendMessage, loading: sendingMessage } = useSendMessage();
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(0);

  // Detect if user is scrolled near the bottom
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    
    setIsNearBottom(distanceFromBottom < SCROLL_THRESHOLD);
  }, []);

  // Scroll to bottom smoothly (only when appropriate)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle auto-scroll on new messages
  useEffect(() => {
    const messagesLength = messages.length;
    const isNewMessage = messagesLength > previousMessagesLengthRef.current;

    if (isNewMessage && isNearBottom) {
      setShouldAutoScroll(true);
    }

    previousMessagesLengthRef.current = messagesLength;
  }, [messages, isNearBottom]);

  // Execute auto-scroll when flag is set
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
      setShouldAutoScroll(false);
    }
  }, [shouldAutoScroll, scrollToBottom]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile || !content.trim()) return;

    let imageUrl: string | undefined;

    try {
      setUploading(true);

      if (selectedImage) {
        const timestamp = Date.now();
        const filename = `${timestamp}-${selectedImage.name}`;
        const storageRef = ref(
          storage,
          `groups/${groupId}/messages/${filename}`,
        );

        await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      await sendMessage(
        groupId,
        userProfile.uid,
        userProfile.displayName,
        userProfile.profileImage || undefined,
        content,
        imageUrl,
      );

      setContent("");
      setSelectedImage(null);
      setPreviewUrl(null);
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border/30 overflow-hidden flex flex-col">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 flex flex-col"
      >
        {loading ? (
          <div className="flex items-center justify-center flex-1 min-h-20">
            <Loader size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center flex-1 min-h-40">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <MessageCircle 
                  size={32} 
                  className="text-muted-foreground/30" 
                />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-0.5">
                No messages yet
              </p>
              <p className="text-xs text-muted-foreground/60">
                Start the conversation
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === userProfile?.uid;
              return (
                <div
                  key={message.id}
                  className={`flex gap-1 ${
                    isOwnMessage ? "flex-row-reverse" : ""
                  }`}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* Avatar */}
                  <img
                    src={
                      message.senderAvatar ||
                      "https://tr.rbxcdn.com/180DAY-bd2c1a5fc86fd014cbbbaaafdd777643/420/420/Hat/Webp/noFilter"
                    }
                    alt={message.senderName}
                    className="w-5 h-5 rounded-full flex-shrink-0 mt-0"
                    title={message.senderName}
                  />

                  {/* Message Content */}
                  <div
                    className={`flex flex-col max-w-sm ${
                      isOwnMessage ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Sender Name - Show on hover */}
                    {hoveredMessageId === message.id && (
                      <span className="text-xs font-medium text-foreground/60 px-2 leading-none mb-0.5">
                        {message.senderName}
                      </span>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-lg px-2.5 py-1 break-words ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Message attachment"
                          className="max-w-xs rounded max-h-40 mb-1"
                        />
                      )}
                      <p className="text-sm leading-snug">{message.content}</p>
                      {message.isEdited && (
                        <p className="text-xs opacity-60 mt-0.5">(edited)</p>
                      )}
                    </div>

                    {/* Timestamp - Show on hover */}
                    {hoveredMessageId === message.id && (
                      <span className="text-xs text-muted-foreground/50 px-2 mt-0.5 leading-none">
                        {formatTime(message.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed Footer */}
      <div className="border-t border-border/20 bg-card flex-shrink-0">
        {previewUrl && (
          <div className="px-3 pt-1.5 pb-1">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-xs h-20 object-cover rounded"
              />
              <button
                onClick={handleDeleteImage}
                className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90 transition-colors"
                type="button"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-2.5 space-y-1">
          <div className="flex gap-1.5 items-stretch">
            <Input
              type="text"
              placeholder="Message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={sendingMessage || uploading}
              className="flex-1 h-8 text-sm px-2.5 py-1"
            />

            <Button
              type="submit"
              disabled={!content.trim() || sendingMessage || uploading}
              size="sm"
              className="px-2.5 h-8 flex-shrink-0"
              title="Send (Enter to send)"
              variant="ghost"
            >
              {sendingMessage || uploading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendingMessage || uploading}
              className="p-1.5 hover:bg-secondary/50 rounded flex-shrink-0 h-8 w-8 flex items-center justify-center"
              title="Attach image"
            >
              <ImageIcon size={16} className="text-muted-foreground" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
