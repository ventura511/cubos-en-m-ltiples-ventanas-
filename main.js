// Importar la clase WindowManager desde el archivo 'WindowManager.js'
import WindowManager from './WindowManager.js';

// Alias para la librería Three.js
const t = THREE;

// Declaración de variables para la escena 3D
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

// Obtener la fecha actual y establecer la hora a 00:00:00:000
let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

// Inicializar el tiempo interno en segundos desde el inicio del día
let internalTime = getTime();
let windowManager;
let initialized = false;

// Función para obtener el tiempo en segundos desde el inicio del día
function getTime() {
    return (new Date().getTime() - today) / 1000.0;
}

// Verificar si se debe borrar el almacenamiento local
if (new URLSearchParams(window.location.search).get("clear")) {
    localStorage.clear();
} else {
    // Este código es esencial para evitar que algunos navegadores carguen previamente el contenido de algunas páginas antes de visitar la URL
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState != 'hidden' && !initialized) {
            init();
        }
    });

    window.onload = () => {
        if (document.visibilityState != 'hidden') {
            init();
        }
    };

    // Función de inicialización
    function init() {
        initialized = true;

        // Agregar un pequeño tiempo de espera porque window.offsetX reporta valores incorrectos antes de un breve período
        setTimeout(() => {
            setupScene();
            setupWindowManager();
            resize();
            updateWindowShape(false);
            render();
            window.addEventListener('resize', resize);
        }, 500);
    }

    // Configuración de la escena 3D
    function setupScene() {
        camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);

        camera.position.z = 2.5;
        near = camera.position.z - .5;
        far = camera.position.z + 0.5;

        scene = new t.Scene();
        scene.background = new t.Color(0.0);
        scene.add(camera);

        renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
        renderer.setPixelRatio(pixR);

        world = new t.Object3D();
        scene.add(world);

        renderer.domElement.setAttribute("id", "scene");
        document.body.appendChild(renderer.domElement);
    }

    // Configuración del administrador de ventanas
    function setupWindowManager() {
        windowManager = new WindowManager();
        windowManager.setWinShapeChangeCallback(updateWindowShape);
        windowManager.setWinChangeCallback(windowsUpdated);

        // Aquí puedes agregar tus metadatos personalizados a cada instancia de ventana
        let metaData = { foo: "bar" };

        // Inicializar el administrador de ventanas y agregar esta ventana al grupo centralizado de ventanas
        windowManager.init(metaData);

        // Llamar a windowsUpdated inicialmente (más tarde será llamado por el callback de cambio de ventana)
        windowsUpdated();
    }

    // Función llamada cuando se actualizan las ventanas
    function windowsUpdated() {
        updateNumberOfCubes();
    }

    // Actualizar el número de cubos en la escena
    function updateNumberOfCubes() {
        let wins = windowManager.getWindows();

        // Eliminar todos los cubos
        cubes.forEach((c) => {
            world.remove(c);
        })

        cubes = [];

        // Agregar nuevos cubos basados en la configuración actual de la ventana
        for (let i = 0; i < wins.length; i++) {
            let win = wins[i];

            let c = new t.Color();
            c.setHSL(i * .1, 1.0, .5);

            let s = 100 + i * 50;
            let cube = new t.Mesh(new t.BoxGeometry(s, s, s), new t.MeshBasicMaterial({ color: c, wireframe: true }));
            cube.position.x = win.shape.x + (win.shape.w * .5);
            cube.position.y = win.shape.y + (win.shape.h * .5);

            world.add(cube);
            cubes.push(cube);
        }
    }

    // Actualizar la forma de la ventana
    function updateWindowShape(easing = true) {
        // Almacenar el desplazamiento actual en un objeto proxy que actualizamos en la función de representación
        sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
        if (!easing) sceneOffset = sceneOffsetTarget;
    }

    // Función de representación
    function render() {
        let t = getTime();

        windowManager.update();

        // Calcular la nueva posición en función de la diferencia entre el desplazamiento actual y el nuevo desplazamiento multiplicado por un valor de atenuación (para crear el agradable efecto de suavizado)
        let falloff = .05;
        sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
        sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

        // Establecer la posición del mundo en el desplazamiento
        world.position.x = sceneOffset.x;
        world.position.y = sceneOffset.y;

        let wins = windowManager.getWindows();

        // Recorrer todos nuestros cubos y actualizar sus posiciones en función de las posiciones actuales de la ventana
        for (let i = 0; i < cubes.length; i++) {
            let cube = cubes[i];
            let win = wins[i];
            let _t = t;// + i * .2;

            let posTarget = { x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5) }

            cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
            cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;
            cube.rotation.x = _t * .5;
            cube.rotation.y = _t * .3;
        };

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    // Cambiar el tamaño del renderizador para que se ajuste al tamaño de la ventana
    function resize() {
        let width = window.innerWidth;
        let height = window.innerHeight

        camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
}
