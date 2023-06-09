const apiKey = '26ba3a7e283acb9cd1e8665c6c3b319a';
const coordinatesUrl = 'https://api.openweathermap.org/data/2.5/weather?q=';
const oneCallUrl = 'https://api.openweathermap.org/data/2.5/onecall?lat=';
const userFormEl = $('#city-search');
const col2El = $('.col2');
const cityInputEl = $('#city');
const fiveDayEl = $('#five-day');
const searchHistoryEl = $('#search-history');
const currentDay = moment().format('M/DD/YYYY');
const weatherIconUrl = 'http://openweathermap.org/img/wn/';
const searchHistoryArray = loadSearchHistory();

function titleCase(str) {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function loadSearchHistory() {
  let searchHistoryArray = JSON.parse(localStorage.getItem('search history')) || { searchedCity: [] };
  searchHistoryArray.searchedCity.forEach(city => searchHistory(city));
  return searchHistoryArray;
}

function saveSearchHistory() {
  localStorage.setItem('search history', JSON.stringify(searchHistoryArray));
}

function searchHistory(city) {
  const searchHistoryItem = $('<div>').addClass('search-history-item');
  const searchHistoryBtn = $('<button>').addClass('btn').text(city).on('click', () => {
    $('#current-weather').remove();
    $('#five-day').empty();
    $('#five-day-header').remove();
    getWeather(city);
  }).attr('type', 'button');
  const deleteBtn = $('<button>').addClass('delete-btn').html('&times;').on('click', event => {
    event.stopPropagation();
    const city = $(event.target).prev().text();
    deleteSearchHistory(city);
    $(event.target).parent().remove();
  });

  searchHistoryItem.append(searchHistoryBtn, deleteBtn);
  searchHistoryEl.append(searchHistoryItem);
}

function deleteSearchHistory(city) {
  const index = searchHistoryArray.searchedCity.indexOf(city);
  if (index > -1) {
    searchHistoryArray.searchedCity.splice(index, 1);
    saveSearchHistory();
  }
}

function getWeather(city) {
  const coordinatesUrlWithCity = `${coordinatesUrl}${city}&appid=${apiKey}`;

  fetch(coordinatesUrlWithCity)
    .then(coordinateResponse => {
      if (coordinateResponse.ok) {
        coordinateResponse.json().then(data => {
          const { lat: cityLatitude, lon: cityLongitude } = data.coord;
          const oneCallUrlWithCoords = `${oneCallUrl}${cityLatitude}&lon=${cityLongitude}&appid=${apiKey}&units=imperial`;

          fetch(oneCallUrlWithCoords)
            .then(weatherResponse => {
              if (weatherResponse.ok) {
                weatherResponse.json().then(weatherData => {
                  displayCurrentDay(city, weatherData);
                  displayFiveDayForecast(weatherData);
                });
              }
            });
        });
      } else {
        alert('Error: Open Weather could not find city');
      }
    })
    .catch(() => {
      alert('Unable to connect to Open Weather');
    });
}

function displayCurrentDay(city, weatherData) {
  const currentWeatherEl = $('<div>').attr('id', 'current-weather');
  const weatherIcon = weatherData.current.weather[0].icon;
  const cityCurrentWeatherIcon = `${weatherIconUrl}${weatherIcon}.png`;
  const currentWeatherHeadingEl = $('<h2>').text(`${city} (${currentDay})`);
  const iconImgEl = $('<img>').attr({ id: 'current-weather-icon', src: cityCurrentWeatherIcon, alt: 'Weather Icon' });
  const currWeatherListEl = $('<ul>');
  const currWeatherDetails = [
    `Temp: ${weatherData.current.temp} °F`,
    `Wind: ${weatherData.current.wind_speed} MPH`,
    `Humidity: ${weatherData.current.humidity}%`
  ];

  for (const detail of currWeatherDetails) {
    const currWeatherListItem = $('<li>').text(detail.includes('UV Index') ? 'UV Index: ' : detail);
    if (detail.includes('UV Index')) {
      const uviItem = $('<span>').text(weatherData.current.uvi);
      currWeatherListItem.append(uviItem);
    }
    currWeatherListEl.append(currWeatherListItem);
  }

  $('#five-day').before(currentWeatherEl);
  currentWeatherEl.append(currentWeatherHeadingEl);
  currentWeatherHeadingEl.append(iconImgEl);
  currentWeatherEl.append(currWeatherListEl);
}

function displayFiveDayForecast(weatherData) {
  const fiveDayHeaderEl = $('<h2>').text('5-Day Forecast:').attr('id', 'five-day-header');
  $('#current-weather').after(fiveDayHeaderEl);
  const fiveDayArray = Array.from({ length: 5 }, (_, i) => moment().add(i + 1, 'days').format('M/DD/YYYY'));

  for (const forecastDate of fiveDayArray) {
    const cardDivEl = $('<div>').addClass('col3');
    const cardBodyDivEl = $('<div>').addClass('card-body');
    const cardTitleEl = $('<h3>').addClass('card-title').text(forecastDate);
    const forecastIcon = weatherData.daily[fiveDayArray.indexOf(forecastDate)].weather[0].icon;
    const forecastIconEl = $('<img>').attr({ src: `${weatherIconUrl}${forecastIcon}.png`, alt: 'Weather Icon' });
    const tempEL = $('<p>').addClass('card-text').text(`Temp: ${weatherData.daily[fiveDayArray.indexOf(forecastDate)].temp.max}`);
    const windEL = $('<p>').addClass('card-text').text(`Wind: ${weatherData.daily[fiveDayArray.indexOf(forecastDate)].wind_speed} MPH`);
    const humidityEL = $('<p>').addClass('card-text').text(`Humidity: ${weatherData.daily[fiveDayArray.indexOf(forecastDate)].humidity}%`);

    $('#five-day').append(cardDivEl);
    cardDivEl.append(cardBodyDivEl);
    cardBodyDivEl.append(cardTitleEl);
    cardBodyDivEl.append(forecastIconEl);
    cardBodyDivEl.append(tempEL);
    cardBodyDivEl.append(windEL);
    cardBodyDivEl.append(humidityEL);
  }
}

function submitCitySearch(event) {
  event.preventDefault();
  const city = titleCase(cityInputEl.val().trim());

  if (searchHistoryArray.searchedCity.includes(city)) {
    alert(`${city} is included in history below. Click the ${city} button to get weather.`);
    cityInputEl.val('');
  } else if (city) {
    getWeather(city);
    searchHistory(city);
    searchHistoryArray.searchedCity.push(city);
    saveSearchHistory();
    cityInputEl.val('');
  } else {
    alert('Please enter a city');
  }
}

$(document).ready(function() {
  userFormEl.on('submit', submitCitySearch);

  $('#search-btn').on('click', function () {
    $('#current-weather').remove();
    $('#five-day').empty();
    $('#five-day-header').remove();
  });
});
