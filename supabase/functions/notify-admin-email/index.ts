// supabase/functions/notify-admin-email/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SB_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_USER = Deno.env.get("EMAIL_USER") ?? "";
const EMAIL_PASS = Deno.env.get("EMAIL_PASS") ?? "";
const FROM_ADDRESS = Deno.env.get("STATUS_EMAIL_FROM") ?? "ResiFix KNUST <onboarding@resend.dev>";

const provider = RESEND_API_KEY ? "resend" : EMAIL_USER && EMAIL_PASS ? "gmail" : "none";

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

Deno.serve(async (req) => {
  if (provider === "none") {
    return new Response("No email provider configured.", { status: 500 });
  }

  try {
    const payload = await req.json();

    // Check if this is an INSERT trigger on the reports table
    if (payload.type !== "INSERT" || payload.table !== "reports" || !payload.record) {
      return new Response("Ignored: Not a report insert", { status: 200 });
    }

    const report = payload.record;
    if (!report.hall_id) {
      return new Response("Ignored: Report has no hall_id", { status: 200 });
    }

    // Find admins for this hall who have email_notifications = true
    // Note: If you add email_notifications to profiles, you can filter on it directly
    // Using a POSTGREST query to filter role and hall_id
    const admins = await rest(`profiles?role=eq.hall_admin&hall_id=eq.${report.hall_id}&email_notifications=eq.true&select=email,full_name`);

    if (!admins || admins.length === 0) {
      return new Response("No admins with email notifications enabled for this hall.", { status: 200 });
    }

    // Also fetch hall name for the email
    const halls = await rest(`halls?id=eq.${report.hall_id}&select=name`);
    const hallName = halls[0]?.name || "Unknown Hall";

    const issueText = escapeHtml(report.issue || report.service_type || "Maintenance Issue");
    const descriptionText = escapeHtml(report.description || "No description provided.");
    const locationText = escapeHtml(report.location || "Unknown location");

    const sentIds = [];

    // Send emails to each admin
    for (const admin of admins) {
      if (!admin.email) continue;
      
      const adminName = escapeHtml(admin.full_name || "Admin");
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2b6cb0;">New Report Filed in ${escapeHtml(hallName)}</h2>
          <p>Hello ${adminName},</p>
          <p>A new maintenance report has been filed and requires your attention.</p>
          
          <div style="background-color: #f7fafc; padding: 16px; border-left: 4px solid #4299e1; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Issue:</strong> ${issueText}</p>
            <p style="margin: 0 0 10px 0;"><strong>Location:</strong> ${locationText}</p>
            <p style="margin: 0;"><strong>Description:</strong> ${descriptionText}</p>
          </div>
          
          <p>Please log in to the admin dashboard to review and assign this report.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #718096;">
            You are receiving this email because you have Email Notifications enabled in your ResiFix KNUST Admin Dashboard settings.
          </p>
        </div>
      `;

      const subject = `New Report: ${issueText} in ${escapeHtml(hallName)}`;
      const result = await sendEmail(admin.email, subject, html);
      sentIds.push(result.id);
    }

    return new Response(JSON.stringify({ success: true, sent: sentIds.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("notify-admin-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
