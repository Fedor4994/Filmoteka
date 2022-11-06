// Переменные для елементов хедера
const header = document.querySelector('.header');
const headerLogo = document.querySelector('.header__logo');
const headerErrorMessage = document.querySelector('.header__error');
const headerNavigationButtons = document.querySelector('.header__buttons_wrapper');
const headerHomePage = document.querySelector('.header__search_wrapper');
const headerLibraryPage = document.querySelector('.header__library_wrapper');
const headerWatchedButton = document.querySelector('.header__watched_button');
const headerQueueButton = document.querySelector('.header__queue_button');

// Переменные для списков карточек популярных/просмотренных/запланированных фильмов и списка элементов пагинации
// которые динамические заполняются контентом
const filmsList = document.querySelector('.films');
const watchedList = document.querySelector('.watched');
const queueList = document.querySelector('.queue');
const paginationList = document.querySelector('.pagination');

// Форма в хедере с инпутом и кнопкой для сабмита
const searchForm = document.querySelector('.header__form');
// Модальное окно при нажатии на постер фильма
const modal = document.querySelector('.backdrop');

// Глобальные переменные для хранения значения инпута/списка всех жанров из API/текущей страници для пагинации/доступного кол-ва страниц
let inputValue = '';
let genres = null;
let page = 1;
let totalFoundPages = null;

// Массивы для хранение данных о просмотренных и запланированных фильмах
// При загрузке страницы заполняються данными из локального хранилища, если оно не пустое
let watchedFilms = [];
if (localStorage.getItem('watched') && localStorage.getItem('watched') !== '[]') {
  watchedFilms = JSON.parse(localStorage.getItem('watched'));
}
let queueFilms = [];
if (localStorage.getItem('queue') && localStorage.getItem('queue') !== '[]') {
  queueFilms = JSON.parse(localStorage.getItem('queue'));
}

// Запрос на сервер за массивом всех доступных жанров фильмов
async function getGenres() {
  const resolve = await fetch(
    'https://api.themoviedb.org/3/genre/movie/list?api_key=abf5df7d75a67bd02b3b1e4ead1fc14d&language=en-US'
  );
  const data = resolve.json();
  return data;
}

// Присвоения массива жанров в глобальную переменную
getGenres().then(data => {
  genres = data.genres;
});

// Запрос на сервер за массивом из 20 самых популярных фильмов за неделю
// В параметр передается глобальная переменная - номер страницы, проще говоря порции элементов, за которыми нужно делать запрос
async function getPopularFilms(page) {
  const resolve = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=abf5df7d75a67bd02b3b1e4ead1fc14d&page=${page}`
  );
  const data = resolve.json();
  return data;
}

// Функция заполнеиния списка популярных фильмов на гловной странице созданными карточками с динамически подставленными
// данными из полученого массива из двадцати объектов фильмов
function renderPopularFilms() {
  getPopularFilms(page)
    .then(data => {
      // Когда новая пачка фильмов рендериться надобности в сообщении о ошибке больше нет
      headerErrorMessage.classList.add('is-hidden');

      const popularFilms = data.results;
      const murkup = popularFilms
        .map(film => {
          // Массив для назвний жанров конкретного фильма на конкретной итерации
          const arr = [];

          // Цикл для перебора айдишников жанром конкретного фильма на конкретной итерации
          film.genre_ids.forEach(id => {
            // Цикл для перебра массива всех доступых жанров из глобальной переменной
            genres.forEach(genre => {
              // Если айдишнк жанра конкретного фильма совпадает с айдишнийком какого то жанра из всех доступных
              // то мы пушим имя этого жанра в локальный массив, который отрисуется в карточке на месте жанров
              if (genre.id === id) {
                arr.push(genre.name);
              }
            });
          });

          // Шаблонная строка создающая карточку фильма с динамическими данными на каждой итерации
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

async function getMovies(movieName, page) {
  const resolve = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=abf5df7d75a67bd02b3b1e4ead1fc14d&query=${movieName}&page=${page}`
  );
  const data = resolve.json();
  return data;
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
  watchedList.style.display = 'none';

  queueList.style.display = 'none';
  watchedList.style.display = 'none';
  page = 1;
  renderPopularFilms(page);
  renderPagination(1000, page);
}

// Действия по нажатию на кнопку MY LIBRARY
function onLibraryButtonClick() {
  header.classList.remove('header__home');
  header.classList.add('header__library');

  headerHomePage.style.display = 'none';
  headerLibraryPage.style.display = 'flex';

  filmsList.style.display = 'none';
  watchedList.style.display = 'flex';

  page = 1;

  if (
    headerWatchedButton.classList.contains('active-header-button') &&
    localStorage.getItem('watched') &&
    localStorage.getItem('watched') !== '[]'
  ) {
    renderWatchedFilms(page);
    renderPagination(totalFoundPages, page);
  } else {
    paginationList.innerHTML = `
    <div class="empty-page">
                  <img src="./img/empty.jpg" alt="no films img" />
                  <span class="empty-page_text">There are no films here yet</span>
    </div>
    `;
  }

  if (
    headerQueueButton.classList.contains('active-header-button') &&
    localStorage.getItem('queue') &&
    localStorage.getItem('queue') !== '[]'
  ) {
    watchedList.style.display = 'none';
    queueList.style.display = 'flex';
    renderQueueFilms(page);
  } else if (headerQueueButton.classList.contains('active-header-button')) {
    watchedList.style.display = 'none';
    queueList.style.display = 'flex';
    paginationList.innerHTML = `
    <div class="empty-page">
                  <img src="./img/empty.jpg" alt="no films img" />
                  <span class="empty-page_text">There are no films here yet</span>
    </div>
    `;
  }
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

        const watchedButton = document.querySelector('.modal__button-watched');
        const queueButton = document.querySelector('.modal__button-queue');
        watchedButton.addEventListener('click', () => {
          watchedFilms.push({
            id: data.id,
            poster: data.poster_path,
            title: data.title,
            genres: data.genres,
            date: data.release_date,
            vote: data.vote_average,
          });

          localStorage.setItem('watched', JSON.stringify(watchedFilms));
        });

        queueButton.addEventListener('click', () => {
          queueFilms.push({
            id: data.id,
            poster: data.poster_path,
            title: data.title,
            genres: data.genres,
            date: data.release_date,
            vote: data.vote_average,
          });
          localStorage.setItem('queue', JSON.stringify(queueFilms));
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
}

function renderWatchedFilms(index) {
  const watchedFilms = JSON.parse(localStorage.getItem('watched'));

  const murkup = watchedFilms.map(film => {
    const genres = film.genres.map(genre => genre.name);
    return `
    <li class="library__item">
              <img src="https://image.tmdb.org/t/p/w500${
                film.poster
              }" alt="movie cover" class="library__image" id=${film.id} />
              <div class="library__descr_wrapper">
                <h3 class="library__title">${film.title.toUpperCase()}</h3>
                <p class="library__description">
                  ${genres.join(', ')} | ${film?.date?.slice(
      0,
      4
    )} <span class="library__vote">${film.vote.toFixed(1)}</span>
                </p>
              </div>
            </li>
    `;
  });

  let size = 4;
  if (window.innerWidth > 767) {
    size = 8;
  }
  if (window.innerWidth > 1280) {
    size = 9;
  }
  let subarray = [];
  for (let i = 0; i < Math.ceil(murkup.length / size); i++) {
    subarray[i] = murkup.slice(i * size, i * size + size);
  }

  totalFoundPages = subarray.length;

  watchedList.innerHTML = subarray[index - 1].join('');
  renderPagination(totalFoundPages, page);
}

function renderQueueFilms(index) {
  const queueFilms = JSON.parse(localStorage.getItem('queue'));

  const murkup = queueFilms.map(film => {
    const genres = film.genres.map(genre => genre.name);
    return `
    <li class="library__item">
              <img src="https://image.tmdb.org/t/p/w500${
                film.poster
              }" alt="movie cover" class="library__image" id=${film.id} />
              <div class="library__descr_wrapper">
                <h3 class="library__title">${film.title.toUpperCase()}</h3>
                <p class="library__description">
                  ${genres.join(', ')} | ${film?.date?.slice(
      0,
      4
    )} <span class="library__vote">${film.vote.toFixed(1)}</span>
                </p>
              </div>
            </li>
    `;
  });

  let size = 4;
  if (window.innerWidth > 767) {
    size = 8;
  }
  if (window.innerWidth > 1280) {
    size = 9;
  }
  let subarray = [];
  for (let i = 0; i < Math.ceil(murkup.length / size); i++) {
    subarray[i] = murkup.slice(i * size, i * size + size);
  }

  totalFoundPages = subarray.length;

  queueList.innerHTML = subarray[index - 1].join('');
  renderPagination(totalFoundPages, page);
}

watchedList.addEventListener('click', openLibraryModal);

queueList.addEventListener('click', openLibraryModal);

function openLibraryModal(event) {
  if (event.target.classList.contains('library__image')) {
    getMovieInfo(Number(event.target.id))
      .then(data => {
        renderModal(data);

        const watchedButton = document.querySelector('.modal__button-watched');
        const queueButton = document.querySelector('.modal__button-queue');

        const modalBody = document.querySelector('.modal__body');
        if (headerWatchedButton.classList.contains('active-header-button')) {
          watchedButton.style.display = 'none';
          queueButton.style.display = 'flex';
        } else {
          queueButton.style.display = 'none';
          watchedButton.style.display = 'flex';
        }

        modalBody.insertAdjacentHTML(
          'beforeend',
          `
         <button class="clear__film">DELETE</button>
        `
        );

        const deleteButton = document.querySelector('.clear__film');

        watchedButton.addEventListener('click', () => {
          watchedFilms.push({
            id: data.id,
            poster: data.poster_path,
            title: data.title,
            genres: data.genres,
            date: data.release_date,
            vote: data.vote_average,
          });

          localStorage.setItem('watched', JSON.stringify(watchedFilms));
          deleteQueueFilm(data);
        });

        queueButton.addEventListener('click', () => {
          queueFilms.push({
            id: data.id,
            poster: data.poster_path,
            title: data.title,
            genres: data.genres,
            date: data.release_date,
            vote: data.vote_average,
          });
          localStorage.setItem('queue', JSON.stringify(queueFilms));
          deleteWatchedFilm(data);
        });

        deleteButton.addEventListener('click', () => {
          deleteWatchedFilm(data);
          deleteQueueFilm(data);
        });

        toggleModal();
      })
      .catch(err => {
        console.log(err);
      });
  }
}

function deleteQueueFilm(data) {
  queueFilms.forEach((film, index) => {
    if (film.id === data.id) {
      if (headerQueueButton.classList.contains('active-header-button')) {
        queueFilms.splice(index, 1);
        localStorage.setItem('queue', JSON.stringify(queueFilms));
        if (localStorage.getItem('queue') && localStorage.getItem('queue') !== '[]') {
          renderQueueFilms(page);
        } else {
          paginationList.innerHTML = `
                  <div class="empty-page">
                  <img src="./img/empty.jpg" alt="no films img" />
                  <span class="empty-page_text">There are no films here yet</span>
                  </div>
                  `;
          queueList.innerHTML = '';
        }

        toggleModal();
        window.removeEventListener('keydown', onEscClose);
      }
    }
  });
}

function deleteWatchedFilm(data) {
  watchedFilms.forEach((film, index) => {
    if (film.id === data.id) {
      if (headerWatchedButton.classList.contains('active-header-button')) {
        watchedFilms.splice(index, 1);
        localStorage.setItem('watched', JSON.stringify(watchedFilms));
        if (localStorage.getItem('watched') && localStorage.getItem('watched') !== '[]') {
          renderWatchedFilms(page);
        } else {
          paginationList.innerHTML = `
                  <div class="empty-page">
                  <img src="./img/empty.jpg" alt="no films img" />
                  <span class="empty-page_text">There are no films here yet</span>
                  </div>
                  `;
          watchedList.innerHTML = '';
        }

        toggleModal();
        window.removeEventListener('keydown', onEscClose);
      }
    }
  });
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

  if (
    headerQueueButton.classList.contains('active-header-button') &&
    header.classList.contains('header__library')
  ) {
    renderQueueFilms(page);
    renderPagination(totalFoundPages, page);
    return;
  }

  if (
    headerWatchedButton.classList.contains('active-header-button') &&
    header.classList.contains('header__library')
  ) {
    renderWatchedFilms(page);
    renderPagination(totalFoundPages, page);
    return;
  }

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

  if (
    headerQueueButton.classList.contains('active-header-button') &&
    header.classList.contains('header__library')
  ) {
    renderQueueFilms(page);
    renderPagination(totalFoundPages, page);
    return;
  }

  if (
    headerWatchedButton.classList.contains('active-header-button') &&
    header.classList.contains('header__library')
  ) {
    renderWatchedFilms(page);
    renderPagination(totalFoundPages, page);
    return;
  }

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

    if (
      headerQueueButton.classList.contains('active-header-button') &&
      header.classList.contains('header__library')
    ) {
      renderQueueFilms(page);
      renderPagination(totalFoundPages, page);
      return;
    }

    if (
      headerWatchedButton.classList.contains('active-header-button') &&
      header.classList.contains('header__library')
    ) {
      renderWatchedFilms(page);
      renderPagination(totalFoundPages, page);
      return;
    }

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

headerWatchedButton.addEventListener('click', () => {
  if (headerWatchedButton.classList.contains('active-header-button')) {
    return;
  }
  page = 1;
  if (localStorage.getItem('watched') && localStorage.getItem('watched') !== '[]') {
    renderPagination(totalFoundPages, page);
    renderWatchedFilms(page);
  } else {
    paginationList.innerHTML = `
    <div class="empty-page">
                  <img src="./img/empty.jpg" alt="no films img" />
                  <span class="empty-page_text">There are no films here yet</span>
    </div>
    `;
  }

  headerWatchedButton.classList.add('active-header-button');
  headerQueueButton.classList.remove('active-header-button');
  watchedList.style.display = 'flex';
  queueList.style.display = 'none';
});

headerQueueButton.addEventListener('click', () => {
  if (headerQueueButton.classList.contains('active-header-button')) {
    return;
  }
  page = 1;
  if (localStorage.getItem('queue') && localStorage.getItem('queue') !== '[]') {
    renderPagination(totalFoundPages, page);
    renderQueueFilms(page);
  } else {
    paginationList.innerHTML = `
    <div class="empty-page">
                  <img src="./img/empty.jpg" alt="no films img" />
                  <span class="empty-page_text">There are no films here yet</span>
    </div>
    `;
  }
  headerQueueButton.classList.add('active-header-button');
  headerWatchedButton.classList.remove('active-header-button');
  watchedList.style.display = 'none';
  queueList.style.display = 'flex';
});

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
