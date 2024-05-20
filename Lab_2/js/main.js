// Ссылка на элемент веб страницы в котором будет отображаться графика
var container;
// Переменные "камера", "сцена" и "отрисовщик"
var camera, scene, renderer;
// создание массива с планетами 
var planets = [];
// для отслеживания клавиш 
var keyboard = new THREEx.KeyboardState();
// часы 
var clock = new THREE.Clock();
// на какую планету смотреть 
var chase = -1;

// угол с которого смотреть на планету 
var angle = Math.PI/2; 
// скорость изменения позиции камеры 
var switch_speed = 1;

// положение камеры общее  
var camera_default_pos = new THREE.Vector3(0, 150, 0);
// куда смотрит камера общее
var camera_default_look = new THREE.Vector3(0, 0, 0);
// куда смотрит камера в моменте
var camera_current_look = new THREE.Vector3(0, 0, 0);

// ортографическая сцена и камера для спрайтов 
var sceneOrtho, cameraOrtho;

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
    camera.position.set(0, 150, 0);

    //создание ортогональной камеры
    cameraOrtho = new THREE.OrthographicCamera( - window.innerWidth / 2, window.innerWidth / 2, 
                                                  window.innerHeight / 2, - window.innerHeight / 2, 1, 10 );
    cameraOrtho.position.z = 10;
    //сцена для хранения списка объектов размещаемых в экранных координатах
    sceneOrtho = new THREE.Scene();

    // Установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3( 0, 0.0, 0));
    
    // Создание отрисовщика
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    
    //отключение авто очистки рендера
    renderer.autoClear = false;

    // Закрашивание экрана синим цветом, заданным в 16-ричной системе
    renderer.setClearColor( 0x000000ff, 1);
    container.appendChild( renderer.domElement );
    
    // Добавление функции обработки события изменения размеров окна
    window.addEventListener( 'resize', onWindowResize, false );

    CreateSunSystem();
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
    // время с рисования предыдущего кадра, чтоб скорость вращения планет не зависело от фпс
    var delta = clock.getDelta();

    keys(delta);

    //кручение планет
    for (var i = 0; i < planets.length; i++)
    {
        //создание набора матриц
        var m = new THREE.Matrix4();
        var m1 = new THREE.Matrix4();
        var m2 = new THREE.Matrix4();
        
        //расчёт угла поворота вокруг оси
        planets[i].a1 += planets[i].s1 * delta;
        //расчёт угла поворота вокруг орбиты
        planets[i].a2 += planets[i].s2 * delta;
        
        //создание матрицы поворота (вокруг оси Y) в m1 и матрицы перемещения в m2
        m1.makeRotationY( planets[i].a2 );
        m2.setPosition(new THREE.Vector3(planets[i].x, 0, 0));
        
        //запись результата перемножения m1 и m2 в m = перенос потом поворот 
        m.multiplyMatrices( m2, m1 );
        
        //кручение вокруг оси
        m1.makeRotationY( planets[i].a1 );
        m.multiplyMatrices( m1, m );

        //установка m в качестве матрицы преобразований объекта object
        planets[i].sphere.matrix = m;
        planets[i].sphere.matrixAutoUpdate = false;

        if (planets[i].sat != null)
        {
            //создание набора матриц
            var sm = new THREE.Matrix4();
            var sm1 = new THREE.Matrix4();
            var sm2 = new THREE.Matrix4();
            
            //расчёт угла поворота вокруг оси
            planets[i].sat.a1 += planets[i].sat.s1 * delta;
            //расчёт угла поворота вокруг орбиты
            planets[i].sat.a2 += planets[i].sat.s2 * delta;
            
            //создание матрицы поворота (вокруг оси Y) в m1 и матрицы перемещения в m2
            sm1.makeRotationY( planets[i].sat.a1 );
            sm2.setPosition(new THREE.Vector3(planets[i].sat.x, 0, 0));
            
            //запись результата перемножения m1 и m2 в m = перенос потом поворот 
            sm.multiplyMatrices( sm2, sm1 );
            
            //кручение вокруг оси
            sm1.makeRotationY( planets[i].sat.a2 );
            sm.multiplyMatrices( sm1, sm );

            //получение матрицы позиции из матрицы объекта
            var mm = new THREE.Matrix4();
            mm.copyPosition(planets[i].sphere.matrix);
            //получение позиции из матрицы позиции
            var pos = new THREE.Vector3(0, 0, 0);
            pos.setFromMatrixPosition(mm);

            sm.multiplyMatrices( mm, sm );

            //установка m в качестве матрицы преобразований объекта object
            planets[i].sat.sphere.matrix = sm;
            planets[i].sat.sphere.matrixAutoUpdate = false;

            planets[i].sat.track.position.copy(pos);
        }

        if (planets[i].clouds != null)
        {
            //создание набора матриц
            var cm = new THREE.Matrix4();
            var cm1 = new THREE.Matrix4();
            
            //создание матрицы поворота (вокруг оси Y) в m1
            cm1.makeRotationY( planets[i].a1 );
            
            //кручение вокруг оси
            cm1.makeRotationY( planets[i].a2 );
            cm.multiplyMatrices( cm1, cm );
            
            //получение матрицы позиции из матрицы объекта
            var mm = new THREE.Matrix4();
            mm.copyPosition(planets[i].sphere.matrix);

            //получение позиции из матрицы позиции
            var pos = new THREE.Vector3(0, 0, 0);
            pos.setFromMatrixPosition(mm);

            cm.multiplyMatrices( mm, cm );

            //установка m в качестве матрицы преобразований объекта object
            planets[i].clouds.matrix = cm;
            planets[i].clouds.matrixAutoUpdate = false;

        }

        if (planets[i].sprite_name != null && chase == -1)
        {
            planets[i].sprite_info.visible = false;
            planets[i].sprite_name.visible = true;

            //получение матрицы позиции из матрицы объекта
            var mm = new THREE.Matrix4();
            mm.copyPosition(planets[i].sphere.matrix);

            //получение позиции из матрицы позиции
            var pos = new THREE.Vector3(0, 0, 0);
            pos.setFromMatrixPosition(mm);

            planets[i].sprite_name.position.x = pos.x-7 + 5 / planets[i].r;
            planets[i].sprite_name.position.y = pos.y;
            planets[i].sprite_name.position.z = pos.z-7 + 5 / planets[i].r;
        }

        if (chase >= 0 && planets[chase].sprite_info != null)
        {
            planets[i].sprite_name.visible = false;
            planets[i].sprite_info.visible = false;
            planets[chase].sprite_info.visible = true;

            updateHUDSprite(planets[chase].sprite_info);
        }
    }

    // Добавление функции на вызов, при перерисовки браузером страницы
    requestAnimationFrame( animate );
    render();
}

function render()
{
    //процесс отрисовки сцены и объектов в экранных координатах
    renderer.clear();
    renderer.render( scene, camera );
    renderer.clearDepth();
    renderer.render( sceneOrtho, cameraOrtho );
}

function CreateSunSystem(){
    //создвние фонового источника освещения  
    const amb_light = new THREE.AmbientLight(0x202020);
    amb_light.position.set(0, 0, 0);
    scene.add( amb_light );

    //создание источника освещения 
    const light = new THREE.PointLight(0xffffff);
    light.position.set(0, 0, 0);
    scene.add( light );

    //создание солнца 
    createSphere(10, "imgs/sunmap.jpg");
    //создание небосвода
    createSphere(500, "imgs/starmap.jpg"); 


    // запись структур планет в массив 
    //создание меркурия 
    planets.push(createPlanet(2, "imgs/mercury/mercurymap.jpg", "imgs/mercury/mercurybump.jpg", "imgs/mercury/mercury_sprite.png", "imgs/mercury/info.png", 
                              20, 0.7, 4, null, null));
    //создание венеры 
    planets.push(createPlanet(4, "imgs/venus/venusmap.jpg", "imgs/venus/venusbump.jpg", "imgs/venus/venus_sprite.png", "imgs/venus/info.png", 
                              32, 0.5, 5, null, null));
    //создание земли с луной 
    planets.push(createPlanet(3.8, "imgs/earth/earthmap1k.jpg", "imgs/earth/earthbump1k.jpg", "imgs/earth/earth_sprite.png", "imgs/earth/info.png", 
                              45, 0.2, 6, 
                 createPlanet(1, "imgs/earth/moon/moonmap1k.jpg", "imgs/earth/moon/moonbump1k.jpg", null, null, 6, 2, 3, null, null), createEarthCloud()));
    //создание марса  
    planets.push(createPlanet(5, "imgs/mars/marsmap1k.jpg", "imgs/mars/marsbump1k.jpg", "imgs/mars/mars_sprite.png", "imgs/mars/info.png",
                              61, 0.1, 1, null, null));


}

function createSphere(radius, texture_name){
    //создание геометрии сферы
    var geometry = new THREE.SphereGeometry( radius, 32, 32 );
    
    //загрузка текстуры
    var tex = new THREE.TextureLoader().load( texture_name );
    tex.minFilter = THREE.NearestFilter;
    
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

function createPlanet(r, texture_name, bump_texture_name, sp_n, sp_info, x, s1 , s2, sat, clouds){
    //создание геометрии сферы
    var geometry = new THREE.SphereGeometry( r, 32, 32 );
    
    //загрузка текстуры
    var tex = new THREE.TextureLoader().load( texture_name );
    tex.minFilter = THREE.NearestFilter;

    //загрузка карты высот
    var bump = new THREE.TextureLoader().load( bump_texture_name )
    
    //назначение карты и масштабирования высот
    var material = new THREE.MeshPhongMaterial({
        map: tex,
        bumpMap: bump,
        bumpScale: 0.05,
        side: THREE.DoubleSide
   });
    
    //создание объекта
    var sphere = new THREE.Mesh( geometry, material );
    
    //смещение
    sphere.position.x = x;

    //размещение объекта в сцене
    scene.add( sphere );

    //создание структуры с параметрами планеты 
    var planet = {};
    planet.sphere = sphere;
    planet.x = x;
    planet.r = r;
    planet.s1 = s1;
    planet.a1 = 0.0;
    planet.s2 = s2;
    planet.a2 = 0.0;
    planet.sat = sat;
    planet.track = createTrack(x);
    planet.clouds = clouds;
    planet.sprite_name = addPlanetSprite(sp_n);
    planet.sprite_info = addSprite(sp_info);

    return planet;
}

function createTrack(r)
{
    //создание материала для пунктирной линии
    var dashed_material = new THREE.LineDashedMaterial( {
        color: 0xffff00, //цвет линии
        dashSize: 2, //размер сегмента
        gapSize: 2, //величина отступа между сегментами
    } );
   
    var points = []; //массив для хранения координат сегментов
   
    for (var i = 0; i < 360; i++)
    {
        var x = r * Math.cos(i*Math.PI/180);
        var z = r * Math.sin(i*Math.PI/180);
        points.push( new THREE.Vector3( x, 0, z ) ); //начало линии
    }
   
    var geometry = new THREE.BufferGeometry().setFromPoints( points ); //создание геометрии
    var line = new THREE.Line( geometry, dashed_material ); //создание модели
    line.computeLineDistances(); //вычисление дистанции между сегментами
    
    scene.add(line); //добавление модели в сцену
    
    return line;
}

function keys(delta)
{
    if (keyboard.pressed("0")) 
    {
        chase = -1;
    }
    if (keyboard.pressed("1")) 
    {
        chase = 0;
    }
    if (keyboard.pressed("2")) 
    {
        chase = 1;
    }
    if (keyboard.pressed("3")) 
    {
        chase = 2;
    }
    if (keyboard.pressed("4")) 
    {
        chase = 3;
    }

    if (chase >= 0)
    {
        //получение матрицы позиции из матрицы объекта
        var mm = new THREE.Matrix4();
        mm.copyPosition(planets[chase].sphere.matrix);

        //получение позиции из матрицы позиции
        var pos = new THREE.Vector3(0, 0, 0);
        pos.setFromMatrixPosition(mm);

        // вычисление точки в которую будет смотреть камера 
        var cpos = new THREE.Vector3(0, 0, 0);

        cpos.x = pos.x + planets[chase].r*4 * Math.cos(angle - planets[chase].a1);
        cpos.z = pos.z + planets[chase].r*4 * Math.sin(angle - planets[chase].a1);
        cpos.y = 7;

        // Установка позиции камеры
        camera.position.lerp(cpos, delta*switch_speed);

        camera_current_look.lerp(pos, delta*5);

        // Установка точки, на которую камера будет смотреть
        camera.lookAt(camera_current_look);
    }
    else 
    {
        // Установка позиции камеры
        camera.position.lerp(camera_default_pos, delta*switch_speed);

        camera_current_look.lerp(camera_default_look, delta*switch_speed);

        // Установка точки, на которую камера будет смотреть
        camera.lookAt(camera_current_look);
    }

    if (keyboard.pressed("right"))
    {
        angle += Math.PI/5;
    }
    if (keyboard.pressed("left"))
    {
        angle -= Math.PI/5;
    }
}

function createEarthCloud()
{
    // create destination canvas
    var canvasResult = document.createElement('canvas');
    canvasResult.width = 1024;
    canvasResult.height = 512;
    var contextResult = canvasResult.getContext('2d');

    // load earthcloudmap
    var imageMap = new Image();
    imageMap.addEventListener("load", function()
    {
        // create dataMap ImageData for earthcloudmap
        var canvasMap = document.createElement('canvas');
        canvasMap.width = imageMap.width;
        canvasMap.height = imageMap.height;
        var contextMap = canvasMap.getContext('2d');
        contextMap.drawImage(imageMap, 0, 0);
        var dataMap = contextMap.getImageData(0, 0, canvasMap.width, canvasMap.height);

        // load earthcloudmaptrans
        var imageTrans = new Image();
        imageTrans.addEventListener("load", function()
        {
            // create dataTrans ImageData for earthcloudmaptrans
            var canvasTrans = document.createElement('canvas');
            canvasTrans.width = imageTrans.width;
            canvasTrans.height = imageTrans.height;
            var contextTrans = canvasTrans.getContext('2d');
            contextTrans.drawImage(imageTrans, 0, 0);
            var dataTrans = contextTrans.getImageData(0, 0, canvasTrans.width,
            canvasTrans.height);

            // merge dataMap + dataTrans into dataResult
            var dataResult = contextMap.createImageData(canvasMap.width, canvasMap.height);
            for(var y = 0, offset = 0; y < imageMap.height; y++)
                for(var x = 0; x < imageMap.width; x++, offset += 4)
                {
                    dataResult.data[offset+0] = dataMap.data[offset+0];
                    dataResult.data[offset+1] = dataMap.data[offset+1];
                    dataResult.data[offset+2] = dataMap.data[offset+2];
                    dataResult.data[offset+3] = 255-dataTrans.data[offset+0];
                }

            // update texture with result
            contextResult.putImageData(dataResult,0,0)
            material.map.needsUpdate = true;
        });

        imageTrans.src = "imgs/earth/earthcloudmaptrans.jpg";
    }, false);

    imageMap.src = "imgs/earth/earthcloudmap.jpg";

    var geometry = new THREE.SphereGeometry(4, 32, 32);
    var material = new THREE.MeshPhongMaterial({
        map: new THREE.Texture(canvasResult),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
    });

    var mesh = new THREE.Mesh(geometry, material);
    
    scene.add(mesh);

    var m = new THREE.Matrix4();
    mesh.matrix = m;
    
    return mesh;
}

//функция для создания спрайта
function addPlanetSprite(name)
{
    map = new THREE.TextureLoader().load( name );
    material = new THREE.SpriteMaterial( { map: map } );

    sprite = new THREE.Sprite( material );
    sprite.scale.set( 7, 7, 1 );
    scene.add( sprite );

    return sprite;
}

//функция для создания спрайта
function addSprite(name)
{
    //загрузка текстуры спрайта
    var texture = new THREE.TextureLoader().load(name);
    var material = new THREE.SpriteMaterial( { map: texture } );
    
    //создание спрайта
    sprite = new THREE.Sprite( material);
    
    //центр и размер спрайта
    sprite.center.set( 0.0, 1.0 );
    sprite.scale.set( 500, 500, 1 );

    //позиция спрайта (центр экрана)
    sprite.position.set( 0, 0, 1 );
    sceneOrtho.add(sprite);

    return sprite;
}

//функция для обновления позиции спрайта
function updateHUDSprite(sprite)
{
    var width = window.innerWidth / 2;
    var height = window.innerHeight / 2;

    sprite.position.set( width/2.2, height, 1 ); // левый верхний угол экрана
}