// Pomodoro Timer with Mood Lighting and Focus White Noise

const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const skipBtn = document.getElementById("skip-btn");
const backBtn = document.getElementById("back-btn");
const moodBg = document.getElementById("mood-bg");
const sessionType = document.getElementById("session-type");
const subjectName = document.getElementById("subject-name");
const sessionsCount = document.getElementById("sessions-count");
const soundToggle = document.getElementById("sound-toggle");
const soundPanel = document.getElementById("sound-panel");
const soundType = document.getElementById("sound-type");
const soundVolume = document.getElementById("sound-volume");
const workDurationInput = document.getElementById("work-duration");
const breakDurationInput = document.getElementById("break-duration");
const notificationsCheckbox = document.getElementById("notifications-enabled");

let timeRemaining = 25 * 60; // Current timer in seconds
let totalTime = 25 * 60; // Initial session duration
let isRunning = false;
let isWorkSession = true; // true = work, false = break
let sessionsCompleted = 0;
let timerInterval = null;
let audioContext = null;
let oscillators = [];
let gainNodes = [];

// Get subject from URL or session storage
const subject = new URLSearchParams(window.location.search).get("subject") || "Study";
subjectName.textContent = subject;

// White noise generation
const initAudioContext = () => {
  if (audioContext) return;
  
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create white noise
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }
  
  window.noiseBuffer = noiseBuffer;
};

const playWhiteNoise = (type) => {
  if (!audioContext) initAudioContext();
  
  // Stop existing noise
  stopWhiteNoise();
  
  if (type === "none") return;
  
  const volume = parseInt(soundVolume.value) / 100;
  
  // Create white noise source
  const source = audioContext.createBufferSource();
  source.buffer = window.noiseBuffer;
  source.loop = true;
  
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume * 0.3; // Reduce base volume for comfort
  
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start();
  
  // Add frequency modulation for different "vibes"
  const modGain = audioContext.createGain();
  const modOsc = audioContext.createOscillator();
  
  switch (type) {
    case "rain":
      modOsc.frequency.value = 0.5; // Subtle modulation
      break;
    case "forest":
      modOsc.frequency.value = 0.3;
      break;
    case "ocean":
      modOsc.frequency.value = 0.2;
      break;
    case "coffee":
      modOsc.frequency.value = 0.8;
      break;
  }
  
  modOsc.connect(modGain);
  modGain.connect(gainNode.gain);
  modGain.gain.value = 0.1;
  modOsc.start();
  
  window.currentAudioSource = source;
  window.currentModOsc = modOsc;
};

const stopWhiteNoise = () => {
  if (window.currentAudioSource) {
    window.currentAudioSource.stop();
    window.currentModOsc.stop();
    window.currentAudioSource = null;
    window.currentModOsc = null;
  }
};

const updateMoodLighting = () => {
  moodBg.classList.remove("focus", "break", "warning", "pulse-warning");
  
  const lastMinute = timeRemaining < 60 && isWorkSession;
  
  if (isWorkSession) {
    moodBg.classList.add("focus");
    if (lastMinute) {
      moodBg.classList.add("pulse-warning");
    }
  } else {
    moodBg.classList.add("break");
  }
};

const updateDisplay = () => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  
  // Update session type
  if (isWorkSession) {
    sessionType.textContent = `${Math.ceil((totalTime - timeRemaining) / 60)}:00 elapsed • Work session`;
  } else {
    sessionType.textContent = `${Math.ceil((totalTime - timeRemaining) / 60)}:00 elapsed • Break time`;
  }
  
  updateMoodLighting();
};

const completeSession = () => {
  isRunning = false;
  stopWhiteNoise();
  
  if (isWorkSession) {
    sessionsCompleted++;
    sessionsCount.textContent = sessionsCompleted;
    moodBg.classList.add("complete");
    
    // Show notification
    if (notificationsCheckbox.checked && Notification.permission === "granted") {
      new Notification("Session complete! 🎉", {
        body: `Great work on ${subject}! Take a break.`,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>✓</text></svg>"
      });
    }
    
    // Auto-start break
    setTimeout(() => {
      isWorkSession = false;
      timeRemaining = parseInt(breakDurationInput.value) * 60;
      totalTime = timeRemaining;
      updateDisplay();
      startSession();
    }, 2000);
  } else {
    moodBg.classList.add("focus");
    
    if (notificationsCheckbox.checked && Notification.permission === "granted") {
      new Notification("Break over! 💪", {
        body: "Ready for another work session?",
      });
    }
    
    // Reset to work mode
    setTimeout(() => {
      isWorkSession = true;
      timeRemaining = parseInt(workDurationInput.value) * 60;
      totalTime = timeRemaining;
      updateDisplay();
    }, 2000);
  }
  
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  skipBtn.textContent = isWorkSession ? "Skip" : "Next";
};

const startSession = () => {
  if (isRunning) return;
  
  isRunning = true;
  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  
  // Start white noise
  playWhiteNoise(soundType.value);
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateDisplay();
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      completeSession();
    }
  }, 1000);
};

const pauseSession = () => {
  isRunning = false;
  clearInterval(timerInterval);
  stopWhiteNoise();
  
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  startBtn.textContent = "Resume";
};

const skipSession = () => {
  clearInterval(timerInterval);
  stopWhiteNoise();
  isRunning = false;
  
  isWorkSession = !isWorkSession;
  timeRemaining = parseInt(
    isWorkSession ? workDurationInput.value : breakDurationInput.value
  ) * 60;
  totalTime = timeRemaining;
  updateDisplay();
  
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  startBtn.textContent = "Start session";
};

// Event Listeners
startBtn.addEventListener("click", startSession);
pauseBtn.addEventListener("click", pauseSession);
skipBtn.addEventListener("click", skipSession);

backBtn.addEventListener("click", () => {
  window.history.back();
});

soundToggle.addEventListener("click", () => {
  soundPanel.classList.toggle("hidden");
});

soundType.addEventListener("change", () => {
  if (isRunning) {
    playWhiteNoise(soundType.value);
  }
});

soundVolume.addEventListener("input", () => {
  if (window.currentAudioSource && audioContext) {
    const volume = parseInt(soundVolume.value) / 100;
    // Note: We'd need to track gainNode to update volume
    // This is a simplified version
  }
});

workDurationInput.addEventListener("change", () => {
  if (!isRunning && isWorkSession) {
    timeRemaining = parseInt(workDurationInput.value) * 60;
    totalTime = timeRemaining;
    updateDisplay();
  }
});

breakDurationInput.addEventListener("change", () => {
  if (!isRunning && !isWorkSession) {
    timeRemaining = parseInt(breakDurationInput.value) * 60;
    totalTime = timeRemaining;
    updateDisplay();
  }
});

// Request notification permissions
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// Initialize display
updateDisplay();
