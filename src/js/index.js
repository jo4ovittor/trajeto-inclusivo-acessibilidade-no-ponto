// === Dados das linhas ===
const schedules = [
  {
    id: "1",
    routeNumber: "203",
    routeName: "Jardim Noiva da Colina",
    times: [
      { departure: "05:25" }, { departure: "06:00" }, { departure: "06:30" }, { departure: "07:00" },
      { departure: "07:30" }, { departure: "08:00" }, { departure: "08:30" }, { departure: "09:00" },
      { departure: "09:30" }, { departure: "10:00" }, { departure: "10:30" }, { departure: "11:00" },
      { departure: "11:30" }, { departure: "12:00" }, { departure: "12:30" }, { departure: "13:00" },
      { departure: "13:30" }, { departure: "14:00" }, { departure: "14:30" }, { departure: "15:00" },
      { departure: "15:30" }, { departure: "16:00" }, { departure: "16:30" }, { departure: "17:00" },
      { departure: "17:30" }, { departure: "18:00" }, { departure: "18:30" }, { departure: "19:00" },
      { departure: "19:30" }, { departure: "20:00" }, { departure: "20:30" }, { departure: "21:00" },
      { departure: "21:30" }, { departure: "22:00" }, { departure: "22:30" },
    ],
  },
  {
    id: "2",
    routeNumber: "246",
    routeName: "Hospital Unimed / TCI / TPI",
    times: [
      { departure: "05:18" }, { departure: "06:13" }, { departure: "07:35" }, { departure: "09:00" },
      { departure: "10:02" }, { departure: "12:10" }, { departure: "13:10" }, { departure: "14:10" },
      { departure: "15:20" }, { departure: "16:27" }, { departure: "17:37" }, { departure: "18:45" },
    ],
  },
];

// === Atualiza a data ===
document.getElementById("updateDate").textContent = new Date().toLocaleDateString("pt-BR");

// === Utilitários ===
function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getNextTimeToday(times) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const t of times) if (timeToMinutes(t.departure) > nowMinutes) return t;
  return null;
}

// === Fala ===
function speakMessage(text) {
  if ("speechSynthesis" in window) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "pt-BR";
    msg.rate = 1.0;
    window.speechSynthesis.speak(msg);
  }
}

// === Beep ===
function playBeep() {
  const beep = new Audio("src/audio/beep.mp3");
  beep.play().catch(() => console.log("Beep bloqueado pelo navegador até interação do usuário."));
}

// === Renderiza linhas ===
function renderSchedules() {
  const list = document.getElementById("scheduleList");
  const term = document.getElementById("searchInput").value.toLowerCase();
  list.innerHTML = "";

  const filtered = schedules.filter(
    (s) =>
      s.routeNumber.toLowerCase().includes(term) ||
      s.routeName.toLowerCase().includes(term)
  );

  if (filtered.length === 0) {
    list.innerHTML = `<p style="text-align:center;color:#777;">Nenhuma linha encontrada.</p>`;
    return [];
  }

  filtered.forEach((item) => {
    const next = getNextTimeToday(item.times);
    const div = document.createElement("div");
    div.className = "schedule-item";
    div.innerHTML = `
      <div class="route-info">
        <span class="route-number">${item.routeNumber}</span>
        <span class="route-name">${item.routeName}</span>
      </div>
      <div class="times-group">
        <strong>Próximo horário:</strong>
        <span class="time-list">${next ? next.departure : "Fim do dia"}</span>
      </div>
    `;
    list.appendChild(div);
  });

  return filtered;
}

// === Reconhecimento de voz unificado (com beep e audiodescrição) ===
function startVoiceRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Seu navegador não suporta reconhecimento de voz.");
    return;
  }

  playBeep(); // 🔊 toca antes de escutar

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;

  const overlayBtn = document.getElementById("startVoiceBtn");
  overlayBtn.style.background = "#28a745"; // verde = escutando

  recognition.onstart = () => {
    console.log("🎙️ Escutando...");
  };

  recognition.onresult = (event) => {
    let transcript = event.results[0][0].transcript.trim();
    transcript = transcript.replace(/[.,;!?]+$/, "");
    document.getElementById("searchInput").value = transcript;

    const result = renderSchedules();

    if (result.length > 0) {
      const line = result[0];
      const next = getNextTimeToday(line.times);
      const nextText = next ? `Próximo horário às ${next.departure}.` : "Não há mais horários hoje.";
      speakMessage(`Linha ${line.routeNumber}, ${line.routeName}. ${nextText}`);

      // Fecha overlay
      const overlay = document.getElementById("voiceOverlay");
      overlay.classList.add("fade-out");
      setTimeout(() => (overlay.style.display = "none"), 800);
      window.lineFound = true;
    } else {
      window.lineFound = false;
      speakMessage("Nenhuma linha encontrada. Tente novamente.");
    }
  };

  recognition.onerror = () => {
    overlayBtn.style.background = "#007bff";
    speakMessage("Erro ao reconhecer a fala. Tente novamente.");
  };

  recognition.onend = () => {
    overlayBtn.style.background = "#007bff";
    if (!window.lineFound) {
      setTimeout(() => startVoiceRecognition(), 3000);
    }
  };

  recognition.start();
}

// === Inicialização ===
window.addEventListener("load", () => {
  renderSchedules();

  window.currentSpeech = null;
  function speakMessageControlled(message) {
    if (window.currentSpeech) speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "pt-BR";
    window.currentSpeech = utterance;
    speechSynthesis.speak(utterance);
    return utterance;
  }

  setTimeout(() => {
    window.currentSpeech = speakMessageControlled(
      "Bem vindo ao trajeto inclusivo. Clique na tela para ativar o áudio e diga o número ou o nome da linha que deseja."
    );
  }, 1000);

  const overlay = document.getElementById("voiceOverlay");
  overlay.style.display = "flex";

  overlay.addEventListener("click", () => {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    startVoiceRecognition();
    window.hasActivatedVoice = true;
  });

  setTimeout(() => {
    if (!window.hasActivatedVoice) {
      speakMessageControlled(
        "Clique na tela e diga o número ou o nome da linha que deseja."
      );
    }
  }, 20000);
});
