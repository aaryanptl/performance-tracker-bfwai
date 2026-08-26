import { randomBytes, randomInt } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!projectUrl || !secretKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and the server-only SUPABASE_SECRET_KEY in .env.local.",
  );
}

const supabase = createClient(projectUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function shuffle(value) {
  const characters = [...value];
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const replacement = randomInt(index + 1);
    [characters[index], characters[replacement]] = [characters[replacement], characters[index]];
  }
  return characters.join("");
}

function temporaryPassword() {
  return shuffle(`Aa1!${randomBytes(15).toString("base64url")}`);
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

const { data: people, error: peopleError } = await supabase
  .from("people")
  .select("id, display_name, work_email, auth_user_id")
  .eq("active", true)
  .order("display_name");

if (peopleError) throw peopleError;

const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (usersError) throw usersError;

const usersByEmail = new Map(
  usersPage.users.filter((user) => user.email).map((user) => [user.email.toLowerCase(), user]),
);
const createdCredentials = [];

for (const person of people) {
  if (person.auth_user_id) continue;

  const normalizedEmail = person.work_email.trim().toLowerCase();
  let authUser = usersByEmail.get(normalizedEmail);

  if (!authUser) {
    const password = temporaryPassword();
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: person.display_name },
    });
    if (error) throw new Error(`Could not provision ${normalizedEmail}: ${error.message}`);

    authUser = data.user;
    usersByEmail.set(normalizedEmail, authUser);
    createdCredentials.push({
      name: person.display_name,
      email: normalizedEmail,
      temporaryPassword: password,
    });
  }

  const { error: linkError } = await supabase
    .from("people")
    .update({ auth_user_id: authUser.id, joined_at: new Date().toISOString() })
    .eq("id", person.id);
  if (linkError) throw new Error(`Could not link ${normalizedEmail}: ${linkError.message}`);
}

if (createdCredentials.length > 0) {
  const outputDirectory = resolve("output");
  const outputPath = resolve(outputDirectory, "initial-login-credentials.csv");
  const rows = [
    ["name", "email", "temporary_password"],
    ...createdCredentials.map(({ name, email, temporaryPassword: password }) => [
      name,
      email,
      password,
    ]),
  ];

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  console.log(`Provisioned ${createdCredentials.length} users. Credentials: ${outputPath}`);
} else {
  console.log("No new users needed provisioning.");
}
