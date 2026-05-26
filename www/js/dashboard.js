/**
 * It's Wesus – Portal do Investidor
 * dashboard.js – Vanilla ES6+ | PURE STATIC PERFORMANCE ENGINE
 */

"use strict";

/* ── THEME CONTROLLER ─────────────────────────────────────── */
const ThemeController = (() => {
  const HTML = document.documentElement;
  const STORAGE_KEY = "wesus-theme";
  const SUN_PATH =
    "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
  const MOON_PATH =
    "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z";

  let isDark = true;

  function _getStrokeWidth(path) {
    return path === SUN_PATH ? "1.8" : "2";
  }
  function _buildIconSVG(path, strokeWidth) {
    return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" d="${path}"/>`;
  }

  function _updateIcons() {
    const path = isDark ? SUN_PATH : MOON_PATH;
    const strokeWidth = _getStrokeWidth(path);
    const iconHTML = _buildIconSVG(path, strokeWidth);
    ["themeIconDesktop", "themeIconMobile"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = iconHTML;
    });
  }

  function apply(dark) {
    isDark = dark;
    dark ? HTML.classList.add("dark") : HTML.classList.remove("dark");
    _updateIcons();
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }

  function toggle() {
    apply(!isDark);
  }

  function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    apply(stored ? stored === "dark" : true);
    ["themeToggleDesktop", "themeToggleMobile"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn)
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          toggle();
        });
    });
  }

  return { init };
})();

/* ── NAVIGATION CONTROLLER ────────────────────────────────── */
const NavigationController = (() => {
  function _setActive(clicked, siblings) {
    siblings.forEach((el) => el.classList.remove("active"));
    clicked.classList.add("active");
  }

  function init() {
    [".nav-item", ".bottom-nav-item"].forEach((selector) => {
      const items = document.querySelectorAll(selector);
      items.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          _setActive(item, items);
        });
      });
    });
  }
  return { init };
})();

/* ── SCROLL CONTROLLER (PURE GPU GYRO TILT ENGINE) ────────── */
const ScrollController = (() => {
  function init() {
    const crystalCards = document.querySelectorAll(".hero-card-crystal");
    if (crystalCards.length === 0) return;

    let ticking = false;

    function handleOrientation(event) {
      if (event.gamma === null || event.beta === null) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Limita a inclinação a no máximo 6 graus para ser um efeito ultra sutil (Estilo Apple)
          // Gamma controla o eixo Y (esquerda/direita) | Beta controla o eixo X (frente/trás)
          const tiltX = Math.max(-6, Math.min(6, event.gamma * 0.2));
          const tiltY = Math.max(-6, Math.min(6, (event.beta - 55) * 0.2)); // 55° é o ângulo médio de leitura na mão

          crystalCards.forEach((card) => {
            // Executado diretamente pelo hardware compositor da GPU (Zero layout repaint)
            card.style.transform = `perspective(1000px) translateZ(0) rotateX(${-tiltY}deg) rotateY(${tiltX}deg)`;
          });

          ticking = false;
        });
        ticking = true;
      }
    }

    function activateSensors() {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === "granted")
              window.addEventListener(
                "deviceorientation",
                handleOrientation,
                true,
              );
          })
          .catch(console.error);
      } else {
        window.addEventListener("deviceorientation", handleOrientation, true);
      }
    }

    document.addEventListener("click", activateSensors, { once: true });
    document.addEventListener("touchstart", activateSensors, { once: true });
  }

  return { init };
})();

/* ── BALANCE VISIBILITY TOGGLE ────────────────────────────── */
const BalanceVisibility = (() => {
  let isVisible = true;
  const MASK = "••••••••";
  const SELECTORS = ["#patrimonyHeading"];
  const originals = new Map();

  function toggle() {
    isVisible = !isVisible;
    SELECTORS.forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      if (isVisible) {
        if (originals.has(el)) {
          el.textContent = originals.get(el);
          el.style.letterSpacing = "";
        }
      } else {
        if (!originals.has(el)) originals.set(el, el.textContent.trim());
        el.textContent = MASK;
        el.style.letterSpacing = "0.15em";
      }
    });
  }

  function init() {
    SELECTORS.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) originals.set(el, el.textContent.trim());
    });
    document
      .querySelectorAll(".header-action-btn")
      .forEach((btn) => btn.addEventListener("click", toggle));
  }
  return { init };
})();

/* ── GREETING DYNAMIC ─────────────────────────────────────── */
const GreetingController = (() => {
  function _getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Bom dia";
    if (h >= 12 && h < 19) return "Boa tarde";
    return "Boa noite";
  }
  function init() {
    const text = `${_getGreeting()}, Alexandre.`;
    document.querySelectorAll("h1").forEach((el) => {
      if (el.textContent.includes("Alexandre")) el.textContent = text;
    });
  }
  return { init };
})();

/* ── CONTRACT DATA CONTROLLER (AUTOMATIC TOOLTIP ALIGNMENT) ── */
const ChartDataController = (() => {
  const clientData = {
    months: 3,
    roiTotal: "+ € 24.500,00",
  };

  function alignTooltip() {
    const node = document.getElementById("chartFinalNode");
    const tooltip = document.getElementById("chartTooltip");
    const svg = document.getElementById("staticPlasmaChart");

    if (!node || !tooltip || !svg) return;

    // Pega nas coordenadas reais da bolinha do gráfico dentro do ecrã
    const svgPoint = node.getBoundingClientRect();
    const containerRect = svg.parentElement.getBoundingClientRect();

    // Calcula o ponto central exato do nó do gráfico
    const x = svgPoint.left - containerRect.left + svgPoint.width / 2;
    const y = svgPoint.top - containerRect.top + svgPoint.height / 2;

    // Aplica as coordenadas base
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;

    // 💡 CONDICIONAL DE MUDANÇA DE POSIÇÃO (A partir de 460px)
    if (window.innerWidth <= 460) {
      // Traduz -50% no X (centraliza) e 25px positivo no Y (empurra para BAIXO do ponto)
      tooltip.style.transform = "translate(-80%, 25px)";
    } else {
      // Traduz -80% no X e -120% negativo no Y (empurra para CIMA do ponto)
      tooltip.style.transform = "translate(-80%, -120%)";
    }
  }

  function init() {
    const tooltipValue = document.getElementById("tooltipValue");
    if (tooltipValue) {
      tooltipValue.textContent = clientData.roiTotal;
    }

    // Executa o alinhamento inicial
    alignTooltip();

    // Se o ecrã rodar ou mudar de tamanho (Desktop), ele recalcula sozinho
    window.addEventListener("resize", alignTooltip);
  }

  return { init };
})();

/* ── ENTRY POINT ──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  ThemeController.init();
  NavigationController.init();
  ScrollController.init();
  BalanceVisibility.init();
  GreetingController.init();
  ChartDataController.init();
});
