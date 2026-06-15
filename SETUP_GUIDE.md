# WakeProof — Setup & Usage Guide

## What is WakeProof?

WakeProof is a smart alarm system that **won't let you sleep through it**. Unlike a regular alarm, pressing a button is not enough. To dismiss the alarm you must:

1. **Take a live selfie** (Step 1) — proving your eyes are open  
2. **Photograph your sink / brushing area** (Step 2) — proving you actually got up and went to the bathroom

Only after both challenges does the alarm silence. The permanent OFF button (which fully disables the alarm) is hidden while the alarm is ringing — so you cannot accidentally kill it in a half-asleep state.

---

## How to Run It (Quick Start)

### Option A — Open Directly in Browser (Easiest)

1. Extract the `WakeProof` folder anywhere on your computer or phone's storage.
2. Open `index.html` in Chrome (Android) or Safari (iPhone).
3. Done — it works immediately.

> **Note:** Camera and notifications require HTTPS or localhost. See Option B for a proper local server.

---

### Option B — Run on a Local Server (Recommended for Full Features)

This enables PWA install, service worker, and notifications.

#### If you have Python installed:

```bash
cd WakeProof
python3 -m http.server 8080
```

Then open your browser at: `http://localhost:8080`

#### If you have Node.js installed:

```bash
cd WakeProof
npx serve .
```

Then open the URL it shows (usually `http://localhost:3000`).

---

### Option C — Host it Online (Best for Mobile Use)

For the best experience on your phone, host it on a free static host:

#### Netlify Drop (Recommended — 1 minute setup):
1. Go to https://app.netlify.com/drop
2. Drag and drop the entire `WakeProof` folder onto the page
3. Netlify gives you a live HTTPS URL like `https://wakeproof-abc123.netlify.app`
4. Open that URL on your phone — done!

#### GitHub Pages (Free):
1. Create a GitHub account if you don't have one
2. Create a new repository called `wakeproof`
3. Upload all files in the `WakeProof` folder to the repository
4. Go to Settings → Pages → Source: main branch → / (root)
5. Your URL will be `https://yourusername.github.io/wakeproof`

---

## Install on Your Phone (PWA — Works Like a Real App)

### Android (Chrome):
1. Open the app URL in Chrome
2. Tap the three-dot menu (⋮) at the top right
3. Tap **"Add to Home screen"**
4. Tap **Add** — it now appears on your home screen like a native app

### iPhone (Safari):
1. Open the app URL in Safari
2. Tap the **Share** button (the box with an arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add** — it now appears on your home screen

Once installed as a PWA, it opens full-screen without a browser bar, just like a real app.

---

## First Time Setup

1. **Allow Camera Access** — When you first open the camera challenge, your browser will ask for permission. Tap **Allow**. This is required for the alarm to work.

2. **Allow Notifications** (optional but recommended) — WakeProof will ask for notification permission. Tap **Allow** so it can remind you even when the browser is minimized.

3. **Keep the screen on** — For the alarm to ring when your phone is locked:
   - On Android: Keep the app open (don't close the tab)
   - On iPhone: Keep Safari open in the foreground or use the PWA version

---

## How to Set an Alarm

1. Open WakeProof
2. Use the **▲ ▼ arrows** (or swipe up/down on the time digits) to set your desired hour and minute
3. Optionally type a label like "Morning routine"
4. Tap **Set Alarm**
5. You'll see a countdown bar appear showing when the alarm fires

---

## When the Alarm Rings

1. The screen will show a pulsing animation and play an alarm sound
2. Tap **"📸 Take Selfie to Stop Alarm"**
3. Your front camera opens — position your face in the oval and tap the shutter
4. Review the photo, tap **✓ Use This** to confirm
5. You'll see Step 1 verified ✅
6. Tap Continue — your rear camera opens now
7. Point at your **sink, tap, or brushing area** and take a photo
8. Tap **✓ Use This** to confirm
9. Alarm is fully dismissed! 🎉

---

## Cancelling / Turning Off

- **Cancel** (alarm set but not ringing): Tap the **Cancel** button in the alarm bar on the home screen
- **Permanent OFF** (alarm is ringing): This button is intentionally hidden while ringing. It only appears if you are on the ringing screen but you need to stop the alarm completely (not via the challenge). Scroll to find it if truly needed.

---

## Tips for Best Results

| Tip | Why |
|-----|-----|
| Keep your phone plugged in at night | Ensures the screen can wake and the alarm runs |
| Use the PWA (installed to home screen) | Feels native, works better than a browser tab |
| Grant camera & notification permissions | Required for challenges and background alerts |
| Set a label with your intention | e.g. "Gym at 6am" helps motivate you |
| Use a bright room for the selfie | Camera needs enough light to capture |

---

## Troubleshooting

**Alarm didn't ring while the phone was locked:**  
Mobile browsers suspend JavaScript when the screen is off. For reliable alarms:
- Use the app with the screen on (set auto-lock to "Never" while sleeping — not ideal, but functional)
- Or install on a dedicated old phone/tablet kept plugged in

**Camera says "permission denied":**  
Go to your browser settings → Site Settings → Camera → allow for this site → reload the page

**No sound:**  
Tap the screen once first — browsers require a user gesture before playing audio. The alarm sound starts after you interact.

**App looks small on my phone:**  
Ensure you're using the PWA version (installed to home screen). In browser, make sure zoom is at 100%.

---

## File Structure

```
WakeProof/
├── index.html          Main app interface
├── css/
│   └── style.css       All styling (dark midnight theme)
├── js/
│   └── app.js          All app logic
├── sw.js               Service worker (offline + notifications)
├── manifest.json       PWA manifest
├── assets/
│   ├── icon-192.png    App icon (small)
│   └── icon-512.png    App icon (large)
└── SETUP_GUIDE.md      This file
```

---

## Privacy

WakeProof runs **100% locally in your browser**. No photos are uploaded anywhere. No data is sent to any server. Everything stays on your device. The captured photos are used only to visually confirm the challenge, then discarded when you leave the screen.

---

*Built for the WakeProof personal alarm system — because you deserve to wake up fully.*
