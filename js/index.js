const header = document.querySelector('.header');
const headerLogo = document.querySelector('.header__logo');
const headerErrorMessage = document.querySelector('.header__error');
const headerNavigationButtons = document.querySelector('.header__buttons_wrapper');
const headerHomePage = document.querySelector('.header__search_wrapper');
const headerLibraryPage = document.querySelector('.header__library_wrapper');
const filmsList = document.querySelector('.films');
const libraryList = document.querySelector('.library');
const paginationList = document.querySelector('.pagination');
const searchForm = document.querySelector('.header__form');
const modal = document.querySelector('.backdrop');

let inputValue = '';
let genres = null;
let page = 1;
let totalFoundPages = null;

async function getGenres() {
  const resolve = await fetch(
    'https://api.themoviedb.org/3/genre/movie/list?api_key=abf5df7d75a67bd02b3b1e4ead1fc14d&language=en-US'
  );
  const data = resolve.json();
  return data;
}

async function getPopularFilms(page) {
  const resolve = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=abf5df7d75a67bd02b3b1e4ead1fc14d&page=${page}`
  );
  const data = resolve.json();
  return data;
}

getGenres().then(data => {
  genres = data.genres;
});

function renderPopularFilms() {
  getPopularFilms(page)
    .then(data => {
      const popularFilms = data.results;
      headerErrorMessage.classList.add('is-hidden');

      const murkup = popularFilms
        .map(film => {
          const arr = [];

          film.genre_ids.forEach(id => {
            genres.forEach(genre => {
              if (genre.id === id) {
                arr.push(genre.name);
              }
            });
          });

          return `
      <li class="films__item">
      <img
        src="https://image.tmdb.org/t/p/w500${film.poster_path}"
        alt="movie poster"
        class="films__image"
        id=${film.id}
      />
      <div class="flims__desc_wrapper">
        <h3 class="films__title">${film.title}</h3>
        <p class="films__description">${arr.join(', ')} | ${film.release_date.slice(0, 4)}</p>
      </div>
    </li>
      `;
        })
        .join('');

      filmsList.innerHTML = murkup;
    })
    .catch(err => {
      console.log(err);
    });
}

searchForm.addEventListener('click', searchFilms);

function searchFilms(event) {
  event.preventDefault();
  page = 1;
  if (event.target.classList.contains('header__search')) {
    inputValue = event.currentTarget.elements.query.value;
    renderFilms(inputValue);
    event.currentTarget.reset();
  }
}

function renderFilms(value) {
  getMovies(value, page)
    .then(data => {
      if (data.total_pages === 0) {
        headerErrorMessage.classList.remove('is-hidden');
        return;
      }
      headerErrorMessage.classList.add('is-hidden');
      totalFoundPages = data.total_pages;
      const foundFilms = data.results;
      const murkup = foundFilms
        .map(film => {
          const arr = [];

          film.genre_ids.forEach(id => {
            genres.forEach(genre => {
              if (genre.id === id) {
                arr.push(genre.name);
              }
            });
          });

          return `
          <li class="films__item">
          <img src="https://image.tmdb.org/t/p/w500${
            film.poster_path
          }" alt="movie poster" class="films__image"  id=${film.id}  />
          <div class="flims__desc_wrapper">
          <h3 class="films__title">${film.title}</h3>
          <p class="films__description">${arr.join(', ')} | ${film?.release_date?.slice(0, 4)}</p>
          </div>
          </li>
          `;
        })
        .join('');

      filmsList.innerHTML = murkup;
      renderPagination(totalFoundPages, page);
    })
    .catch(err => {
      console.log(err);
    });
}

async function getMovies(movieName, page) {
  const resolve = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=abf5df7d75a67bd02b3b1e4ead1fc14d&query=${movieName}&page=${page}`
  );
  const data = resolve.json();
  return data;
}

headerLogo.addEventListener('click', event => {
  event.preventDefault();
  // Находит кнопку с подчеркиванием, и снимвет его с нее, а после вешает на первый попавшийся header__btn, а тоесть на хоум пейдж
  headerNavigationButtons.querySelector('.current-button').classList.remove('current-button');
  headerNavigationButtons.querySelector('.header__btn').classList.add('current-button');
  onHomeButtonClick();
  page = 1;
  totalFoundPages = null;
  renderPopularFilms(page);
  renderPagination(1000, page);
});

headerNavigationButtons.addEventListener('click', event => {
  const target = event.target;
  // Если нажали НЕ по кнопке с подчеркиванием, то находим среди двух кнопок ту у которой оно есть и удаляем
  // а той кнопке по которой кликнули(у которой нет подчеркивания), той добавляем класс
  if (!target.classList.contains('current-button') && target.classList.contains('header__btn')) {
    event.currentTarget.querySelector('.current-button').classList.remove('current-button');
    target.classList.add('current-button');

    //Вызов необходимых функций при нажатии на ту, или иную кнопку
    if (target.textContent === 'HOME') {
      onHomeButtonClick();
    }
    if (target.textContent === 'MY LIBRARY') {
      onLibraryButtonClick();
    }
  }
});

// Действия по нажатию на кнопку HOME
function onHomeButtonClick() {
  header.classList.add('header__home');
  header.classList.remove('header__library');

  headerLibraryPage.style.display = 'none';
  headerHomePage.style.display = 'flex';

  filmsList.style.display = 'flex';
  libraryList.style.display = 'none';
}

// Действия по нажатию на кнопку MY LIBRARY
function onLibraryButtonClick() {
  header.classList.remove('header__home');
  header.classList.add('header__library');

  headerHomePage.style.display = 'none';
  headerLibraryPage.style.display = 'flex';

  filmsList.style.display = 'none';
  libraryList.style.display = 'flex';
}

async function getMovieInfo(id) {
  const resolve = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=abf5df7d75a67bd02b3b1e4ead1fc14d`
  );
  const data = resolve.json();
  return data;
}

function renderModal(info) {
  const genres = info.genres.map(genre => genre.name);
  window.addEventListener('keydown', onEscClose);
  const murkup = `
   <div class="modal">
        <button data-modal-close type="button" class="modal__close">
          <img src="./img/close.svg" alt="close" class="modal__close_icon" />
        </button>
        <img src="https://image.tmdb.org/t/p/w500${
          info.poster_path
        }" alt="movie poster" class="modal__img" />
        <div class="modal__body">
          <h3 class="modal__title">${info.title.toUpperCase()}</h3>
          <div class="modal__stats">
            <div class="modal__stats_left">
              <span class="modal__text">Vote / Votes</span>
              <span class="modal__text">Popularity</span>
              <span class="modal__text">Original Title</span>
              <span class="modal__text">Genre</span>
            </div>
            <div class="modal__stats_right">
              <p class="modal__votes_info">
                <span class="modal__vote">${info.vote_average.toFixed(
                  2
                )}</span> <span class="modal__text">/</span>
                <span class="modal__votes">${info.vote_count}</span>
              </p>
              <span class="modal__text_bold">${info.popularity.toFixed(0)}</span>
              <span class="modal__text_bold">${info.original_title.toUpperCase()}</span>
              <span class="modal__text_bold">${genres.join(', ')}</span>
            </div>
          </div>
          <span class="modal__about">ABOUT</span>
          <p class="modal__desription">
            ${info.overview}
          </p>
          <div class="modal__buttons">
            <button type="button" class="modal__button-watched">ADD TO WATCHED</button>
            <button type="button" class="modal__button-queue">ADD TO QUEUE</button>
          </div>
        </div>
      </div>
  `;

  modal.innerHTML = murkup;

  const modalClose = document.querySelector('.modal__close');
  modalClose.addEventListener('click', () => {
    toggleModal();
    window.removeEventListener('keydown', onEscClose);
  });
}

filmsList.addEventListener('click', openFilmsModal);

function openFilmsModal(event) {
  if (event.target.classList.contains('films__image')) {
    getMovieInfo(Number(event.target.id))
      .then(data => {
        renderModal(data);
        toggleModal();
      })
      .catch(err => {
        console.log(err);
      });
  }
}

function onEscClose(event) {
  if (event.key === 'Escape') {
    toggleModal();
    window.removeEventListener('keydown', onEscClose);
  }
}

function toggleModal() {
  modal.classList.toggle('is-hidden');
  if (modal.classList.contains('is-hidden')) {
    enableScroll();
  } else {
    disableScroll();
  }
}

modal.addEventListener('click', event => {
  if (event.target.classList.contains('backdrop')) {
    toggleModal();
    window.removeEventListener('keydown', onEscClose);
  }
});

function renderPagination(allPages, visualPage) {
  let paginationItem = '';

  let beforePage = visualPage - 2;
  let afterPage = visualPage + 2;
  let isActive = '';

  if (visualPage > 1) {
    paginationItem += `
    <li class="pagination__item">
            <button type="button" class="pagination__button_minus">
              <img src="./img/arrow-left.svg" alt="arrow-left" width="16" height="16" />
            </button>
          </li>
    `;
  }

  if (window.innerWidth > 767) {
    if (page > 3) {
      paginationItem += `
    <li class="pagination__item pagination__number pagination__${isActive}">${1}</li>
    <li class="pagination__item">...</li>
    `;
    }
  }

  for (let pageLength = beforePage; pageLength <= afterPage; pageLength++) {
    if (pageLength > allPages) {
      continue;
    }
    if (pageLength === -1) {
      pageLength += 1;
    }
    if (pageLength === 0) {
      pageLength += 1;
    }
    if (pageLength === visualPage) {
      isActive = 'active';
    } else {
      isActive = '';
    }

    paginationItem += `
    <li class="pagination__item pagination__number pagination__${isActive}">${pageLength}</li>
    `;
  }

  if (window.innerWidth > 767) {
    if (page > 3 && page < allPages - 4) {
      paginationItem += `
        <li class="pagination__item">...</li>
        <li class="pagination__item pagination__number pagination__${isActive}">${page + 5}</li>
    `;
    }
  }

  if (visualPage < allPages) {
    paginationItem += `
    <li class="pagination__item ">
            <button type="button" class="pagination__button_plus">
              <img src="./img/arrow-right.svg" alt="arrow-right" width="16" height="16" />
            </button>
          </li>
    `;
  }

  paginationList.innerHTML = paginationItem;

  paginationList.addEventListener('click', onNumbersClick);

  if (page > 1) {
    const paginationButtonMinus = document.querySelector('.pagination__button_minus');
    paginationButtonMinus.addEventListener('click', onMinusClick);
  }

  if (page < allPages) {
    const paginationButtonPlus = document.querySelector('.pagination__button_plus');
    paginationButtonPlus.addEventListener('click', onPlusClick);
  }
}

function onPlusClick() {
  page += 1;

  if (totalFoundPages) {
    renderFilms(inputValue);
    renderPagination(totalFoundPages, page);
  } else {
    renderPopularFilms(page);
    renderPagination(1000, page);
  }

  // document.documentElement.scrollTop = 0;
}

function onMinusClick() {
  page -= 1;
  if (totalFoundPages) {
    renderFilms(inputValue);
    renderPagination(totalFoundPages, page);
  } else {
    renderPopularFilms(page);
    renderPagination(1000, page);
  }

  // document.documentElement.scrollTop = 0;
}

function onNumbersClick(event) {
  if (event.target.classList.contains('pagination__number')) {
    page = Number(event.target.textContent);
    if (totalFoundPages) {
      renderFilms(inputValue);
      renderPagination(totalFoundPages, page);
    } else {
      renderPopularFilms(page);
      renderPagination(1000, page);
    }

    // document.documentElement.scrollTop = 0;
  }
}

function disableScroll() {
  const widthScroll = window.innerWidth - document.body.offsetWidth;

  document.body.style.cssText = `
        position: relative;
        overflow: hidden;
        heigth: 100vh;
        padding-right: ${widthScroll}px;
    `;
}

function enableScroll() {
  document.body.style.cssText = ``;
}

renderPopularFilms(page);
renderPagination(1000, page);
