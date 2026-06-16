// /* =============================================
//    WakeProof — App Logic v2
//    Smart alarm with location-aware challenges
// ============================================= */

// 'use strict';

// /* =======================================
//    CHALLENGE PROFILES
//    Each profile defines Step 2 differently
//    Step 1 is always a selfie (same for all)
// ======================================= */
// const CHALLENGE_PROFILES = {
//   home: {
//     id:       'home',
//     label:    'Home',
//     icon:     '🏠',
//     desc:     'Sink / bathroom area',
//     step2: {
//       title:  'Photo of Your Sink',
//       hint:   'Point at your sink or bathroom area where you brush',
//       btn:    '🚿 Sink Photo to Finish',
//       icon:   '🦷',
//       successTitle: '🦷 Sink Verified!',
//       successSub:   'You made it to the bathroom. Alarm dismissed!',
//     }
//   },
//   office: {
//     id:       'office',
//     label:    'Office',
//     icon:     '🏢',
//     desc:     'Desk, keyboard or office window',
//     step2: {
//       title:  'Photo of Your Desk / Office',
//       hint:   'Point at your desk, keyboard, monitor, or an office window',
//       btn:    '💼 Desk Photo to Finish',
//       icon:   '💻',
//       successTitle: '💼 Desk Verified!',
//       successSub:   'You\'re at your desk. Alarm dismissed!',
//     }
//   },
//   travel: {
//     id:       'travel',
//     label:    'Travel',
//     icon:     '✈️',
//     desc:     'Hotel room, window or street view',
//     step2: {
//       title:  'Photo of Your Surroundings',
//       hint:   'Take a photo of a window, hotel room, or outside view',
//       btn:    '🌍 Location Photo to Finish',
//       icon:   '🗺️',
//       successTitle: '🌍 Location Verified!',
//       successSub:   'Safe travels. Alarm dismissed!',
//     }
//   },
//   gym: {
//     id:       'gym',
//     label:    'Gym',
//     icon:     '🏋️',
//     desc:     'Equipment, weights or gym floor',
//     step2: {
//       title:  'Photo of Gym Equipment',
//       hint:   'Point at any gym equipment, weights, or the gym floor',
//       btn:    '💪 Gym Photo to Finish',
//       icon:   '🏋️',
//       successTitle: '💪 Gym Verified!',
//       successSub:   'Time to train! Alarm dismissed!',
//     }
//   },
// };

// /* ---- State ---- */
// const state = {
//   alarm:        null,       // { hour, minute, label, profile, timestamp }
//   selectedProfile: 'home',  // default profile
//   intervalId:   null,
//   checkId:      null,
//   countdownId:  null,
//   ringingStart: null,
//   currentStep:  0,          // 0=selfie, 1=step2
//   cameraStream: null,
//   facingMode:   'user',
//   capturedBlob: null,
//   audioCtx:     null,
//   alarmPlaying: false,
// };

// /* ---- Picker ---- */
// let pickerHour = 22;
// let pickerMin  = 0;

// /* =======================================
//    INIT
// ======================================= */
// function init() {
//   loadAlarmFromStorage();
//   startClock();
//   renderPicker();
//   renderProfiles();
//   updateActiveBar();
//   requestNotifPermission();
//   attachSwipeListeners();
// }

// function startClock() {
//   function tick() {
//     const now = new Date();
//     const h   = String(now.getHours()).padStart(2,'0');
//     const m   = String(now.getMinutes()).padStart(2,'0');
//     document.getElementById('live-time').textContent = `${h}:${m}`;
//     document.getElementById('live-date').textContent = now.toLocaleDateString('en-US', {
//       weekday:'long', month:'short', day:'numeric'
//     });
//   }
//   tick();
//   state.intervalId = setInterval(tick, 1000);
// }

// /* =======================================
//    PROFILE SELECTOR
// ======================================= */
// function renderProfiles() {
//   const container = document.getElementById('profile-selector');
//   if (!container) return;
//   container.innerHTML = '';

//   Object.values(CHALLENGE_PROFILES).forEach(profile => {
//     const btn = document.createElement('button');
//     btn.className = 'profile-btn' + (profile.id === state.selectedProfile ? ' active' : '');
//     btn.setAttribute('data-id', profile.id);
//     btn.innerHTML = `
//       <span class="profile-icon">${profile.icon}</span>
//       <span class="profile-label">${profile.label}</span>
//       <span class="profile-desc">${profile.desc}</span>
//     `;
//     btn.onclick = () => selectProfile(profile.id);
//     container.appendChild(btn);
//   });

//   updateStep2Preview();
// }

// function selectProfile(id) {
//   state.selectedProfile = id;
//   document.querySelectorAll('.profile-btn').forEach(btn => {
//     btn.classList.toggle('active', btn.getAttribute('data-id') === id);
//   });
//   updateStep2Preview();
// }

// function updateStep2Preview() {
//   const profile = CHALLENGE_PROFILES[state.selectedProfile];
//   const el = document.getElementById('step2-preview');
//   if (el && profile) {
//     el.innerHTML = `
//       <span class="step2-icon">${profile.step2.icon}</span>
//       <span class="step2-text">Step 2: ${profile.step2.title}</span>
//     `;
//   }
// }

// /* =======================================
//    PERSISTENCE
// ======================================= */
// function saveAlarmToStorage() {
//   if (state.alarm) {
//     localStorage.setItem('wakeproof_alarm', JSON.stringify(state.alarm));
//   } else {
//     localStorage.removeItem('wakeproof_alarm');
//   }
// }

// function loadAlarmFromStorage() {
//   const raw = localStorage.getItem('wakeproof_alarm');
//   if (raw) {
//     try {
//       state.alarm = JSON.parse(raw);
//       if (state.alarm.profile) state.selectedProfile = state.alarm.profile;
//       startAlarmCheck();
//     } catch(e) {
//       localStorage.removeItem('wakeproof_alarm');
//     }
//   }
// }

// /* =======================================
//    PICKER
// ======================================= */
// function renderPicker() {
//   document.getElementById('hour-display').textContent = String(pickerHour).padStart(2,'0');
//   document.getElementById('min-display').textContent  = String(pickerMin).padStart(2,'0');
// }

// function changeHour(delta) {
//   pickerHour = (pickerHour + delta + 24) % 24;
//   renderPicker();
// }

// function changeMin(delta) {
//   pickerMin = (pickerMin + delta + 60) % 60;
//   renderPicker();
// }

// function attachSwipeListeners() {
//   function addSwipe(el, onUp, onDown) {
//     let startY = null;
//     el.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
//     el.addEventListener('touchend', e => {
//       if (startY === null) return;
//       const dy = startY - e.changedTouches[0].clientY;
//       if (Math.abs(dy) > 15) { dy > 0 ? onUp() : onDown(); }
//       startY = null;
//     }, { passive: true });
//   }
//   const hEl = document.getElementById('hour-display');
//   const mEl = document.getElementById('min-display');
//   if (hEl) addSwipe(hEl, () => changeHour(1), () => changeHour(-1));
//   if (mEl) addSwipe(mEl, () => changeMin(1),  () => changeMin(-1));
// }

// /* =======================================
//    SET / CANCEL ALARM
// ======================================= */
// function setAlarm() {
//   if (state.alarm) { showModal('modal-existing'); return; }

//   const label   = document.getElementById('alarm-label').value.trim() || 'Wake up!';
//   const now     = new Date();
//   const alarmDt = new Date();
//   alarmDt.setHours(pickerHour, pickerMin, 0, 0);
//   if (alarmDt <= now) alarmDt.setDate(alarmDt.getDate() + 1);

//   state.alarm = {
//     hour:      pickerHour,
//     minute:    pickerMin,
//     label,
//     profile:   state.selectedProfile,
//     timestamp: alarmDt.getTime(),
//   };

//   saveAlarmToStorage();
//   scheduleNotification(alarmDt, label);
//   startAlarmCheck();
//   updateActiveBar();

//   const profile = CHALLENGE_PROFILES[state.selectedProfile];
//   showToast(`Alarm set for ${String(pickerHour).padStart(2,'0')}:${String(pickerMin).padStart(2,'0')} ${profile.icon}`);
// }

// function cancelAlarm() {
//   clearInterval(state.checkId);
//   clearInterval(state.countdownId);
//   state.alarm = null;
//   saveAlarmToStorage();
//   updateActiveBar();
//   showToast('Alarm cancelled');
// }

// function updateActiveBar() {
//   const bar = document.getElementById('active-alarm-bar');
//   if (!state.alarm) { bar.classList.add('hidden'); return; }

//   bar.classList.remove('hidden');

//   const profile = CHALLENGE_PROFILES[state.alarm.profile] || CHALLENGE_PROFILES.home;
//   document.getElementById('active-alarm-time-display').textContent =
//     `${String(state.alarm.hour).padStart(2,'0')}:${String(state.alarm.minute).padStart(2,'0')}`;
//   document.getElementById('active-alarm-label-display').textContent =
//     `${profile.icon} ${state.alarm.label}`;

//   updateCountdown();
//   clearInterval(state.countdownId);
//   state.countdownId = setInterval(updateCountdown, 30000);
// }

// function updateCountdown() {
//   if (!state.alarm) return;
//   const diff = state.alarm.timestamp - Date.now();
//   if (diff <= 0) { document.getElementById('active-countdown').textContent = 'Ringing now'; return; }
//   const h = Math.floor(diff / 3600000);
//   const m = Math.floor((diff % 3600000) / 60000);
//   document.getElementById('active-countdown').textContent = `in ${h}h ${m}m`;
// }

// /* =======================================
//    ALARM CHECK
// ======================================= */
// function startAlarmCheck() {
//   clearInterval(state.checkId);
//   state.checkId = setInterval(checkAlarmTrigger, 10000);
//   checkAlarmTrigger();
// }

// function checkAlarmTrigger() {
//   if (!state.alarm) return;
//   if (Date.now() >= state.alarm.timestamp) triggerAlarm();
// }

// /* =======================================
//    TRIGGER ALARM
// ======================================= */
// function triggerAlarm() {
//   clearInterval(state.checkId);
//   clearInterval(state.countdownId);

//   state.ringingStart = Date.now();
//   state.currentStep  = 0;

//   const profile = CHALLENGE_PROFILES[state.alarm.profile] || CHALLENGE_PROFILES.home;
//   const timeStr = `${String(state.alarm.hour).padStart(2,'0')}:${String(state.alarm.minute).padStart(2,'0')}`;

//   document.getElementById('ringing-time-display').textContent = timeStr;
//   document.getElementById('ringing-label-display').textContent = `${profile.icon}  ${state.alarm.label}`;
//   document.getElementById('btn-challenge').textContent = '📸 Take Selfie to Stop Alarm';
//   document.getElementById('challenge-desc').textContent = 'Step 1 of 2: Take a selfie to prove you\'re awake';

//   // Render step 2 badge on ringing screen
//   const step2Badge = document.getElementById('step2-badge');
//   if (step2Badge) {
//     step2Badge.textContent = `Then: ${profile.step2.icon}  ${profile.step2.title}`;
//   }

//   updateProgressDots(0);
//   startAlarmSound();
//   showScreen('screen-ringing');

//   if ('vibrate' in navigator) navigator.vibrate([500,300,500,300,500,300,500]);
//   requestWakeLock();
// }

// /* =======================================
//    ALARM SOUND
// ======================================= */
// function startAlarmSound() {
//   if (state.alarmPlaying) return;
//   try {
//     state.audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
//     state.alarmPlaying = true;
//     playAlarmLoop();
//   } catch(e) { console.warn('Audio error:', e); }
// }

// function playAlarmLoop() {
//   if (!state.alarmPlaying || !state.audioCtx) return;
//   const ctx   = state.audioCtx;
//   const tones = [880, 1100, 1320];
//   let t = ctx.currentTime;
//   tones.forEach((freq, i) => {
//     const osc  = ctx.createOscillator();
//     const gain = ctx.createGain();
//     osc.connect(gain); gain.connect(ctx.destination);
//     osc.type = 'square';
//     osc.frequency.setValueAtTime(freq, t + i * 0.2);
//     gain.gain.setValueAtTime(0, t + i * 0.2);
//     gain.gain.linearRampToValueAtTime(0.15, t + i * 0.2 + 0.02);
//     gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.18);
//     osc.start(t + i * 0.2); osc.stop(t + i * 0.2 + 0.2);
//   });
//   state._soundTimer = setTimeout(() => { if (state.alarmPlaying) playAlarmLoop(); }, 1200);
// }

// function stopAlarmSound() {
//   state.alarmPlaying = false;
//   clearTimeout(state._soundTimer);
//   if (state.audioCtx) {
//     try { state.audioCtx.close(); } catch(e){}
//     state.audioCtx = null;
//   }
//   if ('vibrate' in navigator) navigator.vibrate(0);
// }

// /* =======================================
//    WAKE LOCK
// ======================================= */
// let wakeLock = null;
// async function requestWakeLock() {
//   if ('wakeLock' in navigator) {
//     try { wakeLock = await navigator.wakeLock.request('screen'); } catch(e){}
//   }
// }
// function releaseWakeLock() {
//   if (wakeLock) { try { wakeLock.release(); } catch(e){} wakeLock = null; }
// }

// /* =======================================
//    CHALLENGE FLOW
// ======================================= */
// function startChallenge() {
//   if (state.currentStep === 0) {
//     // Step 1: selfie — always front camera
//     state.facingMode = 'user';
//     openCamera({ step: 0 });
//   } else {
//     // Step 2: profile-specific — rear camera
//     state.facingMode = 'environment';
//     openCamera({ step: 1 });
//   }
// }

// function updateProgressDots(step) {
//   const dot1 = document.getElementById('dot-1');
//   const dot2 = document.getElementById('dot-2');
//   if (step === 0) {
//     dot1.className = 'prog-dot active'; dot1.textContent = '1';
//     dot2.className = 'prog-dot';        dot2.textContent = '2';
//   } else {
//     dot1.className = 'prog-dot done';   dot1.textContent = '✓';
//     dot2.className = 'prog-dot active'; dot2.textContent = '2';
//   }
// }

// /* =======================================
//    CAMERA
// ======================================= */
// async function openCamera({ step }) {
//   showScreen('screen-camera');

//   const profile = CHALLENGE_PROFILES[(state.alarm && state.alarm.profile) || state.selectedProfile] || CHALLENGE_PROFILES.home;

//   let title, hint;
//   if (step === 0) {
//     title = 'Take a Selfie';
//     hint  = 'Position your face in the oval and tap capture';
//   } else {
//     title = profile.step2.title;
//     hint  = profile.step2.hint;
//   }

//   document.getElementById('camera-title').textContent = title;
//   document.getElementById('camera-hint').textContent  = hint;

//   const guide = document.getElementById('face-guide');
//   if (step === 1) {
//     guide.classList.add('sink-mode');
//   } else {
//     guide.classList.remove('sink-mode');
//   }

//   const video = document.getElementById('camera-video');
//   video.style.transform = (step === 0) ? 'scaleX(-1)' : 'none';

//   document.getElementById('capture-section').classList.remove('hidden');
//   document.getElementById('preview-section').classList.add('hidden');

//   await startCameraStream();
// }

// async function startCameraStream() {
//   stopCameraStream();
//   try {
//     const constraints = {
//       video: { facingMode: { ideal: state.facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
//       audio: false,
//     };
//     state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
//     document.getElementById('camera-video').srcObject = state.cameraStream;
//   } catch(err) {
//     console.error('Camera error:', err);
//     stopCameraStream();
//     showScreen(state.alarmPlaying ? 'screen-ringing' : 'screen-home');
//     showModal('modal-perm');
//   }
// }

// function stopCameraStream() {
//   if (state.cameraStream) {
//     state.cameraStream.getTracks().forEach(t => t.stop());
//     state.cameraStream = null;
//   }
//   const vid = document.getElementById('camera-video');
//   if (vid) vid.srcObject = null;
// }

// async function flipCamera() {
//   state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
//   const video = document.getElementById('camera-video');
//   video.style.transform = state.facingMode === 'user' ? 'scaleX(-1)' : 'none';
//   await startCameraStream();
// }

// function capturePhoto() {
//   const video  = document.getElementById('camera-video');
//   const canvas = document.getElementById('camera-canvas');
//   canvas.width  = video.videoWidth  || 640;
//   canvas.height = video.videoHeight || 480;

//   const ctx = canvas.getContext('2d');
//   if (state.facingMode === 'user') {
//     ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
//   }
//   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//   const flash = document.getElementById('camera-flash');
//   flash.classList.remove('hidden');
//   setTimeout(() => flash.classList.add('hidden'), 300);

//   const dataURL = canvas.toDataURL('image/jpeg', 0.85);
//   document.getElementById('capture-preview').src = dataURL;
//   document.getElementById('capture-section').classList.add('hidden');
//   document.getElementById('preview-section').classList.remove('hidden');
//   state.capturedBlob = dataURL;
// }

// function retakePhoto() {
//   document.getElementById('capture-section').classList.remove('hidden');
//   document.getElementById('preview-section').classList.add('hidden');
//   state.capturedBlob = null;
// }

// function confirmPhoto() {
//   stopCameraStream();

//   const profile = CHALLENGE_PROFILES[(state.alarm && state.alarm.profile) || state.selectedProfile] || CHALLENGE_PROFILES.home;

//   if (state.currentStep === 0) {
//     // Selfie done — show success, then move to step 2
//     showSuccessStep(
//       '🤳 Selfie Verified!',
//       `Great! Now complete Step 2: ${profile.step2.icon} ${profile.step2.title}`,
//       false
//     );
//     state.currentStep = 1;
//   } else {
//     // Step 2 done — alarm fully dismissed
//     showSuccessStep(
//       profile.step2.successTitle,
//       profile.step2.successSub,
//       true
//     );
//     state.currentStep = 2;
//   }
// }

// function closeCameraCancel() {
//   stopCameraStream();
//   showScreen(state.alarmPlaying ? 'screen-ringing' : 'screen-home');
// }

// /* =======================================
//    SUCCESS SCREEN
// ======================================= */
// function showSuccessStep(title, subtitle, isFinal) {
//   document.getElementById('success-title').textContent    = title;
//   document.getElementById('success-subtitle').textContent = subtitle;
//   document.getElementById('btn-next').textContent = isFinal ? '🎉 I\'m Fully Awake!' : 'Continue →';
//   showScreen('screen-success');
// }

// function proceedToNextChallenge() {
//   if (state.currentStep === 1) {
//     // Show ringing screen with step 2 challenge
//     const profile = CHALLENGE_PROFILES[(state.alarm && state.alarm.profile) || state.selectedProfile] || CHALLENGE_PROFILES.home;
//     updateProgressDots(1);
//     document.getElementById('btn-challenge').textContent  = profile.step2.btn;
//     document.getElementById('challenge-desc').textContent = `Step 2 of 2: ${profile.step2.title}`;
//     showScreen('screen-ringing');
//   } else if (state.currentStep === 2) {
//     dismissAlarmFully();
//   }
// }

// /* =======================================
//    DISMISS
// ======================================= */
// function dismissAlarmFully() {
//   stopAlarmSound();
//   releaseWakeLock();
//   const elapsed = Math.round((Date.now() - state.ringingStart) / 60000);
//   document.getElementById('stat-challenges').textContent = '2';
//   document.getElementById('stat-time').textContent       = `${elapsed}m`;
//   state.alarm = null;
//   saveAlarmToStorage();
//   showScreen('screen-done');
// }

// /* =======================================
//    PERMANENT OFF
// ======================================= */
// function permanentOff() { showModal('modal-perm-off'); }

// function confirmPermanentOff() {
//   closeModal('modal-perm-off');
//   stopAlarmSound();
//   releaseWakeLock();
//   cancelAlarm();
//   showScreen('screen-home');
//   showToast('Alarm permanently turned off');
// }

// /* =======================================
//    NOTIFICATIONS
// ======================================= */
// function requestNotifPermission() {
//   if ('Notification' in window && Notification.permission === 'default') {
//     Notification.requestPermission();
//   }
// }

// function scheduleNotification(alarmDate, label) {
//   if (!('Notification' in window) || Notification.permission !== 'granted') return;
//   const delay = alarmDate.getTime() - Date.now();
//   if (delay > 0) {
//     setTimeout(() => {
//       new Notification('⏰ WakeProof', {
//         body:    `${label} — Time to wake up!`,
//         icon:    'assets/icon-192.png',
//         requireInteraction: true,
//       });
//     }, delay);
//   }
// }

// /* =======================================
//    SCREEN ROUTING
// ======================================= */
// function showScreen(id) {
//   document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
//   const target = document.getElementById(id);
//   if (target) target.classList.add('active');
//   window.scrollTo(0, 0);
// }

// function goHome() {
//   showScreen('screen-home');
//   updateActiveBar();
// }

// /* =======================================
//    MODALS & TOAST
// ======================================= */
// function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
// function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// let _toastTimer = null;
// function showToast(msg) {
//   const el = document.getElementById('toast');
//   el.textContent = msg;
//   el.classList.remove('hidden');
//   clearTimeout(_toastTimer);
//   _toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
// }

// /* =======================================
//    SERVICE WORKER
// ======================================= */
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW failed:', e));
//   });
// }

// /* =======================================
//    BOOT
// ======================================= */
// window.addEventListener('DOMContentLoaded', init);


/* =============================================
   WakeProof — App Logic v3
   Fixes:
   1. Permanent OFF is truly disabled while ringing
   2. Sound starts immediately on alarm trigger (user gesture workaround)
   3. AI photo verification via Claude Vision API
============================================= */

'use strict';

/* =======================================
   CHALLENGE PROFILES
======================================= */
const CHALLENGE_PROFILES = {
  home: {
    id: 'home', label: 'Home', icon: '🏠', desc: 'Sink / bathroom area',
    step2: {
      title: 'Photo of Your Sink',
      hint:  'Point at your sink or bathroom area where you brush your teeth',
      btn:   '🚿 Sink Photo to Finish',
      icon:  '🦷',
      successTitle: '🦷 Sink Verified!',
      successSub:   'You made it to the bathroom. Alarm dismissed!',
      aiPrompt: 'Does this photo clearly show a bathroom sink, tap, toothbrush, toothpaste, or bathroom/toilet area? Reply with JSON only: {"pass": true/false, "reason": "short reason"}',
    }
  },
  office: {
    id: 'office', label: 'Office', icon: '🏢', desc: 'Desk, keyboard or office window',
    step2: {
      title: 'Photo of Your Desk / Office',
      hint:  'Point at your desk, keyboard, monitor, or an office window',
      btn:   '💼 Desk Photo to Finish',
      icon:  '💻',
      successTitle: '💼 Desk Verified!',
      successSub:   'You\'re at your desk. Alarm dismissed!',
      aiPrompt: 'Does this photo clearly show an office desk, computer, keyboard, monitor, office chair, or office environment? Reply with JSON only: {"pass": true/false, "reason": "short reason"}',
    }
  },
  travel: {
    id: 'travel', label: 'Travel', icon: '✈️', desc: 'Hotel room, window or street view',
    step2: {
      title: 'Photo of Your Surroundings',
      hint:  'Take a photo of a window view, hotel room, or outdoor surroundings',
      btn:   '🌍 Location Photo to Finish',
      icon:  '🗺️',
      successTitle: '🌍 Location Verified!',
      successSub:   'Safe travels. Alarm dismissed!',
      aiPrompt: 'Does this photo show a travel environment such as a hotel room, window view, outdoor street, airport, or unfamiliar surroundings that suggest the person is travelling or away from home? Reply with JSON only: {"pass": true/false, "reason": "short reason"}',
    }
  },
  gym: {
    id: 'gym', label: 'Gym', icon: '🏋️', desc: 'Equipment, weights or gym floor',
    step2: {
      title: 'Photo of Gym Equipment',
      hint:  'Point at any gym equipment, weights, treadmill, or gym floor',
      btn:   '💪 Gym Photo to Finish',
      icon:  '🏋️',
      successTitle: '💪 Gym Verified!',
      successSub:   'Time to train! Alarm dismissed!',
      aiPrompt: 'Does this photo clearly show gym equipment, weights, dumbbells, barbells, treadmill, exercise machines, or a gym environment? Reply with JSON only: {"pass": true/false, "reason": "short reason"}',
    }
  },
};

/* ---- State ---- */
const state = {
  alarm:           null,
  selectedProfile: 'home',
  intervalId:      null,
  checkId:         null,
  countdownId:     null,
  ringingStart:    null,
  currentStep:     0,
  cameraStream:    null,
  facingMode:      'user',
  capturedDataURL: null,
  audioCtx:        null,
  alarmPlaying:    false,
  audioUnlocked:   false,   // FIX #2: track if audio context is unlocked
  isRinging:       false,   // FIX #1: track ringing state
  verifying:       false,   // FIX #3: AI verification in progress
};

let pickerHour = 22;
let pickerMin  = 0;

/* =======================================
   FIX #2 — AUDIO UNLOCK ON FIRST TAP
   Browsers block AudioContext until user gesture.
   We create & unlock it on the very first tap anywhere.
======================================= */
function unlockAudio() {
  if (state.audioUnlocked) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Play a silent buffer to unlock
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    ctx.resume().then(() => {
      state.audioUnlocked = true;
      ctx.close();
    });
  } catch(e) {}
}

document.addEventListener('touchstart', unlockAudio, { once: false, passive: true });
document.addEventListener('click', unlockAudio, { once: false, passive: true });

/* =======================================
   INIT
======================================= */
function init() {
  loadAlarmFromStorage();
  startClock();
  renderPicker();
  renderProfiles();
  updateActiveBar();
  requestNotifPermission();
  attachSwipeListeners();
}

function startClock() {
  function tick() {
    const now = new Date();
    document.getElementById('live-time').textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    document.getElementById('live-date').textContent = now.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
  }
  tick();
  state.intervalId = setInterval(tick, 1000);
}

/* =======================================
   PROFILE SELECTOR
======================================= */
function renderProfiles() {
  const container = document.getElementById('profile-selector');
  if (!container) return;
  container.innerHTML = '';
  Object.values(CHALLENGE_PROFILES).forEach(profile => {
    const btn = document.createElement('button');
    btn.className = 'profile-btn' + (profile.id === state.selectedProfile ? ' active' : '');
    btn.setAttribute('data-id', profile.id);
    btn.innerHTML = `<span class="profile-icon">${profile.icon}</span><span class="profile-label">${profile.label}</span><span class="profile-desc">${profile.desc}</span>`;
    btn.onclick = () => selectProfile(profile.id);
    container.appendChild(btn);
  });
  updateStep2Preview();
}

function selectProfile(id) {
  state.selectedProfile = id;
  document.querySelectorAll('.profile-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-id') === id);
  });
  updateStep2Preview();
}

function updateStep2Preview() {
  const profile = CHALLENGE_PROFILES[state.selectedProfile];
  const el = document.getElementById('step2-preview');
  if (el && profile) {
    el.innerHTML = `<span class="step2-icon">${profile.step2.icon}</span><span class="step2-text">Step 2: ${profile.step2.title}</span>`;
  }
}

/* =======================================
   PERSISTENCE
======================================= */
function saveAlarmToStorage() {
  if (state.alarm) {
    localStorage.setItem('wakeproof_alarm', JSON.stringify(state.alarm));
  } else {
    localStorage.removeItem('wakeproof_alarm');
  }
}

function loadAlarmFromStorage() {
  const raw = localStorage.getItem('wakeproof_alarm');
  if (raw) {
    try {
      state.alarm = JSON.parse(raw);
      if (state.alarm.profile) state.selectedProfile = state.alarm.profile;
      startAlarmCheck();
    } catch(e) { localStorage.removeItem('wakeproof_alarm'); }
  }
}

/* =======================================
   PICKER
======================================= */
function renderPicker() {
  document.getElementById('hour-display').textContent = String(pickerHour).padStart(2,'0');
  document.getElementById('min-display').textContent  = String(pickerMin).padStart(2,'0');
}
function changeHour(delta) { pickerHour = (pickerHour + delta + 24) % 24; renderPicker(); }
function changeMin(delta)  { pickerMin  = (pickerMin  + delta + 60) % 60; renderPicker(); }

function attachSwipeListeners() {
  function addSwipe(el, onUp, onDown) {
    let startY = null;
    el.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend',   e => {
      if (startY === null) return;
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 15) { dy > 0 ? onUp() : onDown(); }
      startY = null;
    }, { passive: true });
  }
  const hEl = document.getElementById('hour-display');
  const mEl = document.getElementById('min-display');
  if (hEl) addSwipe(hEl, () => changeHour(1), () => changeHour(-1));
  if (mEl) addSwipe(mEl, () => changeMin(1),  () => changeMin(-1));
}

/* =======================================
   SET / CANCEL ALARM
======================================= */
function setAlarm() {
  if (state.alarm) { showModal('modal-existing'); return; }
  const label   = document.getElementById('alarm-label').value.trim() || 'Wake up!';
  const now     = new Date();
  const alarmDt = new Date();
  alarmDt.setHours(pickerHour, pickerMin, 0, 0);
  if (alarmDt <= now) alarmDt.setDate(alarmDt.getDate() + 1);

  state.alarm = { hour: pickerHour, minute: pickerMin, label, profile: state.selectedProfile, timestamp: alarmDt.getTime() };
  saveAlarmToStorage();
  scheduleNotification(alarmDt, label);
  startAlarmCheck();
  updateActiveBar();
  const profile = CHALLENGE_PROFILES[state.selectedProfile];
  showToast(`Alarm set for ${String(pickerHour).padStart(2,'0')}:${String(pickerMin).padStart(2,'0')} ${profile.icon}`);
}

function cancelAlarm() {
  clearInterval(state.checkId);
  clearInterval(state.countdownId);
  state.alarm = null;
  saveAlarmToStorage();
  updateActiveBar();
  showToast('Alarm cancelled');
}

function updateActiveBar() {
  const bar = document.getElementById('active-alarm-bar');
  if (!state.alarm) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  const profile = CHALLENGE_PROFILES[state.alarm.profile] || CHALLENGE_PROFILES.home;
  document.getElementById('active-alarm-time-display').textContent =
    `${String(state.alarm.hour).padStart(2,'0')}:${String(state.alarm.minute).padStart(2,'0')}`;
  document.getElementById('active-alarm-label-display').textContent = `${profile.icon} ${state.alarm.label}`;
  updateCountdown();
  clearInterval(state.countdownId);
  state.countdownId = setInterval(updateCountdown, 30000);
}

function updateCountdown() {
  if (!state.alarm) return;
  const diff = state.alarm.timestamp - Date.now();
  if (diff <= 0) { document.getElementById('active-countdown').textContent = 'Ringing now'; return; }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  document.getElementById('active-countdown').textContent = `in ${h}h ${m}m`;
}

/* =======================================
   ALARM CHECK
======================================= */
function startAlarmCheck() {
  clearInterval(state.checkId);
  state.checkId = setInterval(checkAlarmTrigger, 10000);
  checkAlarmTrigger();
}

function checkAlarmTrigger() {
  if (!state.alarm) return;
  if (Date.now() >= state.alarm.timestamp) triggerAlarm();
}

/* =======================================
   TRIGGER ALARM
======================================= */
function triggerAlarm() {
  clearInterval(state.checkId);
  clearInterval(state.countdownId);

  state.ringingStart = Date.now();
  state.currentStep  = 0;
  state.isRinging    = true;  // FIX #1

  const profile = CHALLENGE_PROFILES[state.alarm.profile] || CHALLENGE_PROFILES.home;
  const timeStr = `${String(state.alarm.hour).padStart(2,'0')}:${String(state.alarm.minute).padStart(2,'0')}`;

  document.getElementById('ringing-time-display').textContent  = timeStr;
  document.getElementById('ringing-label-display').textContent = `${profile.icon}  ${state.alarm.label}`;
  document.getElementById('btn-challenge').textContent         = '📸 Take Selfie to Stop Alarm';
  document.getElementById('challenge-desc').textContent        = 'Step 1 of 2: Take a selfie to prove you\'re awake';

  const step2Badge = document.getElementById('step2-badge');
  if (step2Badge) step2Badge.textContent = `Then: ${profile.step2.icon}  ${profile.step2.title}`;

  // FIX #1: Hide permanent off button completely while ringing
  setPermanentOffVisibility(false);

  updateProgressDots(0);
  startAlarmSound();
  showScreen('screen-ringing');

  if ('vibrate' in navigator) navigator.vibrate([500,300,500,300,500,300,500]);
  requestWakeLock();
}

/* =======================================
   FIX #1 — PERMANENT OFF BUTTON CONTROL
   Only visible when NOT ringing
======================================= */
function setPermanentOffVisibility(visible) {
  const btn = document.getElementById('btn-perm-off');
  if (!btn) return;
  if (visible) {
    btn.classList.remove('hidden');
    btn.disabled = false;
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
  } else {
    // Completely disable — hidden, no pointer events, no click
    btn.classList.add('hidden');
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0';
  }
}

/* =======================================
   FIX #2 — ALARM SOUND
   Uses resumed AudioContext + oscillator approach
   that works reliably even with browser autoplay blocks
======================================= */
function startAlarmSound() {
  if (state.alarmPlaying) return;
  try {
    state.audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
    state.alarmPlaying = true;
    // Resume immediately (works because triggerAlarm is called from setInterval which itself
    // started after a user gesture set the alarm — audio context will be in running state)
    state.audioCtx.resume().then(() => {
      if (state.alarmPlaying) playAlarmLoop();
    });
  } catch(e) { console.warn('Audio error:', e); }
}

function playAlarmLoop() {
  if (!state.alarmPlaying || !state.audioCtx) return;
  const ctx   = state.audioCtx;
  const tones = [880, 1100, 1320, 1100];
  let t = ctx.currentTime + 0.05;

  tones.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0,    t + i * 0.22);
    gain.gain.linearRampToValueAtTime(0.18, t + i * 0.22 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.20);
    osc.start(t + i * 0.22);
    osc.stop( t + i * 0.22 + 0.22);
  });

  state._soundTimer = setTimeout(() => {
    if (state.alarmPlaying) playAlarmLoop();
  }, 1400);
}

function stopAlarmSound() {
  state.alarmPlaying = false;
  clearTimeout(state._soundTimer);
  if (state.audioCtx) {
    try { state.audioCtx.close(); } catch(e){}
    state.audioCtx = null;
  }
  if ('vibrate' in navigator) navigator.vibrate(0);
}

/* =======================================
   WAKE LOCK
======================================= */
let wakeLock = null;
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch(e){}
  }
}
function releaseWakeLock() {
  if (wakeLock) { try { wakeLock.release(); } catch(e){} wakeLock = null; }
}

/* =======================================
   CHALLENGE FLOW
======================================= */
function startChallenge() {
  if (state.currentStep === 0) {
    state.facingMode = 'user';
    openCamera({ step: 0 });
  } else {
    state.facingMode = 'environment';
    openCamera({ step: 1 });
  }
}

function updateProgressDots(step) {
  const dot1 = document.getElementById('dot-1');
  const dot2 = document.getElementById('dot-2');
  if (step === 0) {
    dot1.className = 'prog-dot active'; dot1.textContent = '1';
    dot2.className = 'prog-dot';        dot2.textContent = '2';
  } else {
    dot1.className = 'prog-dot done';   dot1.textContent = '✓';
    dot2.className = 'prog-dot active'; dot2.textContent = '2';
  }
}

/* =======================================
   CAMERA
======================================= */
async function openCamera({ step }) {
  showScreen('screen-camera');
  const profile = CHALLENGE_PROFILES[(state.alarm && state.alarm.profile) || state.selectedProfile] || CHALLENGE_PROFILES.home;

  let title, hint;
  if (step === 0) {
    title = 'Take a Selfie';
    hint  = 'Open eyes, good lighting, face clearly visible in the oval';
  } else {
    title = profile.step2.title;
    hint  = profile.step2.hint;
  }

  document.getElementById('camera-title').textContent = title;
  document.getElementById('camera-hint').textContent  = hint;

  const guide = document.getElementById('face-guide');
  guide.classList.toggle('sink-mode', step === 1);

  document.getElementById('camera-video').style.transform = (step === 0) ? 'scaleX(-1)' : 'none';
  document.getElementById('capture-section').classList.remove('hidden');
  document.getElementById('preview-section').classList.add('hidden');
  document.getElementById('verify-status').classList.add('hidden');

  await startCameraStream();
}

async function startCameraStream() {
  stopCameraStream();
  try {
    const constraints = {
      video: { facingMode: { ideal: state.facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    };
    state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    document.getElementById('camera-video').srcObject = state.cameraStream;
  } catch(err) {
    stopCameraStream();
    showScreen(state.isRinging ? 'screen-ringing' : 'screen-home');
    showModal('modal-perm');
  }
}

function stopCameraStream() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
  const vid = document.getElementById('camera-video');
  if (vid) vid.srcObject = null;
}

async function flipCamera() {
  state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
  document.getElementById('camera-video').style.transform = state.facingMode === 'user' ? 'scaleX(-1)' : 'none';
  await startCameraStream();
}

function capturePhoto() {
  const video  = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  if (state.facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const flash = document.getElementById('camera-flash');
  flash.classList.remove('hidden');
  setTimeout(() => flash.classList.add('hidden'), 300);

  state.capturedDataURL = canvas.toDataURL('image/jpeg', 0.85);
  document.getElementById('capture-preview').src = state.capturedDataURL;
  document.getElementById('capture-section').classList.add('hidden');
  document.getElementById('preview-section').classList.remove('hidden');
  document.getElementById('verify-status').classList.add('hidden');
}

function retakePhoto() {
  document.getElementById('capture-section').classList.remove('hidden');
  document.getElementById('preview-section').classList.add('hidden');
  document.getElementById('verify-status').classList.add('hidden');
  state.capturedDataURL = null;
}

/* =======================================
   FIX #3 — AI PHOTO VERIFICATION
======================================= */
async function confirmPhoto() {
  if (!state.capturedDataURL || state.verifying) return;

  const profile = CHALLENGE_PROFILES[(state.alarm && state.alarm.profile) || state.selectedProfile] || CHALLENGE_PROFILES.home;
  const isStep0 = state.currentStep === 0;

  // Build the AI prompt for this step
  let aiPrompt;
  if (isStep0) {
    aiPrompt = 'Is there a clearly visible human face in this photo with eyes that appear open? The photo should show a real person awake with their face clearly lit and visible. Reply with JSON only: {"pass": true/false, "reason": "short reason under 10 words"}';
  } else {
    aiPrompt = profile.step2.aiPrompt;
  }

  // Show verifying state
  state.verifying = true;
  const verifyEl = document.getElementById('verify-status');
  verifyEl.className = 'verify-status verifying';
  verifyEl.innerHTML = '<span class="verify-spinner">⏳</span> Verifying photo with AI...';
  verifyEl.classList.remove('hidden');

  // Disable confirm button during verification
  const confirmBtn = document.getElementById('btn-confirm-photo');
  if (confirmBtn) confirmBtn.disabled = true;

  try {
    const base64 = state.capturedDataURL.split(',')[1];
    const result = await verifyPhotoWithAI(base64, aiPrompt);

    if (result.pass) {
      // PASSED
      verifyEl.className = 'verify-status pass';
      verifyEl.innerHTML = `<span>✅</span> Verified! Proceeding...`;

      // Short delay so user sees the green tick, then advance
      setTimeout(() => {
        stopCameraStream();
        state.verifying = false;
        advanceAfterVerification(isStep0, profile);
      }, 900);

    } else {
      // FAILED — show reason, let them retake
      verifyEl.className = 'verify-status fail';
      verifyEl.innerHTML = `<span>❌</span> ${result.reason || 'Photo not accepted. Please retake.'}`;
      state.verifying = false;
      if (confirmBtn) confirmBtn.disabled = false;
    }

  } catch(err) {
    // Network/API error — fail open so alarm can still be dismissed
    console.error('AI verify error:', err);
    verifyEl.className = 'verify-status pass';
    verifyEl.innerHTML = '<span>⚠️</span> Could not verify — accepting photo.';
    setTimeout(() => {
      stopCameraStream();
      state.verifying = false;
      advanceAfterVerification(isStep0, profile);
    }, 1200);
  }
}

async function verifyPhotoWithAI(base64jpeg, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64jpeg },
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const data = await response.json();
  const text = data.content?.[0]?.text || '{}';

  // Strip any markdown fences
  const clean = text.replace(/```json|```/gi, '').trim();
  return JSON.parse(clean);
}

function advanceAfterVerification(isStep0, profile) {
  if (isStep0) {
    showSuccessStep('🤳 Selfie Verified!', `You\'re awake! Now: ${profile.step2.icon} ${profile.step2.title}`, false);
    state.currentStep = 1;
  } else {
    showSuccessStep(profile.step2.successTitle, profile.step2.successSub, true);
    state.currentStep = 2;
  }
}

function closeCameraCancel() {
  stopCameraStream();
  state.verifying = false;
  showScreen(state.isRinging ? 'screen-ringing' : 'screen-home');
}

/* =======================================
   SUCCESS SCREEN
======================================= */
function showSuccessStep(title, subtitle, isFinal) {
  document.getElementById('success-title').textContent    = title;
  document.getElementById('success-subtitle').textContent = subtitle;
  document.getElementById('btn-next').textContent = isFinal ? '🎉 I\'m Fully Awake!' : 'Continue →';
  showScreen('screen-success');
}

function proceedToNextChallenge() {
  if (state.currentStep === 1) {
    const profile = CHALLENGE_PROFILES[(state.alarm && state.alarm.profile) || state.selectedProfile] || CHALLENGE_PROFILES.home;
    updateProgressDots(1);
    document.getElementById('btn-challenge').textContent  = profile.step2.btn;
    document.getElementById('challenge-desc').textContent = `Step 2 of 2: ${profile.step2.title}`;
    showScreen('screen-ringing');
  } else if (state.currentStep === 2) {
    dismissAlarmFully();
  }
}

/* =======================================
   DISMISS
======================================= */
function dismissAlarmFully() {
  stopAlarmSound();
  releaseWakeLock();
  state.isRinging = false;  // FIX #1
  const elapsed = Math.round((Date.now() - state.ringingStart) / 60000);
  document.getElementById('stat-challenges').textContent = '2';
  document.getElementById('stat-time').textContent       = `${elapsed}m`;
  state.alarm = null;
  saveAlarmToStorage();
  showScreen('screen-done');
}

/* =======================================
   FIX #1 — PERMANENT OFF (only when NOT ringing)
======================================= */
function permanentOff() {
  if (state.isRinging) return; // extra guard — should never reach here
  showModal('modal-perm-off');
}

function confirmPermanentOff() {
  closeModal('modal-perm-off');
  stopAlarmSound();
  releaseWakeLock();
  state.isRinging = false;
  cancelAlarm();
  showScreen('screen-home');
  showToast('Alarm permanently turned off');
}

/* =======================================
   NOTIFICATIONS
======================================= */
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}

function scheduleNotification(alarmDate, label) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const delay = alarmDate.getTime() - Date.now();
  if (delay > 0) {
    setTimeout(() => {
      new Notification('⏰ WakeProof', { body: `${label} — Time to wake up!`, icon: 'assets/icon-192.png', requireInteraction: true });
    }, delay);
  }
}

/* =======================================
   SCREEN ROUTING
======================================= */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() {
  state.isRinging = false;
  // Show permanent off only when not ringing (i.e. going home means alarm done/cancelled)
  setPermanentOffVisibility(false);
  showScreen('screen-home');
  updateActiveBar();
}

/* =======================================
   MODALS & TOAST
======================================= */
function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

/* =======================================
   SERVICE WORKER
======================================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW failed:', e));
  });
}

window.addEventListener('DOMContentLoaded', init);
