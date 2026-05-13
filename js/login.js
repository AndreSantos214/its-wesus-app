/* ═══════════════════════════════════════════════════════
   login.js — It's Wesus Portal do Investidor
   Vanilla JS | ES6+ | Capacitor-ready
════════════════════════════════════════════════════════ */

(function () {
  "use strict";

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

      // Success — store token & redirect
      sessionStorage.setItem("wesus_token", result.token);
      sessionStorage.setItem("wesus_user", JSON.stringify(result.user));

      // Smooth exit animation before navigation
      document.body.style.transition = "opacity 0.4s ease";
      document.body.style.opacity = "0";
      setTimeout(() => {
        // Replace with your dashboard route
        window.location.href = "dashboard.html";
      }, 400);
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
})();

/* ── Trava de Fundo Anti-Teclado ──────────────────────────── */
const mobileBg = document.getElementById("mobile-bg");
if (mobileBg) {
  // Mede a altura física absoluta da tela do telemóvel e tranca em pixels.
  // Assim, quando o teclado sobe e encolhe o 'viewport', a imagem ignora.
  mobileBg.style.height = window.screen.height + "px";
}
