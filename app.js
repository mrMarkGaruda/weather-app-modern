const defaultCoords = { lat: 48.8566, lon: 2.3522, name: "Paris Weather" };

const openMeteoURL = (lat, lon) => 
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

const debounce = (fn, delay = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

const weatherCodeToEmoji = (code) => ({
  0: "☀️ Clear sky", 1: "🌤️ Mainly clear", 2: "🌤️ Mainly clear", 3: "☁️ Overcast",
  45: "🌫️ Fog", 48: "🌫️ Fog", 51: "🌦️ Drizzle", 53: "🌦️ Drizzle", 55: "🌦️ Drizzle",
  56: "🌧️ Freezing drizzle", 57: "🌧️ Freezing drizzle", 61: "🌧️ Rain", 63: "🌧️ Rain",
  65: "🌧️ Rain", 66: "❄️ Freezing rain", 67: "❄️ Freezing rain", 71: "❄️ Snow",
  73: "❄️ Snow", 75: "❄️ Snow", 77: "❄️ Snow grains", 80: "🌦️ Rain showers",
  81: "🌦️ Rain showers", 82: "🌦️ Rain showers", 85: "❄️ Snow showers",
  86: "❄️ Snow showers", 95: "⛈️ Thunderstorm", 96: "⛈️ Thunderstorm", 99: "⛈️ Thunderstorm"
}[code] || "❓ Unknown");

const fetchWeather = async (lat, lon, city = "") => {
  try {
    const res = await fetch(openMeteoURL(lat, lon));
    const data = await res.json();
    updateWeatherCard(data, city);
  } catch (e) {
    document.getElementById("error-message").textContent = `Error: ${e.message}`;
  }
};

const updateWeatherCard = ({ current_weather }, city) => {
  const { temperature, windspeed, winddirection, weathercode, time } = current_weather;
  if (city) document.getElementById("city-name").textContent = city;
  document.getElementById("temperature").textContent = `Temperature: ${temperature}°C`;
  document.getElementById("windspeed").textContent = `Wind Speed: ${windspeed} km/h`;
  document.getElementById("winddir").textContent = `Wind Direction: ${winddirection}°`;
  document.getElementById("weather-description").textContent = weatherCodeToEmoji(weathercode);
  document.getElementById("observation-time").textContent = `Observed at: ${new Date(time).toLocaleTimeString()}`;
  document.getElementById("weather-icon").textContent = weatherCodeToEmoji(weathercode).split(" ")[0];
};

const fetchSuggestions = async (query) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=10`);
    let results = await res.json();
    const seen = new Set();
    return results.filter(({ type, display_name }) =>
      ["city", "town"].includes(type) && !seen.has(display_name) && seen.add(display_name)
    );
  } catch {
    return [];
  }
};

const renderSuggestions = (suggestions) => {
  const list = document.getElementById("suggestions");
  list.innerHTML = "";
  suggestions.forEach(({ display_name, lat, lon }) => {
    const li = document.createElement("li");
    li.textContent = display_name;
    Object.assign(li.dataset, { lat, lon });
    li.classList.add("suggestion-item");
    list.appendChild(li);
  });
  list.classList.add("show");
};

const handleSearchInput = async (e) => {
  const query = e.target.value.trim();
  if (!query) return document.getElementById("suggestions").classList.remove("show");
  renderSuggestions(await fetchSuggestions(query));
};

document.getElementById("search-input").addEventListener("input", debounce(handleSearchInput, 300));

document.getElementById("suggestions").addEventListener("click", (e) => {
  if (!e.target.matches("li.suggestion-item")) return;
  fetchWeather(e.target.dataset.lat, e.target.dataset.lon, e.target.textContent);
  document.getElementById("suggestions").innerHTML = "";
  document.getElementById("search-input").value = "";
});

document.addEventListener("DOMContentLoaded", () => fetchWeather(defaultCoords.lat, defaultCoords.lon, defaultCoords.name));
