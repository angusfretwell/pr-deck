import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useStoredViews } from "./storage";
import { NEW_SESSION, openViews, type ViewsChange } from "./views";

export function useViews(owner: string, slug: string | null) {
  const [storedViews, setStoredViews] = useStoredViews();
  const [session, setSession] = useState(NEW_SESSION);
  const [, navigate] = useLocation();
  const stored = storedViews[owner];

  const views = openViews({ owner, stored, slug, session });
  if (views.session !== session) setSession(views.session);

  const { list } = views;
  useEffect(() => {
    if (list !== stored)
      setStoredViews((prev) => (prev[owner] === stored ? { ...prev, [owner]: list } : prev));
  }, [list, stored, owner, setStoredViews]);

  if (!stored) return null;

  const commit = (change: ViewsChange) => {
    if (change.views !== stored) setStoredViews((prev) => ({ ...prev, [owner]: change.views }));
    if (change.session !== views.session) setSession(change.session);
    if (change.navigate) navigate(change.navigate.to, { replace: change.navigate.replace });
  };

  return { views, commit };
}
