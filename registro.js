let signUp = document.getElementById("signUp");
let signIn = document.getElementById("signIn"); 
let nameInput = document.getElementById("nameInput");
let title = document.getElementById("title");

const btnRegistrar = document.getElementById('btnRegistrar'); // ❌ Estaba mal escrito: btnReg7istrar
// ✅ URL corregida de MockAPI
const API_URL = 'http://68f7ec8bf7fb897c66177705.mockapi.io/users/registro';

btnRegistrar.onclick = async function(event) { // ⚠️ Agregué 'async' aquí
  event.preventDefault();

  // Capturar valores
  const perfil = document.querySelector('#perfilInput input').value.trim();
  const nombre = document.querySelector('#nameInput input').value.trim();
  const correo = document.querySelector('#emailInput input').value.trim();
  const contrasena = document.querySelector('#passwordInput input').value.trim();
  const confcontrasena = document.querySelector('#ConfpasswordInput input').value.trim();

  // Validar que todos los campos estén llenos
  if (!perfil || !nombre || !correo || !contrasena || !confcontrasena) {
    alert('⚠️ Todos los campos son obligatorios.');
    return;
  }

  // Validar coincidencia de contraseñas
  if (contrasena !== confcontrasena) {
    alert('⚠️ Las contraseñas no coinciden.');
    return;
  }

  // Validar formato básico de correo
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!correoRegex.test(correo)) {
    alert('⚠️ El correo electrónico no es válido.');
    return;
  }

  // Crear objeto con los datos
  const nuevoUsuario = { // ❌ Antes decía 'registro'
    perfil,
    nombre,
    correo,
    contrasena
  };

  try {
    // Enviar datos a MockAPI
    const respuesta = await fetch(API_URL, { // ❌ Estaba entre comillas: 'await'
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuevoUsuario)
    });

    if (!respuesta.ok) throw new Error('Error al registrar el usuario');

    const data = await respuesta.json();
    console.log('✅ Usuario registrado con éxito:', data);

    // Mostrar mensaje de éxito con animación
    let mensaje = document.createElement('div');
    mensaje.textContent = '✅ Registro exitoso';
    mensaje.style.position = 'fixed';
    mensaje.style.top = '20px';
    mensaje.style.left = '50%';
    mensaje.style.transform = 'translateX(-50%)';
    mensaje.style.background = '#155aa8';
    mensaje.style.color = 'white';
    mensaje.style.padding = '12px 24px';
    mensaje.style.borderRadius = '10px';
    mensaje.style.zIndex = '1000';
    mensaje.style.fontWeight = 'bold';
    mensaje.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    mensaje.style.opacity = '0';
    mensaje.style.transition = 'opacity 0.5s ease-in-out, top 0.5s ease-in-out';

    document.body.appendChild(mensaje);

    // Animación: aparece
    setTimeout(() => {
      mensaje.style.opacity = '1';
      mensaje.style.top = '40px';
    }, 100);

    // Animación: desaparece
    setTimeout(() => {
      mensaje.style.opacity = '0';
      mensaje.style.top = '20px';
      setTimeout(() => mensaje.remove(), 500);
    }, 2000);

    // Limpiar los campos después del registro
    document.querySelector('#perfilInput input').value = '';
    document.querySelector('#nameInput input').value = '';
    document.querySelector('#emailInput input').value = '';
    document.querySelector('#passwordInput input').value = '';
    document.querySelector('#ConfpasswordInput input').value = '';

    // Redirigir después del registro.
    setTimeout(() => {
      window.location.href = 'Login.html';
    }, 3000);

  } catch (error) {
    console.error('❌ Error:', error);
    alert('Ocurrió un error al registrar el usuario ❌');
  }
};