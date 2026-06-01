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

  // Ativa o link híbrido do card de resultados para saltar direto para os contratos históricos
  const historyTrigger = document.getElementById("wesusViewHistoryTrigger");
  if (historyTrigger) {
    historyTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      // Busca o botão nativo do menu de contratos e simula o clique de transição do App
      const docTab = document.querySelector('[data-section="documentos"]');
      if (docTab) {
        docTab.click();
        // Dá um scroll suave de atraso para o usuário já cair focado nos contratos antigos
        setTimeout(() => {
          const historySec = document.querySelector(
            ".contracts-history-section",
          );
          if (historySec)
            historySec.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      }
    });
  }
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

/* ── INVESTMENT MODAL & SIMULATION CONTROLLER (PREMIUM LEAD ENGINE) ── */
const InvestmentModalController = (() => {
  function init() {
    const modal = document.getElementById("wesusInvestmentModal");
    const backdrop = document.getElementById("wesusInvestmentBackdrop");
    const closeBtn = document.getElementById("wesusCloseInvestmentBtn");
    const form = document.getElementById("wesusInvestmentForm");
    const planSubtitle = document.getElementById("modalPlanSubtitle");

    // Inputs e validações
    const amountInput = document.getElementById("investAmount");
    const errorMsg = document.getElementById("amountErrorMsg");

    if (!modal || !form) return;

    // Função estendida para extrair dados contratuais de período e lucro em tempo de execução
    const openModal = (e, btn) => {
      e.preventDefault();
      e.stopPropagation();

      const dateInput = document.getElementById("investDate");
      if (dateInput) {
        const hoje = new Date().toISOString().split("T")[0];
        dateInput.min = hoje;
        dateInput.value = hoje;
      }

      let contextName = "Alocação de Portfólio Restrito";
      let planPeriod = "";
      let planTax = "";

      const cardParent = btn.closest(".hero-card-crystal");

      if (cardParent) {
        const titleEl = cardParent.querySelector("h4, h3");
        if (titleEl) {
          contextName = titleEl.textContent.trim();
        }

        // 🎯 INTERCEPTAÇÃO PREMIUM: Se for Oportunidade Relâmpago, força os dados solicitados
        if (contextName.toLowerCase().includes("relâmpago")) {
          planPeriod = "3 Meses";
          planTax = "Retorno: 10%";
        } else {
          // Coleta e mapeia a taxa fixa real descrita no card para os outros planos
          const taxEl = cardParent.querySelector(".text-gold-gradient");
          if (taxEl) {
            planTax = `Retorno: ${taxEl.textContent.trim()}%`;
          }

          // Formata a exibição do período com base no título extraído
          if (
            contextName.toLowerCase().includes("meses") ||
            contextName.toLowerCase().includes("mês")
          ) {
            planPeriod = contextName;
          }
        }
      }

      if (planSubtitle) {
        planSubtitle.textContent = `Modalidade: ${contextName}`;
      }

      // Sincroniza e exibe a linha de metadados se as informações forem encontradas
      const metaRow = document.getElementById("modalPlanMetaRow");
      const periodEl = document.getElementById("modalPlanPeriod");
      const taxDisplayEl = document.getElementById("modalPlanTax");

      // 🎯 PIPELINE DE INJEÇÃO PREMIUM NO GRID DUAL
      if (metaRow && periodEl && taxDisplayEl && planTax) {
        // Limpa strings residuais para expor apenas os valores puros e imponentes
        periodEl.textContent = planPeriod
          ? planPeriod.replace("Plano ", "")
          : "Prazo Comercial";
        taxDisplayEl.textContent = planTax.replace("Retorno: ", "");

        metaRow.style.setProperty("display", "grid", "important");
      } else if (metaRow) {
        metaRow.style.setProperty("display", "none", "important");
      }

      form.reset();
      if (errorMsg) errorMsg.classList.add("hidden");
      if (amountInput) amountInput.style.borderColor = "";
      modal.classList.add("active");
    };

    const closeModal = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      modal.classList.remove("active");
    };

    // 🎯 SELETOR DE ALTA PRECISÃO:
    // Só ouve quem tem o atributo específico, ignorando a classe CSS genérica
    const investButtons = document.querySelectorAll(
      '[data-modal="investment"]',
    );

    // Adiciona o evento apenas nestes botões específicos
    investButtons.forEach((btn) => {
      btn.removeEventListener("click", (e) => openModal(e, btn));
      btn.addEventListener("click", (e) => openModal(e, btn));
    });

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    // Validação em Tempo Real (Real-time Feedback)
    if (amountInput && errorMsg) {
      amountInput.addEventListener("input", () => {
        const val = parseFloat(amountInput.value);
        if (!isNaN(val) && val < 5000) {
          errorMsg.classList.remove("hidden");
          amountInput.style.borderColor = "#ff6b6b";
        } else {
          errorMsg.classList.add("hidden");
          amountInput.style.borderColor = "";
        }
      });
    }

    // Validação final de segurança na submissão
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const amountValue = parseFloat(amountInput.value);

      // Trava de entrada rigorosa
      if (isNaN(amountValue) || amountValue < 5000) {
        if (errorMsg) errorMsg.classList.remove("hidden");
        if (amountInput) {
          amountInput.style.borderColor = "#ff6b6b";
          amountInput.focus();
        }
        return; // Aborta envio
      }

      // 🎯 VALIDAÇÃO SEGURA: Verifica se o campo existe antes de ler o valor
      const investContactEl = document.getElementById("investContact");

      const leadData = {
        plano: planSubtitle
          ? planSubtitle.textContent.replace("Modalidade: ", "")
          : "Geral",
        valor: amountValue,
        contacto: investContactEl ? investContactEl.value.trim() : "",
        dataInicio: document.getElementById("investDate").value,
      };

      console.log("Lead de Investimento Premium Capturado:", leadData);

      // 🎯 AGORA VAI ACIONAR PERFEITAMENTE!
      modal.classList.add("success-active");

      // Deixa o feedback flutuar por 3.2 segundos para o cliente absorver a experiência de elite
      setTimeout(() => {
        closeModal();

        // Reseta o modal em background após as transições de fade out concluírem
        setTimeout(() => {
          modal.classList.remove("success-active");
          form.reset();
        }, 500);
      }, 800);
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  InvestmentModalController.init(); // 🔥 Ativa o novo pipeline de captação
});

/* ── ANNUAL PERFORMANCE CONTROLLER (DROPDOWN PIPELINE V30 — COLORS PROTECTION) ── */
const AnnualPerformanceController = (() => {
  const mockHistoryData = {
    2026: {
      capital: "€ 140.000,00",
      profit: "+ € 12.500,00",
      isCurrent: true,
      label: "2026 (Atual)",
    },
    2025: {
      capital: "€ 95.500,00",
      profit: "+ € 8.900,00",
      isCurrent: false,
      label: "2025",
    },
    2024: {
      capital: "€ 45.000,00",
      profit: "+ € 3.200,00",
      isCurrent: false,
      label: "2024",
    },
    all: {
      capital: "€ 280.500,00",
      profit: "+ € 24.600,00",
      isCurrent: true,
      label: "Selecionar Ano",
    },
  };

  function init() {
    const dropdownBtn = document.getElementById("annualYearDropdownBtn");
    const dropdownMenu = document.getElementById("annualYearDropdownMenu");
    const dropdownChevron = document.getElementById("dropdownChevron");
    const allTimeBtn = document.getElementById("annualAllTimeBtn");

    const capitalEl = document.getElementById("annualInvestedCapital");
    const profitEl = document.getElementById("annualRealizedProfit");
    const iconEl = document.getElementById("annualProfitIcon");
    const cardsContainer = document.getElementById(
      "annualPerformanceCardsContainer",
    );
    const labelEl = document.getElementById("selectedYearLabel");
    const historyTrigger = document.getElementById("wesusViewHistoryTrigger");

    if (!dropdownBtn || !dropdownMenu || !capitalEl || !profitEl || !allTimeBtn)
      return;

    const toggleDropdown = (show) => {
      if (show) {
        dropdownMenu.classList.remove("hidden");
        if (dropdownChevron) dropdownChevron.classList.add("rotate-180");
      } else {
        dropdownMenu.classList.add("hidden");
        if (dropdownChevron) dropdownChevron.classList.remove("rotate-180");
      }
    };

    dropdownBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(dropdownMenu.classList.contains("hidden"));
    });

    window.addEventListener("click", (e) => {
      if (!e.target.closest("#annualYearDropdownWrapper")) {
        toggleDropdown(false);
      }
    });

    const updatePerformanceData = (key, isAllTime = false) => {
      const data = mockHistoryData[key];
      if (!data) return;

      capitalEl.classList.add("animate-pulse");
      profitEl.classList.add("animate-pulse");

      setTimeout(() => {
        labelEl.textContent = isAllTime ? "Selecionar Ano" : data.label;
        capitalEl.textContent = data.capital;
        profitEl.textContent = data.profit;

        capitalEl.classList.remove("animate-pulse");
        profitEl.classList.remove("animate-pulse");

        if (data.isCurrent) {
          if (cardsContainer) cardsContainer.style.opacity = "1";
        } else {
          // Mantém 85% de opacidade cristalina (sem ficar cinza)
          if (cardsContainer) cardsContainer.style.opacity = "0.85";
        }

        // 🔥 Blindagem: Mantém o lucro sempre verde vibrante e os ícones acesos para todos os anos
        profitEl.className =
          "text-xl lg:text-2xl font-bold text-[#6FCF97] drop-shadow-[0_0_8px_rgba(111,207,151,0.3)] tracking-wide select-all transition-all duration-200";
        if (iconEl) iconEl.setAttribute("stroke", "#6FCF97");

        // Garante que o lucro mantenha sua cor verde e drop-shadow premium intactos
        profitEl.className =
          "text-xl lg:text-2xl font-bold text-[#6FCF97] drop-shadow-[0_0_8px_rgba(111,207,151,0.3)] tracking-wide select-all transition-all duration-200";
        if (iconEl) iconEl.setAttribute("stroke", "#6FCF97");

        // ── CHAVEAMENTO DE INTERAÇÃO SEGURO SEM CONFLITOS VIA DOM ──
        if (isAllTime) {
          allTimeBtn.classList.add("active");
          allTimeBtn.classList.remove("inactive");
          dropdownBtn.classList.add("inactive");
          dropdownBtn.classList.remove("active");
          if (dropdownChevron) dropdownChevron.style.opacity = "0.35";
        } else {
          allTimeBtn.classList.add("inactive");
          allTimeBtn.classList.remove("active");
          dropdownBtn.classList.add("active");
          dropdownBtn.classList.remove("inactive");
          if (dropdownChevron) dropdownChevron.style.opacity = "1";
        }

        // Sincronização de realce interno dos itens do menu suspenso
        dropdownMenu.querySelectorAll("button").forEach((menuBtn) => {
          const menuYear = menuBtn.getAttribute("data-year");
          if (!isAllTime && menuYear === String(key)) {
            menuBtn.style.setProperty("color", "#E8D08D", "important");
            menuBtn.style.setProperty(
              "background-color",
              "rgba(255, 255, 255, 0.05)",
              "important",
            );
          } else {
            menuBtn.style.setProperty(
              "color",
              "rgba(255, 255, 255, 0.6)",
              "important",
            );
            menuBtn.style.setProperty(
              "background-color",
              "transparent",
              "important",
            );
          }
        });

        toggleDropdown(false);
      }, 200);
    };

    // Mapeamento limpo dos ouvintes de eventos
    dropdownMenu.querySelectorAll("button").forEach((menuBtn) => {
      menuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        updatePerformanceData(menuBtn.getAttribute("data-year"), false);
      });
    });

    allTimeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      updatePerformanceData("all", true);
    });

    if (historyTrigger) {
      historyTrigger.addEventListener("click", (e) => {
        e.preventDefault();
        const docTab = document.querySelector('[data-section="documentos"]');
        if (docTab) {
          docTab.click();
          setTimeout(() => {
            const historySec = document.querySelector(
              ".contracts-history-section",
            );
            if (historySec)
              historySec.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 200);
        }
      });
    }

    // Inicialização segura no frame correto (2026 Ativo)
    updatePerformanceData("2026", false);
  }

  return { init };
})();

/* ── ASSET DETAILS MODAL CONTROLLER (FACEBOOK PROFILE INTEGRATION V1) ── */
const AssetDetailsModalController = (() => {
  function init() {
    const modal = document.getElementById("wesusAssetDetailsModal");
    const backdrop = document.getElementById("wesusAssetDetailsBackdrop");
    const closeBtn = document.getElementById("wesusCloseAssetDetailsBtn");

    const tabInterior = document.getElementById("tabBtnInterior");
    const tabDocs = document.getElementById("tabBtnDocs");
    const paneInterior = document.getElementById("assetPaneInterior");
    const paneDocs = document.getElementById("assetPaneDocs");

    const coverImg = document.getElementById("assetDetailsCover");
    const titleEl = document.getElementById("assetDetailsTitle");
    const locationEl = document.getElementById("assetDetailsLocation");
    const totalEl = document.getElementById("assetDetailsTotal");
    const statusEl = document.getElementById("assetDetailsStatus");

    if (!modal || !tabInterior || !tabDocs) return;

    const openDetails = (name, location, imgSrc, total, status) => {
      if (titleEl) titleEl.textContent = name;
      if (locationEl) locationEl.textContent = location;
      if (totalEl) totalEl.textContent = total;
      if (statusEl) statusEl.textContent = status;

      if (coverImg && imgSrc) {
        coverImg.style.opacity = "0"; // 🎯 FIM DO DELAY FEIO: Apaga a foto antiga na hora do clique
        coverImg.src = imgSrc;

        // Ouve o evento de carregamento físico do navegador
        coverImg.onload = () => {
          coverImg.style.opacity = "1"; // 🎯 FADE PREMIUM: Só aparece quando estiver 100% carregada
        };
      }

      switchPane("interior");
      modal.classList.add("active");
    };

    const closeDetails = () => {
      modal.classList.remove("active");
      // Reseta a opacidade ao fechar para preparar a próxima abertura limpa
      setTimeout(() => {
        if (coverImg) coverImg.style.opacity = "0";
      }, 350);
    };

    const switchPane = (target) => {
      if (target === "interior") {
        // Ativa a aba Interior e remove qualquer estado ativo da aba de Documentos
        tabInterior.classList.add("active");
        tabDocs.classList.remove("active");

        paneInterior.classList.remove("hidden");
        paneDocs.classList.add("hidden");
      } else {
        // Ativa a aba Documentos e remove por completo o estado ativo do Interior
        tabDocs.classList.add("active");
        tabInterior.classList.remove("active");

        paneDocs.classList.remove("hidden");
        paneInterior.classList.add("hidden");
      }
    };

    tabInterior.addEventListener("click", () => switchPane("interior"));
    tabDocs.addEventListener("click", () => switchPane("docs"));
    closeBtn.addEventListener("click", closeDetails);
    backdrop.addEventListener("click", closeDetails);

    // Mapeamento das linhas da Tabela (Desktop)
    document.querySelectorAll(".assets-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        // Se clicar explicitamente em botões ou links internos, não intercepta
        if (e.target.closest("a") || e.target.closest("button")) return;

        const name =
          row.querySelector("td p")?.textContent.trim() || "Imóvel Premium";
        const location =
          row.querySelector("td span")?.textContent.trim() || "Portugal";
        const status =
          row.querySelector(".status-badge-construction")?.textContent.trim() ||
          "Em Curso";
        const total =
          row.querySelector("td:last-child")?.textContent.trim() || "€ 0,00";
        const imgSrc = row.querySelector("td img")?.getAttribute("src") || "";

        openDetails(name, location, imgSrc, total, status);
      });
    });

    // Mapeamento dos Cards do Carrossel (Mobile)
    document.querySelectorAll(".carousel-asset-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // 🎯 SALVAGUARDA: Se o usuário clicar no link do mapa, abre o Google Maps em vez de abrir o popup
        if (e.target.closest("a")) return;

        // 🎯 A TRAVA GERAL: Cancela o borbulhamento e congela a viewport móvel no mesmo píxel
        e.preventDefault();
        e.stopPropagation();

        const name =
          card.querySelector("h3")?.textContent.trim() || "Imóvel Premium";
        const location =
          card.querySelector("a")?.textContent.trim() || "Portugal";
        const status =
          card
            .querySelector(".status-badge-construction")
            ?.textContent.trim() || "Em Curso";
        const total =
          card.querySelector("p.font-bold")?.textContent.trim() || "€ 0,00";

        const maskDiv = card.querySelector(".carousel-asset-image-mask");
        let imgSrc = "";
        if (maskDiv) {
          const bgStyle = window.getComputedStyle(maskDiv).backgroundImage;
          imgSrc = bgStyle.replace('url("', "").replace('")', "");
        }

        openDetails(name, location, imgSrc, total, status);
      });
    });
  }

  // ── Sub-Motor Integrado: Lightbox de Fotos do Interior ──
  const initAssetLightbox = () => {
    const lightbox = document.getElementById("wesusLightboxModal");
    const lightboxImg = document.getElementById("wesusLightboxImage");
    const backdrop = document.getElementById("wesusLightboxBackdrop");
    const closeBtn =
      document.getElementById("wSimpleCloseLightboxBtn") ||
      document.getElementById("wesusCloseLightboxBtn");
    const prevBtn =
      document.getElementById("wSimplePrevLightboxBtn") ||
      document.getElementById("wesusPrevLightboxBtn");
    const nextBtn = document.getElementById("wesusNextLightboxBtn");

    if (!lightbox || !lightboxImg) return;

    let imagesArray = [];
    let activeImgIndex = 0;

    const updateLightboxViewport = () => {
      lightboxImg.style.opacity = "0"; // Dispara fade-out controlado na GPU

      // Carrega a nova imagem em background
      const tempLoader = new Image();
      tempLoader.src = imagesArray[activeImgIndex];
      tempLoader.onload = () => {
        lightboxImg.src = imagesArray[activeImgIndex];
        lightboxImg.style.opacity = "1"; // Abre com fade-in suave
      };
    };

    // Intercepta e escuta cliques nas thumbs da galeria interna
    document
      .querySelectorAll(".wesus-interior-grid .wesus-gallery-thumb img")
      .forEach((img) => {
        img.style.cursor = "pointer";
        img.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Varre e mapeia as mídias disponíveis no grid da casa atual em runtime
          imagesArray = Array.from(
            document.querySelectorAll(
              ".wesus-interior-grid .wesus-gallery-thumb img",
            ),
          ).map((i) => i.getAttribute("src"));
          activeImgIndex = imagesArray.indexOf(img.getAttribute("src"));

          if (activeImgIndex === -1) activeImgIndex = 0;

          updateLightboxViewport();
          lightbox.classList.add("active");
        });
      });

    const hideLightbox = () => {
      lightbox.classList.remove("active");
      // Remove o listener global de teclado ao fechar para evitar overhead ou conflitos secundários
      window.removeEventListener("keydown", handleLightboxKeyboard);
      setTimeout(() => {
        lightboxImg.style.opacity = "0";
      }, 300);
    };

    // 🎯 NOVO EVENTO DE TECLADO: Atalhos rápidos premium para desktop
    const handleLightboxKeyboard = (e) => {
      if (!lightbox.classList.contains("active")) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        activeImgIndex = (activeImgIndex + 1) % imagesArray.length;
        updateLightboxViewport();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        activeImgIndex =
          (activeImgIndex - 1 + imagesArray.length) % imagesArray.length;
        updateLightboxViewport();
      } else if (e.key === "Escape") {
        e.preventDefault();
        hideLightbox();
      }
    };

    // Escuta cliques nas thumbs para abrir o modal e injetar o escopo de teclado
    document
      .querySelectorAll(".wesus-interior-grid .wesus-gallery-thumb img")
      .forEach((img) => {
        img.style.cursor = "pointer";
        img.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          imagesArray = Array.from(
            document.querySelectorAll(
              ".wesus-interior-grid .wesus-gallery-thumb img",
            ),
          ).map((i) => i.getAttribute("src"));
          activeImgIndex = imagesArray.indexOf(img.getAttribute("src"));

          if (activeImgIndex === -1) activeImgIndex = 0;

          updateLightboxViewport();
          lightbox.classList.add("active");

          // 🎯 ATIVAÇÃO DO ESCUTADOR DE TECLADO GLOBAL AO ABRIR
          window.addEventListener("keydown", handleLightboxKeyboard);
        });
      });

    if (closeBtn) closeBtn.addEventListener("click", hideLightbox);
    if (backdrop) backdrop.addEventListener("click", hideLightbox);

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeImgIndex =
          (activeImgIndex - 1 + imagesArray.length) % imagesArray.length;
        updateLightboxViewport();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeImgIndex = (activeImgIndex + 1) % imagesArray.length;
        updateLightboxViewport();
      });
    }

    if (closeBtn) closeBtn.addEventListener("click", hideLightbox);
    if (backdrop) backdrop.addEventListener("click", hideLightbox);

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeImgIndex =
          (activeImgIndex - 1 + imagesArray.length) % imagesArray.length;
        updateLightboxViewport();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeImgIndex = (activeImgIndex + 1) % imagesArray.length;
        updateLightboxViewport();
      });
    }
  };

  // Inicializa o sub-motor acoplado
  initAssetLightbox();

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
  AnnualPerformanceController.init();
  AssetDetailsModalController.init();
});
