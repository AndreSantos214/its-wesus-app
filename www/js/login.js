/* ═══════════════════════════════════════════════════════
   login.js — It's Wesus Portal do Investidor
   Vanilla JS | ES6+ | Capacitor-ready | Supabase Integrated
════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── CONFIGURAÇÃO E INICIALIZAÇÃO DO SUPABASE ── */
  const SUPABASE_URL = "https://eolpgnlfxgmramzckxvo.supabase.co";

  // 🔑 COLA AQUI a tua "Publishable key" (anon) que vimos na tela anterior do teu Supabase
  const SUPABASE_ANON_KEY = "sb_publishable_vg-yRQt4yHm0ps1FPeh8LA_O9fruoFv";

  // Inicializa o cliente usando o objeto global injetado pelo CDN
  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  );

  /* ── Controle de Orientação Inteligente (Capacitor) ── */
  if (window.Capacitor && window.Capacitor.Plugins.ScreenOrientation) {
    const { ScreenOrientation } = window.Capacitor.Plugins;

    if (window.innerWidth < 820) {
      ScreenOrientation.lock({ orientation: "portrait" }).catch((err) =>
        console.log("Rotação já trancada ou não suportada no browser."),
      );
    } else {
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

  /* ── INTEGRALIZAÇÃO REAL COM AUTENTICAÇÃO SUPABASE ── */
  async function authenticate(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      // Customização amigável para mensagens de erro comuns de produção
      if (error.message === "Invalid login credentials") {
        throw new Error(
          "Credenciais inválidas. Verifique o seu e-mail e palavra-passe.",
        );
      }
      throw new Error(error.message);
    }

    // Retorna a sessão ativa contendo o token JWT unificado
    return data;
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

      sessionStorage.setItem("wesus_token", result.session.access_token);
      sessionStorage.setItem("wesus_user", JSON.stringify(result.user));

      await offerBiometricActivation(
        emailInput.value.trim(),
        passwordInput.value,
      );

      executePremiumRedirect();
    } catch (err) {
      setLoading(false);
      showFieldError(
        formError,
        err.message || "Erro inesperado. Tente novamente.",
      );

      // Feedback háptico visual (efeito shake) no formulário em caso de falha
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

  /* ── Page entrance ── */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.body.classList.add("fonts-loaded");
    });
  }

  async function offerBiometricActivation(email, password) {
    if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return;

    const { NativeBiometric } = window.Capacitor.Plugins;

    const available = await NativeBiometric.isAvailable();
    if (!available.isAvailable) return;

    const alreadyAsked = localStorage.getItem("wesus_biometric_prompted");

    if (alreadyAsked === "true") return;

    const wantsBiometric = confirm(
      "Deseja ativar Face ID / biometria para entrar mais rápido neste dispositivo?",
    );

    localStorage.setItem("wesus_biometric_prompted", "true");

    if (!wantsBiometric) return;

    try {
      await NativeBiometric.verifyIdentity({
        reason: "Ativar acesso biométrico ao Portal Wesus",
        title: "Portal Wesus",
        subtitle: "Ativar Face ID / Biometria",
        description: "Confirme a sua identidade para ativar o acesso rápido.",
        fallbackTitle: "Usar código",
      });

      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: "itswesus.com",
      });
    } catch (err) {
      console.log("Ativação biométrica cancelada ou falhou:", err);
    }
  }

  /* ── Motor de Biometria (Capacitor) ── */
  async function initBiometricEngine() {
    const biometricBtn = document.getElementById("biometricBtn");

    if (!biometricBtn) return;
    if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) return;

    const { NativeBiometric } = window.Capacitor.Plugins;

    const available = await NativeBiometric.isAvailable();
    if (!available.isAvailable) return;

    try {
      await NativeBiometric.getCredentials({
        server: "itswesus.com",
      });

      biometricBtn.classList.remove("hidden");
    } catch {
      biometricBtn.classList.add("hidden");
    }

    const verifyUser = async () => {
      try {
        await NativeBiometric.verifyIdentity({
          reason: "Aceda à sua conta",
          title: "Portal Wesus",
          subtitle: "Validação biométrica",
          description: "Use o seu sensor/face ID",
          fallbackTitle: "Usar Senha",
        });

        const credentials = await NativeBiometric.getCredentials({
          server: "itswesus.com",
        });

        const result = await authenticate(
          credentials.username,
          credentials.password,
        );

        sessionStorage.setItem("wesus_token", result.session.access_token);
        sessionStorage.setItem("wesus_user", JSON.stringify(result.user));

        executePremiumRedirect();
      } catch (e) {
        console.log("Biometria cancelada ou erro:", e);

        const message = String(e?.message || e || "").toLowerCase();

        if (
          message.includes("invalid login credentials") ||
          message.includes("credenciais inválidas")
        ) {
          try {
            await NativeBiometric.deleteCredentials({
              server: "itswesus.com",
            });

            localStorage.removeItem("wesus_biometric_prompted");
            biometricBtn.classList.add("hidden");

            showFieldError(
              formError,
              "A sua senha foi alterada. Faça login manualmente para reativar a biometria neste dispositivo.",
            );
          } catch (deleteErr) {
            console.log(
              "Não foi possível limpar a biometria antiga:",
              deleteErr,
            );
          }
        }
      }
    };

    biometricBtn.addEventListener("click", verifyUser);
  }

  // Biometria temporariamente desativada no iOS para investigar crash de arranque
  if (
    !(
      window.Capacitor &&
      window.Capacitor.getPlatform &&
      window.Capacitor.getPlatform() === "ios"
    )
  ) {
    initBiometricEngine();
  }
})();

/* ── Lógica Nativa Mobile (Fundo + Teclado + Rotação Inteligente) ──────────────────────────── */
let lastWidth = window.innerWidth;

function updateBackgroundHeights() {
  const actualHeight = window.innerHeight;
  const actualWidth = window.innerWidth;
  const buffer = 120;
  const safeHeight = actualHeight + buffer;
  const offsetTop = -(buffer / 2);

  const mainWrapper = document.getElementById("main-wrapper");
  if (mainWrapper) {
    mainWrapper.style.height = `${actualHeight}px`;
  }

  const mobileBgWrapper = document.querySelector(
    '.lg\\:hidden > img[src*="casa-background-mobile"]',
  )?.parentElement;
  if (mobileBgWrapper) {
    mobileBgWrapper.style.height = `${safeHeight}px`;
    mobileBgWrapper.style.top = `${offsetTop}px`;
    mobileBgWrapper.style.position = "absolute";
  }

  const desktopBgImg = document.querySelector(
    '.lg\\:block > img[src*="casa-background-desktop"]',
  );
  if (desktopBgImg && desktopBgImg.parentElement) {
    desktopBgImg.parentElement.style.height = `${safeHeight}px`;
    desktopBgImg.parentElement.style.top = `${offsetTop}px`;
    desktopBgImg.parentElement.style.position = "fixed";
  }

  const desktopGradientWrapper = document.querySelector(
    ".lg\\:block.w-\\[60\\%\\]",
  );
  if (desktopGradientWrapper) {
    desktopGradientWrapper.style.height = `${safeHeight}px`;
    desktopGradientWrapper.style.top = `${offsetTop}px`;
    desktopGradientWrapper.style.position = "fixed";
  }

  lastWidth = actualWidth;
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.AndroidInterface && window.AndroidInterface.setSystemBarsColor) {
    window.AndroidInterface.setSystemBarsColor("#0b1f3a", false);
  }

  updateBackgroundHeights();

  window.addEventListener("resize", () => {
    if (window.innerWidth !== lastWidth) {
      setTimeout(updateBackgroundHeights, 150);
    }
  });

  document.addEventListener(
    "touchmove",
    function (e) {
      if (document.body.classList.contains("keyboard-open")) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

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
  const curtain = document.createElement("div");
  curtain.style.position = "fixed";
  curtain.style.inset = "0";
  curtain.style.backgroundColor = "#0B1F3A";
  curtain.style.zIndex = "99999";
  curtain.style.display = "flex";
  curtain.style.justifyContent = "center";
  curtain.style.alignItems = "center";
  curtain.style.opacity = "0";
  curtain.style.transition = "opacity 0.28s cubic-bezier(0.25, 1, 0.5, 1)";

  const logo = document.createElement("img");
  logo.src = "img/transition-logo.webp";
  logo.style.width = "100%";
  logo.style.maxWidth = "clamp(160px, 25vw, 420px)";
  logo.style.height = "auto";
  logo.style.opacity = "0";
  logo.style.transform = "scale(0.94)";
  logo.style.transition =
    "opacity 0.2s ease-out, transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)";

  curtain.appendChild(logo);
  document.body.appendChild(curtain);

  void curtain.offsetHeight;

  curtain.style.opacity = "1";
  setTimeout(() => {
    logo.style.opacity = "0.8";
    logo.style.transform = "scale(1)";
  }, 30);

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 380);
}
