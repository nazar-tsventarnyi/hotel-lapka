"use strict";

const menuButton = document.querySelector("[data-menu-toggle]");
const menu = document.getElementById("site-menu");
const desktopNavigation = window.matchMedia("(min-width: 64rem)");
let lastFocusedElement = null;

function setMenuOpen(open) {
  menu.classList.toggle("hidden", !open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute(
    "aria-label",
    open ? "Закрити меню" : "Відкрити меню",
  );
}

menuButton.addEventListener("click", () => {
  setMenuOpen(menuButton.getAttribute("aria-expanded") === "false");
});
menu.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    setMenuOpen(false);
    menuButton.focus();
  }
});
document.addEventListener("focusin", (event) => {
  lastFocusedElement = event.target;
});
document.addEventListener("pointerdown", (event) => {
  if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
    lastFocusedElement = null;
  }
});
desktopNavigation.addEventListener("change", ({ matches }) => {
  const active = document.activeElement;
  const focused = active === document.body ? lastFocusedElement : active;
  setMenuOpen(false);
  if (!matches && menu.contains(focused)) menuButton.focus();
  if (matches && focused === menuButton) menu.querySelector("a").focus();
});

const query = new URLSearchParams(location.search);
const requestedPet = query.get("pet");
const initialApplicationPet =
  requestedPet === "cat" || requestedPet === "dog" ? requestedPet : "";
const calculation = {
  pet: initialApplicationPet || "cat",
  plan: query.get("plan") === "comfort" ? "comfort" : "basic",
  days: query.get("days") ?? "3",
  photo: query.get("photo") === "1",
  play: query.get("play") === "1" && query.get("plan") !== "comfort",
};

const controls = document.querySelectorAll("[data-calc]");
const daysInput = document.getElementById("calc-days");
const priceReference = document.querySelector(".calculation-reference");
const applicationContent = document.getElementById("application-content");
const stateLinks = Array.from(
  document.querySelectorAll("[data-calculation-link]"),
  (link) => ({
    link,
    base: link.getAttribute("href"),
  }),
);

const numberFormat = new Intl.NumberFormat("uk-UA");
const pluralRules = new Intl.PluralRules("uk-UA");
const money = (amount) => `${numberFormat.format(amount)} ₴`;
const dayUnits = { one: "доба", few: "доби", many: "діб", other: "доби" };
const dayLabel = (days) => `${days} ${dayUnits[pluralRules.select(days)]}`;

function isValidDuration(days) {
  return Number.isInteger(days) && days >= 1 && days <= 60;
}

function calculatePrice({
  pet,
  plan,
  days: input,
  photo: hasPhoto,
  play: hasPlay,
}) {
  if (!pet || !/^(?:\d*\.)?\d+(?:e[+-]?\d+)?$/i.test(input)) return null;
  const days = Number(input);
  if (!isValidDuration(days)) return null;

  const comfort = plan === "comfort";
  const dailyRate = (pet === "dog" ? 350 : 250) + (comfort ? 100 : 0);
  const accommodation = dailyRate * days;
  const photo = hasPhoto ? 50 * days : 0;
  const play = hasPlay && !comfort ? 80 * days : 0;
  return {
    pet,
    plan,
    days,
    dailyRate,
    accommodation,
    photo,
    play,
    total: accommodation + photo + play,
  };
}

function priceLabel({ pet, plan, days }) {
  const petLabel = pet === "dog" ? "Собака" : "Кіт";
  const planLabel = plan === "comfort" ? "Комфорт" : "Базовий";
  return `${petLabel} · ${planLabel} · ${dayLabel(days)}`;
}

function updateCalculationLinks(applicationState) {
  for (const { link, base } of stateLinks) {
    const state = priceReference?.contains(link) ? applicationState : calculation;
    if (!state) continue;
    const url = new URL(base, document.baseURI);
    if (state.pet) url.searchParams.set("pet", state.pet);
    url.searchParams.set("plan", state.plan);
    url.searchParams.set("days", state.days);
    if (state.photo) url.searchParams.set("photo", "1");
    if (state.play) url.searchParams.set("play", "1");
    link.href = url.href;
  }
}

function refreshCalculator(price) {
  if (!daysInput) return;
  const comfort = calculation.plan === "comfort";
  const playOption = document.getElementById("play-option");
  daysInput.setAttribute("aria-invalid", String(!price));
  daysInput.setAttribute(
    "aria-describedby",
    price ? "days-help" : "days-help days-error",
  );
  document.getElementById("days-error").hidden = Boolean(price);
  playOption.disabled = comfort;
  playOption.checked = calculation.play;
  document.getElementById("play-label").textContent = comfort
    ? "· включено у «Комфорт»"
    : "· 80 ₴ / доба";
  document.getElementById("price-warning").hidden = Boolean(price);
  document.getElementById("price-breakdown").hidden = !price;
  document.getElementById("price-apply").hidden = !price;
  document.getElementById("price-apply-disabled").hidden = Boolean(price);
  document.getElementById("price-total").textContent = price
    ? money(price.total)
    : "—";
  if (!price) return;

  document.getElementById("price-label").textContent = priceLabel(price);
  document.getElementById("price-rate").textContent =
    `${money(price.dailyRate)} × ${dayLabel(price.days)}`;
  document.getElementById("price-stay").textContent = money(
    price.accommodation,
  );
  document.getElementById("price-photo").textContent = calculation.photo
    ? money(price.photo)
    : "Не обрано";
  document.getElementById("price-play").textContent = comfort
    ? "Включено"
    : calculation.play
      ? money(price.play)
      : "Не обрано";
}

function getFormValues(form) {
  return Object.fromEntries(new FormData(form));
}

function dayNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
    ? time
    : NaN;
}

function stayDuration({ arrival, departure }) {
  return (dayNumber(departure) - dayNumber(arrival)) / 86_400_000;
}

function refreshApplicationPrice(state, usesDates) {
  const price = calculatePrice(state);
  const label = document.getElementById("application-price-label");
  const status = document.getElementById("application-price-status");
  const note = document.getElementById("application-price-note");
  label.hidden = !price;
  label.textContent = price ? priceLabel(price) : "";

  let message = "Оберіть вид тварини у формі, щоб розрахувати вартість.";
  let details = "";
  if (price) {
    message = `Орієнтовно ${money(price.total)}.`;
    details = usesDates
      ? "Тривалість розраховано за датами."
      : "Після вибору дат сума уточниться за тривалістю перебування.";
  } else if (state.pet) {
    message = "Оберіть дати або уточніть кількість діб у калькуляторі.";
  }
  if (status.textContent.trim() !== message) status.textContent = message;
  note.textContent = details;
}

function renderPricing() {
  refreshCalculator(calculatePrice(calculation));
  const form = applicationContent?.querySelector("form");
  let applicationState;
  if (form) {
    const values = getFormValues(form);
    const duration = stayDuration(values);
    const usesDates = isValidDuration(duration);
    applicationState = {
      ...calculation,
      pet: values.pet,
      days: usesDates ? String(duration) : calculation.days,
    };
    refreshApplicationPrice(applicationState, usesDates);
  }
  updateCalculationLinks(applicationState);
}

for (const control of controls) {
  const key = control.dataset.calc;
  if (control.type === "radio")
    control.checked = control.value === calculation[key];
  else if (control.type === "checkbox") control.checked = calculation[key];
  else control.value = calculation[key];

  control.addEventListener("input", () => {
    calculation[key] =
      control.type === "checkbox" ? control.checked : control.value;
    if (calculation.plan === "comfort") calculation.play = false;
    renderPricing();
  });
}

function today() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function validateForm(values) {
  const errors = {};
  if (values.owner.trim().length < 2)
    errors.owner = "Вкажіть ім’я — щонайменше 2 символи.";
  const phone = values.phone.trim();
  const digitCount = phone.replace(/\D/g, "").length;
  if (!/^\+?[\d\s()-]+$/.test(phone) || digitCount < 9 || digitCount > 15) {
    errors.phone = "Введіть 9–15 цифр номера, наприклад +380 67 123 45 67.";
  }
  if (values.pet !== "cat" && values.pet !== "dog")
    errors.pet = "Оберіть вид тварини.";
  if (!values.petname.trim()) errors.petname = "Вкажіть ім’я улюбленця.";
  if (!Number.isFinite(dayNumber(values.arrival)))
    errors.arrival = "Оберіть дату заїзду.";
  else if (values.arrival < today())
    errors.arrival = "Дата заїзду не може бути в минулому.";
  const duration = stayDuration(values);
  if (!Number.isFinite(dayNumber(values.departure)))
    errors.departure = "Оберіть дату виїзду.";
  else if (Number.isFinite(duration) && !isValidDuration(duration)) {
    errors.departure = "Виїзд має бути через 1–60 діб після заїзду.";
  }
  return errors;
}

function showFieldError(form, name, message) {
  const input = form.elements.namedItem(name);
  const error = document.getElementById(`${name}-error`);
  input.setAttribute("aria-invalid", String(Boolean(message)));
  error.textContent = message ?? "";
  error.hidden = !message;
}

function updateDuration(form) {
  const duration = stayDuration(getFormValues(form));
  if (isValidDuration(duration)) {
    calculation.days = String(duration);
    if (daysInput) daysInput.value = calculation.days;
  }
  renderPricing();
}

function initApplication() {
  const initialForm = applicationContent.querySelector("form");
  const blankForm = initialForm.cloneNode(true);
  const template = document.getElementById("application-success");
  const fields = ["owner", "phone", "pet", "petname", "arrival", "departure"];
  let failNext = query.get("submit") === "error";

  function prepareForm(form) {
    form.elements.namedItem("pet").value = initialApplicationPet;
    form.querySelector("#submit-application").type = "submit";
  }

  function checkSubmission(form) {
    const errors = validateForm(getFormValues(form));
    for (const name of fields) showFieldError(form, name, errors[name]);
    const firstError = Object.keys(errors)[0];
    if (!firstError) return true;
    form.elements.namedItem(firstError).focus();
    return false;
  }

  prepareForm(initialForm);

  applicationContent.addEventListener("input", (event) => {
    const field = event.target;
    const form = field.form;
    if (field.name === "arrival" || field.name === "departure")
      updateDuration(form);
    else if (field.name === "pet") renderPricing();
    const markedFields = fields.filter(
      (name) =>
        form.elements.namedItem(name).getAttribute("aria-invalid") === "true",
    );
    if (markedFields.length) {
      const errors = validateForm(getFormValues(form));
      for (const name of markedFields) showFieldError(form, name, errors[name]);
    }
  });

  applicationContent.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById("submit-application");
    if (button.disabled) return;

    const status = document.getElementById("submit-error");
    status.hidden = true;
    if (!checkSubmission(form)) return;

    updateDuration(form);
    const buttonContent = Array.from(button.childNodes);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML =
      '<span class="size-4 shrink-0 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" aria-hidden="true"></span>Перевіряємо заявку…';

    window.setTimeout(() => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (!checkSubmission(form)) {
        button.replaceChildren(...buttonContent);
        return;
      }
      if (failNext) {
        failNext = false;
        status.textContent =
          "Не вдалося завершити заявку. Дані збережено у формі, повторіть спробу.";
        status.hidden = false;
        status.tabIndex = -1;
        status.focus();
        button.textContent = "Спробувати ще раз";
        return;
      }
      updateDuration(form);
      applicationContent.replaceChildren(template.content.cloneNode(true));
      document.getElementById("success-panel").focus();
    }, 650);
  });

  applicationContent.addEventListener("click", (event) => {
    if (!event.target.closest("#new-application")) return;
    const form = blankForm.cloneNode(true);
    applicationContent.replaceChildren(form);
    prepareForm(form);
    renderPricing();
    document.getElementById("owner").focus();
  });
}

if (applicationContent) initApplication();
renderPricing();
