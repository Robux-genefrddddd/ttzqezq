import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupMessages, useSendMessage } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, Send, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Message } from "@shared/api";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface GroupChatProps {
  groupId: string;
}

export default function GroupChat({ groupId }: GroupChatProps) {
  const { userProfile } = useAuth();
  const { messages, loading } = useGroupMessages(groupId);
  const { sendMessage, loading: sendingMessage } = useSendMessage();
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <div className="flex flex-col h-full bg-card rounded-lg border border-border/30">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                No messages yet
              </p>
              <p className="text-xs text-muted-foreground">
                Start the conversation
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === userProfile?.uid;
            return (
              <div
                key={message.id}
                className={`flex gap-2 group ${
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
                  className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                  title={message.senderName}
                />

                {/* Message Content */}
                <div
                  className={`flex flex-col max-w-xs ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender Name - Show on hover or first message */}
                  {hoveredMessageId === message.id && (
                    <span className="text-xs font-medium text-foreground mb-0.5">
                      {message.senderName}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-lg px-3 py-1.5 break-words ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Message attachment"
                        className="max-w-xs rounded mb-1 max-h-48"
                      />
                    )}
                    <p className="text-sm">{message.content}</p>
                    {message.isEdited && (
                      <p className="text-xs opacity-60 mt-0.5">(edited)</p>
                    )}
                  </div>

                  {/* Timestamp - Show on hover */}
                  {hoveredMessageId === message.id && (
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(message.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed Footer */}
      <div className="border-t border-border/20 bg-card p-3 space-y-2">
        {previewUrl && (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-xs h-24 object-cover rounded"
            />
            <button
              onClick={handleDeleteImage}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={sendingMessage || uploading}
              className="flex-1 h-8 text-sm"
            />

            <Button
              type="submit"
              disabled={!content.trim() || sendingMessage || uploading}
              size="sm"
              className="px-3"
              title="Send (Enter to send)"
            >
              {sendingMessage || uploading ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendingMessage || uploading}
              className="p-1.5 hover:bg-secondary/50 rounded transition-colors flex-shrink-0"
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

            <span className="text-xs text-muted-foreground">
              Attach image (optional)
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
