import axios from 'axios';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const BASE_URL = 'https://pixabay.com/api/';
const API_KEY = '39644693-c0461acba61e05ac022ebbc85';
const options = {
  params: {
    key: API_KEY,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    per_page: 40,
    page: 1,
    q: '',
  },
};

let totalHits = 0;
let isLoadingMore = false;
let noMoreResults = false;

// Initialize SimpleLightbox
const lightbox = new SimpleLightbox('.lightbox', {
captionsData: 'alt',
captionDelay: 250,
enableKeyboard: true,
showCounter: false,
scrollZoom: false,
close: false,
});

const searchForm = document.getElementById('search-form')
const loaderEl = document.querySelector('.loader')
const searchInput = document.querySelector('input[name="searchQuery"')
const galleryEl = document.querySelector('.gallery');

searchForm.addEventListener('submit', handleFormSubmit);
window.addEventListener('scroll', handleScroll);
document.addEventListener('DOMContentLoaded', hideLoader);

function showLoader() {
  loaderEl.style.display = 'block';
}

function hideLoader() {
  loaderEl.style.display = 'none';
}

function displayGallery(hits) {
  const photos = hits
    .map(item => {
      return `
            <a href="${item.largeImageURL}" class="lightbox">
                <div class="photo-card">
                    <img src="${item.webformatURL}" alt="${item.tags}" loading="lazy" />
                    <div class="info">
                        <p class="info-item">
                            <b>Likes</b>
                            ${item.likes}
                        </p>
                        <p class="info-item">
                            <b>Views</b>
                            ${item.views}
                        </p>
                        <p class="info-item">
                            <b>Comments</b>
                            ${item.comments}
                        </p>
                        <p class="info-item">
                            <b>Downloads</b>
                            ${item.downloads}
                        </p>
                    </div>
                </div>
            </a>
            `;
    })
    .join('');
  
  // Insert the markup into the gallery element
  galleryEl.insertAdjacentHTML('beforeend', photos);
  checkIfEndOfSearchResultsReached();
  lightbox.refresh();
}

function checkIfEndOfSearchResultsReached() {
  if (options.params.page * options.params.per_page >= totalHits) {
    if (!noMoreResults) {
      Notify.info("We're sorry, but you've reached the end of search results.");
      noMoreResults = true;
    }
  }
}

async function fetchMoreImages() {
  isLoadingMore = true;
  options.params.page += 1;

  try {
    showLoader();
    const response = await axios.get(BASE_URL, options);

    const hits = response.data.hits;
    displayGallery(hits);
  } catch (error) {
    Notify.failure(error);
    hideLoader();
  } finally {
    hideLoader();
    isLoadingMore = false;
  }
}

function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  // Calculate the scroll threshold
  const scrollThreshold = 300;

  // Check if the user has scrolled to near the bottom of the page, the gallery is not empty, more images have not been loaded yet, and the end of the search results has not been reached
  if (shouldLoadMore(scrollTop, scrollHeight, clientHeight, scrollThreshold)) {
    fetchMoreImages();
  }
}

function shouldLoadMore(scrollTop, scrollHeight, clientHeight, scrollThreshold) {
  return (
    scrollTop + clientHeight >= scrollHeight - scrollThreshold &&
    galleryEl.innerHTML !== '' &&
    !isLoadingMore &&
    !noMoreResults
  );
}

async function handleFormSubmit(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Get the search query from the search input field
  const searchQuery = searchInput.value.trim();
  //Update the options.params.q parameter
  options.params.q = searchQuery;

  // Check if the search query is empty
  if (searchQuery === '') {
    return;
  }

  // Reset the page number and the gallery HTML
  options.params.page = 1;
  galleryEl.innerHTML = '';

  // Set the reachedEnd flag to false
  noMoreResults = false;

  try {
    // Show the loader
    showLoader();

    // Make an HTTP GET request to the Pixabay API
    const response = await axios.get(BASE_URL, options);

    // Get the total number of hits and the hits from the response data
    totalHits = response.data.totalHits;
    const hits = response.data.hits;

    // Check if there are any hits
    if (hits.length === 0) {
      // Notify the user that there are no images matching the search query
      Notify.failure('There are no images matching your search query. Please try to search something else.');
    } else {
      // Notify the user that the search results have been found
      Notify.success(`Hooray! We found ${totalHits} images in total.`);

      // Render the gallery
      displayGallery(hits);
    }

    // Clear the search input field
    searchInput.value = '';

    // Hide the loader
    hideLoader();
  } catch (error) {
    // Notify the user of the error
    Notify.failure(error);

    // Hide the loader
    hideLoader();
  }
}
