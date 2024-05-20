// Ссылка на элемент веб страницы в котором будет отображаться графика
var container;
// Переменные "камера", "сцена" и "отрисовщик"
var camera, scene, renderer;

var N = 20;

var sphere;

var axis = new THREE.Vector3(0, 1, 0);

var clock = new THREE.Clock();

var delta = clock.getDelta();

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

    // ShaderMaterial();

    // //загрузка текстуры
    // var earthTex = new THREE.TextureLoader().load( 'imgs/earth_atmos_2048.jpg' );
    // var earthText = new THREE.TextureLoader().load( 'imgs/earth_lights_2048.png' );
    // var normalMaps = new THREE.TextureLoader().load( 'imgs/earth_normal_2048.jpg' );
    // var geometry = new THREE.SphereGeometry( 45, 64, 64 );
    // var shaderMaterial = new THREE.ShaderMaterial({
    //     uniforms: {
    //         dTex: { value: earthTex },
    //         nTex: { value: earthText },
    //         normalMap: { value: normalMaps },
    //         lightPosition: { value: new THREE.Vector3(10000.0, 0.0, 0.0) },
    //         color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
    //         ambientColor: { value: new THREE.Vector4(0.2, 0.2, 0.2, 1.0) },
    //         lightColor: { value: new THREE.Vector4(1.5, 1.5, 1.5, 1.5) }
    //     },
    //     vertexShader: document.getElementById('vertexShader').textContent,
    //     fragmentShader: document.getElementById('fragmentShader').textContent
    // });

    // sphere = new THREE.Mesh( geometry, shaderMaterial );

    // var displacement = new Float32Array(geometry.attributes.position.array.length);
    // for (var i = 0; i < geometry.attributes.position.array.length; i++)
    // {
    //     var rand = (Math.random() * 2) - 1; //случайное значение в диапазоне от -1 до 1
    //     displacement[i] = rand;
    // }

    // //установка списка смещений в качестве атрибута геометрии
    // geometry.setAttribute("displacement", new THREE.BufferAttribute (displacement, 1));

    // scene.add( sphere );

    addS();
}

function addS()
{
    var geometry = new THREE.SphereGeometry( 15, 64, 64 );
    
    var shaderMaterial = new THREE.ShaderMaterial({
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

function ShaderMaterial()
{
    var displacement = new Float32Array(geometry.attributes.position.array.length);

    for (var i = 0; i < geometry.attributes.position.array.length; i++)
    {
        var rand = (Math.random() * 2) - 1;
        displacement[i] = rand;
    }

    geometry.setAttribute("displacement", new THREE.BufferAttribute (displacement, 1));
    
    //загрузка текстуры
    var earthTex = new THREE.TextureLoader().load( 'imgs/earth_atmos_2048.jpg' );
    var earthText = new THREE.TextureLoader().load( 'imgs/earth_lights_2048.png' );
    var geometry = new THREE.SphereGeometry( 15, 64, 64 );
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            dTex: { value: earthTex },
            nTex: { value: earthText },
            lightPosition: { value: THREE.Vector3(10000.0, 0.0, 0.0) },
            color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) },
            ambientColor: { value: new THREE.Vector4(0.2, 0.2, 0.2, 1.0) },
            lightColor: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent
    });
    var sphere = new THREE.Mesh( geometry, shaderMaterial );
    scene.add( sphere );
}