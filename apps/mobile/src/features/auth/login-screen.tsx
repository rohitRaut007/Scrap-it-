// React Compiler is enabled (app.json experiments.reactCompiler). NativeWind v4
// drives styles through a JSX import-source pragma; opting this file out of
// the compiler keeps className→style mapping deterministic on first render.
"use no memo";

import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { TextField } from "@/components/ui/text-field";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/ui/segmented-control";
import { authDebugLog } from "@/lib/auth-debug";
import { api, ApiError } from "@/lib/api";
import { authService } from "@/services/authService";
import { useAppTheme } from "@/lib/theme";
import type { MeResponse } from "@/api/auth";

type Mode = "signin" | "signup";

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const passwordRef = useRef<TextInput>(null);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const describeError = (err: unknown): string => {
    if (err instanceof ApiError) return `Backend ${err.status}: ${err.message}`;
    if (err instanceof Error) return err.message;
    return t("auth.login.genericError");
  };

  const MODE_OPTIONS: ReadonlyArray<SegmentedControlOption<Mode>> = [
    { value: "signin", label: t("auth.login.modeOptions.signin") },
    { value: "signup", label: t("auth.login.modeOptions.signup") },
  ];

  const COPY: Record<
    Mode,
    { title: string; lead: string; cta: string; switchPrefix: string; switchAction: string }
  > = {
    signin: {
      title: t("auth.login.signin.title"),
      lead: t("auth.login.signin.lead"),
      cta: t("auth.login.signin.cta"),
      switchPrefix: t("auth.login.signin.switchPrefix"),
      switchAction: t("auth.login.signin.switchAction"),
    },
    signup: {
      title: t("auth.login.signup.title"),
      lead: t("auth.login.signup.lead"),
      cta: t("auth.login.signup.cta"),
      switchPrefix: t("auth.login.signup.switchPrefix"),
      switchAction: t("auth.login.signup.switchAction"),
    },
  };

  const copy = COPY[mode];

  const validation = useMemo(() => {
    const trimmedEmail = email.trim();
    const emailValid = EMAIL_RE.test(trimmedEmail);
    const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
    return {
      trimmedEmail,
      emailValid,
      passwordValid,
      formValid: emailValid && passwordValid,
    };
  }, [email, password]);

  const submit = async () => {
    if (!validation.formValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (__DEV__) {
        authDebugLog("submit: starting Supabase auth", { mode });
      }
      const auth =
        mode === "signin"
          ? await authService.signIn(validation.trimmedEmail, password)
          : await authService.signUp(validation.trimmedEmail, password);
      if (__DEV__) {
        authDebugLog("submit: calling GET /auth/me", {
          hasAccessToken: Boolean(auth.accessToken),
        });
      }
      const me = await api.get<MeResponse>("/auth/me", {
        accessToken: auth.accessToken,
      });
      if (!me.user?.id) {
        throw new Error(t("auth.login.profileLoadError"));
      }
      router.replace("/home");
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
  };

  const toggleMode = () => switchMode(mode === "signin" ? "signup" : "signin");

  return (
    <Screen contentClassName="px-5 pb-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 gap-3">
          {/* Brand + headline — fixed slots keep layout stable when switching tabs */}
          <View className="items-center pt-1">
            <Logo size={168} />
            <View className="mt-1 w-full gap-0">
              <View className="min-h-[56px] w-full justify-start">
                <Text variant="title" className="text-center">
                  {copy.title}
                </Text>
              </View>
              <View className="min-h-[72px] w-full justify-start">
                <Text variant="lead" className="text-center leading-5">
                  {copy.lead}
                </Text>
              </View>
            </View>
          </View>

          <SegmentedControl
            value={mode}
            options={MODE_OPTIONS}
            onChange={switchMode}
            accessibilityLabel={t("auth.login.accessibilityLabel")}
          />

          <View className="gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/20">
            <TextField
              label={t("auth.login.emailLabel")}
              placeholder={t("auth.login.emailPlaceholder")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!busy}
              onSubmitEditing={() => passwordRef.current?.focus()}
              leftIcon="mail-outline"
            />
            <TextField
              ref={passwordRef}
              label={t("auth.login.passwordLabel")}
              placeholder={t("auth.login.passwordPlaceholder", { count: MIN_PASSWORD_LENGTH })}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              toggleSecure
              autoCapitalize="none"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              textContentType={mode === "signup" ? "newPassword" : "password"}
              returnKeyType="go"
              editable={!busy}
              onSubmitEditing={submit}
              leftIcon="lock-closed-outline"
              hint={
                mode === "signup"
                  ? t("auth.login.passwordHint", { count: MIN_PASSWORD_LENGTH })
                  : undefined
              }
              reserveAccessoryHeight={mode === "signin" ? 40 : undefined}
            />

            {error ? (
              <View className="flex-row items-start rounded-2xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 dark:border-red-400/20 dark:bg-red-400/10">
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.destructive}
                />
                <Text
                  variant="small"
                  className="ml-2 flex-1 text-destructive dark:text-red-400"
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <Button
              size="lg"
              disabled={!validation.formValid}
              loading={busy}
              onPress={submit}
              rightIcon={!busy ? "arrow-forward" : undefined}
              accessibilityLabel={copy.cta}
            >
              {busy ? t("auth.login.pleaseWait") : copy.cta}
            </Button>

            <View className="min-h-[40px] items-center justify-center">
              {mode === "signin" ? (
                <Pressable className="self-center" hitSlop={8}>
                  <Text
                    variant="small"
                    className="font-medium text-primary dark:text-emerald-300"
                  >
                    {t("auth.login.forgotPassword")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View className="flex-row items-center justify-center gap-2">
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={colors.subtleIcon}
            />
            <Text variant="small" className="max-w-[90%] text-center leading-5">
              {t("auth.login.encryptedNotice")}
            </Text>
          </View>

          <View className="mt-auto gap-2 pt-2">
            <Pressable
              onPress={toggleMode}
              hitSlop={8}
              className="self-center py-1"
              accessibilityRole="button"
            >
              <Text variant="muted" className="text-center">
                {copy.switchPrefix}{" "}
                <Text className="font-semibold text-primary dark:text-emerald-300">
                  {copy.switchAction}
                </Text>
              </Text>
            </Pressable>
            <Text variant="small" className="text-center leading-5">
              {t("auth.login.termsNotice")}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
