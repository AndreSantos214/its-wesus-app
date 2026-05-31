/* ═══════════════════════════════════════════════════════
   login.js — It's Wesus Portal do Investidor
   Vanilla JS | ES6+ | Capacitor-ready
════════════════════════════════════════════════════════ */

(function () {
  "use strict";
  /* ── Controle de Orientação Inteligente (Capacitor) ── */
  if (window.Capacitor && window.Capacitor.Plugins.ScreenOrientation) {
    const { ScreenOrientation } = window.Capacitor.Plugins;

    // Se a largura for menor que 820px (nosso breakpoint de tablet), tranca na vertical.
    if (window.innerWidth < 820) {
      ScreenOrientation.lock({ orientation: "portrait" }).catch((err) =>
        console.log("Rotação já trancada ou não suportada no browser."),
      );
    } else {
      // Se for tablet ou desktop, destranca para permitir girar.
      ScreenOrientation.unlock().catch((err) => console.log(err));
    }
  }

  /* ── DOM refs ─────────────────────────────────────── */
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const eyeBtn = document.getElementById("eyeBtn");
  const eyeOpen = document.getElementById("eyeOpen");
  const eyeClosed = document.getElementById("eyeClosed");
  const loginBtn = document.getElementById("loginBtn");
  const btnLabel = document.getElementById("btnLabel");
  const btnSpinner = document.getElementById("btnSpinner");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const formError = document.getElementById("formError");

  /* ── State ────────────────────────────────────────── */
  let passwordVisible = false;
  let isLoading = false;

  /* ── Utils ────────────────────────────────────────── */
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  function showFieldError(el, msg) {
    el.classList.remove("hidden");
    el.textContent = msg;
  }
  function clearFieldError(el) {
    el.classList.add("hidden");
    el.textContent = "";
  }
  function clearAllErrors() {
    clearFieldError(emailError);
    clearFieldError(passwordError);
    clearFieldError(formError);
  }

  /* ── Eye / password toggle ────────────────────────── */
  eyeBtn.addEventListener("click", () => {
    passwordVisible = !passwordVisible;
    passwordInput.type = passwordVisible ? "text" : "password";
    eyeOpen.classList.toggle("hidden", passwordVisible);
    eyeClosed.classList.toggle("hidden", !passwordVisible);
    eyeBtn.setAttribute(
      "aria-label",
      passwordVisible ? "Ocultar palavra-passe" : "Mostrar palavra-passe",
    );
    // Keep focus on input after toggling
    passwordInput.focus();
  });

  /* ── Live input validation (on blur) ─────────────── */
  emailInput.addEventListener("blur", () => {
    if (emailInput.value && !isValidEmail(emailInput.value)) {
      showFieldError(emailError, "Introduza um endereço de e-mail válido.");
    } else {
      clearFieldError(emailError);
    }
  });
  emailInput.addEventListener("input", () => {
    if (!emailError.classList.contains("hidden")) clearFieldError(emailError);
    clearFieldError(formError);
  });
  passwordInput.addEventListener("input", () => {
    if (!passwordError.classList.contains("hidden"))
      clearFieldError(passwordError);
    clearFieldError(formError);
  });

  /* ── Loading state helpers ────────────────────────── */
  function setLoading(state) {
    isLoading = state;
    loginBtn.disabled = state;
    btnLabel.classList.toggle("hidden", state);
    btnSpinner.classList.toggle("hidden", !state);
    loginBtn.style.opacity = state ? "0.8" : "1";
  }

  /* ── Form validation ──────────────────────────────── */
  function validate() {
    let valid = true;
    clearAllErrors();

    if (!emailInput.value.trim()) {
      showFieldError(emailError, "O e-mail é obrigatório.");
      valid = false;
    } else if (!isValidEmail(emailInput.value)) {
      showFieldError(emailError, "Introduza um endereço de e-mail válido.");
      valid = false;
    }

    if (!passwordInput.value) {
      showFieldError(passwordError, "A palavra-passe é obrigatória.");
      valid = false;
    } else if (passwordInput.value.length < 6) {
      showFieldError(
        passwordError,
        "A palavra-passe deve ter pelo menos 6 caracteres.",
      );
      valid = false;
    }

    return valid;
  }

  /* ── Simulated authentication (replace with real API) */
  async function authenticate(email, password) {
    // Simulate network delay (replace with fetch/axios call)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Demo: any @wesus.com email + any 8+ char password succeeds
        if (email.endsWith("@wesus.com") && password.length >= 8) {
          resolve({ token: "demo-jwt-token", user: { email } });
        } else {
          reject(
            new Error(
              "Credenciais inválidas. Verifique o seu e-mail e palavra-passe.",
            ),
          );
        }
      }, 1600);
    });
  }

  /* ── Submit handler ───────────────────────────────── */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;

    setLoading(true);

    try {
      const result = await authenticate(
        emailInput.value.trim(),
        passwordInput.value,
      );

      // Sucesso — Guarda o estado e chama a transição com logo
      sessionStorage.setItem("wesus_token", result.token);
      sessionStorage.setItem("wesus_user", JSON.stringify(result.user));

      // CHAMADA DA TRANSIÇÃO PREMIUM
      executePremiumRedirect();
    } catch (err) {
      setLoading(false);
      showFieldError(
        formError,
        err.message || "Erro inesperado. Tente novamente.",
      );

      // Shake animation on the form card
      const card = form;
      card.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-8px)" },
          { transform: "translateX(8px)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 400, easing: "ease-out" },
      );
    }
  });

  /* ── Page entrance: ensure fonts are loaded before animating ── */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.body.classList.add("fonts-loaded");
    });
  }

  /* ── Motor de Biometria (Capacitor) ── */
  async function initBiometricEngine() {
    const biometricBtn = document.getElementById("biometricBtn");
    if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return;

    const { NativeBiometric } = window.Capacitor.Plugins;

    // Verifica disponibilidade
    const available = await NativeBiometric.isAvailable();
    if (!available.isAvailable) return;

    // Mostra o botão apenas se biometria disponível
    biometricBtn.classList.remove("hidden");

    const verifyUser = async () => {
      try {
        await NativeBiometric.verifyIdentity({
          reason: "Aceda à sua conta",
          title: "Portal Wesus",
          subtitle: "Validação biométrica",
          description: "Use o seu sensor/face ID",
          fallbackTitle: "Usar Senha",
        });

        // Sucesso: Define o token e dispara a transição corrigida
        sessionStorage.setItem("wesus_token", "biometric-token-verified");

        // CHAMADA DA TRANSIÇÃO PREMIUM (Adeus ecrã colado!)
        executePremiumRedirect();
      } catch (e) {
        console.log("Biometria cancelada ou erro:", e);
      }
    };

    biometricBtn.addEventListener("click", verifyUser);
  }

  // Inicializa ao carregar
  initBiometricEngine();
})();

/* ── Lógica Nativa Mobile (Fundo + Teclado + Rotação) ──────────────────────────── */

/* ── Lógica Nativa Mobile (Fundo + Teclado + Rotação Inteligente) ──────────────────────────── */

// Guardamos a largura inicial do ecrã para monitorizar a rotação real
let lastWidth = window.innerWidth;

function updateBackgroundHeights() {
  const actualHeight = window.innerHeight;
  const actualWidth = window.innerWidth;

  // ── MARGEM DE ERRO REFORÇADA (De 60px para 120px) ──
  // Isto cria uma "sangria" generosa nas bordas. A imagem estende-se 60px para cima
  // e 60px para baixo além do limite visível do ecrã, blindando o layout a 100%.
  const buffer = 120;
  const safeHeight = actualHeight + buffer;
  const offsetTop = -(buffer / 2); // Centraliza a imagem verticalmente (-60px)

  // 1. Trancar o wrapper principal estritamente na altura física do ecrã
  const mainWrapper = document.getElementById("main-wrapper");
  if (mainWrapper) {
    mainWrapper.style.height = `${actualHeight}px`;
  }

  // 2. Fundo Mobile (Garante a sobreposição segura nas bordas)
  const mobileBgWrapper = document.querySelector(
    '.lg\\:hidden > img[src*="casa-background-mobile"]',
  )?.parentElement;
  if (mobileBgWrapper) {
    mobileBgWrapper.style.height = `${safeHeight}px`;
    mobileBgWrapper.style.top = `${offsetTop}px`;
    mobileBgWrapper.style.position = "absolute";
  }

  // 3. Fundo Desktop/Tablet
  const desktopBgImg = document.querySelector(
    '.lg\\:block > img[src*="casa-background-desktop"]',
  );
  if (desktopBgImg && desktopBgImg.parentElement) {
    desktopBgImg.parentElement.style.height = `${safeHeight}px`;
    desktopBgImg.parentElement.style.top = `${offsetTop}px`;
    desktopBgImg.parentElement.style.position = "fixed";
  }

  // 4. Gradiente Desktop/Tablet
  const desktopGradientWrapper = document.querySelector(
    ".lg\\:block.w-\\[60\\%\\]",
  );
  if (desktopGradientWrapper) {
    desktopGradientWrapper.style.height = `${safeHeight}px`;
    desktopGradientWrapper.style.top = `${offsetTop}px`;
    desktopGradientWrapper.style.position = "fixed";
  }

  // Atualizar o estado da largura após o cálculo
  lastWidth = actualWidth;
}

document.addEventListener("DOMContentLoaded", () => {
  /* ── Sincronização de Cores Nativas ── */
  if (window.AndroidInterface && window.AndroidInterface.setSystemBarsColor) {
    window.AndroidInterface.setSystemBarsColor("#0b1f3a", false);
  }

  // Execução inicial ao abrir a aplicação
  updateBackgroundHeights();

  /* ── O DETETOR DE ROTAÇÃO INFALÍVEL ── */
  // No ecossistema mobile, o evento 'resize' dispara quando o teclado abre.
  // NO ENTANTO, o teclado altera apenas a altura (innerHeight), NUNCA a largura (innerWidth).
  // Se a largura mudou, significa com 100% de certeza que o Tablet rodou.
  window.addEventListener("resize", () => {
    if (window.innerWidth !== lastWidth) {
      // Um pequeno timeout de 150ms dá espaço para a WebView processar a nova orientação física
      setTimeout(updateBackgroundHeights, 150);
    }
  });

  /* ── Bloqueio de overscroll ── */
  document.addEventListener(
    "touchmove",
    function (e) {
      if (document.body.classList.contains("keyboard-open")) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  /* ── Listeners de Teclado do Capacitor ── */
  if (window.Capacitor && window.Capacitor.Plugins.Keyboard) {
    const { Keyboard } = window.Capacitor.Plugins;

    Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("keyboard-open");
    });

    Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("keyboard-open");
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  /* ── Sincronização de Cores Nativas (Via Java Bridge) ── */
  if (window.AndroidInterface && window.AndroidInterface.setSystemBarsColor) {
    // Cor: #0b1f3a (Teu azul Wesus)
    // isDark: false (Passamos false porque o nosso tema é Escuro, e o código Java inverte a lógica para botões brancos)
    window.AndroidInterface.setSystemBarsColor("#0b1f3a", false);
  }
  // 2. Executa o cálculo inicial quando a app abre
  updateBackgroundHeights();

  // 3. O DETETOR DE ROTAÇÃO DA TELA
  // Usamos orientationchange em vez de 'resize' para que não dispare quando o teclado abre
  window.addEventListener("orientationchange", () => {
    // Um pequeno timeout (150ms) é crucial em WebViews (Capacitor/Ionic)
    // porque o sistema operativo demora uma fração de segundo a atualizar
    // os valores do window.innerHeight depois do dispositivo girar fisicamente.
    setTimeout(updateBackgroundHeights, 150);
    // Fallback de segurança para aparelhos mais lentos
    setTimeout(updateBackgroundHeights, 500);
  });

  // 4. Bloqueio absoluto do movimento da tela (overscroll)
  document.addEventListener(
    "touchmove",
    function (e) {
      if (document.body.classList.contains("keyboard-open")) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  // 5. Escutar o teclado do Capacitor para ativar as animações visuais
  if (window.Capacitor && window.Capacitor.Plugins.Keyboard) {
    const { Keyboard } = window.Capacitor.Plugins;

    Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("keyboard-open");
    });

    Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("keyboard-open");
    });
  }
});

function executePremiumRedirect() {
  // 1. Cria o contentor da cortina (Flexbox absoluto sobreposto)
  const curtain = document.createElement("div");
  curtain.style.position = "fixed";
  curtain.style.inset = "0";
  curtain.style.backgroundColor = "#0B1F3A"; // O teu azul Wesus absoluto
  curtain.style.zIndex = "99999";
  curtain.style.display = "flex";
  curtain.style.justifyContent = "center";
  curtain.style.alignItems = "center";
  curtain.style.opacity = "0";
  curtain.style.transition = "opacity 0.28s cubic-bezier(0.25, 1, 0.5, 1)";

  // 2. Injeta a logo de forma elegante e responsiva
  const logo = document.createElement("img");
  logo.src = "img/transition-logo.webp";

  // 🔥 SOLUÇÃO SÉNIOR: Layout Fluido Baseado na Largura do Ecrã
  logo.style.width = "100%";
  // No mobile: garante um tamanho mínimo de 160px.
  // No ecrã intermédio: ocupa 25% da largura total da janela (25vw).
  // No desktop grande: estabiliza num tamanho imponente de 420px.
  logo.style.maxWidth = "clamp(160px, 25vw, 420px)";

  logo.style.height = "auto";
  logo.style.opacity = "0";
  logo.style.transform = "scale(0.94)";
  logo.style.transition =
    "opacity 0.2s ease-out, transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)";

  curtain.appendChild(logo);
  document.body.appendChild(curtain);

  // 3. Força o reflow do DOM para garantir aceleração por GPU
  void curtain.offsetHeight;

  // 4. Ativa a entrada suave da cortina e o "flash" controlado da logo
  curtain.style.opacity = "1";
  setTimeout(() => {
    logo.style.opacity = "0.8"; // Brilho acetinado premium
    logo.style.transform = "scale(1)";
  }, 30);

  // 5. Redirecionamento no Sweet Spot de tempo
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 380);
}
