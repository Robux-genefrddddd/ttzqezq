import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupMessages, useSendMessage } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, Send, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Message } from "@shared/api";
import { uploadImageToStorage } from "@/lib/fileService";
import { storage } from "@/lib/firebase";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Upload image if selected
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
        userProfile.profileImage,
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

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.senderId === userProfile?.uid ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={
                    message.senderAvatar ||
                    "https://tr.rbxcdn.com/180DAY-bd2c1a5fc86fd014cbbbaaafdd777643/420/420/Hat/Webp/noFilter"
                  }
                  alt={message.senderName}
                  className="w-8 h-8 rounded-full"
                />
              </div>

              {/* Message Content */}
              <div
                className={`flex flex-col max-w-xs ${
                  message.senderId === userProfile?.uid
                    ? "items-end"
                    : "items-start"
                }`}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {message.senderName}
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    message.senderId === userProfile?.uid
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Message attachment"
                      className="max-w-sm rounded mb-2"
                    />
                  )}
                  <p className="text-sm">{message.content}</p>
                  {message.isEdited && (
                    <p className="text-xs opacity-75 mt-1">(edited)</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4 space-y-3">
        {previewUrl && (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-xs h-32 object-cover rounded"
            />
            <button
              onClick={handleDeleteImage}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type a message... (text only or add image)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={sendingMessage || uploading}
              className="flex-1"
            />

            <Button
              type="submit"
              disabled={!content.trim() || sendingMessage || uploading}
              size="sm"
              title="Send message"
            >
              {sendingMessage || uploading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendingMessage || uploading}
              className="text-xs px-3 py-1.5 border border-border rounded hover:bg-secondary transition-colors flex items-center gap-1"
            >
              <ImageIcon size={14} />
              Attach Image (Optional)
            </button>
            <p className="text-xs text-muted-foreground">
              Images are optional - you can send text alone
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
