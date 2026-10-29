/* ===== Código compartido por las páginas internas: carrito, avisos y comunicación con el menú ===== */
(function () {
  // Si alguien abre una página interna directamente y no inició sesión, va al login
  try { if (window.top === window && !JSON.parse(localStorage.getItem('gv_session'))) { location.replace('index.html'); return; } } catch (e) {}
  var K_CART = 'gv_cart';
  var MONEDA = 'S/';

  function read(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; }
    catch (e) { return fallback; }
  }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }

  function money(n) {
    return MONEDA + ' ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function aviso(tipo, datos) {
    try { window.parent.postMessage(Object.assign({ gv: 1, type: tipo }, datos), '*'); } catch (e) {}
  }

  var Cart = {
    get: function () { return read(K_CART, []); },
    save: function (items) {
      write(K_CART, items);
      aviso('cart', { count: this.count() });
      document.dispatchEvent(new CustomEvent('cart:change'));
    },
    add: function (p) {
      var items = this.get(), found = null;
      for (var i = 0; i < items.length; i++) if (items[i].id === p.id) found = items[i];
      if (found) found.cant++; else items.push({ id: p.id, titulo: p.titulo, precio: p.precio, img: p.img, cant: 1 });
      this.save(items);
      return found ? 'inc' : 'new';
    },
    setQty: function (id, cant) {
      var items = this.get();
      for (var i = 0; i < items.length; i++) if (items[i].id === id) items[i].cant = Math.max(1, cant);
      this.save(items);
    },
    remove: function (id) {
      this.save(this.get().filter(function (x) { return x.id !== id; }));
    },
    clear: function () { this.save([]); },
    count: function () { return this.get().reduce(function (a, x) { return a + x.cant; }, 0); },
    total: function () {
      var t = this.get().reduce(function (a, x) { return a + x.precio * x.cant; }, 0);
      return Math.round(t * 100) / 100;
    }
  };

  var zona;
  function toast(texto) {
    if (!zona) { zona = document.createElement('div'); zona.className = 'toast-zone'; document.body.appendChild(zona); }
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = texto;
    zona.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, 2200);
  }

  // Botones "Agregar al carrito" (catálogo y fichas de juego)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    var r = Cart.add({
      id: btn.dataset.id,
      titulo: btn.dataset.titulo,
      precio: parseFloat(btn.dataset.precio),
      img: btn.dataset.img
    });
    toast(r === 'inc' ? 'Se sumó otra unidad de ' + btn.dataset.titulo : btn.dataset.titulo + ' se agregó al carrito');
  });

  // Avisar al menú lateral en qué página estamos y cuántos productos hay en el carrito
  document.addEventListener('DOMContentLoaded', function () {
    aviso('page', { page: document.body.dataset.page || '' });
    aviso('cart', { count: Cart.count() });
  });

  window.Cart = Cart;
  window.money = money;
  window.toast = toast;
  window.sesion = function () { return read('gv_session', null); };
  window.leerLS = read;
  window.escribirLS = write;
})();
