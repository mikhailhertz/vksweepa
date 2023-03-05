/**
 * Приветствую, и заранее извиняюсь за неэстетичный код - меня пугают ограничения по времени, поэтому я пишу первое, что приходит в голову.
 * Обещаю, что мог бы намного лучше выполнить задачу...
 * Когда отправлю решение и закончится таймер, зарефакторю
 */
// Спрайтшит
const sprite = new Image();
// Канвас
const canvas = document.getElementsByTagName('canvas')[0];
// Контекст для рисования
const context = canvas.getContext('2d');
// Размер канваса
const size = {
    w: 256,
    h: 282
};
// Спрайты, поле size - размер спайта в пикселях
const numbers = {
    size: { w: 13, h: 23 }
};
const faces = {
    size: { w: 26, h: 26 }
};
const mines = {
    size: { w: 16, h: 16 }
};
// Минное поле, [тип_спрайта, есть_ли_тут_мина]
const field = new Array(16 * 16);
// Ресет поля
const reset = () => {
    for (let i = 0; i < field.length; i++) {
        field[i] = ['unknown', false];
    }
    for (let i = 0; i < 40; i++) {
        let x = Math.floor(Math.random() * 16);
        let y = Math.floor(Math.random() * 16);
        while (field[y * 16 + x][1]) {
            x = Math.floor(Math.random() * 16);
            y = Math.floor(Math.random() * 16);
        }
        field[y * 16 + x][1] = true;
    }
}
// Рисует спрайт из объекта по ключу в точку (x,y)
const drawSprite = (object, key, x, y) => {
    context.clearRect(x, y, object.size.w, object.size.h);
    context.drawImage(sprite, object[key].x, object[key].y, object.size.w, object.size.h, x, y, object.size.w, object.size.h);
};
// Рисует число спрайтами, left - растет ли число влево
// number = 123, x = 0, y = 0
// left = true -> 123(0,0)
// left = false -> (0,0)123
const drawNumber = (number, x, y, left, width = 0) => {
    if (number < 0) {
        number = 0;
    }
    const l = number.toString().split('').map(c => parseInt(c));
    while (l.length < width) {
        l.unshift(0);
    }
    for (let i = 0; i < l.length; i++) {
        const offset = left ? -((l.length - i - 1) * numbers.size.w) - numbers.size.w : i * numbers.size.w;
        drawSprite(numbers, l[i], x + offset, y);
    }
};
// Рисует все минное поле, конечно перерисовывать все поле по клику на мину неправильно, но я боюсь не успеть
const drawField = () => {
    for (let i = 0; i < field.length; i++) {
        const tile = field[i][0];
        const x = (i % 16) * mines.size.w;
        const y = 26 + Math.trunc(i / 16) * mines.size.h;
        drawSprite(mines, tile, x, y);
    }
}
// Стремный рекурсивный поиск пустых клеток
const findSafeTiles = (i, j) => {
    // Считаем сколько вокруг мин
    let mineCount = 0;
    for (let jj = (j - 1 < 0) ? 0 : j - 1; jj <= j + 1 && jj < 16; jj++) {
        for (let ii = (i - 1 < 0) ? 0 : i - 1; ii <= i + 1 && ii < 16; ii++) {
            if (field[jj * 16 + ii][1]) {
                mineCount += 1;
            }
        }
    }
    // Задаем спрайт
    field[j * 16 + i][0] = mineCount === 0 ? 'clear' : mineCount;
    // Если мин нет - ищем в соседних клетках, исключая текущую клетку и уже открытые клетки
    if (mineCount === 0) {
        for (let jj = (j - 1 < 0) ? 0 : j - 1; jj <= j + 1 && jj < 16; jj++) {
            for (let ii = (i - 1 < 0) ? 0 : i - 1; ii <= i + 1 && ii < 16; ii++) {
                if (ii === i && jj === j) {
                    continue;
                }
                if (field[jj * 16 + ii][0] === 'clear') {
                    continue;
                }
                findSafeTiles(ii, jj);
            }
        }
    }
}

const main = () => {
    let firstClick = null;
    let time = null;
    let mines = null;
    let timeInterval = null;
    let dead = null;
    // Новая игра
    const stateReset = () => {
        context.clearRect(0, 0, size.w, size.h);
        reset();
        firstClick = true;
        time = 0;
        mines = 40;
        dead = false;
        drawNumber(time++, size.w, 0, true);
        drawNumber(mines, 0, 0, false, 2);
        drawSprite(faces, 'smile', size.w / 2 - faces.size.w / 2, 0);
        drawField();
        timeInterval = setInterval(() => drawNumber(time++, size.w, 0, true), 1000);
    }
    stateReset();
    canvas.addEventListener('mousedown', (event) => {
        const rect = canvas.getBoundingClientRect();
        let x = event.clientX;
        let y = event.clientY;
        x -= rect.left;
        y -= rect.top;
        // Если клик по "хедеру"
        if (y <= 26) {
            if (!(size.w / 2 - faces.size.w / 2 < x && x < size.w / 2 + faces.size.w / 2)) {
                return;
            }
            if (!event.button === 0) {
                return;
            }
            drawSprite(faces, 'click', size.w / 2 - faces.size.w / 2, 0);
            const up = () => {
                clearInterval(timeInterval);
                stateReset();
                canvas.removeEventListener('mouseup', up);
            }
            canvas.addEventListener('mouseup', up);
        }
        // Если клик по полю
        else {
            if (dead) {
                return;
            }
            y -= 26;
            const i = Math.trunc(x / 16);
            const j = Math.trunc(y / 16);
            const index = j * 16 + i;
            // ЛКМ
            if (event.button === 0) {
                // Напуганное лицо
                drawSprite(faces, 'woah', size.w / 2 - faces.size.w / 2, 0);
                // Если клик первый и попали по мине - переносим мину
                if (firstClick && field[index][1]) {
                    let x = Math.floor(Math.random() * 16);
                    let y = Math.floor(Math.random() * 16);
                    while (field[y * 16 + x][1]) {
                        x = Math.floor(Math.random() * 16);
                        y = Math.floor(Math.random() * 16);
                    }
                    field[y * 16 + x][1] = true;
                    field[index][1] = false;
                    firstClick = false;
                }
                // По отжатию клика
                const up = () => {
                    // Если попали по мине
                    if (field[index][1]) {
                        dead = true;
                        clearInterval(timeInterval);
                        field[index][0] = 'minedet';
                        // раскрываются все мины
                        field.forEach(tile => {
                            if (tile[1]) {
                                tile[0] = 'mine';
                            } else if (tile[0] === 'flagged') {
                                tile[0] = 'nomine';
                            }
                        });
                        drawSprite(faces, 'ded', size.w / 2 - faces.size.w / 2, 0);
                    } else {
                        // Считаем сколько вокруг мин
                        let mineCount = 0;
                        for (let jj = (j - 1 < 0) ? 0 : j - 1; jj <= j + 1 && jj < 16; jj++) {
                            for (let ii = (i - 1 < 0) ? 0 : i - 1; ii <= i + 1 && ii < 16; ii++) {
                                if (field[jj * 16 + ii][1]) {
                                    mineCount += 1;
                                }
                            }
                        }
                        field[index][0] = mineCount === 0 ? 'clear' : mineCount;
                        // Проверяем остались ли нераскрытые поля - условие победы
                        if (!field.some(tile => tile[0] === 'unknown')) {
                            dead = true;
                            clearInterval(timeInterval);
                            drawSprite(faces, 'rad', size.w / 2 - faces.size.w / 2, 0);
                        } else {
                            findSafeTiles(i, j);
                            drawSprite(faces, 'smile', size.w / 2 - faces.size.w / 2, 0);
                        }
                    }
                    drawNumber(mines, 0, 0, false, 2);
                    drawField();
                    canvas.removeEventListener('mouseup', up);
                }
                canvas.addEventListener('mouseup', up);
            }
            // ПКМ
            else if (event.button === 2) {
                switch (field[index][0]) {
                    case 'unknown':
                        mines -= 1;
                        field[index][0] = 'flagged';
                        break;
                    case 'flagged':
                        field[index][0] = 'question';
                        break;
                    case 'question':
                        mines += 1;
                        field[index][0] = 'unknown';
                        break;
                }
                // Победное условие
                if (!field.some(tile => tile[0] === 'unknown')) {
                    dead = true;
                    clearInterval(timeInterval);
                    drawSprite(faces, 'rad', size.w / 2 - faces.size.w / 2, 0);
                }
                drawField();
                drawNumber(mines, 0, 0, false, 2);
            }
        }
        firstClick = false;
    });
};

const initSprites = (keys, object, padding, y) => {
    for (let i = 0; i < keys.length; i++) {
        object[keys[i]] = {
            x: (object.size.w + padding) * i,
            y: y
        };
    }
}

initSprites([1, 2, 3, 4, 5, 6, 7, 8, 9, 0], numbers, 1, 0);
initSprites(['smile', 'click', 'woah', 'rad', 'ded'], faces, 1, 24);
initSprites(['unknown', 'clear', 'flagged', 'question', 'questionclear', 'mine', 'minedet', 'nomine'], mines, 1, 51);
initSprites([1, 2, 3, 4, 5, 6, 7, 8], mines, 1, 68);

sprite.addEventListener('load', () => {
    main();
});
sprite.src = 'sprite.png';