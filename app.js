// app.js (module)
const DATA_URL = './data.json'; // ↩️ change si ton endpoint est ailleurs

// ----- helpers DOM
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function fmtCurrency(n, ccy = 'EUR', locale = 'fr-FR') {
  const v = Number(n || 0);
  return new Intl.NumberFormat(locale, { style: 'currency', currency: ccy }).format(v);
}

async function loadData() {
  const res = await fetch(`${DATA_URL}?cb=${Date.now()}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ----- renderers
function renderProfile(profile) {
  // "Cadre Entreprise"
  const label = $('#ai-synthese .ai-highlight p.muted');
  if (label && profile.segment_label) label.textContent = profile.segment_label;

  // chips (âge, famille, ville, résidence...)
  const ul = $('#ai-synthese .ai-highlight .chips');
  if (ul && Array.isArray(profile.chips)) {
    ul.innerHTML = profile.chips.map(txt => `<li>${txt}</li>`).join('');
  }
}

function renderStats(stats) {
  const values = $$('#ai-synthese .stat-grid .stat .stat-value');
  if (values.length >= 3) {
    values[0].textContent = stats.anciennete ?? '—'; // Ancienneté
    values[1].textContent = stats.score ?? '—';      // Score
    values[2].textContent = stats.incidents ?? '—';  // Incidents
    if (+stats.incidents === 0) values[2].classList.add('success'); else values[2].classList.remove('success');
  }
}

function renderKYC(kyc) {
  const alertBox = $('#ai-synthese .alert');
  if (!alertBox) return;
  const strong = alertBox.querySelector('strong');
  const p = alertBox.querySelector('p');

  const pct = Number(kyc.completeness_pct ?? 0);
  if (strong) strong.textContent = `⚠️ Complétude KYC : ${pct}%`;

  // L’intitulé + détail des documents manquants
  const title = kyc.missing_docs_title || "📋 Pièces d'identité obligatoires à collecter";
  const details = Array.isArray(kyc.missing_docs) && kyc.missing_docs.length
    ? 'Manquants : ' + kyc.missing_docs.join(', ')
    : 'Aucun document manquant';
  if (p) p.textContent = `${title}${kyc.missing_docs?.length ? ' — ' + details : ''}`;
}

function renderSections(sections) {
  // Contrats
  const contratsP = $('#ai-synthese details:nth-of-type(1) .accordion-content p');
  if (contratsP && sections.contrats) {
    const { auto = 0, habitation = 0, banque = 0 } = sections.contrats;
    contratsP.innerHTML = `<strong>Contrats actifs :</strong> ${auto} Auto • ${habitation} Habitation • ${banque} Banque`;
  }

  // Profil
  const profilDiv = $('#ai-synthese details:nth-of-type(2) .accordion-content');
  if (profilDiv && sections.profil) {
    const { fidelite = '-', incidents = '-', potentiel = '-' } = sections.profil;
    profilDiv.innerHTML = `Fidélité : ${fidelite}<br />Incidents : ${incidents}<br />Potentiel commercial : <span class="badge accent">${potentiel}</span>`;
  }

  // Dernières interactions
  const interDiv = $('#ai-synthese details:nth-of-type(3) .accordion-content');
  if (interDiv && sections.interactions) {
    const { last_event = '-', satisfaction = null } = sections.interactions;
    interDiv.innerHTML =
      `<p>${last_event}</p>` +
      `<p class="muted tiny">Satisfaction : ${satisfaction != null ? String(satisfaction).replace('.', ',') : '-'}/5</p>`;
  }
}

function renderLifeMoments(list) {
  const ul = $('#ai-pistes .life-moments .chips');
  if (ul && Array.isArray(list)) {
    ul.innerHTML = list.map(txt => `<li>${txt}</li>`).join('');
  }
}

function renderDiscoveryQuestions(questions) {
  const wrap = $('#ai-pistes .advice');
  if (!wrap) return;
  const h3 = wrap.querySelector('h3');
  const ps = wrap.querySelectorAll('p');
  if (h3 && h3.textContent.trim() === 'Questions de découverte') {
    // remplace les <p> par ceux du JSON
    ps.forEach(p => p.remove());
    (questions || []).forEach(q => {
      const p = document.createElement('p');
      p.textContent = q;
      wrap.appendChild(p);
    });
  }
}

function badgeByScore(score) {
  if (score >= 8) return { cls: 'success', label: `Score ${score}/10` };
  if (score >= 6) return { cls: 'warning', label: `Score ${score}/10` };
  return { cls: 'info', label: `Score ${score}/10` };
}

function renderRecommendations(recos) {
  const container = $('#ai-pistes .recommendations');
  if (!container) return;

  // Conserve l’entête (titre + switcher), remplace les <article>
  const header = container.querySelector('.recommendations-header');
  const oldArticles = container.querySelectorAll('article.recommendation');
  oldArticles.forEach(n => n.remove());

  // Compteur dans le header
  const h3 = header?.querySelector('h3');
  if (h3) h3.textContent = `Recommandations (${Array.isArray(rec os) ? recos.length : 0})`;

  (recos || []).forEach(r => {
    const { cls, label } = badgeByScore(Number(r.score || 0));
    const article = document.createElement('article');
    article.className = 'recommendation';
    article.dataset.score = String(r.score || 0);
    article.innerHTML = `
      <header>
        <div>
          <h4>${r.title}</h4>
          <span class="badge ${cls}">${label}</span>
        </div>
        <p class="muted tiny">${r.blurb || ''}</p>
      </header>
      <div class="recommendation-body">
        <ul class="preparation">
          ${(r.prep_bullets || []).map(li => `<li>${li}</li>`).join('')}
        </ul>
        <ul class="live" hidden>
          ${(r.live_bullets || []).map(li => `<li>${li}</li>`).join('')}
        </ul>
        <div class="button-row">
          <button class="chip-button" aria-label="Planifier">📅</button>
          <button class="chip-button">🎯 Opportunité</button>
          <button class="chip-button" aria-label="Rejeter">👎</button>
          <button class="chip-button">⏱️ Relancer</button>
        </div>
      </div>
    `;
    container.appendChild(article);
  });

  // (Ré)active le switcher Préparation / Live
  const toggles = $$('#ai-pistes .recommendations .toggle');
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      toggles.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.viewMode; // "preparation" | "live"
      $$('#ai-pistes .recommendations article').forEach(a => {
        const prep = a.querySelector('.preparation');
        const live = a.querySelector('.live');
        if (!prep || !live) return;
        if (mode === 'live') { prep.hidden = true; live.hidden = false; }
        else                 { prep.hidden = false; live.hidden = true; }
      });
    });
  });
}

function renderCall(call) {
  const dur = $('#call-report-dialog .ai-duration .strong');
  if (dur && call.duration) dur.textContent = call.duration;

  const ta = $('#ai-summary-text');
  if (ta && typeof call.summary === 'string') ta.value = call.summary;
}

// ----- “Cases à cocher” → alimenter le résumé
function setupEmailContentIntegration(data) {
  const ta = $('#ai-summary-text');
  if (!ta) return;

  const boxes = $$('input[type="checkbox"][name="email-content"]');
  const anchors = {
    documents: '\n\n[Documents requis]\n',
    recommendations: '\n\n[Recommandations personnalisées]\n',
    recap: '\n\n[Récapitulatif opportunités]\n'
  };

  function buildBlock(key) {
    if (key === 'documents') {
      const list = data.kyc?.missing_docs || [];
      if (!list.length) return `${anchors.documents}Aucun document manquant.`;
      return anchors.documents + list.map(d => `- ${d}`).join('\n');
    }
    if (key === 'recommendations') {
      const recos = data.recommendations || [];
      if (!recos.length) return `${anchors.recommendations}(aucune)`;
      return anchors.recommendations + recos.map(r => `- ${r.title} (${r.score}/10)`).join('\n');
    }
    if (key === 'recap') {
      const { auto = 0, habitation = 0, banque = 0 } = data.sections?.contrats || {};
      return anchors.recap + `Contrats actifs : ${auto} Auto • ${habitation} Habitation • ${banque} Banque`;
    }
    return '';
  }

  function removeBlock(text, anchor) {
    // supprime le bloc commençant par l’ancre jusqu’au prochain bloc ou fin de texte
    const idx = text.indexOf(anchor);
    if (idx === -1) return text;
    const nextIdx = Object.values(anchors)
      .filter(a => a !== anchor)
      .map(a => text.indexOf(a))
      .filter(i => i !== -1)
      .sort((a, b) => a - b)[0];
    return nextIdx !== undefined ? text.slice(0, idx) + text.slice(nextIdx) : text.slice(0, idx).trimEnd();
  }

  boxes.forEach(box => {
    box.addEventListener('change', () => {
      const key = box.value; // "documents" | "recommendations" | "recap"
      const anchor = anchors[key];
      let val = ta.value;

      if (box.checked) {
        // Ajoute le bloc s’il n’existe pas
        if (!val.includes(anchor)) {
          const block = buildBlock(key);
          val = (val.trimEnd() + block).trimEnd();
        }
      } else {
        // Retire le bloc
        val = removeBlock(val, anchor);
      }
      ta.value = val;
    });
  });
}

// ----- boot
async function main() {
  try {
    const data = await loadData();
    renderProfile(data.profile || {});
    renderStats(data.stats || {});
    renderKYC(data.kyc || {});
    renderSections(data.sections || {});
    renderLifeMoments(data.life_moments || []);
    renderDiscoveryQuestions(data.discovery_questions || []);
    renderRecommendations(data.recommendations || []);
    renderCall(data.call || {});
    setupEmailContentIntegration(data);
  } catch (e) {
    console.error('Chargement des données impossible :', e);
  }
}
main();


const interactions = [
  {
    id: crypto.randomUUID(),
    summary: "Demande de mise à jour de coordonnées bancaires.",
    type: "phone",
    date: "2025-05-12",
    timestamp: new Date("2025-05-12T09:30:00").toISOString(),
    tags: ["network", "exchange"]
  },
  {
    id: crypto.randomUUID(),
    summary: "Envoi d'un email de confirmation de devis habitation.",
    type: "email",
    date: "2025-05-04",
    timestamp: new Date("2025-05-04T14:05:00").toISOString(),
    tags: ["company", "exchange"]
  },
  {
    id: crypto.randomUUID(),
    summary: "Rendez-vous agence confirmé pour le 28/05.",
    type: "meeting",
    date: "2025-05-02",
    timestamp: new Date("2025-05-02T11:45:00").toISOString(),
    tags: ["rdv"]
  }
];

const contracts = [
  {
    id: 1,
    type: "immeuble",
    name: "IMMEUBLE",
    contractNumber: "0000003624787404",
    specificity: "",
    effectDate: "01/04/2008",
    status: "en cours",
    cotisation: "796,00 €",
    fractionnement: "S"
  },
  {
    id: 2,
    type: "auto",
    name: "MON AUTO",
    contractNumber: "0000080114634904",
    specificity: "AA-001-AA",
    effectDate: "06/10/2025",
    status: "en cours",
    cotisation: "341,00 €",
    fractionnement: "M"
  },
  {
    id: 3,
    type: "auto",
    name: "MON AUTO",
    contractNumber: "0000080114635004",
    specificity: "AA-001-AA",
    effectDate: "06/10/2025",
    status: "en cours",
    cotisation: "323,00 €",
    fractionnement: "M"
  }
];

const formatDateTime = (isoString) =>
  new Date(isoString).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  });

const formatType = (type) => {
  switch (type) {
    case "phone":
      return "Téléphone";
    case "email":
      return "Email";
    case "meeting":
      return "Rendez-vous";
    default:
      return type;
  }
};

const renderInteractions = () => {
  const list = document.querySelector("#interaction-list");
  if (!list) return;

  const filters = Array.from(
    document.querySelectorAll("#interaction-filters input:checked")
  ).map((input) => input.name);

  list.innerHTML = "";

  const filtered = filters.length
    ? interactions.filter((item) =>
        item.tags.some((tag) => filters.includes(tag))
      )
    : interactions;

  if (!filtered.length) {
    list.innerHTML = '<p class="muted">Aucune interaction disponible</p>';
    return;
  }

  filtered
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((interaction) => {
      const card = document.createElement("article");
      card.className = "interaction-card";
      card.innerHTML = `
        <div class="interaction-meta">
          <span>${formatDateTime(interaction.timestamp)}</span>
          <span>•</span>
          <span>${formatType(interaction.type)}</span>
        </div>
        <p>${interaction.summary}</p>
      `;
      list.append(card);
    });
};

const renderContracts = () => {
  const body = document.querySelector("#contract-table");
  if (!body) return;
  body.innerHTML = "";
  contracts.forEach((contract) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${contract.id}</td>
      <td>${contract.type === "immeuble" ? "🏢" : "🚗"}</td>
      <td>${contract.name}</td>
      <td><a href="#">${contract.contractNumber}</a></td>
      <td>${contract.specificity || "-"}</td>
      <td>${contract.effectDate}</td>
      <td>${contract.status}</td>
      <td>${contract.cotisation}</td>
      <td>${contract.fractionnement}</td>
    `;
    body.append(row);
  });
};

const setupTabs = () => {
  document.querySelectorAll(".tabs").forEach((tabList) => {
    tabList.addEventListener("click", (event) => {
      const button = event.target.closest(".tab");
      if (!button) return;

      const targetId = button.dataset.tabTarget;
      if (!targetId) return;

      const container = tabList.closest(".card");
      const panelsRoot = container?.querySelector(".tab-panels") ?? document;

      tabList.querySelectorAll(".tab").forEach((tab) =>
        tab.classList.toggle("active", tab === button)
      );

      panelsRoot
        .querySelectorAll(":scope > .tab-panel")
        .forEach((panel) =>
          panel.classList.toggle("active", panel.id === targetId)
        );
    });
  });
};

const setupAiTabs = () => {
  document
    .querySelectorAll(".ai-tabs .tab")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const targetId = button.dataset.tabTarget;
        if (!targetId) return;

        button.parentElement
          ?.querySelectorAll(".tab")
          .forEach((tab) => tab.classList.toggle("active", tab === button));

        const panels = button
          .closest("#ai-panel")
          ?.querySelectorAll(".tab-panels > .tab-panel");
        panels?.forEach((panel) =>
          panel.classList.toggle("active", panel.id === targetId)
        );
      })
    );
};

const setupFilters = () => {
  document
    .querySelectorAll("#interaction-filters input")
    .forEach((input) => input.addEventListener("change", renderInteractions));
};

const setupViewModeToggle = () => {
  const toggles = document.querySelectorAll(".toggle[data-view-mode]");
  toggles.forEach((toggle) =>
    toggle.addEventListener("click", () => {
      const mode = toggle.dataset.viewMode;
      if (!mode) return;

      toggles.forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.viewMode === mode)
      );

      document.querySelectorAll(".recommendation").forEach((card) => {
        const prep = card.querySelector(".preparation");
        const live = card.querySelector(".live");
        if (prep) prep.hidden = mode !== "preparation";
        if (live) live.hidden = mode !== "live";
      });
    })
  );
};

const setupQueuePanel = () => {
  const toggle = document.querySelector("#queue-toggle");
  const panel = document.querySelector("#queue-panel");
  const transfer = document.querySelector("#queue-transfer");
  const callButton = document.querySelector("#open-call-report");
  const closeButtons = panel.querySelectorAll("[data-close-queue]");

  if (!toggle || !panel) return;

  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    panel.hidden = expanded;
    toggle.setAttribute("aria-expanded", String(!expanded));
  });

  document.addEventListener("click", (event) => {
    if (!panel.hidden) {
      const target = event.target;
      if (!panel.contains(target) && target !== toggle) {
        closePanel();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanel();
    }
  });

  closeButtons.forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      closePanel();
    })
  );

  transfer?.addEventListener("click", () => {
    interactions.unshift({
      id: crypto.randomUUID(),
      summary: "Appel transféré depuis Genesys Cloud. Rappel conseiller nécessaire.",
      type: "phone",
      date: new Date().toISOString().slice(0, 10),
      timestamp: new Date().toISOString(),
      tags: ["network", "exchange"]
    });
    callButton?.classList.add("pulse");
    renderInteractions();
    closePanel();
  });
};


const setupCallReportDialog = () => {
  const dialog = document.querySelector("#call-report-dialog");
  const openButton = document.querySelector("#open-call-report");
  const form = dialog?.querySelector("form");

  if (!(dialog instanceof HTMLDialogElement) || !openButton || !form) return;

  const resetNotification = () => openButton.classList.remove("pulse");

  openButton.addEventListener("click", () => {
    dialog.showModal();
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dialog.close("cancel");
  });

  dialog.addEventListener("close", () => {
    const action = dialog.returnValue;
    const formData = new FormData(form);
    const summary = (formData.get("summary") ?? "").toString().trim();
    const type = (formData.get("type") ?? "phone").toString();
    const date = (formData.get("date") ?? "").toString();

    const normaliseSummary = (text) =>
      text
        .split(/\n+/)
        .map((line) => line.replace(/^[-•]\s*/, "").trim())
        .find((line) => line.length > 0) ?? text;

    if (action === "confirm" || action === "send") {
      if (!summary || !date) {
        form.reset();
        return;
      }

      const condensed = normaliseSummary(summary);
      const tags = ["exchange"];
      if (action === "send") tags.push("company");

      interactions.unshift({
        id: crypto.randomUUID(),
        summary: condensed,
        type,
        date,
        timestamp: new Date().toISOString(),
        tags
      });
      renderInteractions();
      form.reset();
      resetNotification();
    } else {
      form.reset();
    }
  });
};

const initialise = () => {
  renderInteractions();
  renderContracts();
  setupTabs();
  setupAiTabs();
  setupFilters();
  setupViewModeToggle();
  setupQueuePanel();
  setupCallReportDialog();
};

initialise();
