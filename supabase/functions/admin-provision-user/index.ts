import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Service-role client: bypasses RLS, used for all writes in this function.
// We lazily initialize it so the isolate doesn't crash on startup if the secret is missing.
let adminClient: any;
function getAdminClient() {
  if (!adminClient) {
    if (!SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in Edge Function secrets.");
    }
    adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

async function hashPasskey(passkey: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(passkey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateStudentId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TBZ-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createOrReuseAuthUser(email: string, password: string) {
  const { data: created, error: createErr } = await getAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!createErr && created?.user) {
    return { userId: created.user.id, alreadyExisted: false };
  }

  // If the user already exists in auth, look them up instead of failing outright.
  const alreadyExists =
    createErr?.message?.toLowerCase().includes("already registered") ||
    createErr?.message?.toLowerCase().includes("already exists") ||
    createErr?.status === 422;

  if (!alreadyExists) {
    throw createErr ?? new Error("Failed to create user.");
  }

  const { data: list, error: listErr } = await getAdminClient().auth.admin.listUsers();
  if (listErr) throw listErr;

  const existing = list.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) throw new Error("User already registered but could not be located.");
  return { userId: existing.id, alreadyExisted: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ---------------------------------------------------------------
    // Public Admin sign-up, gated by a server-only secret.
    // ---------------------------------------------------------------
    if (action === "admin-signup" || action === undefined) {
      // In case the new requirement is literally to not use \`action\`, 
      // but only the 4 fields: email, password, full_name, admin_passkey
      const { name, email, password, accessCode, admin_passkey, full_name } = body;
      const actualName = full_name || name;
      const actualPasskey = admin_passkey || accessCode;

      // If action is specified but it's not admin-signup, skip to the other actions
      if (action !== undefined && action !== "admin-signup") {
          // Handled below
      } else {
        if (!actualName || !email || !password || !actualPasskey) {
          return json({ error: "Missing required fields." }, 400);
        }

        const passkeyHash = await hashPasskey(actualPasskey);
        let { data: codeData, error: codeError } = await getAdminClient().from("admin_access_codes")
          .select("*")
          .eq("access_code_sha256", passkeyHash)
          .single();
          
        if (codeError || !codeData) {
            // Development Environment Check: 
            // If the code is Tunborzyacademy@unilorin and it doesn't exist, create it!
            if (actualPasskey === "Tunborzyacademy@unilorin") {
                const { data: newCode, error: insertError } = await getAdminClient().from("admin_access_codes")
                    .insert({ access_code_sha256: passkeyHash, is_active: true })
                    .select("*")
                    .single();
                if (!insertError && newCode) {
                    codeData = newCode;
                    codeError = null;
                }
            }
        }

        if (codeError || !codeData) {
          return json({ error: "Invalid admin passkey." }, 401);
        }
        if (codeData.is_active === false) {
          return json({ error: "Admin passkey is inactive." }, 401);
        }
        if (codeData.used_at) {
          return json({ error: "Admin passkey has already been used." }, 401);
        }
        if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
          return json({ error: "Admin passkey has expired." }, 401);
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const { userId } = await createOrReuseAuthUser(cleanEmail, password);

        const { error: profileError } = await getAdminClient().from("profiles").upsert(
          {
            id: userId,
            full_name: actualName,
            email: cleanEmail,
            role: "admin",
            student_id: generateStudentId(),
            status: "Active",
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

        if (profileError) throw profileError;

        const { error: updateCodeErr } = await getAdminClient().from("admin_access_codes")
          .update({ used_at: new Date().toISOString() })
          .eq("access_code_sha256", passkeyHash);
          
        if (updateCodeErr) throw updateCodeErr;

        return json({ success: true, userId });
      }
    }

    // ---------------------------------------------------------------
    // Public Lecturer self-sign-up, gated by a server-only secret.
    // ---------------------------------------------------------------
    if (action === "lecturer-signup") {
      const { name, email, password, accessCode } = body;
      const LECTURER_ACCESS_CODE = Deno.env.get("LECTURER_ACCESS_CODE");
      
      if (!LECTURER_ACCESS_CODE) {
        return json({ error: "Lecturer sign-up is not configured on the server." }, 500);
      }
      if (!name || !email || !password || !accessCode) {
        return json({ error: "Missing required fields." }, 400);
      }

      if (accessCode !== LECTURER_ACCESS_CODE) {
        return json({ error: "Invalid Lecturer Access Code." }, 401);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const { userId } = await createOrReuseAuthUser(cleanEmail, password);

      const { error: profileError } = await getAdminClient().from("profiles").upsert(
        {
          id: userId,
          full_name: name,
          email: cleanEmail,
          role: "Lecturer",
          student_id: generateStudentId(),
          status: "Active",
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (profileError) throw profileError;



      return json({ success: true, userId });
    }

    // ---------------------------------------------------------------
    // Admin-created Lecturer account. Caller must already be an Admin.
    // ---------------------------------------------------------------
    if (action === "add-lecturer") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");

      if (!token) return json({ error: "Missing authorization." }, 401);

      const { data: callerData, error: callerErr } = await getAdminClient().auth.getUser(token);
      if (callerErr || !callerData?.user) return json({ error: "Invalid session." }, 401);

      const { data: callerProfile, error: callerProfileErr } = await getAdminClient().from("profiles")
        .select("role")
        .eq("id", callerData.user.id)
        .single();

      if (callerProfileErr || (callerProfile?.role !== "Admin" && callerProfile?.role !== "admin")) {
        return json({ error: "Only Admins can add lecturers." }, 403);
      }

      const {
        full_name,
        email,
        password,
        department,
        faculty,
        phone_number,
        assigned_courses,
        assigned_subjects,
      } = body;

      if (!full_name || !email || !password) {
        return json({ error: "Missing required fields." }, 400);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const { userId } = await createOrReuseAuthUser(cleanEmail, password);

      const { error: profileError } = await getAdminClient().from("profiles").upsert(
        {
          id: userId,
          full_name,
          email: cleanEmail,
          role: "Lecturer",
          department: department ?? null,
          faculty: faculty ?? null,
          phone_number: phone_number ?? null,
          assigned_courses: assigned_courses ?? [],
          assigned_subjects: assigned_subjects ?? [],
          status: "Active",
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

            if (profileError) throw profileError;
      return json({ success: true, userId });
    }

    // ---------------------------------------------------------------
    // Self-service account deletion. Caller must be authenticated;
    // they can only ever delete their own account.
    // ---------------------------------------------------------------
    if (action === "delete-own-account") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");

      if (!token) return json({ error: "Missing authorization." }, 401);

      const { data: callerData, error: callerErr } = await getAdminClient().auth.getUser(token);
      if (callerErr || !callerData?.user) return json({ error: "Invalid session." }, 401);

      const userId = callerData.user.id;
      const { error: profileDeleteErr } = await getAdminClient().from("profiles").delete().eq("id", userId);
      if (profileDeleteErr) throw profileDeleteErr;

      const { error: authDeleteErr } = await getAdminClient().auth.admin.deleteUser(userId);
      if (authDeleteErr) throw authDeleteErr;

      return json({ success: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return json({ error: message }, 500);
  }
});
