"use client";

import React, { createContext, useContext } from "react";

// Context to pass store settings from Server Component → Client components
// This eliminates the FOUC (Flash of Old Content) caused by client-side /api/settings fetches

const SettingsContext = createContext<Record<string, string>>({});

export function SettingsProvider({
  settings,
  children,
}: {
  settings: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Record<string, string> {
  return useContext(SettingsContext);
}
