"use strict";

// Якірні переходи з карток зберігають вибір тварини без перезавантаження.
document.querySelectorAll("[data-select-pet]").forEach((link) => {
  link.addEventListener("click", () => {
    const select = document.getElementById("calc-pet");
    select.value = link.dataset.selectPet;
    select.dispatchEvent(new Event("input", { bubbles: true }));
  });
});

document.querySelectorAll('a[href="#application"]').forEach((link) => {
  link.addEventListener("click", () => {
    const calculatorPet = document.getElementById("calc-pet");
    const applicationPet = document.getElementById("application-pet");
    if (calculatorPet && applicationPet) {
      applicationPet.value = calculatorPet.value;
      applicationPet.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
});

const weatherWidget = document.getElementById("weather-widget");
const weatherContent = document.getElementById("weather-content");
const weatherRefresh = document.getElementById("weather-refresh");
const weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=49.8397&longitude=24.0297&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FKyiv";
let weatherBusy = false;

function weatherDescription(code) {
  if (code === 0) return "Ясно";
  if (code >= 1 && code <= 3) return "Мінлива хмарність";
  if ([45, 48].includes(code)) return "Туман";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Дощ";
  if ((code >= 71 && code <= 77) || [85, 86].includes(code)) return "Сніг";
  if (code >= 95 && code <= 99) return "Гроза";
  return "Поточна погода";
}

async function loadWeather() {
  if (!weatherWidget || weatherBusy) return;
  weatherBusy = true;
  weatherRefresh.disabled = true;
  weatherWidget.setAttribute("aria-busy", "true");
  weatherContent.textContent = "Завантажуємо актуальну погоду…";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(weatherUrl, { signal: controller.signal });
    if (!response.ok) throw new Error("Weather unavailable");
    const data = await response.json();
    const current = data.current;
    if (!current || !Number.isFinite(current.temperature_2m) || !Number.isFinite(current.wind_speed_10m)) {
      throw new Error("Invalid weather data");
    }
    const temperature = document.createElement("p");
    temperature.className = "text-4xl font-semibold text-brand";
    temperature.textContent = `${Math.round(current.temperature_2m)} °C`;
    const summary = document.createElement("p");
    summary.className = "mt-3 text-lg";
    summary.textContent = `${weatherDescription(current.weather_code)} · вітер ${current.wind_speed_10m} км/год`;
    const updated = document.createElement("p");
    updated.className = "mt-3 text-sm text-muted";
    const value = current.time;
    updated.textContent = typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
      ? `Дані на ${value.slice(11, 16)} за київським часом.`
      : "Отримано актуальні дані Open-Meteo.";
    weatherContent.replaceChildren(temperature, summary, updated);
  } catch {
    weatherContent.textContent = "Не вдалося завантажити погоду. Перевірте інтернет і спробуйте ще раз.";
  } finally {
    clearTimeout(timeout);
    weatherBusy = false;
    weatherRefresh.disabled = false;
    weatherWidget.removeAttribute("aria-busy");
  }
}

if (weatherWidget) {
  weatherRefresh.addEventListener("click", loadWeather);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        loadWeather();
      }
    }, { rootMargin: "200px" });
    observer.observe(weatherWidget);
  } else loadWeather();
}
