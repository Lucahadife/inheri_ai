import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const demoUsers = [
  {
    email: "executor@fairsplit.ai",
    password: "ChangeMe123!",
    role: "admin",
  },
  {
    email: "heir1@fairsplit.ai",
    password: "ChangeMe123!",
    role: "heir",
  },
  {
    email: "heir2@fairsplit.ai",
    password: "ChangeMe123!",
    role: "heir",
  },
];

const createUser = async (user) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
  });

  if (error) {
    throw error;
  }

  return data.user;
};

const run = async () => {
  console.log("Creating demo users...");
  const users = [];
  for (const user of demoUsers) {
    const created = await createUser(user);
    users.push({ ...user, id: created.id });
  }

  console.log("Creating estate...");
  const { data: estate, error: estateError } = await supabase
    .from("estates")
    .insert({
      name: "The Rivera Estate",
      description: "Sample estate for demo purposes.",
      created_by: users[0].id,
    })
    .select()
    .single();

  if (estateError) throw estateError;

  console.log("Adding members...");
  const membersPayload = users.map((user) => ({
    estate_id: estate.id,
    user_id: user.id,
    email: user.email,
    role: user.role,
    status: "active",
  }));
  const { error: membersError } = await supabase
    .from("estate_members")
    .insert(membersPayload);
  if (membersError) throw membersError;

  console.log("Creating assets...");
  const assetsPayload = [
    {
      estate_id: estate.id,
      name: "Family Home",
      description: "Primary residence in Austin, TX.",
      value_low: 450000,
      value_high: 520000,
      created_by: users[0].id,
    },
    {
      estate_id: estate.id,
      name: "Lake Cabin",
      description: "Vacation property on Lake Travis.",
      value_low: 250000,
      value_high: 320000,
      created_by: users[0].id,
    },
    {
      estate_id: estate.id,
      name: "Vintage Car",
      description: "1967 Ford Mustang.",
      value_low: 42000,
      value_high: 60000,
      created_by: users[0].id,
    },
  ];
  const { data: assets, error: assetsError } = await supabase
    .from("assets")
    .insert(assetsPayload)
    .select();
  if (assetsError) throw assetsError;

  console.log("Seeding preferences and boosts...");
  const preferencesPayload = [
    {
      asset_id: assets[0].id,
      heir_id: users[1].id,
      emotional_score: 5,
      note: "Grew up here.",
    },
    {
      asset_id: assets[1].id,
      heir_id: users[2].id,
      emotional_score: 4,
      note: "Family vacation spot.",
    },
    {
      asset_id: assets[2].id,
      heir_id: users[1].id,
      emotional_score: 3,
      note: "Restoration hobby.",
    },
  ];
  const { error: prefError } = await supabase
    .from("preferences")
    .insert(preferencesPayload);
  if (prefError) throw prefError;

  const boostsPayload = [
    {
      asset_id: assets[0].id,
      heir_id: users[1].id,
      boost: 2,
      note: "Decedent wished heir1 to keep the home.",
    },
  ];
  const { error: boostError } = await supabase
    .from("decedent_boosts")
    .insert(boostsPayload);
  if (boostError) throw boostError;

  console.log("Creating scenarios...");
  const { data: scenarioA, error: scenarioAError } = await supabase
    .from("scenarios")
    .insert({
      estate_id: estate.id,
      heir_id: users[1].id,
      name: "A",
    })
    .select()
    .single();
  if (scenarioAError) throw scenarioAError;

  const { error: scenarioItemsError } = await supabase
    .from("scenario_items")
    .insert([
      { scenario_id: scenarioA.id, asset_id: assets[0].id },
      { scenario_id: scenarioA.id, asset_id: assets[2].id },
    ]);
  if (scenarioItemsError) throw scenarioItemsError;

  console.log("Seed complete.");
  console.log("Estate ID:", estate.id);
  console.log("Demo users:", demoUsers.map((user) => user.email).join(", "));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
