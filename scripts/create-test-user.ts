import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  const email = process.argv[2] || "test@example.com";
  const password = process.argv[3] || "testpassword123";
  const isOrganizer = process.argv[4] === "true" || process.argv[4] === "1";

  console.log(`Creating test user: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Is Organizer: ${isOrganizer}`);

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for dev
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return;
    }

    if (!authData.user) {
      console.error("No user returned from auth creation");
      return;
    }

    console.log("✅ Auth user created:", authData.user.id);

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: authData.user.user_metadata?.full_name || null,
        is_organizer: isOrganizer,
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      // Try to update if user already exists
      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({ is_organizer: isOrganizer })
        .eq("id", authData.user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating user record:", updateError);
      } else {
        console.log("✅ User record updated:", updateData);
      }
    } else {
      console.log("✅ User record created:", userData);
    }

    console.log("\n🎉 Test user created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${authData.user.id}`);
    console.log(`Is Organizer: ${isOrganizer}`);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

createTestUser();

