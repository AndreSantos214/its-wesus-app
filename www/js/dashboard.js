/**
 * It's Wesus – Portal do Investidor
 * dashboard.js – Vanilla ES6+ | HIGH-END REAL-TIME DATABASE PERFORMANCE ENGINE
 */

"use strict";

/* ── CONFIGURAÇÃO GLOBAL DO SUPABASE ── */
const SUPABASE_URL = "https://eolpgnlfxgmramzckxvo.supabase.co";
// 🔑 Usa a mesma Publishable key (anon) que configurou no ecrã de login
const SUPABASE_ANON_KEY = "sb_publishable_vg-yRQt4yHm0ps1FPeh8LA_O9fruoFv";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

// URL oficial do teu Cloudflare Worker para downloads seguros
const CLOUDFLARE_PROXY_URL =
  "https://itswesus-asset-proxy.itswesus-adm.workers.dev";

// 💡 FUNÇÃO MOVIDA PARA O ESCOPO GLOBAL: Evita ReferenceError no AccountSettingsController e centraliza o Silent Refresh
async function getValidWesusToken() {
  const { data } = await supabaseClient.auth.getSession();
  if (data?.session) {
    // Se o Supabase renovou o token em background, usamos o novo automaticamente
    return data.session.access_token;
  }
  // Fallback de contingência para o fluxo legado
  return sessionStorage.getItem("wesus_token");
}

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
          e.stopPropagation(); // 🛡️ Blindagem: impede que o clique suba para o card pai clicável
          toggle();
        });
    });
  }

  return { init };
})();

/* ── NAVIGATION CONTROLLER (SPA TAB SWITCH ENGINE) ── */
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

    // 1. Reset síncrono imediato de segurança
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    // 2. 🛡️ GUARDA SÊNIOR ASSÍNCRONO: Executa logo após o navegador calcular as novas alturas do DOM
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (mainContent) {
        mainContent.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }, 15);

    if (
      sectionName === "dashboard" &&
      typeof ChartDataController !== "undefined"
    ) {
      ChartDataController.alignTooltip();
    }
  }

  function updateHistoryState(sectionName) {
    history.pushState({ section: sectionName }, "", "");
  }

  function init() {
    if (!history.state) {
      history.replaceState({ section: "dashboard" }, "", "");
    }

    document.querySelectorAll(".nav-item, .bottom-nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const sectionName = item.getAttribute("data-section");
        if (sectionName) {
          _setActive(sectionName);
          _switchTab(sectionName);
          updateHistoryState(sectionName);
        }
      });
    });

    document
      .querySelectorAll(".sidebar-logo, .logo-mobile-container")
      .forEach((logo) => {
        logo.style.cursor = "pointer";
        logo.classList.add("cursor-pointer");
        logo.addEventListener("click", (e) => {
          e.preventDefault();
          _setActive("dashboard");
          _switchTab("dashboard");
        });
      });

    window.addEventListener("popstate", (e) => {
      if (sessionStorage.getItem("wesus_token")) {
        const targetSection =
          e.state && e.state.section ? e.state.section : "dashboard";
        _setActive(targetSection);
        _switchTab(targetSection);
      }
    });
  }
  return { init, _switchTab, _setActive };
})();

/* ── SCROLL CONTROLLER (PURE GPU GYRO TILT ENGINE) ────────── */
const ScrollController = (() => {
  const STORAGE_KEY = "wesus-gyro-tilt";
  let isGyroEnabled = true;
  let hasListener = false;
  let ticking = false;

  function updateCardTilt(event, crystalCards) {
    if (event.gamma === null || event.beta === null) return;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (!isGyroEnabled) {
          ticking = false;
          return;
        }
        const tiltX = Math.max(-7, Math.min(7, event.gamma * 0.22));
        const tiltY = Math.max(-7, Math.min(7, (event.beta - 55) * 0.22));

        crystalCards.forEach((card) => {
          card.style.transform = `perspective(1000px) translateZ(0) rotateX(${-tiltY}deg) rotateY(${tiltX}deg)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }

  function resetTransforms() {
    document.querySelectorAll(".hero-card-crystal").forEach((card) => {
      card.style.transform = "";
    });
  }

  function activateSensors() {
    if (!isGyroEnabled) return;
    const crystalCards = document.querySelectorAll(".hero-card-crystal");
    if (crystalCards.length === 0) return;

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === "granted" && !hasListener) {
            window.addEventListener(
              "deviceorientation",
              (e) => updateCardTilt(e, crystalCards),
              true,
            );
            hasListener = true;
          }
        })
        .catch(console.error);
    } else if (!hasListener) {
      window.addEventListener(
        "deviceorientation",
        (e) => updateCardTilt(e, crystalCards),
        true,
      );
      hasListener = true;
    }
  }

  function setupToggle() {
    const toggleInput = document.getElementById("wesusGyroToggle");
    if (!toggleInput) return;

    const storedSetting = localStorage.getItem(STORAGE_KEY);
    isGyroEnabled = storedSetting !== "false";
    toggleInput.checked = isGyroEnabled;

    if (!isGyroEnabled) resetTransforms();

    toggleInput.addEventListener("change", (e) => {
      isGyroEnabled = e.target.checked;
      localStorage.setItem(STORAGE_KEY, isGyroEnabled ? "true" : "false");

      if (!isGyroEnabled) {
        resetTransforms();
      } else {
        activateSensors();
      }
    });
  }

  function init() {
    setupToggle();
    document.addEventListener("click", activateSensors, { once: true });
    document.addEventListener("touchstart", activateSensors, { once: true });
  }

  return { init, activateSensors };
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

      el.style.transition = "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

      if (isVisible) {
        if (originals.has(el)) {
          el.textContent = originals.get(el);
          el.style.letterSpacing = "";
          el.style.filter = "";
        }
      } else {
        if (!originals.has(el)) originals.set(el, el.textContent.trim());
        el.textContent = MASK;
        el.style.letterSpacing = "0.15em";
        el.style.filter = "blur(10px)";
      }
    });
  }

  function init() {
    SELECTORS.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) originals.set(el, el.textContent.trim());
    });

    document.querySelectorAll(".button-eye").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggle();
        btn.style.opacity = isVisible ? "1" : "0.4";
      });
    });
  }
  return { init, updateOriginal: (el, val) => originals.set(el, val) };
})();

/* ── GREETING DYNAMIC ─────────────────────────────────────── */
const GreetingController = (() => {
  function update(nomeCompleto, genero) {
    const primeiroNome = nomeCompleto
      ? nomeCompleto.split(" ")[0]
      : "Investidor";
    const prefixo = genero === "F" ? "Bem-Vinda" : "Bem-Vindo";
    const text = `${prefixo}, ${primeiroNome}.`;

    document.querySelectorAll("h1").forEach((el) => {
      if (
        el.classList.contains("font-playfair") &&
        (el.textContent.includes("Bem-Vindo") ||
          el.textContent.includes("Bem-Vinda") ||
          el.textContent.includes("Boa tarde"))
      ) {
        el.textContent = text;
      }
    });
  }
  return { update };
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

/* ── MOTOR DE GESTÃO DINÂMICA DE PORTFÓLIO ── */
const PortfolioCarouselController = (() => {
  let portfolioContracts = [];
  let currentIndex = 0;
  let isAnimating = false;
  let targetCards = [];

  function setupSwipe(swipeSection) {
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
        if (
          Math.abs(currentX - touchStartX) > 30 &&
          Math.abs(currentX - touchStartX) > Math.abs(currentY - touchStartY)
        ) {
          isSwipeDetected = true;
        }
      },
      { passive: true },
    );

    swipeSection.addEventListener(
      "touchend",
      (e) => {
        if (!isSwipeDetected) return;
        const deltaX = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(deltaX) > 45) {
          triggerTransition(deltaX < 0 ? "next" : "prev");
        }
      },
      { passive: true },
    );
  }

  function renderContractState() {
    if (portfolioContracts.length === 0) return;
    const data = portfolioContracts[currentIndex];
    window.currentContractIndex = currentIndex;
    window.currentContractId = data.id; // 🌟 Guarda o ID do contrato ativo no slide atual

    const subtitle = document.getElementById("dashboardContractSubtitle");
    if (subtitle)
      subtitle.textContent = `${data.building} (${currentIndex + 1} de ${
        portfolioContracts.length
      })`;

    const chartTitle = document.getElementById("dynamicChartTitle");
    if (chartTitle)
      chartTitle.textContent = `Projeção de Rendimentos (${data.building})`;

    const xAxisEnd = document.getElementById("dynamicXAxisEnd");
    if (xAxisEnd) xAxisEnd.textContent = data.xAxis;

    const taxValue = document.getElementById("dynamicTaxValue");
    if (taxValue) taxValue.textContent = data.tax;

    const daysValue = document.getElementById("dynamicDaysValue");
    if (daysValue) daysValue.textContent = data.days;

    const tooltipVal = document.getElementById("tooltipValue");
    if (tooltipVal) tooltipVal.textContent = data.roi;

    const chronoArc = document.getElementById("dynamicChronoArc");
    if (chronoArc) chronoArc.setAttribute("stroke-dashoffset", data.arcOffset);

    if (typeof ChartDataController !== "undefined") {
      setTimeout(ChartDataController.alignTooltip, 20);
    }
  }

  function triggerTransition(direction) {
    if (isAnimating || portfolioContracts.length <= 1) return;
    isAnimating = true;

    const isNext = direction === "next";

    targetCards.forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = isNext ? "translateX(-12px)" : "translateX(12px)";
      card.style.transition = "all 0.2s cubic-bezier(0.25, 1, 0.5, 1)";
    });

    setTimeout(() => {
      if (isNext) {
        currentIndex = (currentIndex + 1) % portfolioContracts.length;
      } else {
        currentIndex =
          (currentIndex - 1 + portfolioContracts.length) %
          portfolioContracts.length;
      }
      renderContractState();

      targetCards.forEach((card) => {
        card.style.transition = "none";
        card.style.transform = isNext
          ? "translateX(12px)"
          : "translateX(-12px)";
        void card.offsetHeight;
        card.style.transition = "all 0.25s cubic-bezier(0.25, 1, 0.5, 1)";
        card.style.opacity = "1";
        card.style.transform = "translateX(0)";
      });

      setTimeout(() => {
        isAnimating = false;
      }, 250);
    }, 200);
  }

  function setContracts(contractsList) {
    portfolioContracts = contractsList;
    renderContractState();

    const prevBtn = document.getElementById("dashboardPrevContractBtn");
    const nextBtn = document.getElementById("dashboardNextContractBtn");

    if (prevBtn && nextBtn) {
      if (portfolioContracts.length <= 1) {
        [prevBtn, nextBtn].forEach((btn) => {
          btn.style.opacity = "0.3";
          btn.style.pointerEvents = "none";
          btn.classList.remove("hover:bg-white/10");
        });
      } else {
        [prevBtn, nextBtn].forEach((btn) => {
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
          btn.classList.add("hover:bg-white/10");
        });
      }
    }
  }

  function init() {
    const prevBtn = document.getElementById("dashboardPrevContractBtn");
    const nextBtn = document.getElementById("dashboardNextContractBtn");
    const swipeSection = document.querySelector(
      'section[onclick*="navigateToContract"]',
    );

    if (!prevBtn || !nextBtn || !swipeSection) return;

    targetCards = [
      swipeSection.querySelector(".lg\\:col-span-3 .hero-card-crystal"),
      ...swipeSection.querySelectorAll("aside .hero-card-crystal"),
    ].filter(Boolean);

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerTransition("next");
    });
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerTransition("prev");
    });
    setupSwipe(swipeSection);
  }

  return { init, setContracts };
})();

/* 🔥 ROTEADOR PRE-CARREGADO COM ALVO DE SCROLL NATIVO */
window.navigateToContract = () => {
  // 🌟 Busca o ID real que guardamos no Passo 2
  const contractId = window.currentContractId;
  if (!contractId) return;

  // Monta o ID exato do elemento HTML correspondente
  const targetId = `contract-${contractId}`;

  if (NavigationController) {
    NavigationController._setActive("documentos");
    NavigationController._switchTab("documentos");
  }

  setTimeout(() => {
    const targetCard = document.getElementById(targetId);
    if (targetCard) {
      // Faz o scroll suave até centralizar o card na tela
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

      // Aplica a sua animação CSS premium de piscar (whatsappFlashEffect)
      targetCard.classList.add("contract-highlight-pulse");

      setTimeout(() => {
        targetCard.classList.remove("contract-highlight-pulse");
      }, 2000);
    }
  }, 180);
};

/* ── 🔥 ROTEADOR INTELIGENTE DE HISTÓRICO COM VALIDAÇÃO DE ESTADO VAZIO ── */
window.navigateToHistory = () => {
  if (NavigationController) {
    NavigationController._setActive("documentos");
    NavigationController._switchTab("documentos");
  }

  setTimeout(() => {
    const historicalContainer = document.getElementById(
      "historicalContractsContainer",
    );

    if (historicalContainer) {
      const isEmptyState =
        historicalContainer.textContent.includes("Ainda não possui");

      if (!isEmptyState) {
        historicalContainer.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        historicalContainer.classList.add("contract-highlight-pulse");
        setTimeout(() => {
          historicalContainer.classList.remove("contract-highlight-pulse");
        }, 2000);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, 180);
};

/* ── 🌟 SOLUÇÃO INTERFACES: LIGHTBOX MODAL CONTROLLER ── */
const LightboxController = (() => {
  let currentImagesArray = [];
  let currentImageIndex = 0;

  function showImage(index) {
    const lightboxImg =
      document.getElementById("wSimpleLightboxImage") ||
      document.getElementById("wesusLightboxImage");
    if (!lightboxImg || currentImagesArray.length === 0) return;

    currentImageIndex =
      (index + currentImagesArray.length) % currentImagesArray.length;

    lightboxImg.style.opacity = "0";
    lightboxImg.src = currentImagesArray[currentImageIndex];
    setTimeout(() => {
      lightboxImg.style.opacity = "1";
    }, 40);
  }

  function init() {
    const modal = document.getElementById("wesusLightboxModal");
    const closeBtn = document.getElementById("wesusCloseLightboxBtn");
    const backdrop = document.getElementById("wesusLightboxBackdrop");
    const prevBtn = document.getElementById("wesusPrevLightboxBtn");
    const nextBtn = document.getElementById("wesusNextLightboxBtn");

    document.addEventListener("click", (e) => {
      const targetImg = e.target.closest(".wesus-gallery-thumb img");
      if (targetImg) {
        const parentGrid = targetImg.closest(".wesus-interior-grid");
        if (parentGrid) {
          const allImgs = Array.from(parentGrid.querySelectorAll("img"));
          currentImagesArray = allImgs.map(
            (img) => img.getAttribute("src") || img.src,
          );
          const clickedIndex = allImgs.indexOf(targetImg);

          if (modal) {
            modal.classList.add("active");
            showImage(clickedIndex);
          }
        }
      }
    });

    if (closeBtn)
      closeBtn.addEventListener(
        "click",
        () => modal && modal.classList.remove("active"),
      );
    if (backdrop)
      backdrop.addEventListener(
        "click",
        () => modal && modal.classList.remove("active"),
      );

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showImage(currentImageIndex - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showImage(currentImageIndex + 1);
      });
    }
  }

  return { init };
})();

/* ── INVESTMENT MODAL & SIMULATION CONTROLLER (AUTOMATED PIPELINE) ── */
const InvestmentModalController = (() => {
  let activeConditions = [];
  let selectedCondicaoId = null;

  async function fetchConditions() {
    try {
      const { data } = await supabaseClient
        .from("condicoes_comerciais")
        .select("*");
      if (data) activeConditions = data;
    } catch (err) {
      console.error("Erro ao pré-carregar planos comerciais:", err.message);
    }
  }

  function init() {
    fetchConditions();

    const modal = document.getElementById("wesusInvestmentModal");
    const backdrop = document.getElementById("wesusInvestmentBackdrop");
    const closeBtn = document.getElementById("wesusCloseInvestmentBtn");
    const form = document.getElementById("wesusInvestmentForm");
    const planSubtitle = document.getElementById("modalPlanSubtitle");
    const amountInput = document.getElementById("investAmount");
    const errorMsg = document.getElementById("amountErrorMsg");

    if (!modal || !form) return;

    const openModal = (e, btn) => {
      e.preventDefault();
      e.stopPropagation();

      const metaRow = document.getElementById("modalPlanMetaRow");
      const periodEl = document.getElementById("modalPlanPeriod");
      const taxDisplayEl = document.getElementById("modalPlanTax");
      const dateInput = document.getElementById("investDate");

      if (dateInput) {
        const hoje = new Date().toISOString().split("T")[0];
        dateInput.min = hoje;
        dateInput.value = hoje;
      }

      let contextName = "Alocação de Portfólio Restrito";
      let planPeriod = "";
      let planTax = "";

      const cardParent =
        btn.closest(".hero-card-crystal") ||
        document.querySelector(".opportunities-special-section");

      if (btn.closest(".hero-card-crystal")) {
        const titleEl = btn
          .closest(".hero-card-crystal")
          .querySelector("h4, h3");
        if (titleEl) contextName = titleEl.textContent.trim();
      } else if (
        cardParent &&
        cardParent.classList.contains("opportunities-special-section")
      ) {
        contextName = "Nova Oportunidade Relâmpago";
      }

      let monthsTarget = 6;
      let isRelampago = contextName.toLowerCase().includes("relâmpago");

      if (
        contextName.toLowerCase().includes("3 meses") ||
        contextName.toLowerCase().includes("curto prazo") ||
        isRelampago
      ) {
        monthsTarget = 3;
        planPeriod = "3 Meses";

        if (isRelampago) {
          planTax = "Retorno: 10%";
          const matchedPlan = activeConditions.find(
            (c) =>
              c.prazo_meses === 3 &&
              c.categoria.toLowerCase().includes("premium"),
          );
          selectedCondicaoId = matchedPlan ? matchedPlan.id : null;
        } else {
          planTax = "Retorno: 6,25%";
          const matchedPlan = activeConditions.find(
            (c) =>
              c.prazo_meses === 3 &&
              c.categoria.toLowerCase().includes("standard"),
          );
          selectedCondicaoId = matchedPlan ? matchedPlan.id : null;
        }
      } else if (
        contextName.toLowerCase().includes("12 meses") ||
        contextName.toLowerCase().includes("performance")
      ) {
        monthsTarget = 12;
        planPeriod = "12 Meses";
        planTax = "Retorno: 25%";

        const matchedPlan = activeConditions.find((c) => c.prazo_meses === 12);
        selectedCondicaoId = matchedPlan ? matchedPlan.id : null;
      } else {
        monthsTarget = 6;
        planPeriod = "6 Meses";
        planTax = "Retorno: 12.5%";

        const matchedPlan = activeConditions.find((c) => c.prazo_meses === 6);
        selectedCondicaoId = matchedPlan ? matchedPlan.id : null;
      }

      if (!selectedCondicaoId && activeConditions.length > 0) {
        selectedCondicaoId = activeConditions[0].id;
      }

      if (planSubtitle) planSubtitle.textContent = `Modalidade: ${contextName}`;
      if (periodEl) periodEl.textContent = planPeriod;
      if (taxDisplayEl)
        taxDisplayEl.textContent = planTax.replace("Retorno: ", "");
      if (metaRow) metaRow.style.setProperty("display", "grid", "important");

      form.reset();
      if (errorMsg) errorMsg.classList.add("hidden");
      if (amountInput) amountInput.style.borderColor = "";

      modal.classList.add("active");
    };

    const closeModal = () => modal.classList.remove("active");

    document.querySelectorAll('[data-modal="investment"]').forEach((btn) => {
      btn.addEventListener("click", (e) => openModal(e, btn));
    });

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

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

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const amountValue = parseFloat(amountInput.value);

      if (isNaN(amountValue) || amountValue < 5000) {
        if (errorMsg) errorMsg.classList.remove("hidden");
        return;
      }

      try {
        const sessionToken = await getValidWesusToken();
        const userRaw = sessionStorage.getItem("wesus_user");
        if (!sessionToken || !userRaw) throw new Error("Sessão Inválida");
        const user = JSON.parse(userRaw);

        const dataPretendida = document.getElementById("investDate").value;

        const { error } = await supabaseClient
          .from("leads_investimento")
          .insert([
            {
              utilizador_id: user.id,
              condicao_id: selectedCondicaoId,
              valor_pretendido: amountValue,
              data_inicio_pretendida: dataPretendida,
            },
          ]);

        if (error) throw error;

        try {
          fetch(`${CLOUDFLARE_PROXY_URL}/api/notify-lead`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              record: {
                utilizador_id: user.id,
                condicao_id: selectedCondicaoId,
                valor_pretendido: amountValue,
                data_inicio_pretendida: dataPretendida,
              },
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const errorBodyText = await res.text();
              console.error(
                "[DIRECT SMTP ERROR] O Proxy rejeitou o pedido:",
                res.status,
                errorBodyText,
              );
            } else {
              console.log(
                "[DIRECT SMTP SUCCESS] Proxy de comunicação processou com sucesso:",
                res.status,
              );
            }
          });
        } catch (mailErr) {
          console.error(
            "[DIRECT SMTP ERROR] Falha física ao contactar a Edge da Cloudflare:",
            mailErr,
          );
        }

        modal.classList.add("success-active");
        setTimeout(() => {
          closeModal();
          setTimeout(() => {
            modal.classList.remove("success-active");
            form.reset();
          }, 500);
        }, 3200);
      } catch (err) {
        alert(`Erro ao registar intenção: ${err.message}`);
      }
    });
  }

  return { init };
})();

/* ── ANNUAL PERFORMANCE CONTROLLER (DROPDOWN PIPELINE V30) ── */
const AnnualPerformanceController = (() => {
  let annualDataMap = {};

  function updatePerformanceData(key, isAllTime = false) {
    const capitalEl = document.getElementById("annualInvestedCapital");
    const profitEl = document.getElementById("annualRealizedProfit");
    const labelEl = document.getElementById("selectedYearLabel");
    const allTimeBtn = document.getElementById("annualAllTimeBtn");
    const dropdownBtn = document.getElementById("annualYearDropdownBtn");
    const dropdownMenu = document.getElementById("annualYearDropdownMenu");

    const data = annualDataMap[key];
    if (!data || !capitalEl || !profitEl) return;

    labelEl.textContent = isAllTime
      ? "Selecionar Ano"
      : key === "2026"
      ? "2026 (Atual)"
      : key;
    capitalEl.textContent = data.capital;
    profitEl.textContent = data.profit;

    if (dropdownMenu) {
      dropdownMenu.querySelectorAll("button").forEach((btn) => {
        const btnYear = btn.getAttribute("data-year");
        if (btnYear === key && !isAllTime) {
          btn.style.setProperty("color", "#E8D08D", "important");
        } else {
          btn.style.setProperty(
            "color",
            "rgba(255, 255, 255, 0.6)",
            "important",
          );
        }
      });
    }

    if (isAllTime) {
      if (allTimeBtn) {
        allTimeBtn.classList.add("active");
        allTimeBtn.classList.remove("inactive");
      }
      if (dropdownBtn) {
        dropdownBtn.classList.add("inactive");
        dropdownBtn.classList.remove("active");
      }
    } else {
      if (allTimeBtn) {
        allTimeBtn.classList.add("inactive");
        allTimeBtn.classList.remove("active");
      }
      if (dropdownBtn) {
        dropdownBtn.classList.add("active");
        dropdownBtn.classList.remove("inactive");
      }
    }
    if (dropdownMenu) dropdownMenu.classList.add("hidden");
  }

  function setAnnualData(dataMap) {
    annualDataMap = dataMap;
    // 🌟 Altera para puxar a chave global "all" e ativar o estado de AllTime
    updatePerformanceData("all", true);
  }
  function init() {
    const dropdownBtn = document.getElementById("annualYearDropdownBtn");
    const dropdownMenu = document.getElementById("annualYearDropdownMenu");
    const allTimeBtn = document.getElementById("annualAllTimeBtn");

    if (!dropdownBtn || !dropdownMenu || !allTimeBtn) return;

    dropdownBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");
    });

    dropdownMenu.querySelectorAll("button").forEach((menuBtn) => {
      menuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const year = menuBtn.getAttribute("data-year");
        updatePerformanceData(year, false);
      });
    });

    allTimeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      updatePerformanceData("all", true);
    });
  }

  return { init, setAnnualData };
})();

/* ── ASSET DETAILS MODAL CONTROLLER ── */
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

    if (!tabInterior || !tabDocs) return;

    const switchPane = (target) => {
      if (target === "interior") {
        tabInterior.classList.add("active");
        tabDocs.classList.remove("active");
        if (paneInterior) paneInterior.classList.remove("hidden");
        if (paneDocs) paneDocs.classList.add("hidden");
      } else {
        tabDocs.classList.add("active");
        tabInterior.classList.remove("active");
        if (paneDocs) paneDocs.classList.remove("hidden");
        if (paneInterior) paneInterior.classList.add("hidden");
      }
    };

    tabInterior.addEventListener("click", () => switchPane("interior"));
    tabDocs.addEventListener("click", () => switchPane("docs"));

    const closeModal = () => {
      if (modal) modal.classList.remove("active");
      setTimeout(() => {
        if (coverImg) coverImg.style.opacity = "0";
      }, 350);
    };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
  }

  return { init };
})();

/* ── ACCOUNT SETTINGS CONTROLLER (PROFILE & SECURITY PIPELINE) ── */
const AccountSettingsController = (() => {
  function init() {
    const btnSaveProfile = document.getElementById("btnSaveProfile");
    const btnUpdatePassword = document.getElementById("btnUpdatePassword");
    const toggleEyeBtn = document.getElementById("toggleNewPasswordView");

    const biometricRow = document.getElementById("biometricSettingsRow");
    if (biometricRow) {
      const isNativeApp =
        window.Capacitor && window.Capacitor.isNativePlatform();
      if (!isNativeApp) {
        biometricRow.style.setProperty("display", "none", "important");
      }
    }

    if (toggleEyeBtn) {
      toggleEyeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById("inputNewPassword");

        if (passwordInput && passwordInput.type === "password") {
          passwordInput.type = "text";
          toggleEyeBtn.style.opacity = "1";
        } else if (passwordInput) {
          passwordInput.type = "password";
          toggleEyeBtn.style.opacity = "0.6";
        }
      });
    }

    if (btnSaveProfile) {
      btnSaveProfile.addEventListener("click", async (e) => {
        e.preventDefault();

        const userRaw = sessionStorage.getItem("wesus_user");
        if (!userRaw) return;
        const user = JSON.parse(userRaw);

        const nome = document.getElementById("inputProfileName").value.trim();
        const email = document.getElementById("inputProfileEmail").value.trim();
        const telemovel = document
          .getElementById("inputProfilePhone")
          .value.trim();

        if (nome.length < 3) {
          alert("O nome deve ter pelo menos 3 caracteres.");
          return;
        }

        try {
          btnSaveProfile.textContent = "A Guardar...";
          btnSaveProfile.disabled = true;

          const { error } = await supabaseClient
            .from("utilizadores")
            .update({ nome_completo: nome, email: email, telemovel: telemovel })
            .eq("id", user.id);

          if (error) throw error;

          const sidebarNameEl = document.getElementById("sidebarUserName");
          const settingsNameEl = document.getElementById("settingsAccountName");

          if (sidebarNameEl) sidebarNameEl.textContent = nome;
          if (settingsNameEl) settingsNameEl.textContent = nome;

          const successModal = document.getElementById(
            "wesusProfileSuccessModal",
          );
          if (successModal) {
            successModal.querySelector("h4").textContent = "Alterações Salvas!";
            successModal.querySelector("p").textContent =
              "O seu perfil de investidor foi atualizado com sucesso.";
            successModal.classList.add("active");
            setTimeout(() => successModal.classList.remove("active"), 2000);
          }
        } catch (err) {
          alert(`Erro ao guardar alterações: ${err.message}`);
        } finally {
          btnSaveProfile.textContent = "Salvar Alterações";
          btnSaveProfile.disabled = false;
        }
      });
    }

    if (btnUpdatePassword) {
      btnUpdatePassword.addEventListener("click", async (e) => {
        e.preventDefault();

        const userRaw = sessionStorage.getItem("wesus_user");
        if (!userRaw) return;
        const user = JSON.parse(userRaw);

        const senhaAtual = document.getElementById(
          "inputCurrentPassword",
        ).value;
        const novaSenha = document.getElementById("inputNewPassword").value;

        if (!senhaAtual || novaSenha.length < 8) {
          alert(
            "Por favor, preencha a senha atual e defina uma nova com no mínimo 8 caracteres.",
          );
          return;
        }

        try {
          btnUpdatePassword.textContent = "A verificar...";
          btnUpdatePassword.disabled = true;

          const { error: authError } =
            await supabaseClient.auth.signInWithPassword({
              email: user.email,
              password: senhaAtual,
            });

          if (authError) {
            throw new Error(
              "A senha atual digitada está incorreta. Tente novamente.",
            );
          }

          btnUpdatePassword.textContent = "A atualizar...";
          const { error: updateError } = await supabaseClient.auth.updateUser({
            password: novaSenha,
          });

          if (updateError) throw updateError;

          const successModal = document.getElementById(
            "wesusProfileSuccessModal",
          );
          if (successModal) {
            successModal.querySelector("h4").textContent = "Senha Alterada!";
            successModal.querySelector("p").textContent =
              "As suas credenciais de segurança foram redefinidas.";
            successModal.classList.add("active");
            setTimeout(() => successModal.classList.remove("active"), 2000);
          }

          document.getElementById("inputCurrentPassword").value = "";
          document.getElementById("documento")
            ? ""
            : (document.getElementById("inputNewPassword").value = "");
        } catch (err) {
          alert(err.message);
        } finally {
          btnUpdatePassword.textContent = "Atualizar Senha";
          btnUpdatePassword.disabled = false;
        }
      });
    }

    const avatarContainerSettings = document.getElementById(
      "avatarContainerSettings",
    );
    const inputAvatarFile = document.getElementById("inputAvatarFile");
    const btnDeleteAvatar = document.getElementById("btnDeleteAvatar");
    const sidebarAvatarImg = document.getElementById("sidebarAvatar");

    if (avatarContainerSettings && inputAvatarFile) {
      avatarContainerSettings.addEventListener("click", (e) => {
        e.preventDefault();
        inputAvatarFile.click();
      });
    }

    if (inputAvatarFile) {
      inputAvatarFile.addEventListener("change", async (event) => {
        const originFile = event.target.files[0];
        if (!originFile) return;

        const userRaw = sessionStorage.getItem("wesus_user");
        if (!userRaw) return;
        const user = JSON.parse(userRaw);
        const userId = user.id;

        const localBlobUrl = URL.createObjectURL(originFile);
        const sidebarImgEl = document.getElementById("sidebarAvatar");
        const settingsImgEl = document.getElementById("settingsAccountAvatar");
        const placeholderEl = document.getElementById(
          "settingsAvatarPlaceholder",
        );

        if (settingsImgEl) {
          settingsImgEl.src = localBlobUrl;
          settingsImgEl.style.setProperty("width", "100%", "important");
          settingsImgEl.style.setProperty("height", "100%", "important");
          settingsImgEl.style.setProperty("object-fit", "cover", "important");
          settingsImgEl.style.setProperty("display", "block", "important");
        }
        if (placeholderEl)
          placeholderEl.style.setProperty("display", "none", "important");
        if (sidebarImgEl) {
          sidebarImgEl.src = localBlobUrl;
          sidebarImgEl.style.setProperty("display", "block", "important");
          const sidebarRing = sidebarImgEl.parentElement;
          if (sidebarRing && sidebarRing.querySelector(".sidebar-initial")) {
            sidebarRing.querySelector(".sidebar-initial").remove();
          }
        }
        if (btnDeleteAvatar) {
          btnDeleteAvatar.classList.remove("hidden");
          btnDeleteAvatar.style.setProperty("display", "block", "important");
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          const img = new Image();
          img.onload = function () {
            const canvas = document.createElement("canvas");
            const maxDimension = 256;
            canvas.width = maxDimension;
            canvas.height = maxDimension;

            const ctx = canvas.getContext("2d");

            let sx = 0;
            let sy = 0;
            let sWidth = img.width;
            let sHeight = img.height;

            if (img.width > img.height) {
              sWidth = img.height;
              sx = (img.width - img.height) / 2;
            } else if (img.height > img.width) {
              sHeight = img.width;
              sy = (img.height - img.width) / 2;
            }

            ctx.drawImage(
              img,
              sx,
              sy,
              sWidth,
              sHeight,
              0,
              0,
              maxDimension,
              maxDimension,
            );

            const fallbackAvatarUrl = user.avatar_url;

            canvas.toBlob(
              async (webpBlob) => {
                try {
                  const token = await getValidWesusToken();
                  if (!token) throw new Error("Sessão expirada.");

                  const response = await fetch(
                    `${CLOUDFLARE_PROXY_URL}/profiles/${userId}/avatar.webp`,
                    {
                      method: "PUT",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "image/webp",
                      },
                      body: webpBlob,
                    },
                  );

                  if (!response.ok)
                    throw new Error("Erro na escrita física do storage proxy.");

                  const publicAvatarUrl = `${CLOUDFLARE_PROXY_URL}/profiles/${userId}/avatar.webp`;

                  const { error } = await supabaseClient
                    .from("utilizadores")
                    .update({ avatar_url: publicAvatarUrl })
                    .eq("id", userId);

                  if (error) throw error;

                  user.avatar_url = publicAvatarUrl;
                  sessionStorage.setItem("wesus_user", JSON.stringify(user));

                  const cacheBustedUrl = `${publicAvatarUrl}?t=${Date.now()}`;
                  if (settingsImgEl) settingsImgEl.src = cacheBustedUrl;
                  if (sidebarImgEl) sidebarImgEl.src = cacheBustedUrl;

                  console.log("Substituição física (.webp) concluída!");
                } catch (err) {
                  console.error("Erro na sincronização de background:", err);
                  alert("Não foi possível persistir a imagem. A reverter.");
                  if (fallbackAvatarUrl) {
                    if (settingsImgEl) settingsImgEl.src = fallbackAvatarUrl;
                    if (sidebarImgEl) sidebarImgEl.src = fallbackAvatarUrl;
                  } else {
                    if (settingsImgEl) settingsImgEl.style.display = "none";
                    if (placeholderEl) placeholderEl.style.display = "flex";
                    if (sidebarImgEl) sidebarImgEl.style.display = "none";
                  }
                }
              },
              "image/webp",
              0.85,
            );
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(originFile);
      });
    }

    if (btnDeleteAvatar) {
      btnDeleteAvatar.addEventListener("click", async (e) => {
        e.preventDefault();
        if (
          !confirm("Tens a certeza que desejas remover a tua foto de perfil?")
        )
          return;

        const userRaw = sessionStorage.getItem("wesus_user");
        if (!userRaw) return;
        const user = JSON.parse(userRaw);
        const userId = user.id;

        const currentName =
          document.getElementById("inputProfileName")?.value ||
          document.getElementById("settingsAccountName")?.textContent ||
          "";
        const initialLetter = currentName.trim()
          ? currentName.trim().charAt(0).toUpperCase()
          : "W";

        const sidebarImgEl = document.getElementById("sidebarAvatar");
        const settingsImgEl = document.getElementById("settingsAccountAvatar");
        const placeholderEl = document.getElementById(
          "settingsAvatarPlaceholder",
        );

        if (settingsImgEl) {
          settingsImgEl.style.setProperty("display", "none", "important");
          settingsImgEl.src = "";
        }
        if (placeholderEl) {
          placeholderEl.style.setProperty("display", "flex", "important");
        }
        if (sidebarImgEl) {
          sidebarImgEl.style.display = "none";
          const sidebarRing = sidebarImgEl.parentElement;
          if (sidebarRing) {
            let initialDiv = sidebarRing.querySelector(".sidebar-initial");
            if (!initialDiv) {
              initialDiv = document.createElement("div");
              initialDiv.className =
                "sidebar-initial w-full h-full flex items-center justify-center text-xs font-bold text-[#E8D08D] font-inter uppercase tracking-wide";
              sidebarRing.appendChild(initialDiv);
            }
            initialDiv.textContent = initialLetter;
          }
        }
        btnDeleteAvatar.classList.add("hidden");
        btnDeleteAvatar.style.setProperty("display", "none", "important");

        try {
          const { error } = await supabaseClient
            .from("utilizadores")
            .update({ avatar_url: null })
            .eq("id", userId);

          if (error) throw error;

          user.avatar_url = null;
          sessionStorage.setItem("wesus_user", JSON.stringify(user));
          if (inputAvatarFile) inputAvatarFile.value = "";
        } catch (err) {
          console.error("Erro ao remover avatar:", err);
        }
      });
    }

    const btnWesusLogout = document.getElementById("btnWesusLogout");
    if (btnWesusLogout) {
      btnWesusLogout.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Deseja realmente encerrar a sua sessão no portal?")) {
          sessionStorage.clear();
          window.location.href = "index.html";
        }
      });
    }
  }

  return { init };
})();

/* ── 🌟 CENTRAL DATABASE ENGINE CONTROLLER (THE CORE ARCHITECT) ── */
const DatabaseController = (() => {
  async function checkRouteGuard() {
    const token = await getValidWesusToken();
    const userRaw = sessionStorage.getItem("wesus_user");

    if (!token || !userRaw) {
      window.location.href = "index.html";
      return null;
    }
    return JSON.parse(userRaw);
  }

  async function downloadContractPDF(pdfUrlPath) {
    try {
      if (!pdfUrlPath) {
        alert("Documento contratual não associado a esta conta.");
        return;
      }

      // Captura o estado da sessão para ler o UUID do investidor logado
      const sessionUserRaw = sessionStorage.getItem("wesus_user");
      if (!sessionUserRaw) throw new Error("Sessão ou utilizador inválido.");
      const user = JSON.parse(sessionUserRaw);

      // 1. Limpa o caminho extraindo apenas o pathname relativo se for URL cheia
      let cleanPath = pdfUrlPath;
      if (
        pdfUrlPath.startsWith("http://") ||
        pdfUrlPath.startsWith("https://")
      ) {
        const urlObj = new URL(pdfUrlPath);
        cleanPath = urlObj.pathname;
      }

      if (cleanPath.startsWith("/")) {
        cleanPath = cleanPath.substring(1);
      }

      // 🎯 CURA DA ROTA: Se aponta para contratos mas falta a pasta do UUID do utilizador...
      if (cleanPath.startsWith("contratos/") && !cleanPath.includes(user.id)) {
        const filename = cleanPath.replace("contratos/", "");
        cleanPath = `contratos/${user.id}/${filename}`;
        console.log(
          `[ROUTING DEFENSIVO] Subpasta UUID injetada dinamicamente: ${cleanPath}`,
        );
      }

      const token = await getValidWesusToken();
      const targetUrl = `${CLOUDFLARE_PROXY_URL}/${cleanPath}`;

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok)
        throw new Error("Erro ao transferir documento do Storage privado.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = cleanPath.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(`Falha de segurança no Storage: ${err.message}`);
    }
  }
  async function loadDashboardData(user) {
    try {
      const [profileRes, contractsRes, assetsRes] = await Promise.all([
        supabaseClient
          .from("utilizadores")
          .select("*")
          .eq("id", user.id)
          .single(),
        supabaseClient
          .from("vw_contratos_detalhados")
          .select("*")
          .eq("utilizador_id", user.id),
        supabaseClient.from("ativos_imobiliarios").select("*"),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (contractsRes.error) throw contractsRes.error;
      if (assetsRes.error) throw assetsRes.error;

      const profile = profileRes.data;
      const contracts = contractsRes.data || [];
      const realAssets = assetsRes.data || [];

      const sidebarNameEl = document.getElementById("sidebarUserName");
      const settingsNameEl = document.getElementById("settingsAccountName");
      const settingsFiliationEl = document.getElementById(
        "settingsAccountFiliation",
      );

      if (sidebarNameEl)
        sidebarNameEl.textContent = profile.nome_completo || "Investidor";
      if (settingsNameEl)
        settingsNameEl.textContent = profile.nome_completo || "Investidor";

      const anoFiliacao = profile.data_filiacao
        ? new Date(profile.data_filiacao).getFullYear()
        : 2026;
      if (settingsFiliationEl)
        settingsFiliationEl.textContent = `Membro Premium desde ${anoFiliacao}`;

      GreetingController.update(profile.nome_completo, profile.genero);

      const inputName = document.getElementById("inputProfileName");
      const inputEmail = document.getElementById("inputProfileEmail");
      const inputPhone = document.getElementById("inputProfilePhone");
      const inputNif = document.getElementById("inputProfileNif");

      if (inputName) inputName.value = profile.nome_completo || "";
      if (inputEmail) inputEmail.value = profile.email || "";
      if (inputPhone) inputPhone.value = profile.telemovel || "";
      if (inputNif)
        inputNif.value = profile.nif
          ? profile.nif.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")
          : "";

      const sidebarImgEl = document.getElementById("sidebarAvatar");
      const settingsImgEl = document.getElementById("settingsAccountAvatar");
      const placeholderEl = document.getElementById(
        "settingsAvatarPlaceholder",
      );
      const btnDeleteAvatar = document.getElementById("btnDeleteAvatar");

      if (profile.avatar_url) {
        const cacheBustedUrl = `${profile.avatar_url}?t=${Date.now()}`;

        if (sidebarImgEl) {
          sidebarImgEl.src = cacheBustedUrl;
          sidebarImgEl.style.display = "block";
          const sidebarRing = sidebarImgEl.parentElement;
          if (sidebarRing) {
            const oldInitial = sidebarRing.querySelector(".sidebar-initial");
            if (oldInitial) oldInitial.remove();
          }
        }
        if (settingsImgEl) {
          settingsImgEl.src = cacheBustedUrl;
          settingsImgEl.style.setProperty("display", "block", "important");
        }
        if (placeholderEl) {
          placeholderEl.style.setProperty("display", "none", "important");
        }
        if (btnDeleteAvatar) {
          btnDeleteAvatar.classList.remove("hidden");
          btnDeleteAvatar.style.setProperty("display", "block", "important");
        }
      } else {
        const initialLetter = profile.nome_completo
          ? profile.nome_completo.trim().charAt(0).toUpperCase()
          : "W";

        if (sidebarImgEl) {
          sidebarImgEl.style.display = "none";
          const sidebarRing = sidebarImgEl.parentElement;
          if (sidebarRing) {
            let initialDiv = sidebarRing.querySelector(".sidebar-initial");
            if (!initialDiv) {
              initialDiv = document.createElement("div");
              initialDiv.className =
                "sidebar-initial w-full h-full flex items-center justify-center text-xs font-bold text-[#E8D08D] font-inter uppercase tracking-widest";
              sidebarRing.appendChild(initialDiv);
            }
            initialDiv.textContent = initialLetter;
          }
        }
        if (settingsImgEl) {
          settingsImgEl.style.setProperty("display", "none", "important");
          settingsImgEl.src = "";
        }
        if (placeholderEl) {
          placeholderEl.style.setProperty("display", "flex", "important");
        }
        if (btnDeleteAvatar) {
          btnDeleteAvatar.classList.add("hidden");
          btnDeleteAvatar.style.setProperty("display", "none", "important");
        }
      }

      let capitalAcumulado = 0;
      let roiAcumulado = 0;
      let sliderContractsArray = [];

      let acumuladorAnual = {
        2026: { capital: 0, profit: 0 },
        2025: { capital: 0, profit: 0 },
        2024: { capital: 0, profit: 0 },
        all: { capital: 0, profit: 0 },
      };

      const activeContainer = document.getElementById(
        "activeContractsContainer",
      );
      const historicalContainer = document.getElementById(
        "historicalContractsContainer",
      );
      const assetsTableBody = document.getElementById("assetsTableBody");
      const heroAssetsCountEl = document.getElementById("heroAssetsCount");
      const assetsMobileCarousel = document.getElementById(
        "assetsMobileCarousel",
      );

      const activeContractsList = contracts.filter(
        (ctr) => ctr.status_termo === "Ativo em Curso",
      );
      const historicalContractsList = contracts.filter(
        (ctr) => ctr.status_termo !== "Ativo em Curso",
      );

      // 🎯 ALTERAÇÃO AQUI: Atualiza o contador de contratos em execução na aba Contratos
      const contractsActiveTitle = document.getElementById(
        "contractsActiveTitle",
      );
      if (contractsActiveTitle) {
        contractsActiveTitle.textContent = `Contratos em Execução (${activeContractsList.length})`;
      }

      // ✨ NOVA INJEÇÃO SÊNIOR: Atualiza o (-) do cabeçalho principal com o valor real
      if (heroAssetsCountEl) {
        heroAssetsCountEl.textContent = `(${activeContractsList.length})`;
      }

      // Se o usuário NÃO tem contratos ativos, mas POSSUI histórico antigo...

      // Se o usuário NÃO tem contratos ativos, mas POSSUI histórico antigo
      if (
        activeContractsList.length === 0 &&
        historicalContractsList.length > 0
      ) {
        let historicCapital = 0;
        let historicRoi = 0;

        // Calcula os valores de tudo o que já foi finalizado
        historicalContractsList.forEach((ctr) => {
          historicCapital += parseFloat(ctr.capital_investido) || 0;
          historicRoi += parseFloat(ctr.rendimento_liquido) || 0;
        });

        const totalMovimentado = historicCapital + historicRoi;

        // 1. Atualiza o Card Hero Principal com o Histórico Consolidado
        const heroLabel = document.querySelector('p[class*="tracking-widest"]');
        if (heroLabel)
          heroLabel.textContent = "Histórico Total Movimentado (Concluído)";

        const patrimonyHeading = document.getElementById("patrimonyHeading");
        if (patrimonyHeading) {
          const formatted = `€ ${totalMovimentado.toLocaleString("pt-PT", {
            minimumFractionDigits: 2,
          })}`;
          patrimonyHeading.textContent = formatted;
          BalanceVisibility.updateOriginal(patrimonyHeading, formatted);
        }

        const heroCapitalHeading =
          document.getElementById("heroCapitalHeading");
        if (heroCapitalHeading) {
          heroCapitalHeading.textContent = `€ ${historicCapital.toLocaleString(
            "pt-PT",
            { minimumFractionDigits: 2 },
          )}`;
        }

        const heroRoiHeading = document.getElementById("heroRoiHeading");
        if (heroRoiHeading) {
          heroRoiHeading.textContent = `+ € ${historicRoi.toLocaleString(
            "pt-PT",
            { minimumFractionDigits: 2 },
          )}`;
        }

        // 2. Modifica a Seção do Gráfico para um Call To Action Amigável
        const chartTitle = document.getElementById("dynamicChartTitle");
        if (chartTitle) chartTitle.textContent = "Status do Portfólio Atual";

        const chartContainer = document.getElementById("chartContainer");
        if (chartContainer) {
          chartContainer.className =
            "w-full flex-1 relative z-10 flex flex-col justify-center items-center mt-2 min-h-[140px]";

          chartContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] border border-white/5 rounded-2xl min-h-[160px] w-full animate-fade-in">
              <p class="text-sm font-bold text-gold mb-1.5">Todos os seus contratos foram concluídos!</p>
              <p class="text-[11px] text-white/50 max-w-md mb-4 font-inter leading-relaxed">
                O seu capital e os seus rendimentos contratados já foram totalmente pagos e transferidos. 
                Visite a aba de Oportunidades para iniciar uma nova alocação e manter o seu patrimônio a render.
              </p>
              <button onclick="if(typeof NavigationController !== 'undefined') { NavigationController._setActive('oportunidades'); NavigationController._switchTab('oportunidades');}" 
                      class="btn-gold-lingot !py-2.5 !px-5 !text-[10px] !text-white uppercase tracking-widest font-bold">
                Ver Novas Oportunidades
              </button>
            </div>
          `;
        }

        // 3. Modifica os Widgets Laterais para o Modo Estático Concluído
        const taxValue = document.getElementById("dynamicTaxValue");
        if (taxValue) {
          const parentTaxContainer = taxValue.parentElement;
          if (parentTaxContainer) {
            parentTaxContainer.className =
              "flex items-center justify-center z-10 mt-1 w-full text-center";
            parentTaxContainer.innerHTML = `<span class="text-sm lg:text-base font-bold uppercase tracking-widest" style="color: #6FCF97; drop-shadow: 0 0 8px rgba(111,207,151,0.35);">Concluído</span>`;
          }
          const cardCrystal = taxValue.closest(".hero-card-crystal");
          if (cardCrystal) {
            const bottomLabel = cardCrystal.querySelector("span:last-child");
            if (bottomLabel) bottomLabel.textContent = "Retorno Fixo";
          }
        }

        const daysValue = document.getElementById("dynamicDaysValue");
        if (daysValue) {
          daysValue.textContent = "0";
          daysValue.className =
            "text-3xl lg:text-4xl font-bold text-gold-liquid leading-none tracking-tight text-center w-full block";

          const daysLabel = daysValue.nextElementSibling;
          if (daysLabel) {
            daysLabel.textContent = "Concluído";
            daysLabel.style.color = "#6FCF97";
            daysLabel.className =
              "text-[8px] lg:text-[9px] uppercase tracking-widest font-bold mt-1.5 text-center w-full block";
          }
        }

        const chronoArc = document.getElementById("dynamicChronoArc");
        if (chronoArc) {
          chronoArc.setAttribute("stroke-dashoffset", "264");
        }

        const subtitle = document.getElementById("dashboardContractSubtitle");
        if (subtitle) subtitle.textContent = "Nenhum contrato ativo de momento";

        // 4. Aplica opacidade desabilitada aos botões de paginação por falta de contratos ativos
        const prevBtn = document.getElementById("dashboardPrevContractBtn");
        const nextBtn = document.getElementById("dashboardNextContractBtn");
        if (prevBtn && nextBtn) {
          [prevBtn, nextBtn].forEach((btn) => {
            btn.style.opacity = "0.3";
            btn.style.pointerEvents = "none";
            btn.classList.remove("hover:bg-white/10");
          });
        }
      } // 🌟 Estrutura fechada em segurança contra crashes de layout.

      // Daqui para baixo, o fluxo segue linear perfeito para quem possui contratos ativos correntes!
      activeContractsList.forEach((ctr, idx) => {
        const cap = parseFloat(ctr.capital_investido);
        const roi = parseFloat(ctr.rendimento_liquido);

        capitalAcumulado += cap;
        roiAcumulado += roi;

        const yearStart = new Date(ctr.data_inicio).getFullYear();
        if (acumuladorAnual[yearStart]) {
          acumuladorAnual[yearStart].capital += cap;
          acumuladorAnual[yearStart].profit += roi;
        }
        acumuladorAnual["all"].capital += cap;
        acumuladorAnual["all"].profit += roi;

        const realTaxRate = ((roi / cap) * 100).toFixed(1).replace(".0", "");

        const matchedAsset = realAssets.find((a) => a.id === ctr.ativo_id);
        const assetName = matchedAsset
          ? matchedAsset.nome_ativo
          : "Imóvel Private Office";
        const assetLocation = matchedAsset
          ? matchedAsset.localizacao
          : "Portugal";
        const assetTotalInvested = matchedAsset
          ? parseFloat(matchedAsset.investimento_total_ativo).toLocaleString(
              "pt-PT",
              { minimumFractionDigits: 2 },
            )
          : cap.toLocaleString("pt-PT", { minimumFractionDigits: 2 });

        const assetImageUrl =
          matchedAsset && matchedAsset.imagem_capa_url
            ? matchedAsset.imagem_capa_url
            : `${CLOUDFLARE_PROXY_URL}/assets/${ctr.ativo_id}/foto-1.webp`;

        const assetGallery =
          matchedAsset && Array.isArray(matchedAsset.galeria_fotos)
            ? matchedAsset.galeria_fotos
            : [];
        const assetDocs =
          matchedAsset &&
          matchedAsset.documentos_urls &&
          typeof matchedAsset.documentos_urls === "object" &&
          !Array.isArray(matchedAsset.documentos_urls)
            ? Object.entries(matchedAsset.documentos_urls).map(
                ([name, path]) => ({
                  name,
                  path,
                  size: "Consultar",
                  type: "PDF",
                }),
              )
            : [];

        // 💡 CORREÇÃO DA INTERPOLAÇÃO DO GOOGLE MAPS: Trocado '1{' pelo padrão correto do ES6 '${}'
        const assetMapsUrl =
          matchedAsset &&
          matchedAsset.maps_url &&
          matchedAsset.maps_url !== "https://maps.google.com"
            ? matchedAsset.maps_url
            : `http://googleusercontent.com/maps.google.com/${encodeURIComponent(
                assetName + ", " + assetLocation,
              )}`;

        const mockMeta = {
          name: assetName,
          location: assetLocation,
          total: assetTotalInvested,
          cover: assetImageUrl,
          gallery: assetGallery,
          docs: assetDocs,
          offset: idx === 0 ? 66 : idx === 1 ? 140 : 210,
          axis: idx === 0 ? "Mês 3" : idx === 1 ? "Mês 6" : "Mês 12",
        };

        sliderContractsArray.push({
          id: ctr.id,
          building: mockMeta.name,
          tax: realTaxRate,
          days: String(ctr.dias_restantes),
          arcOffset: ctr.dias_restantes > 0 ? mockMeta.offset : 264,
          roi: `+ € ${roi.toLocaleString("pt-PT", {
            minimumFractionDigits: 2,
          })}`,
          xAxis: `${mockMeta.axis} (Vencimento)`,
        });

        if (activeContainer) {
          activeContainer.innerHTML += buildContractCardHTML(ctr, idx);
        }

        // 📱 1. CARROSSEL MOBILE CONVERTIDO PARA ASSETS REAIS DO B2
        if (assetsMobileCarousel) {
          assetsMobileCarousel.style.alignItems = "";
          const mobileCardId = `asset-mobile-${idx}`;
          assetsMobileCarousel.innerHTML += `
            <article id="${mobileCardId}" class="snap-start shrink-0 w-80 carousel-asset-card carousel-asset-card-clean rounded-2xl overflow-hidden p-5 flex flex-col justify-between min-h-[175px] relative" style="cursor: pointer;">
              <div class="carousel-asset-image-mask" 
                   style="background-image: url('${assetImageUrl}'); 
                          position: absolute; 
                          inset: 0; 
                          background-size: cover; 
                          background-position: center; 
                          z-index: 0; ">
              </div>
              <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(11, 31, 58, 0.05) 0%, rgba(7, 19, 38, 0.01) 100%); z-index: 1;"></div>
              <div class="relative z-10 h-full flex flex-col justify-between w-full" style="height: 100%; min-height: 135px;">
                <div class="flex justify-between items-start w-full gap-2">
                  <div class="flex flex-col min-w-0 flex-1">
                    <h3 class="font-playfair font-bold text-lg leading-tight text-white select-all truncate">${mockMeta.name}</h3>
                    <a href="${assetMapsUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="flex items-center gap-1 text-[10px] text-gold/90 hover:text-white transition-colors w-fit mt-1.5 font-medium cursor-pointer">
                      <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="truncate">${mockMeta.location}</span>
                    </a>
                  </div>
                  <span class="status-badge-construction shrink-0">Em Curso</span>
                </div>
                <div class="mt-5 border-t border-white/5 pt-3 w-full">
                  <p class="text-[9px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Investimento Total</p>
                  <p class="font-bold text-white text-base select-all">€ ${mockMeta.total}</p>
                </div>
              </div>
            </article>
          `;

          setTimeout(() => {
            document
              .getElementById(mobileCardId)
              ?.addEventListener("click", (e) => {
                if (e.target.closest("a") || e.target.closest("button")) return;
                triggerModalDetails(mockMeta);
              });
          }, 20);
        }

        // 🖥️ 2. TABELA DESKTOP CONVERTIDA PARA ASSETS REAIS DO B2
        if (assetsTableBody) {
          const rowId = `asset-row-${idx}`;
          assetsTableBody.innerHTML += `
            <tr id="${rowId}" class="assets-row cursor-pointer transition-colors hover:bg-white/[0.02]">
              <td class="assets-td">
                <div class="flex items-center gap-3.5">
                  <div class="asset-thumbnail-wrapper w-12 h-12 shrink-0">
                    <img src="${assetImageUrl}" width="48" height="48" alt="Capa Ativo" class="w-full h-full object-cover" onerror="this.src='img/casa-background-mobile-xsmall.webp'" />
                  </div>
                  <p class="font-bold text-sm text-white/95 tracking-wide">${mockMeta.name}</p>
                </div>
              </td>
              <td class="assets-td">
                <a href="${assetMapsUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 transition-colors cursor-pointer">
                  ${mockMeta.location}
                </a>
              </td>
              <td class="assets-td text-center"><span class="status-badge-construction">Em Curso</span></td>
              <td class="assets-td text-right font-bold text-sm text-white/95 tracking-wide">€ ${mockMeta.total}</td>
            </tr>`;

          setTimeout(() => {
            document
              .getElementById(rowId)
              ?.addEventListener("click", () => triggerModalDetails(mockMeta));
          }, 20);
        }
      });

      historicalContractsList.forEach((ctr, idx) => {
        const cap = parseFloat(ctr.capital_investido) || 0;
        const roi = parseFloat(ctr.rendimento_liquido) || 0;

        // June 2026 Refactor: Mapeamento direto pelo ano de início (Evita duplicação)
        const yearStart = new Date(ctr.data_inicio).getFullYear();

        acumuladorAnual["all"].capital += cap;
        acumuladorAnual["all"].profit += roi;

        if (acumuladorAnual[yearStart]) {
          acumuladorAnual[yearStart].capital += cap;
          acumuladorAnual[yearStart].profit += roi;
        }

        if (historicalContainer)
          historicalContainer.innerHTML += buildContractCardHTML(ctr, idx);
      });

      const finalAnnualDataMap = {};
      Object.keys(acumuladorAnual).forEach((key) => {
        finalAnnualDataMap[key] = {
          capital: `€ ${acumuladorAnual[key].capital.toLocaleString("pt-PT", {
            minimumFractionDigits: 2,
          })}`,
          profit: `+ € ${acumuladorAnual[key].profit.toLocaleString("pt-PT", {
            minimumFractionDigits: 2,
          })}`,
        };
      });

      AnnualPerformanceController.setAnnualData(finalAnnualDataMap);

      // Só atualiza o Hero com zeros se for um utilizador totalmente novo.
      if (
        activeContractsList.length > 0 ||
        historicalContractsList.length === 0
      ) {
        const patrimonioTotal = capitalAcumulado + roiAcumulado;
        const patrimonyHeading = document.getElementById("patrimonyHeading");
        const heroCapitalHeading =
          document.getElementById("heroCapitalHeading");
        const heroRoiHeading = document.getElementById("heroRoiHeading");

        if (patrimonyHeading) {
          const formattedPatrimony = `€ ${patrimonioTotal.toLocaleString(
            "pt-PT",
            { minimumFractionDigits: 2 },
          )}`;
          patrimonyHeading.textContent = formattedPatrimony;
          BalanceVisibility.updateOriginal(
            patrimonyHeading,
            formattedPatrimony,
          );
        }
        if (heroCapitalHeading) {
          heroCapitalHeading.textContent = `€ ${capitalAcumulado.toLocaleString(
            "pt-PT",
            { minimumFractionDigits: 2 },
          )}`;
        }
        if (heroRoiHeading) {
          heroRoiHeading.textContent = `+ € ${roiAcumulado.toLocaleString(
            "pt-PT",
            { minimumFractionDigits: 2 },
          )}`;
        }
      }

      if (sliderContractsArray.length > 0) {
        PortfolioCarouselController.setContracts(sliderContractsArray);
      }

      // 🔌 PIPELINE DE SINCRONIZAÇÃO EM TEMPO REAL: PREFERÊNCIAS DE NOTIFICAÇÃO
      try {
        const { data: prefData, error: prefError } = await supabaseClient
          .from("preferencias_conta")
          .select("alerta_relampago, alerta_vencimento")
          .eq("utilizador_id", user.id)
          .maybeSingle();

        if (!prefError && prefData) {
          const toggleRelampago = document.getElementById(
            "wesusAlertaRelampago",
          );
          const toggleVencimento = document.getElementById(
            "wesusAlertaVencimento",
          );

          if (toggleRelampago)
            toggleRelampago.checked = prefData.alerta_relampago;
          if (toggleVencimento)
            toggleVencimento.checked = prefData.alerta_vencimento;
        }

        ["wesusAlertaRelampago", "wesusAlertaVencimento"].forEach((id) => {
          const toggle = document.getElementById(id);
          if (!toggle) return;

          // Clona o nó para anular listeners duplicados gerados pela navegação SPA
          const clone = toggle.cloneNode(true);
          toggle.parentNode.replaceChild(clone, toggle);

          clone.addEventListener("change", async (e) => {
            const column =
              e.target.id === "wesusAlertaRelampago"
                ? "alerta_relampago"
                : "alerta_vencimento";
            const isChecked = e.target.checked;

            try {
              const { error } = await supabaseClient
                .from("preferencias_conta")
                .update({
                  [column]: isChecked,
                  updated_at: new Date().toISOString(),
                })
                .eq("utilizador_id", user.id);

              if (error) throw error;
              console.log(
                `[PREFERENCES] ${column} guardado com sucesso: ${isChecked}`,
              );
            } catch (err) {
              console.error("Falha ao salvar preferência física:", err.message);
              // Mecanismo de Rollback Visual Sênior em caso de falha de rede
              e.target.checked = !isChecked;
              alert(
                "Não foi possível salvar a sua preferência. Verifique a sua ligação à internet.",
              );
            }
          });
        });
      } catch (prefErr) {
        console.error("Erro estrutural ao ligar preferências à BD:", prefErr);
      }
    } catch (err) {
      console.error("Erro ao carregar ecossistema:", err.message);
    }
  }

  async function init() {
    const user = await checkRouteGuard();
    if (user) {
      await loadDashboardData(user);
    }
  }

  return { init, downloadContractPDF };
})();

window.DatabaseController = DatabaseController;

function buildContractCardHTML(ctr, idx) {
  const dateObj = new Date(ctr.data_vencimento);
  const formattedDate = dateObj.toLocaleDateString("pt-PT");
  const capital = parseFloat(ctr.capital_investido).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
  });

  // 🎯 PIPELINE DATA-DRIVEN: Mapeamento baseado no teu banco de dados real
  // Se a view já incluir prazo_meses e taxa_retorno, usamos diretamente.
  // Caso contrário, o mapa de IDs garante consistência absoluta sem cálculos temporais falhos.
  const planoId = ctr.condicao_id;

  let meses = ctr.prazo_meses;
  let taxaRetorno = ctr.taxa_retorno;

  if (meses === undefined || taxaRetorno === undefined) {
    const mapaPlanos = {
      "4c61fe43-b971-492b-b8c5-78fc7f046026": { meses: 3, taxa: "10" },
      "6e5f0b2b-2d65-43c1-8679-e76aa5f31512": { meses: 3, taxa: "6.25" },
      "a9602a14-de39-4b4d-bc3f-b56a68eaea7b": { meses: 6, taxa: "10" }, // 🌟 O teu "Plano Especial"
      "c07128fb-99b5-4c87-855a-f01799a1944e": { meses: 12, taxa: "25" },
      "d94bb0e0-943e-4ad4-86a8-b26ac06681ab": { meses: 6, taxa: "12.5" },
    };

    if (mapaPlanos[planoId]) {
      meses = mapaPlanos[planoId].meses;
      taxaRetorno = mapaPlanos[planoId].taxa;
    } else {
      // Fallback dinâmico seguro de última instância caso surja um ID novo em tempo de execução
      const cap = parseFloat(ctr.capital_investido) || 1;
      const roi = parseFloat(ctr.rendimento_liquido) || 0;
      taxaRetorno = ((roi / cap) * 100).toFixed(1).replace(".0", "");

      const start = new Date(ctr.data_inicio);
      const end = new Date(ctr.data_vencimento);
      meses = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44)) || 0;
    }
  } else {
    taxaRetorno = String(taxaRetorno).replace(".0", "");
  }

  return `
    <div id="contract-${
      ctr.id
    }" class="hero-card-crystal p-5 rounded-3xl grid grid-cols-1 lg:grid-cols-12 items-center gap-4 lg:gap-2 relative overflow-hidden w-full group hover:bg-white/[0.02] transition-all duration-300" style="margin-bottom: 1rem !important;">
      <div class="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-20 pointer-events-none"></div>
      <div class="flex items-center gap-4 min-w-0 lg:col-span-4 w-full">
        <div class="w-11 h-11 rounded-xl bg-[#071326] flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
          <svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <h4 class="text-white font-bold text-sm lg:text-base truncate tracking-wide">Contrato de Mútuo Privado</h4>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-gold/10 text-gold-light tracking-wider">
              ${meses} Meses • ${taxaRetorno}% Retorno
            </span>
          </div>
        </div>
      </div>
      <div class="flex justify-between lg:flex-col gap-1 lg:col-span-2 w-full lg:pl-2">
        <p class="text-[9px] uppercase text-white/40 tracking-widest font-semibold">Vencimento</p>
        <p class="text-xs lg:text-sm text-white/90 font-medium">${formattedDate}</p>
      </div>
      <div class="flex justify-between lg:flex-col gap-1 lg:col-span-2 w-full">
        <p class="text-[9px] uppercase text-white/40 tracking-widest font-semibold">Capital Investido</p>
        <p class="text-xs lg:text-sm text-white/90 font-medium">€ ${capital}</p>
      </div>
      <div class="flex justify-between lg:flex-col gap-1 lg:col-span-2 w-full">
        <p class="text-[9px] uppercase text-white/40 tracking-widest font-semibold">Status do Termo</p>
        <p class="text-xs lg:text-sm font-bold text-[#6FCF97] tracking-wide">${
          ctr.status_termo
        }</p>
      </div>
      <div class="w-full lg:col-span-2 flex lg:justify-end mt-2 lg:mt-0">
        <button onclick="window.DatabaseController.downloadContractPDF('${
          ctr.pdf_url || ""
        }')" class="w-full btn-gold-lingot !py-2.5 !px-4 !text-[10px] !h-auto whitespace-nowrap" style="color: #ffffff !important; letter-spacing: 0.12em;">Baixar Doc</button>
      </div>
    </div>`;
}

/* ── 🔒 SECURITY SESSION TIMEOUT ENGINE (30 MIN INACTIVITY) ── */
const SessionTimeoutController = (() => {
  let inactivityTimeout;
  const THIRTY_MINUTES_MS = 30 * 60 * 1000;

  function forceLogout() {
    console.warn("[SECURITY] Sessão encerrada por inatividade prolongada.");
    sessionStorage.clear();
    window.location.href = "index.html";
  }

  function refreshTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(forceLogout, THIRTY_MINUTES_MS);
  }

  function init() {
    if (!sessionStorage.getItem("wesus_token")) return;

    // Escuta qualquer interação real do usuário para resetar o cronômetro
    [
      "mousemove",
      "mousedown",
      "click",
      "scroll",
      "keypress",
      "touchstart",
    ].forEach((event) => {
      document.addEventListener(event, refreshTimer, { passive: true });
    });

    refreshTimer();
  }

  return { init };
})();

// 🎯 FUNÇÃO UNIFICADA POPULA O CABEÇALHO E A GALERIA INTERNA DO B2 DINAMICAMENTE
function triggerModalDetails(mockMeta) {
  const modal =
    document.getElementById("wSimpleAssetDetailsModal") ||
    document.getElementById("wesusAssetDetailsModal");
  const modalTitle = document.getElementById("assetDetailsTitle");
  const modalLocation = document.getElementById("assetDetailsLocation");
  const modalTotal = document.getElementById("assetDetailsTotal");
  const coverImg = document.getElementById("assetDetailsCover");
  const interiorGrid = modal
    ? modal.querySelector(".wesus-interior-grid")
    : null;
  const docsListContainer = modal
    ? modal.querySelector(".w公共-docs-list, .wesus-docs-list")
    : null;

  if (modalTitle) modalTitle.textContent = mockMeta.name;
  if (modalLocation) modalLocation.textContent = mockMeta.location;
  if (modalTotal) modalTotal.textContent = `€ ${mockMeta.total}`;

  if (coverImg) {
    coverImg.style.opacity = "1";
    coverImg.src = mockMeta.cover;
  }

  if (interiorGrid) {
    if (mockMeta.gallery && mockMeta.gallery.length > 0) {
      interiorGrid.innerHTML = mockMeta.gallery
        .map(
          (imgUrl) => `
            <div class="wesus-gallery-thumb cursor-pointer overflow-hidden rounded-xl border border-white/5 asset-gallery-item">
              <img src="${imgUrl}" alt="Vistoria Técnica Interna" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" onerror="this.src='img/casa-background-mobile-xsmall.webp'" />
            </div>`,
        )
        .join("");
    } else {
      interiorGrid.innerHTML = `
        <div class="col-span-2 p-5 rounded-2xl bg-white/[0.01] border border-white/5 text-center w-full">
          <p class="text-xs text-white/40 font-inter font-medium tracking-wide">Fotos do interior em atualização técnica</p>
        </div>`;
    }
  }

  if (docsListContainer) {
    if (!mockMeta.docs || mockMeta.docs.length === 0) {
      docsListContainer.innerHTML = `
              <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[140px] shadow-inner">
                <p class="text-xs text-white/40 font-inter font-medium tracking-wide">Documentos do Imóvel não disponíveis</p>
              </div>`;
    } else {
      docsListContainer.innerHTML = mockMeta.docs
        .map(
          (doc) => `
              <div class="wocus-doc-item wesus-doc-card flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors w-full">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                  <div class="truncate">
                    <p class="text-xs font-bold text-white/90 truncate">${doc.name}</p>
                    <p class="text-[8px] text-white/30 uppercase font-medium">${doc.type} • ${doc.size}</p>
                  </div>
                </div>
                <button onclick="window.DatabaseController.downloadContractPDF('${doc.path}')" class="text-[9px] font-bold text-gold hover:text-white transition-colors uppercase tracking-wider shrink-0 px-1.5">Baixar</button>
              </div>`,
        )
        .join("");
    }
  }
  if (modal) modal.classList.add("active");
}

/* ── INTERFACE ENTRY POINT ─────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  ThemeController.init();
  NavigationController.init();
  ScrollController.init();
  BalanceVisibility.init();
  ChartDataController.init();
  AnnualPerformanceController.init();
  AssetDetailsModalController.init();
  PortfolioCarouselController.init();
  InvestmentModalController.init();
  LightboxController.init();
  AccountSettingsController.init();
  DatabaseController.init();
  SessionTimeoutController.init();
});
