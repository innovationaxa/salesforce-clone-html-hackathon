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

  if (!toggle || !panel) return;

  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
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

  if (!(dialog instanceof HTMLDialogElement) || !openButton) return;

  const resetNotification = () => openButton.classList.remove("pulse");

  openButton.addEventListener("click", () => {
    dialog.showModal();
  });

  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "confirm") {
      const formData = new FormData(dialog.querySelector("form") ?? undefined);
      const summary = (formData.get("summary") ?? "").toString().trim();
      const type = (formData.get("type") ?? "phone").toString();
      const date = (formData.get("date") ?? "").toString();

      if (!summary || !date) return;

      interactions.unshift({
        id: crypto.randomUUID(),
        summary,
        type,
        date,
        timestamp: new Date().toISOString(),
        tags: ["exchange"]
      });
      renderInteractions();
      dialog.querySelector("form")?.reset();
      resetNotification();
    } else if (dialog.returnValue === "cancel") {
      dialog.querySelector("form")?.reset();
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