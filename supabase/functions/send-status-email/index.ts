// supabase/functions/send-status-email/index.ts
//
// Emails a student when a hall admin changes the status of their maintenance
// report. Invoked from the admin dashboard (src/data/store.js -> updateReport)
// right after the row is successfully updated.
//
// Nothing the caller sends is trusted beyond the report id: the report, its
// owner's address and the new status are all read back from the database with
// the service role, so a tampered request cannot email arbitrary text to an
// arbitrary address.
//
// Two ways to send, checked in this order:
//   1. RESEND_API_KEY          -> sends through Resend
//   2. EMAIL_USER + EMAIL_PASS -> sends through Gmail (the same app-password
//                                 pair the older email-handler function uses)
// Optional: STATUS_EMAIL_FROM  -> overrides the from-address on the Resend path
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@7";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SB_URL") ?? "";
const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_USER = Deno.env.get("EMAIL_USER") ?? "";
const EMAIL_PASS = Deno.env.get("EMAIL_PASS") ?? "";
const FROM_ADDRESS = Deno.env.get("STATUS_EMAIL_FROM") ?? "ResiFix KNUST <onboarding@resend.dev>";

/** Which transport is actually usable right now. */
const provider = RESEND_API_KEY ? "resend" : EMAIL_USER && EMAIL_PASS ? "gmail" : "none";

/**
 * Sends one email through whichever provider is configured. The transporter
 * is built per request rather than at module load, so missing credentials
 * produce a readable error instead of a function that refuses to boot.
 */
const sendEmail = async (to: string, subject: string, html: string) => {
  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result?.message ?? `Resend rejected the send (${res.status}).`);
    }
    return { id: result?.id ?? null, via: "resend" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  const info = await transporter.sendMail({
    from: `"ResiFix KNUST" <${EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return { id: info?.messageId ?? null, via: "gmail" };
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Service-role read against PostgREST. */
const rest = async (path: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`REST ${path} failed: ${res.status} ${await res.text()}`);
  }
  return await res.json();
};

const escapeHtml = (value: string) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

/** Collapses the stray line breaks students leave in the "Other: ..." box. */
const tidy = (value?: string | null) => String(value ?? "").replace(/\s+/g, " ").trim();

const STATUS_COPY: Record<string, { subject: string; headline: string; body: string }> = {
  pending: {
    subject: "is back in the queue",
    headline: "Your request is waiting to be scheduled",
    body: "Your hall admin has put this request back in the queue. You'll hear from us again as soon as a repair visit is booked.",
  },
  scheduled: {
    subject: "has been scheduled",
    headline: "You've been booked in for a repair",
    body: "Your hall admin has booked a maintenance visit for this request. There's nothing you need to do — just make sure the room is accessible at the time below.",
  },
  resolved: {
    subject: "has been resolved",
    headline: "This repair is done",
    body: "Your hall admin has marked this request as resolved. If the problem is still there, file a new request in the app and we'll take another look.",
  },
};

const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const FULL_WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/**
 * Slots are stored as UTC after the dashboard converts the admin's local
 * pick, and the halls are in Ghana (UTC+0, no daylight saving), so reading
 * the UTC fields back gives exactly the wall-clock time the admin chose.
 */
const parseSlot = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 2000) return null;
  return d;
};

/** "Thursday, 5 February 2026" */
const formatApptDate = (iso?: string | null) => {
  const d = parseSlot(iso);
  if (!d) return null;
  return `${FULL_WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${FULL_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/** "10:00 PM" */
const formatApptTime = (iso?: string | null) => {
  const d = parseSlot(iso);
  if (!d) return null;
  const hours = d.getUTCHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${suffix}`;
};

const buildHtml = (opts: {
  studentName: string;
  headline: string;
  body: string;
  reference: string;
  fault: string;
  location: string;
  hall: string;
  status: string;
  apptDate: string | null;
  apptTime: string | null;
  apptCancelled: boolean;
}) => {
  const row = (label: string, value: string) => `
        <tr>
          <td style="padding:8px 0;color:#6b6360;font-size:13px;width:130px;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#1a1c1c;font-size:13px;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f3f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4bebA;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#af101a;padding:20px 28px;">
          <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.2px;">ResiFix KNUST</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <p style="margin:0 0 6px;color:#6b6360;font-size:13px;">Hi ${escapeHtml(opts.studentName)},</p>
          <h1 style="margin:0 0 12px;color:#1a1c1c;font-size:21px;line-height:1.3;font-weight:700;">${escapeHtml(opts.headline)}</h1>
          <p style="margin:0 0 22px;color:#4a4340;font-size:14px;line-height:1.6;">${escapeHtml(opts.body)}</p>

          ${
            opts.apptDate
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fdf6f5;border:1px solid #e4beba;border-radius:10px;margin-bottom:22px;">
            <tr>
              <td style="padding:16px 18px;">
                <div style="color:#6b6360;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;font-weight:700;margin-bottom:10px;">
                  ${opts.apptCancelled ? "Cancelled appointment" : "Your appointment"}
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td style="padding:2px 0;color:#6b6360;font-size:12px;width:56px;">Date</td>
                    <td style="padding:2px 0;color:#af101a;font-size:17px;font-weight:700;${opts.apptCancelled ? "text-decoration:line-through;" : ""}">${escapeHtml(opts.apptDate)}</td>
                  </tr>
                  ${
                    opts.apptTime
                      ? `<tr>
                    <td style="padding:2px 0;color:#6b6360;font-size:12px;width:56px;">Time</td>
                    <td style="padding:2px 0;color:#af101a;font-size:17px;font-weight:700;${opts.apptCancelled ? "text-decoration:line-through;" : ""}">${escapeHtml(opts.apptTime)}</td>
                  </tr>`
                      : ""
                  }
                </table>
              </td>
            </tr>
          </table>`
              : ""
          }

          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #eee6e4;">
            ${row("Reference", opts.reference)}
            ${row("Fault", opts.fault)}
            ${row("Location", opts.location)}
            ${row("Hall", opts.hall)}
            ${opts.apptDate ? row("Scheduled date", opts.apptDate) : ""}
            ${opts.apptTime ? row("Scheduled time", opts.apptTime) : ""}
            ${row("Status", opts.status)}
          </table>

          <p style="margin:24px 0 0;color:#8f6f6c;font-size:12px;line-height:1.6;">
            You're getting this because you filed a maintenance request in the ResiFix KNUST app.
            Open the app to see the full history of this request.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  if (provider === "none") {
    return json(
      {
        error:
          "No mail provider is configured. Under Edge Functions -> Secrets in the Supabase dashboard, " +
          "add either RESEND_API_KEY, or the EMAIL_USER and EMAIL_PASS pair used by the email-handler function.",
      },
      500,
    );
  }

  try {
    // --- 1. Who is calling? -------------------------------------------
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Missing Authorization header." }, 401);

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return json({ error: "Not signed in." }, 401);
    const caller = await userRes.json();
    if (!caller?.id) return json({ error: "Not signed in." }, 401);

    const profiles = await rest(`profiles?id=eq.${caller.id}&select=role,hall_id`);
    const profile = profiles[0];
    if (!profile || !["hall_admin", "super_admin"].includes(profile.role)) {
      return json({ error: "Only hall admins can send status emails." }, 403);
    }

    // --- 2. What are we emailing about? -------------------------------
    const payload = await req.json().catch(() => ({}));
    const reportId = String(payload?.reportId ?? "");
    if (!UUID.test(reportId)) return json({ error: "A valid reportId is required." }, 400);

    const reports = await rest(
      `reports?id=eq.${reportId}&select=id,reference_id,student_name,student_email,category,issue,location,hall_id,hall_name,status`,
    );
    const report = reports[0];
    if (!report) return json({ error: "Report not found." }, 404);

    // A hall admin may only mail their own hall's students.
    if (profile.role === "hall_admin" && profile.hall_id !== report.hall_id) {
      return json({ error: "That report belongs to another hall." }, 403);
    }

    if (!report.student_email) {
      return json({ skipped: "That student has no email address on file." });
    }

    const status = String(report.status ?? "pending");
    const copy = STATUS_COPY[status] ?? {
      subject: `is now ${status}`,
      headline: `Your request is now ${status}`,
      body: "Your hall admin has updated this maintenance request.",
    };

    // Pull the booked slot in whatever the new status is, so the student
    // always sees when the visit is (or was) due. A live booking wins; if
    // there is only a completed or cancelled one, show that instead.
    const appts = await rest(
      `appointments?report_id=eq.${reportId}&select=scheduled_for,slot_label,status&order=scheduled_for.asc&limit=20`,
    );
    const appointment =
      appts.find((a: { status?: string }) => a.status === "scheduled") ??
      appts.find((a: { status?: string }) => a.status !== "cancelled") ??
      appts[0] ??
      null;

    // slot_label is the admin's own rendering of the slot, kept as a
    // fallback for rows saved before scheduled_for was reliable.
    const apptDate = formatApptDate(appointment?.scheduled_for) ?? appointment?.slot_label ?? null;
    const apptTime = formatApptTime(appointment?.scheduled_for);
    const apptCancelled = appointment?.status === "cancelled";

    const fault = tidy(report.issue) || tidy(report.category) || "Maintenance request";
    const reference = report.reference_id || reportId.slice(0, 8).toUpperCase();

    // --- 3. Send it ---------------------------------------------------
    const html = buildHtml({
      studentName: tidy(report.student_name).split(" ")[0] || "there",
      headline: copy.headline,
      body: copy.body,
      reference,
      fault,
      location: tidy(report.location) || "—",
      hall: tidy(report.hall_name) || "—",
      status: status.charAt(0).toUpperCase() + status.slice(1),
      apptDate,
      apptTime,
      apptCancelled,
    });

    let sent;
    try {
      sent = await sendEmail(
        report.student_email,
        `[${reference}] Your maintenance request ${copy.subject}`,
        html,
      );
    } catch (sendErr) {
      const message = sendErr instanceof Error ? sendErr.message : String(sendErr);
      console.error(`[send-status-email] ${provider} rejected the send:`, message);
      return json({ error: message, via: provider }, 502);
    }

    console.log(`[send-status-email] sent ${sent.id} via ${sent.via} -> ${report.student_email} (${status})`);
    return json({ ok: true, id: sent.id, via: sent.via, to: report.student_email, status });
  } catch (err) {
    console.error("[send-status-email] failed:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
