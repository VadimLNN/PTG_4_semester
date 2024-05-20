var container;
var camera, scene, renderer;
var sphere;
var clock = new THREE.Clock();
var cam_ang = 45;
var N = 25;
// для отслеживания клавиш 
var keyboard = new THREEx.KeyboardState();

init();
animate();

function init() {
    container = document.getElementById("container");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight,1,4000);
    camera.position.set(N/2, N, N*4);

    camera.lookAt(new THREE.Vector3(0, 0.0, 0));
    renderer = new THREE.WebGLRenderer({antialias: false,});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x00a9a9c6, 1);
    container.appendChild(renderer.domElement);
    window.addEventListener("resize",onWindowResize,false);

    var geometry = new THREE.SphereGeometry(32, 64, 64);
    var displacement = new Float32Array(geometry.attributes.position.array.length);
    for (var i = 0;i < geometry.attributes.position.array.length;i++) {
        var rand = Math.random() * 2 - 1; //случайное значение в диапазоне от -1 до 1
        displacement[i] = rand;
    }
    
    geometry.computeTangents();
    
    for (var i = 0;i < geometry.attributes.tangent.array.length;i++) {
        geometry.attributes.tangent.array[i] = -geometry.attributes.tangent.array[i];
    }

    //установка списка смещений в качестве атрибута геометрии
    geometry.setAttribute("displacement",new THREE.BufferAttribute(displacement, 1));

    //загрузка текстуры
    var earthTex = new THREE.TextureLoader().load("imgs/earth_atmos_2048.jpg");
    var earthTex_ = new THREE.TextureLoader().load("imgs/earth_lights_2048.png");

    var earthTex_norm = new THREE.TextureLoader().load("imgs/1322.png");

    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            dTex: { value: earthTex }, //текстура
            nTex: { value: earthTex_ },
            normTex: { value: earthTex_norm }, //текстура
            lightPosition: { value: new THREE.Vector3(0.0, 0.0, 10000.0) },            
            color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0),},
            ambientColor: { value: new THREE.Vector4(0.5, 0.5, 0.5, 1.0),},
            lightColor: {
                value: new THREE.Vector4( 1.0, 1.0, 1.0, 1.0),},
        },
        vertexShader:
            document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent,
    });

    sphere = new THREE.Mesh(geometry, shaderMaterial);
    scene.add(sphere);
}

function onWindowResize() {
    // Изменение соотношения сторон для виртуальной камеры
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // Изменение соотношения сторон рендера
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    keys();
    var time = clock.getDelta();
    sphere.rotation.y += (Math.PI /4*time);
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
}

function keys()
{
    if (keyboard.pressed("a"))
        cam_ang++;
    if (keyboard.pressed("d"))
        cam_ang--;

    camera.position.x = sphere.position.x + 110*Math.cos(cam_ang*Math.PI/180);
    camera.position.z = sphere.position.z + 110*Math.sin(cam_ang*Math.PI/180);
    camera.position.y = 15;

    camera.lookAt(0, 0, 0);
}