# Публікація та перевірка ЛР 8

Репозиторій: <https://github.com/nazar-tsventarnyi/hotel-lapka>.

## Локальна копія та синхронізація

```sh
git clone https://github.com/nazar-tsventarnyi/hotel-lapka.git
cd hotel-lapka
git status
git log --oneline --graph --all -6
git remote -v
git pull --ff-only origin main
```

Відкрийте папку у VS Code. Команда `git status` показує стан файлів, `git log` — історію, `git remote -v` — адресу GitHub. `Already up to date` після pull означає, що версії вже синхронізовані.

## GitHub Pages

У репозиторії відкрийте **Settings → Pages**. Джерело — **Deploy from a branch**, гілка — **main**, папка — **/(root)**. Після збереження та успішного розгортання у вкладці Actions відкрийте адресу, яку показує GitHub Pages.

Файл `.nojekyll` вимикає обробку Jekyll; усі локальні посилання на ресурси відносні. Окрема команда збірки не потрібна.

## Netlify

Для збереження адреси <https://hotel-lapka.netlify.app/> використовуйте наявний проєкт:

1. Відкрийте налаштування Continuous deployment та **Link repository**.
2. Оберіть GitHub → `nazar-tsventarnyi/hotel-lapka` → `main`.
3. Залиште Build command порожнім; Publish directory — `.`.
4. Запустіть deploy та дочекайтеся **Published**.

Значення Publish directory також визначене у `netlify.toml`. Після підключення репозиторію push у main запускає новий deploy.

## Перевірка та скріншоти

Для звіту підходять такі підтвердження:

1. GitHub Code з файлами та кількістю комітів.
2. Термінал VS Code з `git status`, `git log` і `git remote -v`.
3. Settings → Pages з джерелом публікації та фактичною адресою.
4. Сайт на GitHub Pages з видимим адресним рядком.
5. Netlify зі статусом Published та підключеним репозиторієм.

Після публікації перевірте меню, калькулятор, валідацію форми, стилі та медіа. На мобільному екрані перевірте відсутність горизонтальної прокрутки.

## Довідка

- <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
- <https://docs.netlify.com/start/quickstarts/deploy-from-repository/>
