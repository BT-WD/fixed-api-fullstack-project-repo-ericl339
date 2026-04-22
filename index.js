const loadButton = document.getElementById('loadButton');
const resultSection = document.getElementById('result');
const errorSection = document.getElementById('error');
const mediaContainer = document.getElementById('mediaContainer');
const titleElement = document.getElementById('title');
const dateElement = document.getElementById('date');
const descriptionElement = document.getElementById('description');
const favoriteButton = document.getElementById('favoriteButton');
const viewFavoritesButton = document.getElementById('viewFavoritesButton');
const favoritesSection = document.getElementById('favorites');
const favoritesList = document.getElementById('favoritesList');
const closeFavoritesButton = document.getElementById('closeFavoritesButton');

const FAVORITES_STORAGE_KEY = 'space_explorer_favorites';
let currentApod = null;

const NASA_API_KEY = '89KFzyZez4etpjSiGIh8mc78GhP32q6BlyhgOqyI';
const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';
const APOD_START_DATE = new Date('1995-06-16');

async function fetchRandomApod() {
  setLoading(true);
  hideError();

  try {
    const apod = await fetchRandomImageApod(10);
    displayApod(apod);
  } catch (error) {
    showError(error.message);
    resultSection.classList.add('hidden');
  } finally {
    setLoading(false);
  }
}

async function fetchRandomImageApod(maxAttempts = 50) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const formattedDate = getRandomApodDateString();
    const url = new URL(NASA_APOD_URL);
    url.searchParams.set('api_key', NASA_API_KEY);
    url.searchParams.set('date', formattedDate);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        continue;
      }

      const apod = await response.json();
      if (apod && apod.media_type === 'image') {
        return apod;
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error('Unable to generate image. Please try again later.');
}

function getRandomApodDateString() {
  const startDate = new Date(APOD_START_DATE);
  const endDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(0, 0, 0, 0);

  const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const randomOffset = getRandomInt(0, dayCount - 1);
  const randomDate = new Date(startDate.getTime() + randomOffset * 24 * 60 * 60 * 1000);

  return formatDate(randomDate);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function displayApod(apod) {
  if (!apod || !apod.title) {
    showError('No data was returned from NASA API.');
    return;
  }

  currentApod = apod;
  titleElement.textContent = apod.title;
  dateElement.textContent = apod.date ? `Date: ${apod.date}` : '';
  descriptionElement.textContent = apod.explanation || '';

  const mediaType = apod.media_type;
  mediaContainer.innerHTML = '';

  if (mediaType === 'image') {
    const image = document.createElement('img');
    image.src = apod.url;
    image.alt = apod.title;
    mediaContainer.appendChild(image);
  } else if (mediaType === 'video') {
    const iframe = document.createElement('iframe');
    iframe.src = apod.url;
    iframe.title = apod.title;
    iframe.allow = 'fullscreen';
    iframe.loading = 'lazy';
    iframe.height = '500';
    mediaContainer.appendChild(iframe);
  } else {
    mediaContainer.textContent = 'This APOD entry is neither an image nor a video.';
  }

  resultSection.classList.remove('hidden');
  updateFavoriteButton();
}

function setLoading(isLoading) {
  loadButton.disabled = isLoading;
  loadButton.textContent = isLoading ? 'Loading...' : 'Show a Random Celestial Image';
}

function showError(message) {
  errorSection.textContent = message;
  errorSection.classList.remove('hidden');
}

function hideError() {
  errorSection.textContent = '';
  errorSection.classList.add('hidden');
}

// Favorite management functions
function getFavorites() {
  const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  updateFavoritesVisibility();
}

function isFavorited(apod) {
  if (!apod || !apod.date) return false;
  const favorites = getFavorites();
  return favorites.some(fav => fav.date === apod.date);
}

function toggleFavorite() {
  if (!currentApod) return;

  const favorites = getFavorites();
  const index = favorites.findIndex(fav => fav.date === currentApod.date);

  if (index > -1) {
    // Remove from favorites
    favorites.splice(index, 1);
  } else {
    // Add to favorites
    const favoriteItem = {
      title: currentApod.title,
      date: currentApod.date,
      explanation: currentApod.explanation,
      url: currentApod.url,
      media_type: currentApod.media_type
    };
    favorites.push(favoriteItem);
  }

  saveFavorites(favorites);
  updateFavoriteButton();
}

function updateFavoriteButton() {
  if (isFavorited(currentApod)) {
    favoriteButton.classList.add('favorited');
  } else {
    favoriteButton.classList.remove('favorited');
  }
}

function updateFavoritesVisibility() {
  const favorites = getFavorites();
  viewFavoritesButton.classList.toggle('hidden', favorites.length === 0);
}

function displayFavorites() {
  const favorites = getFavorites();

  if (favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-favorites">No favorites yet</p>';
    return;
  }

  favoritesList.innerHTML = '';
  favorites.forEach((item, index) => {
    const favoriteItem = document.createElement('div');
    favoriteItem.className = 'favorite-item';
    favoriteItem.innerHTML = `
      <img src="${item.url}" alt="${item.title}" />
      <div class="favorite-item-info">
        <h4 class="favorite-item-title">${item.title}</h4>
        <p class="favorite-item-date">${item.date}</p>
      </div>
      <button class="favorite-item-remove" type="button" data-index="${index}" aria-label="Remove from favorites">✕</button>
    `;

    const removeButton = favoriteItem.querySelector('.favorite-item-remove');
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const favs = getFavorites();
      favs.splice(parseInt(removeButton.dataset.index), 1);
      saveFavorites(favs);
      displayFavorites();
      updateFavoriteButton();
    });

    favoriteItem.addEventListener('click', () => {
      displayApod(favorites[index]);
      closeFavorites();
    });

    favoritesList.appendChild(favoriteItem);
  });
}

function openFavorites() {
  displayFavorites();
  favoritesSection.classList.remove('hidden');
}

function closeFavorites() {
  favoritesSection.classList.add('hidden');
}

loadButton.addEventListener('click', fetchRandomApod);
favoriteButton.addEventListener('click', toggleFavorite);
viewFavoritesButton.addEventListener('click', openFavorites);
closeFavoritesButton.addEventListener('click', closeFavorites);

window.addEventListener('load', updateFavoritesVisibility);

document.addEventListener('click', (e) => {
  if (favoritesSection && !favoritesSection.classList.contains('hidden')) {
    if (!favoritesSection.contains(e.target) && !viewFavoritesButton.contains(e.target)) {
      closeFavorites();
    }
  }
});