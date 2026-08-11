import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("STEP 1");

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    console.log("STEP 2");

    if (!SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in Edge Function secrets.");
    }
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("STEP 3");

    const body = await req.json();
    const { action } = body;

    console.log("STEP 4");

    function json(body: unknown, status = 200) {
      return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      console.log("STEP 7");
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      console.log("STEP 8");

      if (!createErr && created?.user) {
        return { userId: created.user.id, alreadyExisted: false };
      }

      const alreadyExists =
        createErr?.message?.toLowerCase().includes("already registered") ||
        createErr?.message?.toLowerCase().includes("already exists") ||
        createErr?.status === 422;

      if (!alreadyExists) {
        throw createErr ?? new Error("Failed to create user.");
      }

      const { data: list, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) throw listErr;

      const existing = list.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) throw new Error("User already registered but could not be located.");

      return { userId: existing.id, alreadyExisted: true };
    }

    if (action === "admin-signup") {
      const { name, email, password, accessCode } = body;
      const actualName = name;
      const actualPasskey = accessCode;

      if (!actualName || !email || !password || !actualPasskey) {
        return json({ error: "Missing required fields." }, 400);
      }

      const passkeyHash = await hashPasskey(actualPasskey);

      console.log("STEP 5");

      const { data: codeData, error: codeError } = await adminClient.from("admin_access_codes")
        .select("*")
        .eq("access_code_sha256", passkeyHash)
        .single();
        
      console.log("STEP 6");

      if (codeError || !codeData) {
        return json({ error: "Invalid admin passkey." }, 401);
      }

      if (codeData.is_active === false) {
        return json({ error: "Admin passkey is inactive." }, 401);
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        return json({ error: "Admin passkey has expired." }, 401);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const { userId } = await createOrReuseAuthUser(cleanEmail, password);

      console.log("STEP 9");

      const { error: profileError } = await adminClient.from("profiles").upsert(
        {
          id: userId,
          full_name: actualName,
          email: cleanEmail,
          role: "Admin",
          student_id: generateStudentId(),
          status: "Active",
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (profileError) throw profileError;

      console.log("STEP 10");

      return json({ success: true, userId });
    }

    if (action === "lecturer-signup") {
      const { name, email, password } = body;
      
      if (!name || !email || !password) {
        return json({ error: "Missing required fields." }, 400);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const { userId } = await createOrReuseAuthUser(cleanEmail, password);

      const { error: profileError } = await adminClient.from("profiles").upsert(
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

    if (action === "add-lecturer") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");

      if (!token) return json({ error: "Missing authorization." }, 401);

      const { data: callerData, error: callerErr } = await adminClient.auth.getUser(token);
      if (callerErr || !callerData?.user) return json({ error: "Invalid session." }, 401);

      const { data: callerProfile, error: callerProfileErr } = await adminClient.from("profiles")
        .select("role")
        .eq("id", callerData.user.id)
        .single();

      if (callerProfileErr || (callerProfile?.role !== "Admin" && callerProfile?.role !== "admin" && callerProfile?.role !== "Super Admin")) {
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

      const { error: profileError } = await adminClient.from("profiles").upsert(
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

    if (action === "toggle-user-status") {
      console.log("ACTION:", action);
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) return json({ error: "Missing authorization." }, 401);
      
      const { data: callerData, error: callerErr } = await adminClient.auth.getUser(token);
      if (callerErr || !callerData?.user) return json({ error: "Invalid session." }, 401);
      
      console.log("CALLER:", callerData.user.id);
      
      const { data: callerProfile, error: callerProfileErr } = await adminClient.from("profiles")
        .select("role")
        .eq("id", callerData.user.id)
        .single();
        
      console.log("ROLE:", callerProfile?.role);
        
      if (callerProfileErr || (callerProfile?.role !== "Admin" && callerProfile?.role !== "admin" && callerProfile?.role !== "Super Admin")) {
        return json({ error: "Only Admins can toggle user status." }, 403);
      }

      const { userId, status } = body;
      if (!userId || !status) {
        return json({ error: "Missing userId or status." }, 400);
      }
      
      console.log("TARGET USER:", userId);
      console.log("NEW STATUS:", status);

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ status })
        .eq("id", userId);

      if (updateError) {
        console.error("UPDATE ERROR:", updateError);
        throw updateError;
      }
      return json({ success: true });
    }

    if (action === "delete-user") {
      console.log("ACTION:", action);
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) return json({ error: "Missing authorization." }, 401);
      
      const { data: callerData, error: callerErr } = await adminClient.auth.getUser(token);
      if (callerErr || !callerData?.user) return json({ error: "Invalid session." }, 401);
      
      console.log("CALLER:", callerData.user.id);
      
      const { data: callerProfile, error: callerProfileErr } = await adminClient.from("profiles")
        .select("role")
        .eq("id", callerData.user.id)
        .single();
        
      console.log("ROLE:", callerProfile?.role);
        
      if (callerProfileErr || (callerProfile?.role !== "Admin" && callerProfile?.role !== "admin" && callerProfile?.role !== "Super Admin")) {
        return json({ error: "Only Admins can delete users." }, 403);
      }

      const { userId } = body;
      if (!userId) {
        return json({ error: "Missing userId." }, 400);
      }
      
      console.log("TARGET USER:", userId);

      console.log("Deleting profile...");
      const { error: profileDeleteErr } = await adminClient.from("profiles").delete().eq("id", userId);
      if (profileDeleteErr) {
        console.error("PROFILE DELETE ERROR:", profileDeleteErr);
        throw profileDeleteErr;
      }

      console.log("Deleting auth user...");
      const { error: authDeleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (authDeleteErr) {
        console.error("AUTH DELETE ERROR:", authDeleteErr);
        throw authDeleteErr;
      }

      return json({ success: true });
    }

    if (action === "delete-own-account") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");

      if (!token) return json({ error: "Missing authorization." }, 401);

      const { data: callerData, error: callerErr } = await adminClient.auth.getUser(token);
      if (callerErr || !callerData?.user) return json({ error: "Invalid session." }, 401);

      const userId = callerData.user.id;

      const { error: profileDeleteErr } = await adminClient.from("profiles").delete().eq("id", userId);
      if (profileDeleteErr) throw profileDeleteErr;

      const { error: authDeleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (authDeleteErr) throw authDeleteErr;

      return json({ success: true });
    }

    return json({ error: "Unknown action." }, 400);

  } catch (error: any) {
    console.error("EDGE FUNCTION ERROR:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});
