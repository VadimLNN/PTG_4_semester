//импорт библиотеки three.js
import * as THREE from "./libs/three.module.js";

//импорт библиотек для загрузки моделей и материалов
import { MTLLoader } from './libs/MTLLoader.js';
import { OBJLoader } from './libs/OBJLoader.js';
//импорт библиотеки для загрузки моделей в формате glb
import { GLTFLoader } from './libs/GLTFLoader.js';


// Ссылка на элемент веб страницы в котором будет отображаться графика
var container;
// Переменные "камера", "сцена" и "отрисовщик"
var camera, scene, renderer;

//часы для анимации
var clock = new THREE.Clock();

//глобальные переменные для хранения списка анимаций
var mixer, morphs = [];
//создание списка анимаций в функции Init
mixer = new THREE.AnimationMixer( scene );

// для отслеживания клавиш 
var keyboard = new THREEx.KeyboardState();

var T = 10.0, t = 0.0;
var follow_parrot = false;

var bird;
var axisY = new THREE.Vector3(0, 1, 0);
var axisX = new THREE.Vector3(1, 0, 0);
var axisZ = new THREE.Vector3(0, 0, 1);

var plight = new THREE.PointLight(0xffff00, 2, 100, 2);

var birds_path;

// Функция инициализации камеры, отрисовщика, объектов сцены и т.д.
init();
// Обновление данных по таймеру браузера
animate();

// В этой функции можно добавлять объекты и выполнять их первичную настройку
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
    camera.position.set(130, 250, 500);

    // Установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3( 128, 0.0, 128));
    // Создание отрисовщика
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // Закрашивание экрана синим цветом, заданным в 16-ричной системе
    //renderer.setClearColor( 0x008470ff, 1);

    //обработка теней on
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;


    container.appendChild( renderer.domElement );
    // Добавление функции обработки события изменения размеров окна
    window.addEventListener( 'resize', onWindowResize, false );
    
    //создание неба, плоскости и света  
    createSky();
    createPlane(); 
    createLight();

    scene.add(plight);

    // вызов функции загрузки модели (в функции Init)
    loadModel('models/', "Palma.obj", "Palma.mtl");
    loadModel('models/', "Tree.obj", "Tree.mtl");

    // загрузка птиц
    bird = loadAnimatedModel('models/animated/Parrot.glb', true);
    loadAnimatedModel('models/animated/Flamingo.glb', false);
    //loadAnimatedModel('models/animated/Stork.glb', false);

    birds_path = createT();

    // создать кривые
    mixer = new THREE.AnimationMixer(scene);
    
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
    if (keyboard.pressed("q"))
    {
        follow_parrot = true;
        bird.translateZ(0);
    }
        
    if (keyboard.pressed("e"))
    {
        follow_parrot = false;
    }

    // воспроизведение анимаций (в функции animate)
    var delta = clock.getDelta();
    
    t += delta;

    mixer.update( delta );
    
    for ( var i = 0; i < morphs.length; i ++ )
    {
        var morph = morphs[ i ];
        var pos = new THREE.Vector3();

        if(t >= T) t = 0.0;

        pos.copy(birds_path.getPointAt(t/T));
        morph.position.copy(pos);

        plight.position.copy(pos);

        if((t + 0.001) >= T) t = 0.0
        var nextPoint= new THREE.Vector3();
        nextPoint.copy(birds_path.getPointAt((t+0.001)/T));

        morph.lookAt(nextPoint);
        
        if(follow_parrot)
        {
            // установка смещения камеры относительно объекта
            var relativeCameraOffset = new THREE.Vector3(0,50,-75);
            var m1 = new THREE.Matrix4();
            var m2 = new THREE.Matrix4();

            // получение поворота объекта
            m1.extractRotation(morph.matrixWorld);

            // получение позиции объекта 
            //m2.extractPosition(morph.matrixWorld); 
            m2.copyPosition(morph.matrixWorld); 
            m1.multiplyMatrices(m2, m1);

            // получение смещения позиции камеры относительно объекта
            var cameraOffset = relativeCameraOffset.applyMatrix4(m1);

            // установка позиции и направления взгляда камеры
            camera.position.copy(cameraOffset);
            camera.lookAt(morph.position );
        }
        else if (bird != null)
        {
            // установка смещения камеры относительно объекта
            var relativeCameraOffset = new THREE.Vector3(0,50,-75);
            var m1 = new THREE.Matrix4();
            var m2 = new THREE.Matrix4();

            // получение поворота объекта
            //m1.extractRotation(bird.matrixWorld);
            
            // получение позиции объекта 
            m2.copyPosition(bird.matrixWorld); 
            //m1.multiplyMatrices(m2, m1);
            
            // получение смещения позиции камеры относительно объекта
            var cameraOffset = relativeCameraOffset.applyMatrix4(m2);
            
            // установка позиции и направления взгляда камеры
            camera.position.copy(cameraOffset);
            camera.lookAt(bird.position );

            bird.translateZ(25*delta);

            if(keyboard.pressed("a"))
            {
                bird.rotation.z = -Math.PI/4;
                bird.rotation.y += Math.PI/60;
            }
            else 
                bird.rotation.z = 0;

            if(keyboard.pressed("d"))
            {
                bird.rotation.z = Math.PI/4;
                bird.rotation.y -= Math.PI/60;
            }
            if(keyboard.pressed("w"))
            {
                bird.rotateOnAxis(axisX, -Math.PI/60.0);
            }
            if(keyboard.pressed("s"))
            {
                bird.rotateOnAxis(axisX, Math.PI/60.0);
            }
            
            
        }
    }

    // Добавление функции на вызов, при перерисовки браузером страницы
    requestAnimationFrame( animate );
    render();
}

function render()
{
    // Рисование кадра
    renderer.render( scene, camera );
}

function loadModel(path, oname, mname) //где path – путь к папке с моделями
{
    const onProgress = function ( xhr ) { //выполняющаяся в процессе загрузки
        if ( xhr.lengthComputable ) {
                const percentComplete = xhr.loaded / xhr.total * 100;
                console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
            }
    };
    const onError = function () { }; //выполняется в случае возникновения ошибки
    const manager = new THREE.LoadingManager();

    new MTLLoader( manager )
    .setPath( path ) //путь до модели
    .load( mname, function ( materials ) { //название материала
        materials.preload();
        new OBJLoader( manager )
        .setMaterials( materials ) //установка материала
        .setPath( path ) //путь до модели
        .load( oname, function ( object ) { //название модели
            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                    child.castShadow = true;
            } );
            
            for (var i = 0; i < 5; i++)
            {
                //позиция модели по координате X
                object.position.x = Math.random()*320;
                object.position.z = Math.random()*320;

                object.position.y = -15;


                var s = (Math.random()*100 + 30) / 100;
                //масштаб модели
                object.scale.set(s, s, s);
                
                object.receiveShadow = true;
                //object.castShadow = true;

                //добавление модели в сцену
                scene.add( object.clone() );
            }
        }, onProgress, onError );
    } );
}

function createSky()
{
    //создание геометрии сферы
    var geometry = new THREE.SphereGeometry( 650, 32, 32 );
    
    //загрузка текстуры
    var tex = new THREE.TextureLoader().load( "sky/sky_1.jpg" );
    tex.minFilter = THREE.NearestFilter;
    
    var maxAnisotropy = renderer.getMaxAnisotropy();
    tex.anisotropy = maxAnisotropy;

    //создание материала
    var material = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide
    });
    
    //создание объекта
    var sphere = new THREE.Mesh( geometry, material );
    
    //размещение объекта в сцене
    scene.add( sphere );
}

function createPlane()
{
    const geometry = new THREE.PlaneGeometry( 400, 400, 200, 200);
    const material = new THREE.MeshLambertMaterial( {color: 0x008800, side: THREE.DoubleSide} );
    const plane = new THREE.Mesh( geometry, material );

    var heightMap = new THREE.TextureLoader().load('img/lake.jpg');
    var tex = new THREE.TextureLoader().load( 'img/grass.jpg' );

    const planeMaterial = new THREE.MeshPhongMaterial(
    {
        map: tex,
        displacementMap : heightMap,
        displacementScale : 20,
        side: THREE.DoubleSide,
        wireframe: false,
        flatShading: true,
        shininess: 3
    });


    const mesh = new THREE.Mesh(geometry, planeMaterial);
    mesh.position.x = 170;
    mesh.position.z = 120;
    mesh.rotation.x = Math.PI/2;
    scene.add(mesh);

    mesh.receiveShadow = true;
}

function createLight()
{
    //создание точечного источника освещения, параметры: цвет, интенсивность, дальность
    const light = new THREE.PointLight( 0xffffff, 1, 1000 );
    light.position.set( 150, 200, 128 ); //позиция источника освещения
    light.castShadow = true; //включение расчёта теней от источника освещения
    scene.add( light ); //добавление источника освещения в сцену

    //настройка расчёта теней от источника освещения
    light.shadow.mapSize.width = 512; //ширина карты теней в пикселях
    light.shadow.mapSize.height = 512; //высота карты теней в пикселях
    light.shadow.camera.near = 0.5; //расстояние, ближе которого не будет теней
    light.shadow.camera.far = 1500; 

    var helper = new THREE.CameraHelper(light.shadow.camera);
    scene.add(helper);
}

//функция загрузки анимированной модели
function loadAnimatedModel(path, controlled) //где path – путь и название модели
{
    var loader = new GLTFLoader();

    loader.load( path, function ( gltf ) {
        var mesh = gltf.scene.children[ 0 ];
        var clip = gltf.animations[ 0 ];

        //установка параметров анимации (скорость воспроизведения и стартовый фрейм)
        mixer.clipAction( clip, mesh ).setDuration( 1 ).startAt( 0 ).play();

    
        mesh.position.set( Math.random() * 320, 50, Math.random() * 320 ); //установка позиции объекта
        mesh.rotation.y = Math.PI / Math.random()*10; //поворот модели вокруг оси Y
        mesh.scale.set( 0.1, 0.1, 0.1 ); //масштаб модели
        
        
        //mesh.receiveShadow = true;
        mesh.castShadow = true;

        mesh.pos = 0;

        scene.add( mesh ); //добавление модели в сцену
        if (!controlled)
            morphs.push( mesh );
        else 
            bird = mesh;
    } );
}

function createT()
{
    var curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 60, 50, 170 ), //P0
        new THREE.Vector3( 75, 50, 50 ), //P1
        new THREE.Vector3( 255, 50, 50 ), //P2
        new THREE.Vector3( 240, 50, 170 ) //P3
    );
    var curve_2 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 240, 50, 170 ), //P0
        new THREE.Vector3( 255, 50, 300 ), //P1
        new THREE.Vector3( 75, 50, 300 ), //P2
        new THREE.Vector3( 60, 50, 175 ) //P3
    );

    var vertices = [];
    // получение 20-ти точек на заданной кривой
    vertices = curve.getPoints( 200 );
    vertices = vertices.concat(curve_2.getPoints(200));

    // создание кривой по списку точек
    var path = new THREE.CatmullRomCurve3(vertices);
    
    // является ли кривая замкнутой (зацикленной)
    path.closed = true;
    
    //создание геометрии из точек кривой
    // var geometry = new THREE.BufferGeometry().setFromPoints( vertices );
    // var material = new THREE.LineBasicMaterial( { color : 0xffff00 } );
    
    //создание объекта
    //var curveObject = new THREE.Line( geometry, material );
    //scene.add(curveObject); //добавление объекта в сцену

    return path;
}

