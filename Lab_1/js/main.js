// Ссылка на элемент веб страницы в котором будет отображаться графика
var container;
// Переменные "камера", "сцена" и "отрисовщик"
var camera, scene, renderer;
var n = 255;
// Глобальная переменная для хранения карты высот
var imagedata;

// Функция инициализации камеры, отрисовщика, объектов сцены и т.д.
init();
// Обновление данных по таймеру браузера
animate();
// В этой функции можно добавлять объекты и выполнять их первичную настройку
function init() {
    // Получение ссылки на элемент html страницы
    container = document.getElementById("container");
    // Создание "сцены"
    scene = new THREE.Scene();
    // Установка параметров камеры
    // 45 - угол обзора
    // window.innerWidth / window.innerHeight - соотношение сторон
    // 1 - 4000 - ближняя и дальняя плоскости отсечения
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        4000
    );
    // Установка позиции камеры
    camera.position.set(n / 2, n / 1.5, n * 1.5);

    // Установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3(n / 2, 0, n / 2));
    // Создание отрисовщика
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Закрашивание экрана синим цветом, заданным в 16ричной системе
    renderer.setClearColor(0x00a9a9c6, 1);
    container.appendChild(renderer.domElement);
    // Добавление функции обработки события изменения размеров окна
    window.addEventListener("resize", onWindowResize, false);

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var imge = new Image();
    imge.onload = function () {
        canvas.width = imge.width;
        canvas.height = imge.height;
        context.drawImage(imge, 0, 0);
        imagedata = context.getImageData(0, 0, imge.width, imge.height);
        // Пользовательская функция генерации ландшафта
        f();
    };
    // Загрузка изображения с картой высот
    imge.src = "img/plateau.jpg";
}
function onWindowResize() {
    // Изменение соотношения сторон для виртуальной камеры
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // Изменение соотношения сторон рендера
    renderer.setSize(window.innerWidth, window.innerHeight);
}
// В этой функции можно изменять параметры объектов и обрабатывать действия пользователя
function animate() {
    // Добавление функции на вызов, при перерисовки браузером страницы
    requestAnimationFrame(animate);
    render();
}
function render() {
    // Рисование кадра
    renderer.render(scene, camera);
}

function f() {
    var uvs = []; // Массив для хранения текстурных координат
    var vertices = []; // Объявление массива для хранения вершин
    var faces = []; // Объявление массива для хранения индексов
    var geometry = new THREE.BufferGeometry(); // Создание структуры для хранения геометрии

    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            var y = getPixel(imagedata, i, j);
            vertices.push(i, y / 10.0, j);
            uvs.push(i / (n - 1), j / (n - 1)); // Добавление текстурных координат для левой верхней вершины
        }
    }
    for (var i = 0; i < n - 1; i++) {
        for (var j = 0; j < n - 1; j++) {
            faces.push(i + j * n, i + 1 + j * n, i + 1 + (j + 1) * n);
            faces.push(i + j * n, i + 1 + (j + 1) * n, i + (j + 1) * n);
        }
    }

    //Добавление вершин и индексов в геометрию
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setIndex(faces);

    //Добавление текстурных координат в геометрию
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    // Загрузка текстуры yachik.jpg из папки pics
    var tex = new THREE.TextureLoader().load("img/grasstile.jpg");
    var mat = new THREE.MeshBasicMaterial({
        // Источник цвета - текстура
        map: tex,
        wireframe: false,
        side: THREE.DoubleSide,
    });

    // Режим повторения текстуры
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    // Повторить текстуру 10х10 раз
    tex.repeat.set(n, n);

    //создание точечного источника освещения заданного цвета
    var spotlight = new THREE.PointLight(0xffffff);

    //установка позиции источника освещения
    spotlight.position.set(n / 2, n, n * 1.5);
    //добавление источника в сцену
    scene.add(spotlight);

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    var mat = new THREE.MeshLambertMaterial({
        map: tex,
        wireframe: false,
        side: THREE.DoubleSide,
    });

    // Создание объекта и установка его в определённую позицию
    var triangleMesh = new THREE.Mesh(geometry, mat);
    triangleMesh.position.set(0.0, 0.0, 0.0);

    // Добавление объекта в сцену
    scene.add(triangleMesh);
}

function getPixel(imagedata, x, y) {
    var position = (x + imagedata.width * y) * 4,
        data = imagedata.data;
    return data[position];
}
