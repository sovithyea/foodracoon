"use client";

import { useActionState } from "react";
import { saveOnboarding, type OnboardingState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm({
  defaultDisplayName,
}: {
  defaultDisplayName?: string;
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    saveOnboarding,
    {},
  );

  return (
    <form action={formAction} className="w-full max-w-sm space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pick your handle
        </h1>
        <p className="text-muted-foreground text-sm">
          This is how friends will find you on Foodracoon.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="flex items-center">
          <span className="text-muted-foreground border-input bg-muted rounded-l-md border border-r-0 px-3 py-2 text-sm">
            @
          </span>
          <Input
            id="username"
            name="username"
            required
            placeholder="vithyea"
            className="rounded-l-none"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          placeholder="Sovithyea Prach"
          defaultValue={defaultDisplayName}
        />
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        Enter the map
      </Button>
    </form>
  );
}
