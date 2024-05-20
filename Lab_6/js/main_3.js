// Ссылка на элемент веб страницы в котором будет отображаться графика
var container;
// Переменные "камера", "сцена" и "отрисовщик"
var camera, scene, renderer;

var N = 20;

var sphere;

var axis = new THREE.Vector3(0, 1, 0);

var clock = new THREE.Clock();

var delta = clock.getDelta();

var cam_ang = 45;
// для отслеживания клавиш 
var keyboard = new THREEx.KeyboardState();

init();
// Обновление данных по таймеру браузера
animate();

function init()
{
    // Получение ссылки на элемент html страницы
    container = document.getElementById( 'container' );
    // Создание "сцены"
    scene = new THREE.Scene();
    // Установка параметров камеры
    // 45 - угол обзора
    // window.innerWidth / window.innerHeight - соотношение сторон
    // 1 - 4000 - ближняя и дальняя плоскости отсечения
    camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 1, 4000 );
    // Установка позиции камеры
    camera.position.set(N/2, N, N*4);

    // Установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3( N/2, 0.0, N/2));
    // Создание отрисовщика
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // Закрашивание экрана синим цветом, заданным в 16ричной системе
    renderer.setClearColor( 0x00a9a9c6, 1);
    container.appendChild( renderer.domElement );
    // Добавление функции обработки события изменения размеров окна
    window.addEventListener( 'resize', onWindowResize, false );

    addS();
}

function addS()
{
    var geometry = new THREE.SphereGeometry( 15, 64, 64 );
    
    //загрузка текстуры
    var earthTex = new THREE.TextureLoader().load( 'imgs/earth_atmos_2048.jpg' );
    var earthNTex = new THREE.TextureLoader().load( 'imgs/earth_lights_2048.png' );

    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            dTex: { value: earthTex }, //текстура
            nTex: { value: earthNTex }, //текстура
            lightPosition: { value: new THREE.Vector3(10000.0, 0.0, 0.0) },
            color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
            ambientColor: { value: new THREE.Vector4(0.2, 0.2, 0.2, 1.0) },
            lightColor: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent
    });
        
    sphere = new THREE.Mesh( geometry, shaderMaterial );
    
    scene.add( sphere );
}

function onWindowResize()
{
    // Изменение соотношения сторон для виртуальной камеры
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // Изменение соотношения сторон рендера
    renderer.setSize( window.innerWidth, window.innerHeight );
}
// В этой функции можно изменять параметры объектов и обрабатывать действия пользователя
function animate()
{
    keys();
    // Добавление функции на вызов, при перерисовки браузером страницы
    sphere.rotateOnAxis(axis, 0.005);
    requestAnimationFrame( animate );
    render();
}

function render()
{
    // Рисование кадра
    renderer.render( scene, camera );
}

function keys()
{
    if (keyboard.pressed("a"))
        cam_ang++;
    if (keyboard.pressed("d"))
        cam_ang--;

    camera.position.x = sphere.position.x + 40*Math.cos(cam_ang*Math.PI/180);
    camera.position.z = sphere.position.z + 40*Math.sin(cam_ang*Math.PI/180);
    camera.position.y = 15;

    camera.lookAt(0, 0, 0);
}