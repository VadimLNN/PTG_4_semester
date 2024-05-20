//импорт библиотеки three.js
import * as THREE from "./libs/three.module.js";

//импорт библиотек для загрузки моделей и материалов
import { MTLLoader } from "./libs/MTLLoader.js";
import { OBJLoader } from "./libs/OBJLoader.js";
//импорт библиотеки для загрузки моделей в формате glb
import { GLTFLoader } from "./libs/GLTFLoader.js";

// Ссылка на элемент веб страницы в котором будет отображаться графика
var container;
// Переменные "камера", "сцена" и "отрисовщик"
var camera, scene, renderer;

//переменная для хранения координат мыши
var mouse = { x: 0, y: 0 };
//массив для объектов, проверяемых на пересечение с курсором
var targetList = [];
// курсор = цилиндр, его окружность с радиусом
var cursor,
    circle,
    radius = 1;

// размерность ландшавта
var N = 255;
// ландшафт
var geometry;

//отслеживание нажатости кнопки и какой кнопки
var isPressed = false,
    mouse_button = 1;

// часы для аниммаций
var clock = new THREE.Clock();

//объект интерфейса и его ширина
var gui = new dat.GUI();
gui.width = 200;

//режим кисти off
var brVis = false;

// массив для хранения 3д моделей
var models = new Map();

// ссылка ны выбранный объект
var selected = null;
// массив для проверки пересечений
var objectList = [];

// для отслеживания клавиш
var keyboard = new THREEx.KeyboardState();

var cam_ang = 45;

var sceneOrtho;
var cameraOrtho;

var sW = window.innerWidth;
var sH = window.innerHeight;

var button = [];
button.highlight = 0x00ff00;

var waterMat = null;
var snVis = false;

var grav = new THREE.Vector3(0, -9.8, 0);
var wind = new THREE.Vector3(0.0, 0.0, 0.0);

var particles = [];
var MAX_PARTICLES = 10000;
var PARTICLES_PER_SECOND = 2000;

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
    camera.position.set(N / 2, N / 2, N * 1.5);

    // Установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3(N / 2, 0, N / 2));
    // Создание отрисовщика
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Закрашивание экрана  цветом, заданным в 16-ричной системе
    renderer.setClearColor(0x00a9a9c6, 1); //0x00a9a9c6

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    //отключение авто очистки рендера
    renderer.autoClear = false;

    container.appendChild(renderer.domElement);

    // Добавление функции обработки события изменения размеров окна
    window.addEventListener("resize", onWindowResize, false);

    renderer.domElement.addEventListener(
        "mousedown",
        onDocumentMouseDown,
        false
    );
    renderer.domElement.addEventListener("mouseup", onDocumentMouseUp, false);
    renderer.domElement.addEventListener(
        "mousemove",
        onDocumentMouseMove,
        false
    );
    renderer.domElement.addEventListener("wheel", onDocumentMouseScroll, false);
    renderer.domElement.addEventListener("contextmenu", function (event) {
        event.preventDefault();
    });

    CreateGround();

    cursor = createCursor();
    cursor.visible = false;
    circle = createCircle(64);
    circle.visible = false;
    GUI();

    loadModel(
        "models/Building/",
        "Cyprys_House_2.obj",
        "Cyprys_House_2.mtl",
        3,
        "house"
    );
    loadModel("models/Tree/", "Bush1.obj", "Bush1.mtl", 15, "bush");
    loadModel("models/Grade/", "grade.obj", "grade.mtl", 3, "grade");

    //создание ортогональной камеры
    cameraOrtho = new THREE.OrthographicCamera(
        -window.innerWidth / 2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        -window.innerHeight / 2,
        1,
        10
    );
    cameraOrtho.position.z = 10;
    //сцена для хранения списка объектов размещаемых в экранных координатах
    sceneOrtho = new THREE.Scene();

    //создание точечного источника освещения, параметры: цвет, интенсивность, дальность
    const light = new THREE.PointLight(0xffffff, 2, 1000);
    light.position.set(175, 300, 175); //позиция источника освещения
    light.castShadow = true; //включение расчёта теней от источника освещения
    scene.add(light); //добавление источника освещения в сцену

    //настройка расчёта теней от источника освещения
    light.shadow.mapSize.width = 1024; //ширина карты теней в пикселях
    light.shadow.mapSize.height = 1024; //высота карты теней в пикселях
    light.shadow.camera.near = 0.5; //расстояние, ближе которого не будет теней
    light.shadow.camera.far = 1500; //расстояние, дальше которого не будет теней

    button.push(
        addButton("img/House.png", "img/House1.png", 75, 64, "house", 0)
    );
    button.push(
        addButton("img/Grade.png", "img/Grade1.png", 75, 64, "grade", 75)
    );
    button.push(
        addButton("img/Bush.png", "img/Bush1.png", 75, 64, "bush", 150)
    );
    button.push(addButton("img/Bush.png", "img/Bush1.png", 75, 64, "del", 225));

    waterMat = createSpriteMaterial("img/3.png");
}

function onWindowResize() {
    // Изменение соотношения сторон для виртуальной камеры
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // Изменение соотношения сторон рендера
    renderer.setSize(window.innerWidth, window.innerHeight);

    for (var i = 0; i < button.length; i++) updateHUDSprite(button[i]);
}

function animate() {
    var delta = clock.getDelta();

    keys();

    if (isPressed && brVis) hsphere(mouse_button, delta);

    // Добавление функции на вызов, при перерисовки браузером страницы
    requestAnimationFrame(animate);
    render(delta);
}

function render(delta) {
    // Рисование кадра
    renderer.render(scene, camera);

    if (snVis) {
        emitter(delta);
    } else {
        if (particles.length > 0) {
            for (var i = 0; i < particles.length; i++) {
                scene.remove(particles[i].sprite);
                particles.splice(i, 1);
            }
        }
    }

    //процесс отрисовки сцены и объектов в экранных координатах
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(sceneOrtho, cameraOrtho);
}

function CreateGround() {
    var vertices = [];
    var faces = [];
    var uvs = [];
    geometry = new THREE.BufferGeometry();

    for (var i = 0; i < N; i++)
        for (var j = 0; j < N; j++) vertices.push(i, 0, j); // Добавление координат первой вершины в массив вершин

    for (var i = 0; i < N - 1; i++)
        for (var j = 0; j < N - 1; j++) {
            var v1 = i + j * N;
            var v2 = i + 1 + j * N;
            var v3 = i + 1 + (j + 1) * N;
            var v4 = i + (j + 1) * N;

            faces.push(v1, v2, v3); // Добавление индексов (порядок соединения вершин) в массив индексов
            faces.push(v1, v3, v4); // Добавление индексов (порядок соединения вершин) в массив индексов

            uvs.push(i / (N - 1), j / (N - 1)); // Добавление текстурных координат для левой верхней вершины
        }

    //Добавление текстурных координат в геометрию
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setIndex(faces);

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    // Загрузка текстуры yachik.jpg из папки pics
    var tex = new THREE.TextureLoader().load("img/grass.jpg");

    var triangleMaterial = new THREE.MeshLambertMaterial({
        map: tex,
        wireframe: false,
        side: THREE.DoubleSide,
    });

    // Режим повторения текстуры
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    // Повторить текстуру 10х10 раз
    tex.repeat.set(10, 10);

    var triangleMesh = new THREE.Mesh(geometry, triangleMaterial);
    triangleMesh.position.set(0.0, 0.0, 0.0);

    // Добавление объекта в сцену
    scene.add(triangleMesh);

    //добавление в массив плоскость (ландшафт)
    targetList.push(triangleMesh);
}

function onDocumentMouseScroll(event) {
    if (brVis) {
        if (event.wheelDelta > 0) radius++;
        if (event.wheelDelta < 0) radius--;

        circle.scale.set(radius, 1, radius);
    }
}

function onDocumentMouseMove(event) {
    //определение позиции мыши
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    vector.unproject(camera);
    var ray = new THREE.Raycaster(
        camera.position,
        vector.sub(camera.position).normalize()
    );

    // создание массива для хранения объектов, с которыми пересечётся луч
    var intersects = ray.intersectObjects(targetList);

    if (brVis) {
        // если луч пересёк какой-либо объект из списка targetList
        if (intersects.length > 0) {
            //печать списка полей объекта
            cursor.position.copy(intersects[0].point);
            cursor.position.y += 1;

            circle.position.copy(intersects[0].point);
            circle.position.y = 0;

            for (
                var i = 0;
                i < circle.geometry.attributes.position.array.length - 1;
                i += 3
            ) {
                //получение позиции в локальной системе координат
                var pos = new THREE.Vector3();

                pos.x = circle.geometry.attributes.position.array[i];
                pos.y = circle.geometry.attributes.position.array[i + 1];
                pos.z = circle.geometry.attributes.position.array[i + 2];

                //нахождение позиции в глобальной системе координат
                pos.applyMatrix4(circle.matrixWorld);

                var x = Math.round(pos.x);
                var z = Math.round(pos.z);
                var ind = (z + x * N) * 3;

                if (ind >= 0 && geometry.attributes.position.array.length)
                    circle.geometry.attributes.position.array[i + 1] =
                        geometry.attributes.position.array[ind + 1];
            }

            circle.geometry.attributes.position.needsUpdate = true; //обновление вершин
            circle.position.y += 0.5;
        }
    } else {
        if (intersects.length > 0)
            if (selected != null && isPressed) {
                var size = new THREE.Vector3();
                selected.userData.bbox.getSize(size);

                var oldPos = new THREE.Vector3();
                oldPos.copy(selected.position);

                selected.position.copy(intersects[0].point);

                selected.userData.bbox.setFromObject(selected);

                //получение позиции центра объекта
                var pos = new THREE.Vector3();
                selected.userData.bbox.getCenter(pos);
                selected.userData.obb.position.copy(pos);

                //установка позиции
                selected.userData.cube.position.copy(pos);

                for (var i = 0; i < objectList.length; i++) {
                    if (selected.userData.cube != objectList[i]) {
                        objectList[i].material.visible = false;
                        if (
                            intersect(
                                selected.userData,
                                objectList[i].userData.model.userData
                            )
                        ) {
                            selected.position.copy(oldPos);

                            selected.userData.cube.position.y = oldPos.y;
                            selected.userData.cube.position.x = oldPos.x;
                            selected.userData.cube.position.z = oldPos.z;

                            selected.userData.cube.material.color = {
                                r: 1,
                                g: 0,
                                b: 0,
                            };
                            objectList[i].material.color = { r: 1, g: 0, b: 0 };
                            objectList[i].material.visible = true;
                        } else {
                            selected.userData.cube.material.color = {
                                r: 0,
                                g: 1,
                                b: 0,
                            };
                            objectList[i].material.color = { r: 0, g: 1, b: 0 };
                        }
                    }
                }
            }

        for (var i = 0; i < button.length; i++) {
            if (buttonHoover(event.clientX, event.clientY, button[i]))
                button[i].sp.material = button[i].mat2;
            else button[i].sp.material = button[i].mat1;
        }
    }
}

function onDocumentMouseDown(event) {
    isPressed = true;

    for (var i = 0; i < button.length; i++) {
        if (buttonHoover(event.clientX, event.clientY, button[i]) == true) {
            if (button[i].model == "del") delMesh(selected);
            else addMesh(button[i].model);
        }
    }

    if (brVis) {
        if (event.button == 0) mouse_button = 1;
        else if (event.button == 2) mouse_button = -1;
    } else {
        //определение позиции мыши
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
        var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
        vector.unproject(camera);
        var ray = new THREE.Raycaster(
            camera.position,
            vector.sub(camera.position).normalize()
        );

        // создание массива для хранения объектов, с которыми пересечётся луч
        var intersects = ray.intersectObjects(objectList, true);

        if (intersects.length > 0) {
            if (selected != null) {
                selected.userData.cube.material.visible = false;

                selected = intersects[0].object.userData.model;

                selected.userData.cube.material.visible = true;
            } else {
                selected = intersects[0].object.userData.model;
                selected.userData.cube.material.visible = true;
            }
        } else if (selected != null) {
            //скрытие объекта
            selected.userData.cube.material.visible = false;
            selected = null;
        }
    }
}

function onDocumentMouseUp(event) {
    isPressed = false;
}

function createCursor() {
    //параметры цилиндра: диаметр вершины, диаметр основания, высота, число сегментов
    var geometry = new THREE.CylinderGeometry(1.5, 0, 5, 64);
    var cyMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var cylinder = new THREE.Mesh(geometry, cyMaterial);
    scene.add(cylinder);

    return cylinder;
}

function createCircle(L) {
    //создание материала для пунктирной линии
    var dashed_material = new THREE.LineBasicMaterial({
        color: 0xffff00, //цвет линии
    });

    var points = []; //массив для хранения координат сегментов

    //штоб окружность цельная была
    var k = 360 / L;

    for (var i = 0; i < L; i++) {
        var x = radius * Math.cos((i * k * Math.PI) / 180);
        var z = radius * Math.sin((i * k * Math.PI) / 180);

        points.push(new THREE.Vector3(x, 0, z)); //начало линии
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points); //создание геометрии
    var line = new THREE.LineLoop(geometry, dashed_material); //создание модели
    line.computeLineDistances(); //вычисление дистанции между сегментами

    line.scale.set(radius, 1, radius);

    scene.add(line); //добавление модели в сцену

    return line;
}

function hsphere(k, delta) {
    var pos = new THREE.Vector3();
    pos.copy(cursor.position);

    var vertices = geometry.getAttribute("position"); //получение массива вершин плоскости

    for (
        var i = 0;
        i < vertices.array.length;
        i += 3 //перебор вершин
    ) {
        var x = vertices.array[i]; //получение координат вершин по X
        var z = vertices.array[i + 2]; //получение координат вершин по Z

        //нет смысла извлекать корень из отрицательных чисел
        var h =
            Math.pow(radius, 2) -
            (Math.pow(x - pos.x, 2) + Math.pow(z - pos.z, 2));

        if (h > 0) vertices.array[i + 1] += Math.sqrt(h) * k * delta; //изменение координат по Y
    }

    for (var i = 0; i < objectList.length; i++) {
        var x = Math.round(objectList[i].position.x);
        var z = Math.round(objectList[i].position.z);

        var y = vertices.array[(z + x * N) * 3 + 1];

        objectList[i].userData.model.position.y = y;
        var size = new THREE.Vector3();
        objectList[i].userData.model.userData.bbox.getSize(size);
        objectList[i].position.y =
            objectList[i].userData.model.position.y + size.y / 2;
    }

    geometry.setAttribute("position", vertices); //установка изменённых вершин

    geometry.computeVertexNormals(); //пересчёт нормалей
    geometry.attributes.position.needsUpdate = true; //обновление вершин
    geometry.attributes.normal.needsUpdate = true; //обновление нормалей
}

function GUI() {
    //массив переменных, ассоциированных с интерфейсом
    var params = {
        sx: 3,
        sy: 3,
        sz: 3,
        rx: 0,
        ry: 0,
        rz: 0,
        w: 0,
        Brush: false,
        Rain: false,
        addHouse: function () {
            addMesh("house");
        },
        addBush: function () {
            addMesh("bush");
        },
        addGrade: function () {
            addMesh("grade");
        },
        del: function () {
            delMesh(selected);
        },
    };
    //создание вкладки
    var folder1 = gui.addFolder("Scale");
    var folder2 = gui.addFolder("Rotating");
    var folder3 = gui.addFolder("Wind");

    //ассоциирование переменных отвечающих за масштабирование
    //в окне интерфейса они будут представлены в виде слайдера
    //минимальное значение - 1, максимальное – 100, шаг – 1
    //listen означает, что изменение переменных будет отслеживаться
    var meshSX = folder1.add(params, "sx").min(1).max(10).step(1).listen();
    var meshSY = folder1.add(params, "sy").min(1).max(10).step(1).listen();
    var meshSZ = folder1.add(params, "sz").min(1).max(10).step(1).listen();

    var meshRX = folder2
        .add(params, "rx")
        .min(0)
        .max(2 * Math.PI)
        .step(Math.PI / 30)
        .listen();
    var meshRY = folder2
        .add(params, "ry")
        .min(0)
        .max(2 * Math.PI)
        .step(Math.PI / 30)
        .listen();
    var meshRZ = folder2
        .add(params, "rz")
        .min(0)
        .max(2 * Math.PI)
        .step(Math.PI / 30)
        .listen();

    var windSX = folder3.add(params, "w").min(-100).max(100).step(1).listen();

    //при запуске программы папка будет открыта
    folder1.open();
    folder2.open();
    folder3.open();

    //описание действий совершаемых при изменении ассоциированных значений
    meshSX.onChange(function (value) {
        resize_obj(selected, 1, value);
    });
    meshSY.onChange(function (value) {
        resize_obj(selected, 2, value);
    });
    meshSZ.onChange(function (value) {
        resize_obj(selected, 3, value);
    });

    meshRX.onChange(function (value) {
        rotate_obj(selected, 1, value);
    });
    meshRY.onChange(function (value) {
        rotate_obj(selected, 2, value);
    });
    meshRZ.onChange(function (value) {
        rotate_obj(selected, 3, value);
    });

    windSX.onChange(function (value) {
        if (snVis) wind.x = value;
    });

    //добавление чек бокса с именем brush
    var cubeVisible = gui.add(params, "Brush").name("brush").listen();
    cubeVisible.onChange(function (value) {
        brVis = value;
        cursor.visible = value;
        circle.visible = value;
    });

    var rainVisible = gui.add(params, "Rain").name("Rain").listen();
    rainVisible.onChange(function (value) {
        snVis = value;
    });

    //добавление кнопок, при нажатии которых будут вызываться функции addMesh
    //и delMesh соответственно. Функции описываются самостоятельно.
    gui.add(params, "addHouse").name("add House");
    gui.add(params, "addBush").name("add Bush");
    gui.add(params, "addGrade").name("add Grade");
    gui.add(params, "del").name("Delete");

    //при запуске программы интерфейс будет раскрыт
    gui.open();
}

function loadModel(path, oname, mname, scle, name) {
    //где path – путь к папке с моделями
    const onProgress = function (xhr) {
        //выполняющаяся в процессе загрузки
        if (xhr.lengthComputable) {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            console.log(Math.round(percentComplete, 2) + "% downloaded");
        }
    };
    const onError = function () {}; //выполняется в случае возникновения ошибки
    const manager = new THREE.LoadingManager();

    new MTLLoader(manager)
        .setPath(path) //путь до модели
        .load(mname, function (materials) {
            //название материала
            materials.preload();
            new OBJLoader(manager)
                .setMaterials(materials) //установка материала
                .setPath(path) //путь до модели
                .load(
                    oname,
                    function (object) {
                        //название модели
                        object.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {
                                child.castShadow = true;
                                child.parent = object;
                            }
                        });

                        // чтоб весь объект двигался = не по частям
                        object.parent = object;

                        object.castShadow = true;

                        //масштаб модели
                        object.scale.set(scle, scle, scle);

                        //object.receiveShadow = true;
                        //object.castShadow = true;

                        //добавление модели с именем в array
                        models.set(name, object);
                    },
                    onProgress,
                    onError
                );
        });
}

function addMesh(name) {
    if (!brVis) {
        var model = models.get(name).clone();

        model.position.x = Math.random() * N;
        model.position.z = Math.random() * N;

        //создание объекта Box3 и установка его вокруг объекта object
        var box = new THREE.Box3();
        model.userData.bbox = box;
        box.setFromObject(model);

        //создание куба единичного размера
        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
        });
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        //скрытие объекта
        cube.material.visible = false;

        //получение позиции центра объекта
        var pos = new THREE.Vector3();
        box.getCenter(pos);

        //получение размеров объекта
        var size = new THREE.Vector3();
        box.getSize(size);

        //установка позиции и размера объекта в куб
        cube.position.copy(pos);
        cube.scale.set(size.x, size.y, size.z);

        model.userData.cube = cube;
        cube.userData.model = model;

        var obb = {};
        //структура состоит из матрицы поворота, позиции и половины размера
        obb.basis = new THREE.Matrix4();
        obb.halfSize = new THREE.Vector3();
        obb.position = new THREE.Vector3();

        //получение позиции центра объекта
        box.getCenter(obb.position);
        //получение размеров объекта
        box.getSize(obb.halfSize).multiplyScalar(0.5);
        //получение матрицы поворота объекта
        obb.basis.extractRotation(model.matrixWorld);
        //структура хранится в поле userData объекта
        model.userData.obb = obb;

        objectList.push(cube);
        scene.add(model);
    }
}

function resize_obj(selected, xyz, value) {
    if (xyz == 1) selected.userData.cube.userData.model.scale.x = value;
    if (xyz == 2) selected.userData.cube.userData.model.scale.y = value;
    if (xyz == 3) selected.userData.cube.userData.model.scale.z = value;

    selected.userData.bbox.setFromObject(selected);
    selected.userData.bbox
        .getSize(selected.userData.obb.halfSize)
        .multiplyScalar(0.5);
    selected.userData.obb.basis.extractRotation(selected.matrixWorld);

    var pos = new THREE.Vector3();
    selected.userData.bbox.getCenter(pos);
    selected.userData.obb.position.copy(pos);
    selected.userData.cube.position.copy(pos);

    var size = new THREE.Vector3();
    selected.userData.bbox.getSize(size);
    selected.userData.cube.scale.set(size.x, size.y, size.z);
}

function rotate_obj(selected, xyz, value) {
    if (xyz == 1) {
        selected.userData.cube.userData.model.rotation.x = value;
        selected.userData.cube.rotation.x = value;
    }
    if (xyz == 2) {
        selected.userData.cube.userData.model.rotation.y = value;
        selected.userData.cube.rotation.y = value;
    }
    if (xyz == 3) {
        selected.userData.cube.userData.model.rotation.z = value;
        selected.userData.cube.rotation.z = value;
    }

    selected.userData.bbox.setFromObject(selected);
    selected.userData.obb.basis.extractRotation(selected.matrixWorld);

    var pos = new THREE.Vector3();
    selected.userData.bbox.getCenter(pos);
    selected.userData.obb.position.copy(pos);
    selected.userData.cube.position.copy(pos);
}

function intersect(ob1, ob2) {
    var xAxisA = new THREE.Vector3();
    var yAxisA = new THREE.Vector3();
    var zAxisA = new THREE.Vector3();
    var xAxisB = new THREE.Vector3();
    var yAxisB = new THREE.Vector3();

    var zAxisB = new THREE.Vector3();
    var translation = new THREE.Vector3();
    var vector = new THREE.Vector3();

    var axisA = [];
    var axisB = [];
    var rotationMatrix = [[], [], []];
    var rotationMatrixAbs = [[], [], []];
    var _EPSILON = 1e-3;

    var halfSizeA, halfSizeB;
    var t, i;

    ob1.obb.basis.extractBasis(xAxisA, yAxisA, zAxisA);
    ob2.obb.basis.extractBasis(xAxisB, yAxisB, zAxisB);

    // push basis vectors into arrays, so you can access them via indices
    axisA.push(xAxisA, yAxisA, zAxisA);
    axisB.push(xAxisB, yAxisB, zAxisB);
    // get displacement vector
    vector.subVectors(ob2.obb.position, ob1.obb.position);
    // express the translation vector in the coordinate frame of the current
    // OBB (this)
    for (i = 0; i < 3; i++) {
        translation.setComponent(i, vector.dot(axisA[i]));
    }
    // generate a rotation matrix that transforms from world space to the
    // OBB's coordinate space
    for (i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            rotationMatrix[i][j] = axisA[i].dot(axisB[j]);
            rotationMatrixAbs[i][j] = Math.abs(rotationMatrix[i][j]) + _EPSILON;
        }
    }
    // test the three major axes of this OBB
    for (i = 0; i < 3; i++) {
        vector.set(
            rotationMatrixAbs[i][0],
            rotationMatrixAbs[i][1],
            rotationMatrixAbs[i][2]
        );
        halfSizeA = ob1.obb.halfSize.getComponent(i);
        halfSizeB = ob2.obb.halfSize.dot(vector);

        if (Math.abs(translation.getComponent(i)) > halfSizeA + halfSizeB) {
            return false;
        }
    }
    // test the three major axes of other OBB
    for (i = 0; i < 3; i++) {
        vector.set(
            rotationMatrixAbs[0][i],
            rotationMatrixAbs[1][i],
            rotationMatrixAbs[2][i]
        );
        halfSizeA = ob1.obb.halfSize.dot(vector);
        halfSizeB = ob2.obb.halfSize.getComponent(i);
        vector.set(
            rotationMatrix[0][i],
            rotationMatrix[1][i],
            rotationMatrix[2][i]
        );
        t = translation.dot(vector);
        if (Math.abs(t) > halfSizeA + halfSizeB) {
            return false;
        }
    }
    // test the 9 different cross-axes
    // A.x <cross> B.x
    halfSizeA =
        ob1.obb.halfSize.y * rotationMatrixAbs[2][0] +
        ob1.obb.halfSize.z * rotationMatrixAbs[1][0];
    halfSizeB =
        ob2.obb.halfSize.y * rotationMatrixAbs[0][2] +
        ob2.obb.halfSize.z * rotationMatrixAbs[0][1];
    t =
        translation.z * rotationMatrix[1][0] -
        translation.y * rotationMatrix[2][0];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }
    // A.x < cross> B.y
    halfSizeA =
        ob1.obb.halfSize.y * rotationMatrixAbs[2][1] +
        ob1.obb.halfSize.z * rotationMatrixAbs[1][1];
    halfSizeB =
        ob2.obb.halfSize.x * rotationMatrixAbs[0][2] +
        ob2.obb.halfSize.z * rotationMatrixAbs[0][0];
    t =
        translation.z * rotationMatrix[1][1] -
        translation.y * rotationMatrix[2][1];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }

    // A.x <cross> B.z
    halfSizeA =
        ob1.obb.halfSize.y * rotationMatrixAbs[2][2] +
        ob1.obb.halfSize.z * rotationMatrixAbs[1][2];
    halfSizeB =
        ob2.obb.halfSize.x * rotationMatrixAbs[0][1] +
        ob2.obb.halfSize.y * rotationMatrixAbs[0][0];
    t =
        translation.z * rotationMatrix[1][2] -
        translation.y * rotationMatrix[2][2];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }
    // A.y <cross> B.x
    halfSizeA =
        ob1.obb.halfSize.x * rotationMatrixAbs[2][0] +
        ob1.obb.halfSize.z * rotationMatrixAbs[0][0];
    halfSizeB =
        ob2.obb.halfSize.y * rotationMatrixAbs[1][2] +
        ob2.obb.halfSize.z * rotationMatrixAbs[1][1];
    t =
        translation.x * rotationMatrix[2][0] -
        translation.z * rotationMatrix[0][0];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }
    // A.y <cross> B.y
    halfSizeA =
        ob1.obb.halfSize.x * rotationMatrixAbs[2][1] +
        ob1.obb.halfSize.z * rotationMatrixAbs[0][1];
    halfSizeB =
        ob2.obb.halfSize.x * rotationMatrixAbs[1][2] +
        ob2.obb.halfSize.z * rotationMatrixAbs[1][0];
    t =
        translation.x * rotationMatrix[2][1] -
        translation.z * rotationMatrix[0][1];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }
    // A.y <cross> B.z
    halfSizeA =
        ob1.obb.halfSize.x * rotationMatrixAbs[2][2] +
        ob1.obb.halfSize.z * rotationMatrixAbs[0][2];
    halfSizeB =
        ob2.obb.halfSize.x * rotationMatrixAbs[1][1] +
        ob2.obb.halfSize.y * rotationMatrixAbs[1][0];
    t =
        translation.x * rotationMatrix[2][2] -
        translation.z * rotationMatrix[0][2];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }

    // A.z <cross> B.x
    halfSizeA =
        ob1.obb.halfSize.x * rotationMatrixAbs[1][0] +
        ob1.obb.halfSize.y * rotationMatrixAbs[0][0];
    halfSizeB =
        ob2.obb.halfSize.y * rotationMatrixAbs[2][2] +
        ob2.obb.halfSize.z * rotationMatrixAbs[2][1];
    t =
        translation.y * rotationMatrix[0][0] -
        translation.x * rotationMatrix[1][0];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }
    // A.z <cross> B.y
    halfSizeA =
        ob1.obb.halfSize.x * rotationMatrixAbs[1][1] +
        ob1.obb.halfSize.y * rotationMatrixAbs[0][1];
    halfSizeB =
        ob2.obb.halfSize.x * rotationMatrixAbs[2][2] +
        ob2.obb.halfSize.z * rotationMatrixAbs[2][0];
    t =
        translation.y * rotationMatrix[0][1] -
        translation.x * rotationMatrix[1][1];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }
    // A.z <cross> B.z
    halfSizeA =
        ob1.obb.halfSize.x * rotationMatrixAbs[1][2] +
        ob1.obb.halfSize.y * rotationMatrixAbs[0][2];
    halfSizeB =
        ob2.obb.halfSize.x * rotationMatrixAbs[2][1] +
        ob2.obb.halfSize.y * rotationMatrixAbs[2][0];
    t =
        translation.y * rotationMatrix[0][2] -
        translation.x * rotationMatrix[1][2];
    if (Math.abs(t) > halfSizeA + halfSizeB) {
        return false;
    }

    // no separating axis exists, so the two OBB don't intersect
    return true;
}

function keys() {
    if (keyboard.pressed("a")) cam_ang++;
    if (keyboard.pressed("d")) cam_ang--;

    camera.position.x = N / 2 + 200 * Math.cos((cam_ang * Math.PI) / 180);
    camera.position.z = N / 2 + 200 * Math.sin((cam_ang * Math.PI) / 180);

    camera.lookAt(N / 2, 0, N / 2);
}

function delMesh(link) {
    if (selected != null) {
        //поиск индекса эллемента link в массиве
        var ind = objectList.indexOf(link.userData.cube);
        //если такой индекс существует, удаление одного эллемента из массива
        if (~ind) objectList.splice(ind, 1);
        //удаление из сцены объекта, на который ссылается link
        scene.remove(link.userData.cube);
        scene.remove(link);

        selected = null;
    }
}

function buttonHoover(mouseX, mouseY, btn) {
    mouseX = mouseX - sW / 2;
    mouseY = -1 * (mouseY - sH / 2);

    if (btn.left < mouseX && mouseX < btn.left + btn.w)
        if (btn.up > mouseY && mouseY > btn.up - btn.h) return true;

    return false;
}

//функция для создания спрайта
function addButton(name1, name2, scaleW, scaleH, models, posx) {
    //загрузка текстуры спрайта
    var texture1 = new THREE.TextureLoader().load(name1);
    var material1 = new THREE.SpriteMaterial({ map: texture1 });

    //загрузка текстуры спрайта
    var texture2 = new THREE.TextureLoader().load(name2);
    var material2 = new THREE.SpriteMaterial({ map: texture2 });

    //создание спрайта
    var sprite = new THREE.Sprite(material1);
    //центр и размер спрайта
    sprite.center.set(0.0, 1.0);
    sprite.scale.set(scaleW, scaleH, 1);
    //позиция спрайта (центр экрана)
    sprite.position.set(-sW / 2.0 + posx, sH / 2.0, 1);
    //sprite.position.set( 0, 128, 1 );

    sceneOrtho.add(sprite);

    var sprt = {};
    sprt.sp = sprite;

    sprt.mat1 = material1;
    sprt.mat2 = material2;

    sprt.w = scaleW;
    sprt.h = scaleH;

    sprt.left = sprite.position.x;
    sprt.up = sprite.position.y;

    sprt.model = models;

    return sprt;
}

function createSpriteMaterial(name) {
    //загрузка текстуры спрайта
    var texture = new THREE.TextureLoader().load(name);
    var material = new THREE.SpriteMaterial({ map: texture });

    return material;
}

function addSprite(mat, pos, lifetime) {
    var sprite = new THREE.Sprite(mat);
    sprite.center.set(0.5, 0.5);
    sprite.scale.set(2.5, 2, 1);
    sprite.position.copy(pos);

    scene.add(sprite);

    var sprt = {};
    sprt.sprite = sprite;
    sprt.v = new THREE.Vector3(0, 0, 0);
    sprt.m = Math.random() * 0.1 + 0.01;
    sprt.lifetime = lifetime;

    return sprt;
}

function emitter(delta) {
    var current_particles = Math.ceil(PARTICLES_PER_SECOND * delta);

    for (var i = 0; i < current_particles; i++) {
        if (particles.length < MAX_PARTICLES) {
            var x = Math.random() * (N + 400) - 200;
            var z = Math.random() * N;

            var lifetime = Math.random() * 2 + 3;

            var pos = new THREE.Vector4(x, 200, z);
            var particle = addSprite(waterMat, pos, lifetime);

            particles.push(particle);
        }
    }

    for (var i = 0; i < particles.length; i++) {
        particles[i].lifetime -= delta;

        if (particles[i].lifetime <= 0) {
            scene.remove(particles[i].sprite);
            particles.splice(i, 1);
            continue;
        }

        var gs = new THREE.Vector3();
        gs.copy(grav);
        gs.multiplyScalar(particles[i].m);

        gs.multiplyScalar(delta);
        particles[i].v.add(gs);

        var v = new THREE.Vector3(0, 0, 0);
        var w = new THREE.Vector3(0, 0, 0);

        w.copy(wind);
        w.multiplyScalar(delta);

        v.copy(particles[i].v);
        v.add(w);

        particles[i].sprite.position.add(v);
    }
}

//функция для обновления позиции спрайта
function updateHUDSprite(sprite, p) {
    var width = window.innerWidth / 2 + p;
    var height = window.innerHeight / 2;
    sprite.center.set(0.0, 1.0);
    sprite.scale.set(scaleW, scaleH, 1);
    //позиция спрайта (центр экрана)
    sprite.position.set(-sW / 2.0 + 1, sH / 2.0, 1);
    // sprite.position.set(-width, height, 1); // левый верхний угол экрана
}
