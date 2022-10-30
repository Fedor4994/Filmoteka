const header = document.querySelector('.header');
const headerLogo = document.querySelector('.header__logo');
const headerNavigationButtons = document.querySelector('.header__buttons_wrapper');
const headerHomePage = document.querySelector('.header__search_wrapper');
const headerLibraryPage = document.querySelector('.header__library_wrapper');
const filmsList = document.querySelector('.films');
const libraryList = document.querySelector('.library');
const paginationList = document.querySelector('.pagination');

let genres = null;
let page = 1;

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

headerLogo.addEventListener('click', event => {
  event.preventDefault();
  // Находит кнопку с подчеркиванием, и снимвет его с нее, а после вешает на первый попавшийся header__btn, а тоесть на хоум пейдж
  headerNavigationButtons.querySelector('.current-button').classList.remove('current-button');
  headerNavigationButtons.querySelector('.header__btn').classList.add('current-button');
  onHomeButtonClick();
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

    // if (window.innerWidth > 767) {
    //   console.log('Че-то делаем');
    //   if (page > 3) {
    //     paginationItem += `
    // <li class="pagination__item pagination__number pagination__${isActive}">${1}</li>
    // <li class="pagination__item">...</li>
    // `;
    //   }
    // }

    paginationItem += `
    <li class="pagination__item pagination__number pagination__${isActive}">${pageLength}</li>
    `;
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
  renderPagination(1000, page);
  renderPopularFilms(page);
  // document.documentElement.scrollTop = 0;
}

function onMinusClick() {
  page -= 1;
  renderPagination(1000, page);
  renderPopularFilms(page);
  // document.documentElement.scrollTop = 0;
}

function onNumbersClick(event) {
  if (event.target.classList.contains('pagination__number')) {
    page = Number(event.target.textContent);
    renderPagination(1000, page);
    renderPopularFilms(page);
    // document.documentElement.scrollTop = 0;
  }
}

renderPagination(1000, page);
renderPopularFilms(page);
