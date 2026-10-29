/* ===== Registro e inicio de sesión (guardado en el navegador con localStorage) =====
   Nota: es un sistema de práctica para el trabajo de clase. No hay servidor,
   así que las cuentas solo existen en el navegador donde se crean. */
(function () {
  var K_USERS = 'gv_users';
  var K_SESSION = 'gv_session';

  function read(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  // Hash sencillo para no guardar la contraseña en texto plano
  function hash(texto) {
    var h = 5381;
    for (var i = 0; i < texto.length; i++) { h = ((h << 5) + h + texto.charCodeAt(i)) | 0; }
    return (h >>> 0).toString(36) + '-' + texto.length;
  }

  window.Auth = {
    disponible: function () {
      try { localStorage.setItem('gv_test', '1'); localStorage.removeItem('gv_test'); return true; }
      catch (e) { return false; }
    },
    users: function () { return read(K_USERS, []); },
    register: function (nombre, email, pass) {
      email = email.trim().toLowerCase();
      var users = this.users();
      for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) return { ok: false, error: 'Ese correo ya tiene una cuenta. Inicia sesión.' };
      }
      users.push({ nombre: nombre.trim(), email: email, pass: hash(email + ':' + pass) });
      if (!write(K_USERS, users)) return { ok: false, error: 'No se pudo guardar la cuenta en este navegador.' };
      return { ok: true };
    },
    login: function (email, pass) {
      email = email.trim().toLowerCase();
      var users = this.users();
      for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
          if (users[i].pass === hash(email + ':' + pass)) {
            write(K_SESSION, { nombre: users[i].nombre, email: email });
            return { ok: true };
          }
          return { ok: false, error: 'La contraseña es incorrecta.' };
        }
      }
      return { ok: false, error: 'No existe una cuenta con ese correo. Regístrate primero.' };
    },
    current: function () { return read(K_SESSION, null); },
    logout: function () { try { localStorage.removeItem(K_SESSION); } catch (e) {} }
  };
})();
