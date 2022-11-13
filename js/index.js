// Переменные для елементов хедера
const header = document.querySelector('.header');
const headerLogo = document.querySelector('.header__logo');
const headerErrorMessage = document.querySelector('.header__error');
const headerHomeButton = document.querySelector('.header__btn_home');
const headerLibraryButton = document.querySelector('.header__btn_library');
const headerHomePage = document.querySelector('.header__search_wrapper');
const headerLibraryPage = document.querySelector('.header__library_wrapper');
const headerWatchedButton = document.querySelector('.header__watched_button');
const headerQueueButton = document.querySelector('.header__queue_button');
const profile = document.querySelector('.your-profile');
const profileText = document.querySelector('.your-profile__text');
const loginButton = document.querySelector('.login-button');

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

// Модалка авторизации
const loginModal = document.querySelector('[login-data-modal]');
const modalTitle = document.querySelector('.modal__title_auth');
const loginForm = document.querySelector('.login-form');
const userNameInput = document.querySelector('.login-lable_name');
const userSignin = document.querySelector('.modal-footer__button_orange');
const userLogin = document.querySelector('.modal-footer__button_green');
const cancleButton = document.querySelector('.modal-footer__button_red');

// Глобальные переменные для хранения значения инпута/списка всех жанров из API/текущей страници для пагинации/доступного кол-ва страниц
let inputValue = '';
let genres = null;
let page = 1;
let totalFoundPages = null;
let size = null;
let authToken = null;
let globalUserId = null;
if (localStorage.getItem('userId')) {
  globalUserId = localStorage.getItem('userId');
}

if (localStorage.getItem('token')) {
  authToken = localStorage.getItem('token');
}

// Массивы для хранение данных о просмотренных и запланированных фильмах
// При загрузке страницы заполняються данными из локального хранилища, если оно не пустое
let watchedFilms = [];

// if (localStorage.getItem('watched') && localStorage.getItem('watched') !== '[]') {
//   watchedFilms = JSON.parse(localStorage.getItem('watched'));
// }
let queueFilms = [];

if (localStorage.getItem('auth') === 'true') {
  profileText.textContent = localStorage.getItem('globalUserName');
  profile.classList.remove('d-none');
  loginButton.classList.add('d-none');
  localStorage.setItem('auth', true);
  getWatchedFilmsFromDb(authToken, globalUserId);
  getQueueFilmsFromDb(authToken, globalUserId);

  loginForm.reset();
}

// if (localStorage.getItem('queue') && localStorage.getItem('queue') !== '[]') {
//   queueFilms = JSON.parse(localStorage.getItem('queue'));
// }

const firebaseConfig = {
  apiKey: 'AIzaSyByGY0m4xXgosXbFT2k9ieaGqeN8d2Kra0',
  authDomain: 'filmoteka-e3ad4.firebaseapp.com',
  databaseURL: 'https://filmoteka-e3ad4-default-rtdb.firebaseio.com',
  projectId: 'filmoteka-e3ad4',
  storageBucket: 'filmoteka-e3ad4.appspot.com',
  messagingSenderId: '323992097218',
  appId: '1:323992097218:web:05788e4ecaab4ab3a7c65b',
  measurementId: 'G-LKM0Z8JDG6',
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

loginButton.addEventListener('click', openLoginModal);

function openLoginModal() {
  loginModal.classList.remove('is-hidden');

  window.removeEventListener('keydown', onEscClose);
  window.addEventListener('keydown', onEscLoginClose);
}

function onEscLoginClose(event) {
  if (event.key === 'Escape') {
    loginModalClose();
  }
}

loginModal.addEventListener('click', event => {
  if (event.target.classList.contains('backdrop')) {
    loginModalClose();
  }
});

profile.addEventListener('click', event => {
  if (event.target.classList.contains('your-profile__exit')) {
    profile.classList.add('d-none');
    loginButton.classList.remove('d-none');
    localStorage.setItem('auth', false);
    onLogoClick(event);
    localStorage.removeItem('userId');
    globalUserId = null;
    watchedFilms = [];
    queueFilms = [];
    // createQueueFilmsDb();
  }
});

function checkAuth() {
  if (profile.classList.contains('d-none')) {
    return false;
  }
  return true;
}

cancleButton.addEventListener('click', loginModalClose);

function loginModalClose() {
  loginModal.classList.add('is-hidden');
  window.removeEventListener('keydown', onEscLoginClose);

  // Что бы при закрытии не мелькала модалка с регистрацией
  setTimeout(() => {
    userNameInput.style.display = 'flex';
    modalTitle.textContent = 'Authorization';
    userSignin.style.display = 'block';
    userLogin.classList.remove('activeLoginForm');
    loginForm.reset();
  }, 500);
}

userLogin.addEventListener('click', onLoginButtonClick);

function onLoginButtonClick() {
  if (userLogin.classList.contains('activeLoginForm')) {
    loginForm.addEventListener('submit', signIn);
    return;
  }

  userLogin.type = 'submit';
  loginForm.reset();
  userNameInput.style.display = 'none';
  modalTitle.textContent = 'Sign-in';
  userSignin.style.display = 'none';
  userLogin.classList.add('activeLoginForm');
}

function signIn(event) {
  const userEmail = event.target.elements.email.value.trim();
  const userPassword = event.target.elements.password.value.trim();
  if (userEmail !== '' && userPassword !== '') {
    console.log(userEmail);
    console.log(userPassword);

    authWithEmailAndPassword(userEmail, userPassword)
      .then(data => {
        localStorage.setItem('token', data.idToken);
        authToken = data.idToken;
        let userId = data.localId;

        localStorage.setItem('userId', userId);
        globalUserId = userId;

        if (getWatchedFilmsFromDb(authToken, userId) === 'No token') {
          alert('Incorrect email or password');
          event.target.elements.password.value = '';
          event.target.elements.email.focus();
          return;
        }

        if (getQueueFilmsFromDb(authToken, userId) === 'No token') {
          alert('Incorrect email or password');
          event.target.elements.password.value = '';
          event.target.elements.email.focus();
          return;
        }

        getWatchedFilmsFromDb(authToken, userId);

        getQueueFilmsFromDb(authToken, userId);

        // localStorage.setItem('watched', JSON.stringify(watchedFilms));
        // localStorage.setItem('queue', JSON.stringify(queueFilms));

        loginModalClose();

        profile.classList.remove('d-none');
        localStorage.setItem('auth', true);
        loginButton.classList.add('d-none');
        loginForm.removeEventListener('submit', signIn);

        getUsersDb(authToken)
          .then(userData => {
            const name = Object.values(userData).find(user => user.email === data.email);
            console.log(userData);
            profileText.textContent = name.name;
            localStorage.setItem('globalUserName', name.name);
            location.reload();
          })

          .catch(err => {
            console.log(err);
            profileText.textContent = 'User';
          });
      })
      .catch(err => {
        console.log(err);
      });
  }
}

function getWatchedFilmsFromDb(token, userId) {
  if (!token) {
    return 'No token';
  }

  createWatchedFilmsDb(userId).then(data => {
    const id = data.name;

    fetch(
      `https://filmoteka-e3ad4-default-rtdb.firebaseio.com/users/${userId}/watched.json?auth=${token}`
    )
      .then(respone => respone.json())
      .then(data => {
        const arrValues = Object.values(data);
        const lastFilms = arrValues[arrValues.length - 1];
        if (!lastFilms) {
          return;
        }

        watchedFilms = lastFilms;
      });
  });
  // localStorage.setItem('watched', JSON.stringify(watchedFilms));

  return watchedFilms;
}

function getQueueFilmsFromDb(token, userId) {
  if (!token) {
    return 'No token';
  }

  createQueueFilmsDb(userId).then(data => {
    // console.log(data);
    const id = data.name;
    fetch(
      `https://filmoteka-e3ad4-default-rtdb.firebaseio.com/users/${userId}/queue.json?auth=${token}`
    )
      .then(respone => respone.json())
      .then(data => {
        const arrValues = Object.values(data);
        const lastFilms = arrValues[arrValues.length - 1];
        if (!lastFilms) {
          return;
        }

        queueFilms = lastFilms;
      });
  });
  // localStorage.setItem('queue', JSON.stringify(queueFilms));

  return queueFilms;
}

async function authWithEmailAndPassword(email, password) {
  const apiKey = 'AIzaSyByGY0m4xXgosXbFT2k9ieaGqeN8d2Kra0';
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  const data = response.json();
  return data;
}

async function createUserWithEmailAndPassword(email, password) {
  const apiKey = 'AIzaSyByGY0m4xXgosXbFT2k9ieaGqeN8d2Kra0';
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  const data = response.json();
  return data;
}

loginForm.addEventListener('submit', userAuthorization);

function userAuthorization(event) {
  event.preventDefault();
  const userName = event.target.elements.login.value.trim();
  const userEmail = event.target.elements.email.value.trim();
  const userPassword = event.target.elements.password.value.trim();
  if (userName !== '' && userEmail !== '' && userPassword !== '') {
    console.log(userName);
    localStorage.setItem('globalUserName', userName);
    console.log(userEmail);
    console.log(userPassword);

    auth
      .createUserWithEmailAndPassword(userEmail, userPassword)
      .then(data => {
        console.log(data);
        const user = auth.currentUser;
        const databaseRef = database.ref();
        localStorage.setItem('token', user.Aa);
        authToken = localStorage.getItem('token');
        globalUserId = user.uid;
        localStorage.setItem('userId', user.uid);
        watchedFilms = [];
        queueFilms = [];
        watchedList.innerHTML = '';
        queueList.innerHTML = '';
        // getWatchedFilmsFromDb(authToken, globalUserId);
        // getQueueFilmsFromDb(authToken);

        const userData = {
          email: userEmail,
          password: userPassword,
          name: userName,
          uid: user.uid,
        };

        databaseRef.child('users/' + user.uid).set(userData);

        loginModalClose();
        profileText.textContent = userName;
        globalUserName = userName;
        profile.classList.remove('d-none');
        loginButton.classList.add('d-none');
        localStorage.setItem('auth', true);
        event.target.reset();
        // location.reload();
      })
      .catch(err => {
        console.log(err);
        alert('The email address is already in use by another account');
        event.target.elements.password.value = '';
        event.target.elements.email.focus();
      });
  }
}

async function createWatchedFilmsDb(userId) {
  // getWatchedDb(authToken, userId)
  //   .then(data => {
  //     arr = Object.values(data);

  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });

  const resolve = await fetch(
    `https://filmoteka-e3ad4-default-rtdb.firebaseio.com/users/${userId}/watched.json`,
    {
      method: 'POST',
      body: JSON.stringify(watchedFilms),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  const data = resolve.json();
  return data;
}

async function createQueueFilmsDb(userId) {
  // getQueueDb(authToken)
  //   .then(data => {
  //     queueFilms = data;
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });

  const resolve = await fetch(
    `https://filmoteka-e3ad4-default-rtdb.firebaseio.com/users/${userId}/queue.json`,
    {
      method: 'POST',
      body: JSON.stringify(queueFilms),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  const data = resolve.json();
  return data;
}

async function getUsersDb(token) {
  const resolve = await fetch(
    `https://filmoteka-e3ad4-default-rtdb.firebaseio.com/users.json?auth=${token}`
  );
  const data = resolve.json();
  return data;
}

async function getWatchedDb(token) {
  const resolve = await fetch(
    `https://filmoteka-e3ad4-default-rtdb.firebaseio.com/watched.json?auth=${token}`
  );
  // const resolve = await fetch(
  //   `https://filmoteka-e3ad4-default-rtdb.firebaseio.com/users/${userId}/watched.json?auth=${token}`
  // );
  const data = resolve.json();
  return data;
}

async function getQueueDb(token) {
  const resolve = await fetch(
    `https://filmoteka-e3ad4-default-rtdb.firebaseio.com/queue.json?auth=${token}`
  );
  const data = resolve.json();
  return data;
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
        headerErrorMessage.textContent =
          'Search result not successful. Enter the correct movie name and try again';
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

headerLogo.addEventListener('click', onLogoClick);
function onLogoClick(event) {
  event.preventDefault();
  // Находит кнопку с подчеркиванием, и снимвет его с нее, а после вешает на первый попавшийся header__btn, а тоесть на хоум пейдж

  document.querySelector('.current-button').classList.remove('current-button');
  document.querySelector('.header__btn').classList.add('current-button');
  onHomeButtonClick();
  page = 1;
  totalFoundPages = null;
  renderPopularFilms(page);
  renderPagination(1000, page);
}

headerHomeButton.addEventListener('click', onHomeButtonClick);
headerLibraryButton.addEventListener('click', onLibraryButtonClick);

// Действия по нажатию на кнопку HOME
function onHomeButtonClick() {
  headerHomeButton.classList.add('current-button');
  headerLibraryButton.classList.remove('current-button');

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
  if (!checkAuth()) {
    openLoginModal();
    return;
  }

  headerHomeButton.classList.remove('current-button');
  headerLibraryButton.classList.add('current-button');

  header.classList.remove('header__home');
  header.classList.add('header__library');

  headerHomePage.style.display = 'none';
  headerLibraryPage.style.display = 'flex';

  filmsList.style.display = 'none';
  watchedList.style.display = 'flex';

  page = 1;

  if (headerWatchedButton.classList.contains('active-header-button') && watchedFilms.length !== 0) {
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

  if (headerQueueButton.classList.contains('active-header-button') && queueFilms.length !== 0) {
    watchedList.style.display = 'none';
    queueList.style.display = 'flex';
    renderQueueFilms(page);
    renderPagination(totalFoundPages, page);
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

async function getMovieTrailer(id) {
  const resolve = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/videos?api_key=abf5df7d75a67bd02b3b1e4ead1fc14d`
  );
  const data = resolve.json();
  return data;
}

function renderModal(info) {
  let trailerId = null;

  const genres = info.genres.map(genre => genre.name);
  window.addEventListener('keydown', onEscClose);
  const murkup = `
   <div class="modal">
      <button data-modal-close type="button" class="modal__close">
        <img src="./img/close.svg" alt="close" class="modal__close_icon" />
      </button>
      <div class="poster-wrapper">
        <img
          src="https://image.tmdb.org/t/p/w500${info.poster_path}"
          alt="movie poster"
          class="modal__img"
        />
        <a
    class="youtube-btn link tube"
    href="https://www.youtube.com/embed/${trailerId}"
    data-video="${trailerId}"
  ></a>
      </div>

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
              <span class="modal__vote">${info.vote_average.toFixed(2)}</span>
              <span class="modal__text">/</span>
              <span class="modal__votes">${info.vote_count}</span>
            </p>
            <span class="modal__text_bold">${info.popularity.toFixed(0)}</span>
            <span class="modal__text_bold">${info.original_title.toUpperCase()}</span>
            <span class="modal__text_bold">${genres.join(', ')}</span>
          </div>
        </div>
        <span class="modal__about">ABOUT</span>
        <p class="modal__desription">${info.overview}</p>
        <div class="modal__buttons">
          <button type="button" class="modal__button-watched">ADD TO WATCHED</button>
          <button type="button" class="modal__button-queue">ADD TO QUEUE</button>
        </div>
      </div>
    </div>

    <div class="backdrop is-hidden" trailer-data-modal>
      <div class="trailer-modal">
        <div class="youtube-video" id="player"></div>
      </div>
    </div>
  `;

  getMovieTrailer(Number(info.id))
    .then(data => {
      trailerId = data.results.find(film => film.name.includes('Trailer'))?.key;
      console.log(trailerId);

      const youtubeLink = document.querySelector('.youtube-btn');
      youtubeLink.href = `https://www.youtube.com/embed/${trailerId}`;
      youtubeLink.dataset.video = trailerId;

      var tag = document.createElement('script');

      tag.src = 'https://www.youtube.com/iframe_api';
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      const videoModal = document.querySelector('[trailer-data-modal]');
      var player;

      youtubeLink.addEventListener('click', event => {
        event.preventDefault();
        const id = event.target.dataset.video;
        videoModal.classList.remove('is-hidden');

        if (player) {
          if (player.playerInfo.videoData.video_id == id) {
            player.playVideo();
          } else {
            player.loadVideoById({ videoId: id });
            console.log(123);
          }
          // } else {
        } else {
          player = new YT.Player('player', {
            videoId: id,
            events: {
              onReady: onPlayerReady,
            },
          });
        }
      });

      videoModal.addEventListener('click', event => {
        if (event.target.classList.contains('backdrop')) {
          videoModal.classList.add('is-hidden');
          player.pauseVideo();
          player.destroy();
        }
      });

      function onPlayerReady(event) {
        event.target.playVideo();
      }
    })
    .catch(err => {
      console.log(err);
    });

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
          if (!checkAuth()) {
            openLoginModal();
            return;
          }

          if (watchedFilms.find(film => film.id === data.id)) {
            toggleModal();
            headerErrorMessage.classList.remove('is-hidden');
            headerErrorMessage.textContent = 'You already added this movie to watched';
            document.documentElement.scrollTop = 0;
            return;
          }
          headerErrorMessage.classList.add('is-hidden');

          if (queueFilms.find(film => film.id === data.id)) {
            queueFilms.forEach((film, index) => {
              if (film.id === data.id) {
                queueFilms.splice(index, 1);
                createQueueFilmsDb(globalUserId);
                // localStorage.setItem('queue', JSON.stringify(queueFilms));
                // if (localStorage.getItem('queue') && localStorage.getItem('queue') !== '[]') {
                if (queueFilms.length !== 0) {
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
                /////////////////////////////
                window.removeEventListener('keydown', onEscClose);
              }
            });
          }
          watchedFilms.push({
            id: data.id,
            poster: data.poster_path,
            title: data.title,
            genres: data.genres,
            date: data.release_date,
            vote: data.vote_average,
          });

          createWatchedFilmsDb(globalUserId);

          // localStorage.setItem('watched', JSON.stringify(watchedFilms));
        });

        queueButton.addEventListener('click', () => {
          if (!checkAuth()) {
            openLoginModal();
            return;
          }

          if (queueFilms.find(film => film.id === data.id)) {
            toggleModal();
            headerErrorMessage.classList.remove('is-hidden');
            headerErrorMessage.textContent = 'You already added this movie to queue';
            document.documentElement.scrollTop = 0;
            return;
          }
          headerErrorMessage.classList.add('is-hidden');

          if (watchedFilms.find(film => film.id === data.id)) {
            watchedFilms.forEach((film, index) => {
              if (film.id === data.id) {
                watchedFilms.splice(index, 1);
                createWatchedFilmsDb(globalUserId);
                // localStorage.setItem('watched', JSON.stringify(watchedFilms));
                // if (localStorage.getItem('watched') && localStorage.getItem('watched') !== '[]') {
                if (watchedFilms.length !== 0) {
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

                window.removeEventListener('keydown', onEscClose);
              }
            });
          }
          queueFilms.push({
            id: data.id,
            poster: data.poster_path,
            title: data.title,
            genres: data.genres,
            date: data.release_date,
            vote: data.vote_average,
          });

          createQueueFilmsDb(globalUserId);
          // localStorage.setItem('queue', JSON.stringify(queueFilms));
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
}

function renderWatchedFilms(index) {
  // const watchedFilms = JSON.parse(localStorage.getItem('watched'));

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

  size = 4;
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
  // const queueFilms = JSON.parse(localStorage.getItem('queue'));

  const murkup = queueFilms.map(film => {
    const genres = film?.genres?.map(genre => genre.name);
    return `
    <li class="library__item">
              <img src="https://image.tmdb.org/t/p/w500${
                film.poster
              }" alt="movie cover" class="library__image" id=${film.id} />
              <div class="library__descr_wrapper">
                <h3 class="library__title">${film.title.toUpperCase()}</h3>
                <p class="library__description">
                  ${genres?.join(', ')} | ${film?.date?.slice(
      0,
      4
    )} <span class="library__vote">${film.vote.toFixed(1)}</span>
                </p>
              </div>
            </li>
    `;
  });

  size = 4;
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
          if (watchedFilms.find(film => film.id === data.id)) {
            toggleModal();
            return;
          }

          watchedFilms.push({
            id: data.id,
            poster: data.poster_path,
            title: data.title,
            genres: data.genres,
            date: data.release_date,
            vote: data.vote_average,
          });

          createWatchedFilmsDb(globalUserId);

          // localStorage.setItem('watched', JSON.stringify(watchedFilms));
          deleteQueueFilm(data);
        });

        queueButton.addEventListener('click', () => {
          if (queueFilms.find(film => film.id === data.id)) {
            toggleModal();
            return;
          }

          queueFilms.push({
            id: data.id,
            poster: data.poster_path,
            title: data.title,
            genres: data.genres,
            date: data.release_date,
            vote: data.vote_average,
          });

          createQueueFilmsDb(globalUserId);
          // localStorage.setItem('queue', JSON.stringify(queueFilms));
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
        if (queueFilms.length === size + 1) {
          page -= 1;
        }
        queueFilms.splice(index, 1);
        createQueueFilmsDb(globalUserId);
        // localStorage.setItem('queue', JSON.stringify(queueFilms));
        // if (localStorage.getItem('queue') && localStorage.getItem('queue') !== '[]') {
        if (queueFilms.length !== 0) {
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
        if (watchedFilms.length === size + 1) {
          page -= 1;
        }
        watchedFilms.splice(index, 1);
        createWatchedFilmsDb(globalUserId);
        // localStorage.setItem('watched', JSON.stringify(watchedFilms));
        // if (localStorage.getItem('watched') && localStorage.getItem('watched') !== '[]') {
        if (watchedFilms.length !== 0) {
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
  // if (localStorage.getItem('watched') && localStorage.getItem('watched') !== '[]') {
  if (watchedFilms.length !== 0) {
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
  // if (localStorage.getItem('queue') && localStorage.getItem('queue') !== '[]') {
  if (queueFilms.length !== 0) {
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
