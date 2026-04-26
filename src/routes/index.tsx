import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventForm } from "@/components/EventForm";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Calendar, Clock, MapPin, Building2, User, Mail, GraduationCap, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

interface EventRow {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  venue: string;
  department: string;
  category: string;
  priority: string;
  assigned_teacher: string;
  cr_email: string;
  extra_emails: string[];
  email_sent: boolean;
  created_at: string;
}

const priorityStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

function Index() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setEvents(data as EventRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            College Event Notifications
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Publish events. Notify students instantly.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/80 md:text-lg">
            Create a college event and we'll deliver a beautifully formatted email to your Class CR
            and any extra recipients in seconds.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => setOpen(true)}
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Event
            </Button>
          </div>
        </div>
      </header>

      {/* Events */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recent Events</h2>
            <p className="text-sm text-muted-foreground">Latest 50 published events</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-accent p-4">
              <Calendar className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No events yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click "Add Event" to publish your first one.
            </p>
            <Button className="mt-5" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((ev) => (
              <Card
                key={ev.id}
                className="overflow-hidden p-5 transition-all hover:shadow-lg"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{ev.category}</Badge>
                      <Badge variant="outline" className={priorityStyles[ev.priority]}>
                        {ev.priority}
                      </Badge>
                      {ev.email_sent && (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
                          ✓ Sent
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-2 truncate text-lg font-semibold text-foreground">{ev.title}</h3>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ev.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {ev.event_date}</div>
                  <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {ev.event_time}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {ev.venue}</div>
                  <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {ev.department}</div>
                  <div className="flex items-center gap-1.5 col-span-2"><GraduationCap className="h-3.5 w-3.5" /> {ev.assigned_teacher}</div>
                  <div className="flex items-center gap-1.5 col-span-2 truncate"><Mail className="h-3.5 w-3.5" /> {ev.cr_email}{ev.extra_emails?.length ? ` +${ev.extra_emails.length}` : ""}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <EventForm open={open} onOpenChange={setOpen} onCreated={load} />
    </div>
  );
}
