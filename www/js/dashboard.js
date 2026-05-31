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
    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.add("hidden"));

    const targetTab = document.getElementById(`tab-${sectionName}`);
    if (targetTab) targetTab.classList.remove("hidden");

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

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

      // Adiciona transição suave para o efeito de desfoque
      el.style.transition = "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

      if (isVisible) {
        if (originals.has(el)) {
          el.textContent = originals.get(el);
          el.style.letterSpacing = "";
          el.style.filter = ""; // Remove o desfoque
        }
      } else {
        if (!originals.has(el)) originals.set(el, el.textContent.trim());
        el.textContent = MASK;
        el.style.letterSpacing = "0.15em";
        el.style.filter = "blur(10px)"; // Aplica o desfoque premium
      }
    });
  }

  function init() {
    SELECTORS.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) originals.set(el, el.textContent.trim());
    });

    // 🔥 CORREÇÃO: Altera para escutar a classe real do botão (.button-eye)
    document.querySelectorAll(".button-eye").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggle();

        // Feedback visual no botão de vidro: fica semi-transparente se oculto
        btn.style.opacity = isVisible ? "1" : "0.4";
      });
    });
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

/* ── MOTOR DE GESTÃO DINÂMICA, GESTOS E ANIMAÇÃO FLUIDA DE PORTFÓLIO ── */
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

  const swipeSection = document.querySelector(
    'section[onclick*="navigateToContract"]',
  );

  if (!prevBtn || !nextBtn || !swipeSection) return;

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
  window.currentContractIndex = currentIndex;

  // 🎯 Captura os elementos físicos das vistas de dados para aplicar animação acelerada por hardware
  const targetCards = [
    swipeSection.querySelector(".lg\\:col-span-3 .hero-card-crystal"),
    ...swipeSection.querySelectorAll("aside .hero-card-crystal"),
  ].filter(Boolean);

  // Injeta a classe base de hardware em todos os alvos mapeados
  targetCards.forEach((card) => card.classList.add("wesus-hardware-card"));

  let isAnimating = false;

  function renderContractState() {
    const data = portfolioContracts[currentIndex];
    window.currentContractIndex = currentIndex;

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
      setTimeout(ChartDataController.alignTooltip, 20);
    }
  }

  /* ── PIPELINE DE TRANSIÇÃO FLUIDA 60FPS (GPU DRIVEN) ── */
  function triggerTransition(direction) {
    if (isAnimating) return;
    isAnimating = true;

    const isNext = direction === "next";
    const exitClass = isNext ? "wesus-exit-left" : "wesus-exit-right";
    const enterClass = isNext ? "wesus-enter-right" : "wesus-enter-left";

    // 1. Desliza e esmaece os elementos atuais para fora da tela
    targetCards.forEach((card) => card.classList.add(exitClass));

    // 2. No ápice da invisibilidade (180ms), fazemos o hot-swap de dados
    setTimeout(() => {
      if (isNext) {
        currentIndex = (currentIndex + 1) % portfolioContracts.length;
      } else {
        currentIndex =
          (currentIndex - 1 + portfolioContracts.length) %
          portfolioContracts.length;
      }
      renderContractState();

      // 3. Move os cards instantaneamente para o lado oposto (ainda invisíveis)
      targetCards.forEach((card) => {
        card.classList.remove(exitClass);
        card.classList.add(enterClass);

        // 🔥 TRUQUE DE ENGENHARIA SÉNIOR: Força reflow no DOM para registrar o posicionamento instantâneo
        void card.offsetHeight;

        // 4. Remove a classe de entrada, ativando a transição nativa de volta ao centro (transform: none)
        card.classList.remove(enterClass);
      });

      // Libera a trava do motor após a estabilização completa do frame
      setTimeout(() => {
        isAnimating = false;
      }, 180);
    }, 180);
  }

  // Listeners das setas físicas integrados ao pipeline fluido
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    triggerTransition("next");
  });

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    triggerTransition("prev");
  });

  /* ── DETEÇÃO DE SWIPE AVANÇADA COM CONTROLO DE FILTRO DE INTENÇÃO ── */
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwipeDetected = false;

  swipeSection.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      isSwipeDetected = false;
    },
    { passive: true },
  );

  swipeSection.addEventListener(
    "touchmove",
    (e) => {
      const currentX = e.changedTouches[0].screenX;
      const currentY = e.changedTouches[0].screenY;

      const diffX = Math.abs(currentX - touchStartX);
      const diffY = Math.abs(currentY - touchStartY);

      // Se o arrasto horizontal for significativamente maior que o vertical,
      // interceptamos o fluxo nativo assumindo paginação por gesto.
      if (diffX > 30 && diffX > diffY) {
        isSwipeDetected = true;
      }
    },
    { passive: true },
  );

  swipeSection.addEventListener(
    "touchend",
    (e) => {
      if (!isSwipeDetected) return;

      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      const SWIPE_THRESHOLD = 45; // Sensibilidade de pixels para o app rodar ágil
      const VERTICAL_LOCK = 50; // Margem contra movimentos diagonais erráticos

      if (
        Math.abs(deltaX) > SWIPE_THRESHOLD &&
        Math.abs(deltaY) < VERTICAL_LOCK
      ) {
        if (deltaX < 0) {
          triggerTransition("next");
        } else {
          triggerTransition("prev");
        }
      }
    },
    { passive: true },
  );

  // Camada protetora contra triggers acidentais do onclick nativo do card durante o swipe
  swipeSection.addEventListener(
    "click",
    (e) => {
      if (isSwipeDetected) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
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

  const documentosTabTrigger = document.querySelector(
    '[data-section="documentos"]',
  );
  if (documentosTabTrigger) documentosTabTrigger.click();

  setTimeout(() => {
    const targetCard = document.getElementById(targetId);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      targetCard.classList.add("contract-highlight-pulse");

      setTimeout(() => {
        targetCard.classList.remove("contract-highlight-pulse");
      }, 2000);
    }
  }, 180);
};

/* ── COMING SOON POPUP CONTROLLER ────────────────────────── */
const ComingSoonController = (() => {
  function init() {
    const popup = document.getElementById("wesusComingSoonPopup");
    const backdrop = document.getElementById("wesusComingSoonBackdrop");
    const closeBtn = document.getElementById("wesusClosePopupBtn");

    if (!popup) return;

    const showPopup = (e) => {
      e.preventDefault();
      e.stopPropagation();
      popup.classList.add("active");
    };

    const hidePopup = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      popup.classList.remove("active");
    };

    // Fechar ao clicar no botão ou no fundo
    closeBtn.addEventListener("click", hidePopup);
    backdrop.addEventListener("click", hidePopup);

    // 🔥 CORREÇÃO: Ignora o botão do WhatsApp E o próprio botão de fechar o popup!
    const actionButtons = document.querySelectorAll(
      ".btn-gold-lingot:not(.btn-emerald-lingot):not(#wesusClosePopupBtn)",
    );

    actionButtons.forEach((btn) => {
      btn.addEventListener("click", showPopup);
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  ComingSoonController.init();
});

/* ── ENTRY POINT ──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  ThemeController.init();
  NavigationController.init();
  ScrollController.init();
  BalanceVisibility.init();
  GreetingController.init();
  ChartDataController.init();
});
