// Clase que gestiona las ventanas y su interacción
class WindowManager {
	// Propiedades privadas de la clase
	#windows;  // Lista de ventanas
	#count;    // Contador de ventanas
	#id;       // ID de la ventana actual
	#winData;  // Datos de la ventana actual
	#winShapeChangeCallback;  // Callback para cambios en la forma de la ventana
	#winChangeCallback;       // Callback para cambios en la lista de ventanas

	// Constructor de la clase
	constructor() {
		let that = this;

		// Evento que se dispara cuando localStorage es modificado desde otra ventana
		addEventListener("storage", (event) => {
			if (event.key == "windows") {
				let newWindows = JSON.parse(event.newValue);
				let winChange = that.#didWindowsChange(that.#windows, newWindows);

				that.#windows = newWindows;

				if (winChange) {
					if (that.#winChangeCallback) that.#winChangeCallback();
				}
			}
		});

		// Evento que se dispara cuando la ventana actual está a punto de cerrarse
		window.addEventListener('beforeunload', function (e) {
			let index = that.getWindowIndexFromId(that.#id);

			// Eliminar esta ventana de la lista y actualizar el almacenamiento local
			that.#windows.splice(index, 1);
			that.updateWindowsLocalStorage();
		});
	}

	// Método privado que verifica si hubo cambios en la lista de ventanas
	#didWindowsChange(pWins, nWins) {
		if (pWins.length != nWins.length) {
			return true;
		} else {
			let c = false;

			for (let i = 0; i < pWins.length; i++) {
				if (pWins[i].id != nWins[i].id) c = true;
			}

			return c;
		}
	}

	// Método público para iniciar la ventana actual
	init(metaData) {
		this.#windows = JSON.parse(localStorage.getItem("windows")) || [];
		this.#count = localStorage.getItem("count") || 0;
		this.#count++;

		this.#id = this.#count;
		let shape = this.getWinShape();
		this.#winData = { id: this.#id, shape: shape, metaData: metaData };
		this.#windows.push(this.#winData);

		localStorage.setItem("count", this.#count);
		this.updateWindowsLocalStorage();
	}

	// Método para obtener la forma de la ventana actual
	getWinShape() {
		let shape = { x: window.screenLeft, y: window.screenTop, w: window.innerWidth, h: window.innerHeight };
		return shape;
	}

	// Método para obtener el índice de una ventana a partir de su ID
	getWindowIndexFromId(id) {
		let index = -1;

		for (let i = 0; i < this.#windows.length; i++) {
			if (this.#windows[i].id == id) index = i;
		}

		return index;
	}

	// Método para actualizar la lista de ventanas en el almacenamiento local
	updateWindowsLocalStorage() {
		localStorage.setItem("windows", JSON.stringify(this.#windows));
	}

	// Método para actualizar la información de la ventana actual
	update() {
		let winShape = this.getWinShape();

		if (
			winShape.x != this.#winData.shape.x ||
			winShape.y != this.#winData.shape.y ||
			winShape.w != this.#winData.shape.w ||
			winShape.h != this.#winData.shape.h
		) {
			this.#winData.shape = winShape;

			let index = this.getWindowIndexFromId(this.#id);
			this.#windows[index].shape = winShape;

			if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
			this.updateWindowsLocalStorage();
		}
	}

	// Método para establecer el callback de cambio de forma de la ventana
	setWinShapeChangeCallback(callback) {
		this.#winShapeChangeCallback = callback;
	}

	// Método para establecer el callback de cambio de ventana
	setWinChangeCallback(callback) {
		this.#winChangeCallback = callback;
	}

	// Método para obtener la lista de ventanas
	getWindows() {
		return this.#windows;
	}

	// Método para obtener los datos de la ventana actual
	getThisWindowData() {
		return this.#winData;
	}

	// Método para obtener la ID de la ventana actual
	getThisWindowID() {
		return this.#id;
	}
}

export default WindowManager;
