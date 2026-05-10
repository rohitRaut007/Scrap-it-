import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { SupabaseJwtStrategy } from "./strategies/supabase-jwt.strategy";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "jwt" })],
  controllers: [AuthController],
  providers: [SupabaseJwtStrategy, JwtAuthGuard],
  exports: [PassportModule, JwtAuthGuard],
})
export class AuthModule {}
