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

    if (window.AndroidInterface && window.AndroidInterface.setSystemBarsColor) {
      window.AndroidInterface.setSystemBarsColor(
        dark ? "#071326" : "#FFFFFF",
        !dark,
      );
    }
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

/* ── NAVIGATION CONTROLLER (SPA TAB SWITCH ENGINE CORRIGIDO) ── */
const NavigationController = (() => {
  function _setActive(sectionName) {
    document.querySelectorAll(".nav-item, .bottom-nav-item").forEach((el) => {
      if (el.getAttribute("data-section") === sectionName) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }

  function _switchTab(sectionName) {
    // 1. Oculta as abas antigas e mostra a nova ativa
    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.add("hidden"));

    const targetTab = document.getElementById(`tab-${sectionName}`);
    if (targetTab) targetTab.classList.remove("hidden");

    // 2. 🔥 CORREÇÃO DEFINITIVA: Salto instantâneo puro ignorando o smooth scroll do CSS
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    // Alinha a tooltip se voltarmos ao painel principal
    if (
      sectionName === "dashboard" &&
      typeof ChartDataController !== "undefined"
    ) {
      ChartDataController.alignTooltip();
    }
  }

  function init() {
    document.querySelectorAll(".nav-item, .bottom-nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const sectionName = item.getAttribute("data-section");
        if (sectionName) {
          _setActive(sectionName);
          _switchTab(sectionName);
        }
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
          const tiltX = Math.max(-6, Math.min(6, event.gamma * 0.2));
          const tiltY = Math.max(-6, Math.min(6, (event.beta - 55) * 0.2));
          crystalCards.forEach((card) => {
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
    const text = `${_getGreeting()}, André.`;
    document.querySelectorAll("h1").forEach((el) => {
      if (
        el.textContent.includes("André") ||
        el.textContent.includes("Alexandre")
      )
        el.textContent = text;
    });
  }
  return { init };
})();

/* ── CONTRACT DATA CONTROLLER (AUTOMATIC TOOLTIP ALIGNMENT) ── */
const ChartDataController = (() => {
  function alignTooltip() {
    const node = document.getElementById("chartFinalNode");
    const tooltip = document.getElementById("chartTooltip");
    const svg = document.getElementById("staticPlasmaChart");

    if (!node || !tooltip || !svg) return;

    const svgPoint = node.getBoundingClientRect();
    const containerRect = svg.parentElement.getBoundingClientRect();

    const x = svgPoint.left - containerRect.left + svgPoint.width / 2;
    const y = svgPoint.top - containerRect.top + svgPoint.height / 2;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;

    if (window.innerWidth <= 460) {
      tooltip.style.transform = "translate(-80%, 25px)";
    } else {
      tooltip.style.transform = "translate(-80%, -120%)";
    }
  }

  function init() {
    alignTooltip();
    window.addEventListener("resize", alignTooltip);
  }
  return { init, alignTooltip };
})();

/* ── MOTOR DE GESTÃO DINÂMICA E ROTEAMENTO (V36 - 5 CONTRATOS) ── */
document.addEventListener("DOMContentLoaded", () => {
  const subtitle = document.getElementById("dashboardContractSubtitle");
  const prevBtn = document.getElementById("dashboardPrevContractBtn");
  const nextBtn = document.getElementById("dashboardNextContractBtn");

  const chartTitle = document.getElementById("dynamicChartTitle");
  const xAxisEnd = document.getElementById("dynamicXAxisEnd");
  const tooltipVal = document.getElementById("tooltipValue");
  const taxValue = document.getElementById("dynamicTaxValue");
  const daysValue = document.getElementById("dynamicDaysValue");
  const chronoArc = document.getElementById("dynamicChronoArc");

  if (!prevBtn || !nextBtn) return;

  const portfolioContracts = [
    {
      building: "Edifício Aliados",
      tax: "10",
      days: "12",
      arcOffset: 66,
      roi: "+ € 5.000,00",
      xAxis: "Mês 3 (Vencimento)",
    },
    {
      building: "Villa Infante",
      tax: "12,5",
      days: "45",
      arcOffset: 140,
      roi: "+ € 6.250,00",
      xAxis: "Mês 6 (Vencimento)",
    },
    {
      building: "Palácio Estoril",
      tax: "15",
      days: "88",
      arcOffset: 210,
      roi: "+ € 7.500,00",
      xAxis: "Mês 12 (Vencimento)",
    },
    {
      building: "Douro Marina",
      tax: "8,5",
      days: "5",
      arcOffset: 25,
      roi: "+ € 4.250,00",
      xAxis: "Mês 2 (Vencimento)",
    },
    {
      building: "Lumina Chiado",
      tax: "14",
      days: "115",
      arcOffset: 250,
      roi: "+ € 7.000,00",
      xAxis: "Mês 18 (Vencimento)",
    },
  ];

  let currentIndex = 0;
  window.currentContractIndex = currentIndex; // Sincroniza o estado para o escopo nativo

  function renderContractState() {
    const data = portfolioContracts[currentIndex];
    window.currentContractIndex = currentIndex; // Atualiza a cada clique de seta

    if (subtitle)
      subtitle.textContent = `${data.building} (${currentIndex + 1} de ${
        portfolioContracts.length
      })`;
    if (chartTitle)
      chartTitle.textContent = `Projeção de Rendimentos (${data.building})`;
    if (xAxisEnd) xAxisEnd.textContent = data.xAxis;
    if (taxValue) taxValue.textContent = data.tax;
    if (daysValue) daysValue.textContent = data.days;
    if (tooltipVal) tooltipVal.textContent = data.roi;
    if (chronoArc) chronoArc.setAttribute("stroke-dashoffset", data.arcOffset);

    if (
      typeof ChartDataController !== "undefined" &&
      ChartDataController.alignTooltip
    ) {
      setTimeout(ChartDataController.alignTooltip, 40);
    }
  }

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % portfolioContracts.length;
    renderContractState();
  });

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex =
      (currentIndex - 1 + portfolioContracts.length) %
      portfolioContracts.length;
    renderContractState();
  });
});

/* 🔥 ROTEADOR PRE-CARREGADO COM ALVO DE SCROLL NATIVO (WHATSAPP PULSE) */
window.navigateToContract = () => {
  const contractMappingIds = [
    "contract-aliados",
    "contract-villa",
    "contract-estoril",
    "contract-marina",
    "contract-chiado",
  ];
  const currentIndex = window.currentContractIndex || 0;
  const targetId = contractMappingIds[currentIndex];

  // 1. Aciona programaticamente a troca de abas do SPA para "Contratos"
  const documentosTabTrigger = document.querySelector(
    '[data-section="documentos"]',
  );
  if (documentosTabTrigger) documentosTabTrigger.click();

  // 2. Aguarda a abertura da div oculta para calcular a física de rolagem suave
  setTimeout(() => {
    const targetCard = document.getElementById(targetId);
    if (targetCard) {
      // Move o scroll centralizando o card perfeitamente na viewport do telemóvel
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

      // Injeta o efeito flash do WhatsApp
      targetCard.classList.add("contract-highlight-pulse");

      // Destrói a classe após a animação de 2 segundos para liberar o efeito Tilt do Giroscópio
      setTimeout(() => {
        targetCard.classList.remove("contract-highlight-pulse");
      }, 2000);
    }
  }, 180);
};

/* ── ENTRY POINT ──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  ThemeController.init();
  NavigationController.init();
  ScrollController.init();
  BalanceVisibility.init();
  GreetingController.init();
  ChartDataController.init();
});
