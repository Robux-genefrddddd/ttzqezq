import { useState, useEffect } from "react";
import { AlertCircle, Ban, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getUserWarnings,
  deleteWarning,
  Warning,
} from "@/lib/warningService";

interface WarningsSectionProps {
  userId: string;
  canDelete?: boolean; // Only founders can delete
}

export function WarningsSection({
  userId,
  canDelete = false,
}: WarningsSectionProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarnings();
  }, [userId]);

  const loadWarnings = async () => {
    try {
      setLoading(true);
      const userWarnings = await getUserWarnings(userId);
      setWarnings(userWarnings);
    } catch (error) {
      console.error("Error loading warnings:", error);
      toast.error("Failed to load warnings");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWarning = async (warningId: string) => {
    if (!canDelete) {
      toast.error("Only founders can delete warnings");
      return;
    }

    try {
      await deleteWarning(warningId);
      toast.success("Warning deleted");
      await loadWarnings();
    } catch (error) {
      console.error("Error deleting warning:", error);
      toast.error("Failed to delete warning");
    }
  };

  const getWarningColor = (type: string) => {
    switch (type) {
      case "ban":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "suspension":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "warning":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-secondary/20 rounded-lg" />
      </div>
    );
  }

  if (warnings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
        <p>No warnings or bans on record</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className={`p-4 border rounded-xl ${getWarningColor(warning.type)}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold capitalize">{warning.type}</span>
                {warning.type === "ban" && <Ban size={16} />}
                {warning.expiresAt && (
                  <span className="flex items-center gap-1 text-xs">
                    <Clock size={12} />
                    Expires {new Date(warning.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-sm mb-2">{warning.reason}</p>
              <p className="text-xs opacity-75">
                By {warning.adminName} •{" "}
                {new Date(warning.createdAt).toLocaleDateString()} at{" "}
                {new Date(warning.createdAt).toLocaleTimeString()}
              </p>
            </div>

            {canDelete && (
              <button
                onClick={() => handleDeleteWarning(warning.id)}
                className="p-2 hover:bg-black/20 rounded transition-colors flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
