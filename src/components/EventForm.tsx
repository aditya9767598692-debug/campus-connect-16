import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const empty = {
  title: "",
  description: "",
  date: "",
  time: "",
  venue: "",
  department: "",
  category: "Seminar",
  priority: "Medium",
  assignedTeacher: "",
  crEmail: "",
  extraEmails: "",
};

export function EventForm({ open, onOpenChange, onCreated }: EventFormProps) {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof empty, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const required: (keyof typeof empty)[] = [
      "title", "description", "date", "time", "venue", "department",
      "category", "priority", "assignedTeacher", "crEmail",
    ];
    for (const k of required) {
      if (!form[k].toString().trim()) {
        toast.error(`Please fill in ${k}`);
        return false;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.crEmail.trim())) {
      toast.error("CR email is not valid");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const extraEmails = form.extraEmails
        .split(/[,\s\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const invalid = extraEmails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      if (invalid.length) {
        toast.error(`Invalid extra emails: ${invalid.join(", ")}`);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, extraEmails }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create event", {
          description: typeof json.details === "string" ? json.details : undefined,
        });
        return;
      }
      toast.success("Event published & email sent!", {
        description: `Notified ${json.recipients?.length ?? 0} recipient(s).`,
      });
      setForm(empty);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error("Network error", {
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Event</DialogTitle>
          <DialogDescription>
            Fill in details — recipients will be notified by email instantly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Annual Tech Symposium" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What is this event about?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time *</Label>
              <Input id="time" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input id="venue" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Auditorium A" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Input id="department" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Computer Science" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seminar">Seminar</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priority *</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="teacher">Assigned Teacher *</Label>
            <Input id="teacher" value={form.assignedTeacher} onChange={(e) => set("assignedTeacher", e.target.value)} placeholder="Dr. Jane Smith" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr">Class CR Email *</Label>
            <Input id="cr" type="email" value={form.crEmail} onChange={(e) => set("crEmail", e.target.value)} placeholder="cr@college.edu" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="extra">Extra Student Emails (optional)</Label>
            <Textarea
              id="extra"
              rows={2}
              value={form.extraEmails}
              onChange={(e) => set("extraEmails", e.target.value)}
              placeholder="student1@college.edu, student2@college.edu"
            />
            <p className="text-xs text-muted-foreground">Comma, space, or newline separated.</p>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[160px]">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Publish & Notify</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}