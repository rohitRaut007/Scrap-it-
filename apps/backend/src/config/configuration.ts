export default () => ({
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  corsOrigins: process.env.CORS_ORIGINS ?? "",
});
