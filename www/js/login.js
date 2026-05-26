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

  /* ── Submit handler ───────────────────────────────── */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isLoading) return;

    // Mantido apenas para testar o comportamento visual da validação local
    if (!validate()) {
      // Shake animation se a validação falhar
      form.animate(
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
      return;
    }

    setLoading(true);

    // Sucesso direto — define dados dummy para testes no dashboard
    sessionStorage.setItem("wesus_token", "token-de-teste-temporario");
    sessionStorage.setItem(
      "wesus_user",
      JSON.stringify({ email: emailInput.value.trim() }),
    );

    // Executa a animação suave de saída antes de redirecionar
    document.body.style.transition = "opacity 0.4s ease";
    document.body.style.opacity = "0";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 400);
  });

  /* ── Page entrance: ensure fonts are loaded before animating ── */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.body.classList.add("fonts-loaded");
    });
  }
})();

/* ── Lógica Nativa Mobile (Fundo + Teclado + Rotação) ──────────────────────────── */

function updateBackgroundHeights() {
  const marginOfError = 100;
  const safeHeight = window.innerHeight + marginOfError;

  // Fundo Mobile
  const mobileBgWrapper = document.querySelector(
    '.lg\\:hidden > img[src*="casa-background-mobile"]',
  )?.parentElement;
  if (mobileBgWrapper) {
    mobileBgWrapper.style.height = `${safeHeight}px`;
    mobileBgWrapper.style.position = "absolute";
  }

  // Fundo Desktop/Tablet
  const desktopBgImg = document.querySelector(
    '.lg\\:block > img[src*="casa-background-desktop"]',
  );
  if (desktopBgImg && desktopBgImg.parentElement) {
    desktopBgImg.parentElement.style.height = `${safeHeight}px`;
    desktopBgImg.parentElement.style.position = "fixed";
  }

  // Gradiente Desktop/Tablet
  const desktopGradientWrapper = document.querySelector(
    ".lg\\:block.w-\\[60\\%\\]",
  );
  if (desktopGradientWrapper) {
    desktopGradientWrapper.style.height = `${safeHeight}px`;
    desktopGradientWrapper.style.position = "fixed";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateBackgroundHeights();

  window.addEventListener("orientationchange", () => {
    setTimeout(updateBackgroundHeights, 150);
    setTimeout(updateBackgroundHeights, 500);
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
