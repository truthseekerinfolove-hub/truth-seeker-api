const ALLOWED_ORIGINS = [
  "https://broad-cloud-199a.truthseekerinfolove.workers.dev"
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Truth Seeker API is running"
        }),
        { headers }
      );
    }

    if (request.method !== "POST" || url.pathname !== "/submit") {
      return new Response(
        JSON.stringify({ success: false, error: "Not found" }),
        { status: 404, headers }
      );
    }

    try {
      const data = await request.json();

      const requesterName = String(data.requester_name || data.name || "").trim();
      const requesterEmail = String(data.requester_email || data.email || "").trim();

      if (!requesterName || !requesterEmail) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Name and email are required"
          }),
          { status: 400, headers }
        );
      }

      await env.DB.prepare(`
        INSERT INTO submissions
          (requester_name, requester_email, subject_name,
           subject_address, residency_status, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        requesterName,
        requesterEmail,
        String(data.subject_name || ""),
        String(data.subject_address || ""),
        String(data.residency_status || ""),
        String(data.details || data.request_details || "")
      ).run();

      return new Response(
        JSON.stringify({
          success: true,
          message: "Submission received"
        }),
        { status: 201, headers }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unable to save submission"
        }),
        { status: 500, headers }
      );
    }
  }
};
