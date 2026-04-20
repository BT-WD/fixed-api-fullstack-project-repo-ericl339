const loadButton = document.getElementById('loadButton');
const resultSection = document.getElementById('result');
const errorSection = document.getElementById('error');
const mediaContainer = document.getElementById('mediaContainer');
const titleElement = document.getElementById('title');
const dateElement = document.getElementById('date');
const descriptionElement = document.getElementById('description');

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

loadButton.addEventListener('click', fetchRandomApod);