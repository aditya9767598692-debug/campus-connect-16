import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  date: z.string().min(1),
  time: z.string().min(1),
  venue: z.string().trim().min(1).max(200),
  department: z.string().trim().min(1).max(100),
  category: z.enum(["Seminar", "Sports", "Cultural", "Workshop", "Other"]),
  priority: z.enum(["Low", "Medium", "High"]),
  assignedTeacher: z.string().trim().min(1).max(150),
  crEmail: z.string().trim().email().max(255),
  extraEmails: z.array(z.string().trim().email().max(255)).max(50).default([]),
});

function buildEmailHtml(d: z.infer<typeof eventSchema>, eventId: string, origin: string) {
  const priorityColor = d.priority === "High" ? "#dc2626" : d.priority === "Medium" ? "#d97706" : "#059669";
  const viewUrl = `${origin}/?event=${eventId}`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${d.title}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#8b5cf6);padding:28px 32px;color:#fff;">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">College Event Notification</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">${d.title}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">${d.description.replace(/\n/g, "<br/>")}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e7eb;margin-top:16px;">
            ${row("📅 Date", d.date)}
            ${row("⏰ Time", d.time)}
            ${row("📍 Venue", d.venue)}
            ${row("🏛️ Department", d.department)}
            ${row("🏷️ Category", d.category)}
            ${row("⚡ Priority", `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${priorityColor}1a;color:${priorityColor};font-weight:600;font-size:13px;">${d.priority}</span>`)}
            ${row("👤 Assigned Teacher", d.assignedTeacher)}
          </table>
          <div style="text-align:center;margin-top:28px;">
            <a href="${viewUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Event</a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:18px 32px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
          You are receiving this because you are listed as a recipient for college event notifications.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:40%;vertical-align:top;">${label}</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:500;">${value}</td></tr>`;
}

export const Route = createFileRoute("/api/create-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const parsed = eventSchema.safeParse(body);
          if (!parsed.success) {
            return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
          }
          const data = parsed.data;

          const { data: inserted, error: dbErr } = await supabaseAdmin
            .from("events")
            .insert({
              title: data.title,
              description: data.description,
              event_date: data.date,
              event_time: data.time,
              venue: data.venue,
              department: data.department,
              category: data.category,
              priority: data.priority,
              assigned_teacher: data.assignedTeacher,
              cr_email: data.crEmail,
              extra_emails: data.extraEmails,
            })
            .select()
            .single();

          if (dbErr || !inserted) {
            return Response.json({ error: "Database error", details: dbErr?.message }, { status: 500 });
          }

          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          const RESEND_API_KEY = process.env.RESEND_API_KEY;
          if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
            return Response.json({ error: "Email service not configured" }, { status: 500 });
          }

          const origin = new URL(request.url).origin;
          const html = buildEmailHtml(data, inserted.id, origin);
          // Send to the CR email plus any extra emails provided.
          const recipients = Array.from(
            new Set([data.crEmail, ...data.extraEmails].filter(Boolean)),
          );

          const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": RESEND_API_KEY,
            },
            body: JSON.stringify({
              from: "College Events <onboarding@resend.dev>",
              to: recipients,
              subject: `New Event: ${data.title}`,
              html,
            }),
          });

          const emailJson = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            await supabaseAdmin
              .from("events")
              .update({ email_sent: false, email_error: JSON.stringify(emailJson).slice(0, 500) })
              .eq("id", inserted.id);
            return Response.json(
              { error: "Email send failed", details: emailJson, event: inserted },
              { status: 502 },
            );
          }

          await supabaseAdmin.from("events").update({ email_sent: true }).eq("id", inserted.id);
          return Response.json({ success: true, event: inserted, recipients, emailId: emailJson?.id ?? null });
        } catch (err) {
          console.error("create-event error", err);
          return Response.json(
            { error: "Server error", details: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});