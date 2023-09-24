const carrito = [];
let productos;
let codigosDescuento = {};
let descuentoAplicado = false;
let descuentoGuardado = 0;

// Limpiar el carrito al cargar la página
localStorage.removeItem('carrito');

// Función para cargar los productos desde el archivo JSON y mostrarlos
async function cargarProductos() {
    try {
        const response = await fetch('./json/productos.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo JSON de productos');
        }
        productos = await response.json();
        console.log(productos);
        const productoSelect = document.getElementById('producto');
        const productoImagen = document.getElementById('producto-imagen'); // Elemento para mostrar la imagen

        productos.forEach((producto) => {
            const option = document.createElement('option');
            option.value = producto.id; // Cambiar a ID en lugar de nombre
            option.textContent = producto.nombre + ' - $' + producto.precio;
            productoSelect.appendChild(option);
        });

        // Agregar evento de cambio para mostrar la imagen del producto seleccionado
        productoSelect.addEventListener('change', function () {
            const selectedProductId = parseInt(productoSelect.value);
            const selectedProduct = productos.find((p) => p.id === selectedProductId);

            if (selectedProduct) {
                // Actualizar la imagen del producto
                productoImagen.src = selectedProduct.imagen;
                productoImagen.style.display = 'block'; // Mostrar la imagen
            } else {
                // Si no se selecciona un producto válido, ocultar la imagen
                productoImagen.src = '';
                productoImagen.style.display = 'none';
            }
        });
    } catch (error) {
        console.error(error);
    }
}

// Función para cargar los códigos de descuento desde el archivo JSON
async function cargarCodigosDescuento() {
    try {
        const response = await fetch('./json/codigos_descuento.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo JSON de códigos de descuento');
        }
        codigosDescuento = await response.json();
    } catch (error) {
        console.error(error);
    }
}

// Cargar productos y códigos de descuento al cargar la página
cargarProductos();
cargarCodigosDescuento();

// Función para aplicar el descuento
document.getElementById('aplicarDescuento').addEventListener('click', function () {
    if (descuentoAplicado) {
        console.log("Ya se ha aplicado un descuento.");
        return; // No hacer nada si ya se aplicó un descuento
    }

    const codigoDescuento = document.getElementById('codigoDescuento').value.trim().toUpperCase();

    const descuento = codigosDescuento[codigoDescuento];

    const totalVentaAntesDescuento = carrito.reduce((total, item) => total + item.unidades * item.precio, 0);

    const totalVentaConDescuento = descuento !== undefined ? totalVentaAntesDescuento * (1 - descuento) : totalVentaAntesDescuento;

    document.getElementById('totalVenta').textContent = totalVentaConDescuento.toFixed(2);

    if (descuento !== undefined) {
        console.log(`Cupón aplicado: Descuento del ${descuento * 100}%`);
        mostrarNotificacion(`Cupón aplicado: Descuento del ${descuento * 100}%`);
        document.getElementById('codigoDescuento').disabled = true;
        document.getElementById('aplicarDescuento').disabled = true;
        descuentoAplicado = true;
        descuentoGuardado = descuento;
    } else {
        console.log("Cupón no válido");
        mostrarError("Cupón no válido");
    }
});

// Función para actualizar el carrito
function actualizarCarrito() {
    const carritoList = document.getElementById('carrito');
    carritoList.innerHTML = '';

    let totalVenta = 0;

    carrito.forEach((carritoFinal) => {
        const total = carritoFinal.unidades * carritoFinal.precio;
        totalVenta += total;

        const listItem = document.createElement('li');
        listItem.textContent = `Producto: ${productos.find(p => p.id === carritoFinal.id).nombre}, Unidades: ${carritoFinal.unidades}, Precio unitario: $${carritoFinal.precio}, Total: $${total}`;
        
        // Botón de eliminación del producto con el ID como atributo personalizado
        const eliminarButton = document.createElement('button');
        eliminarButton.textContent = 'Eliminar';
        eliminarButton.classList.add('eliminar-producto');
        eliminarButton.setAttribute('data-producto-id', carritoFinal.id);
        eliminarButton.style.marginLeft = '20px'; // Ajusta el margen izquierdo según tus preferencias
        
        // Agregar evento de clic para eliminar el producto
        eliminarButton.addEventListener('click', function () {
            const productoId = parseInt(eliminarButton.getAttribute('data-producto-id'));
            const indiceProducto = carrito.findIndex((item) => item.id === productoId);
            if (indiceProducto !== -1) {
                carrito.splice(indiceProducto, 1); // Eliminar el producto del carrito
                actualizarCarrito(); // Actualizar la visualización del carrito
            }
        });

        // Agregar el botón de eliminación al elemento de la lista
        listItem.appendChild(eliminarButton);

        carritoList.appendChild(listItem);
    });

    // Calcular el total de la venta antes de aplicar el descuento
    const totalVentaAntesDescuento = totalVenta;

    // Verificar si se ha aplicado un descuento y calcular el total con descuento
    const totalVentaConDescuento = descuentoAplicado ? totalVentaAntesDescuento * (1 - descuentoGuardado) : totalVentaAntesDescuento;

    document.getElementById('totalVenta').textContent = totalVentaConDescuento.toFixed(2);
}

// Función para mostrar notificaciones con Toastify
function mostrarNotificacion(mensaje) {
    Toastify({
        text: mensaje,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'left',
    }).showToast();
}

// Función para mostrar notificaciones de error con Toastify
function mostrarError(mensaje) {
    Toastify({
        text: mensaje,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'left',
        backgroundColor: '#f44336',
    }).showToast();
}

// Función para manejar la compra de productos
document.getElementById('compra-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const productoSelect = document.getElementById('producto');
    const productoId = parseInt(productoSelect.value);
    const unidades = parseInt(document.getElementById('unidades').value);

    const selectedProduct = productos.find((p) => p.id === productoId);

    if (selectedProduct) {
        const existingProduct = carrito.find((item) => item.id === productoId);

        if (existingProduct) {
            existingProduct.unidades += unidades;
        } else {
            carrito.push({ id: productoId, unidades, precio: selectedProduct.precio });
        }

        actualizarCarrito();
        document.getElementById('mensaje').textContent = `Producto ${selectedProduct.nombre} agregado al carrito.`;

        document.getElementById('finalizarCompra').disabled = false;

        document.getElementById('unidades').value = '';
        document.getElementById('codigoDescuento').value = '';

        localStorage.setItem('carrito', JSON.stringify(carrito));
    } else {
        document.getElementById('mensaje').textContent = 'Producto no válido';
    }
});

// Función para finalizar la compra
document.getElementById('finalizarCompra').addEventListener('click', function () {
    if (carrito.length > 0) {
        // Llamar a Toastify para mostrar el mensaje de compra finalizada
        Toastify({
            text: "Compra finalizada. Gracias por su compra.",
            duration: 3000,
            gravity: 'top',
            position: 'left',
            backgroundColor: '#4CAF50',
        }).showToast();

        // Limpiar el carrito después de la compra
        carrito.length = 0;
        localStorage.removeItem('carrito');
        actualizarCarrito();

        // Limpiar los campos de unidades, descuento y reiniciar la imagen
        document.getElementById('unidades').value = '';
        document.getElementById('codigoDescuento').value = '';
        document.getElementById('producto-imagen').src = ''; // Reiniciar la imagen

        // Habilitar nuevamente el campo de entrada de códigos de descuento y el botón "Aplicar Descuento"
        document.getElementById('codigoDescuento').disabled = false;
        document.getElementById('aplicarDescuento').disabled = false;

        // Deshabilitar el botón "Finalizar Compra" nuevamente
        document.getElementById('finalizarCompra').disabled = true;

        // Reiniciar el estado del descuento aplicado
        descuentoAplicado = false;
        descuentoGuardado = 0;

    } else {
        // Si no hay productos en el carrito, muestra un mensaje de error con Toastify
        Toastify({
            text: "Agregue al menos un producto al carrito antes de finalizar la compra.",
            duration: 3000,
            gravity: 'top',
            position: 'left',
            backgroundColor: '#f44336',
        }).showToast();
    }
});

// Agregar evento de clic a los botones de eliminación
const eliminarBotones = document.querySelectorAll('.eliminar-producto');
eliminarBotones.forEach((boton) => {
    boton.addEventListener('click', function () {
        const productoId = parseInt(boton.getAttribute('data-producto-id'));
        const indiceProducto = carrito.findIndex((item) => item.id === productoId);
        if (indiceProducto !== -1) {
            carrito.splice(indiceProducto, 1);
            actualizarCarrito();
        }
    });
});
