const header = document.querySelector('.header');
const headerLogo = document.querySelector('.header__logo');
const headerNavigationButtons = document.querySelector('.header__buttons_wrapper');
const headerHomePage = document.querySelector('.header__search_wrapper');
const headerLibraryPage = document.querySelector('.header__library_wrapper');

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
}

// Действия по нажатию на кнопку MY LIBRARY
function onLibraryButtonClick() {
  header.classList.remove('header__home');
  header.classList.add('header__library');
  headerHomePage.style.display = 'none';
  headerLibraryPage.style.display = 'flex';
}
