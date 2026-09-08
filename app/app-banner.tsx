"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";

const APP_NAME = "CPA Australia";
const DISMISS_KEY = "app-banner-dismissed";

const IOS_URL =
  "https://apps.apple.com/app/apple-store/id6752239608?pt=2158661&ct=mobile_app_launch_promotion_cpa_landing_page_website&mt=8";
const ANDROID_URL =
  "https://play.google.com/store/apps/details?id=com.cpaaustralia.mobileapp&referrer=utm_source%3Dcpa_landing_page%26utm_medium%3Dwebsite%26utm_campaign%3Dmobile_app_launch_promotion";

type Target = { url: string; store: string };

function pickTarget(): Target | null {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a desktop UA, so fall back to the touch-capable Mac check.
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  // Chrome, Firefox and in-app webviews all embed "Safari" in the UA, so exclude their own tokens.
  const isSafari = !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|MicroMessenger)/.test(ua);

  // Safari on iOS already draws Apple's native banner from the meta tag in layout.tsx.
  if (isIOS && isSafari) return null;
  if (isIOS) return { url: IOS_URL, store: "App Store" };
  if (/Android/.test(ua)) return { url: ANDROID_URL, store: "Google Play" };
  return null;
}

export function AppBanner() {
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // Private mode or blocked storage — show the banner rather than fail.
    }
    setTarget(pickTarget());
  }, []);

  if (!target) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setTarget(null);
  }

  return (
    <aside className="app-banner">
      <button className="app-banner-close" onClick={dismiss} aria-label="Dismiss app banner">
        <X size={15} />
      </button>
      <span className="app-banner-icon"><Smartphone size={20} /></span>
      <span className="app-banner-copy">
        <strong>{APP_NAME}</strong>
        <small>Free &mdash; on the {target.store}</small>
      </span>
      <a className="app-banner-cta" href={target.url} target="_blank" rel="noreferrer">Open</a>
    </aside>
  );
}
