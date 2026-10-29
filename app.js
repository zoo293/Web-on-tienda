/* ===== Catálogo: panel del carrito, búsqueda y boleta de compra ===== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var carrito = $('carrito'), overlay = $('overlay'), lista = $('carrito-items'),
      vacio = $('carrito-vacio'), totalEl = $('carrito-precio-total'), cantEl = $('carrito-cantidad'),
      pagarBtn = $('btn-pagar'), badge = $('badge-carrito');

  /* ---------- Abrir / cerrar el carrito ---------- */
  function abrir() { carrito.classList.add('open'); overlay.classList.add('show'); }
  function cerrar() { carrito.classList.remove('open'); overlay.classList.remove('show'); }
  $('btn-abrir-carrito').addEventListener('click', abrir);
  $('btn-cerrar-carrito').addEventListener('click', cerrar);
  overlay.addEventListener('click', cerrar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { cerrar(); cerrarBoleta(); } });

  /* ---------- Dibujar el carrito ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var iconoBasura = '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>';

  function dibujar() {
    var items = Cart.get();
    lista.innerHTML = '';
    items.forEach(function (it) {
      var div = document.createElement('div');
      div.className = 'carrito-item';
      div.dataset.id = it.id;
      div.innerHTML =
        '<img src="' + esc(it.img) + '" alt="">' +
        '<div class="carrito-item-detalles">' +
          '<span class="carrito-item-titulo">' + esc(it.titulo) + '</span>' +
          '<div class="selector-cantidad">' +
            '<button data-accion="restar" aria-label="Quitar uno">−</button>' +
            '<span>' + it.cant + '</span>' +
            '<button data-accion="sumar" aria-label="Agregar uno">+</button>' +
          '</div>' +
          '<span class="carrito-item-precio">' + money(it.precio * it.cant) + '</span>' +
        '</div>' +
        '<button class="btn-eliminar" data-accion="eliminar" aria-label="Eliminar">' + iconoBasura + '</button>';
      lista.appendChild(div);
    });
    vacio.style.display = items.length ? 'none' : 'block';
    pagarBtn.disabled = !items.length;
    totalEl.textContent = money(Cart.total());
    cantEl.textContent = Cart.count() + (Cart.count() === 1 ? ' producto' : ' productos');
    badge.textContent = Cart.count();
    badge.classList.toggle('show', Cart.count() > 0);
  }

  lista.addEventListener('click', function (e) {
    var b = e.target.closest('[data-accion]');
    if (!b) return;
    var id = b.closest('.carrito-item').dataset.id;
    var it = Cart.get().filter(function (x) { return x.id === id; })[0];
    if (!it) return;
    if (b.dataset.accion === 'sumar') Cart.setQty(id, it.cant + 1);
    if (b.dataset.accion === 'restar') { if (it.cant > 1) Cart.setQty(id, it.cant - 1); else Cart.remove(id); }
    if (b.dataset.accion === 'eliminar') Cart.remove(id);
  });

  document.addEventListener('cart:change', dibujar);
  /* ---------- Búsqueda ---------- */
  var buscar = $('buscar'), sinRes = $('sin-resultados');
  buscar.addEventListener('input', function () {
    var q = buscar.value.trim().toLowerCase(), visibles = 0;
    document.querySelectorAll('.contenedor-items .card').forEach(function (c) {
      var ok = c.dataset.titulo.toLowerCase().indexOf(q) !== -1;
      c.style.display = ok ? '' : 'none';
      if (ok) visibles++;
    });
    sinRes.style.display = visibles ? 'none' : 'block';
  });

  /* ---------- Boleta ---------- */
  var modal = $('modal-boleta');

  function aLetras(n) {
    var U = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
    var D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    var C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    function menor1000(x) {
      if (x === 100) return 'cien';
      var s = '', c = Math.floor(x / 100), r = x % 100;
      if (c) s += C[c] + ' ';
      if (r < 30) s += U[r]; else { var d = Math.floor(r / 10), u = r % 10; s += D[d] + (u ? ' y ' + U[u] : ''); }
      return s.trim();
    }
    if (n === 0) return 'cero';
    var m = Math.floor(n / 1000), r = n % 1000, s = '';
    if (m) s += (m === 1 ? 'mil' : menor1000(m).replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un') + ' mil') + ' ';
    if (r) s += menor1000(r);
    return s.trim();
  }

  function pagar() {
    var items = Cart.get();
    if (!items.length) { toast('Tu carrito está vacío'); return; }

    var total = Cart.total();
    var gravada = Math.round(total / 1.18 * 100) / 100;
    var igv = Math.round((total - gravada) * 100) / 100;
    var n = (leerLS('gv_boleta_n', 0) || 0) + 1;
    escribirLS('gv_boleta_n', n);
    var numero = 'B001-' + String(n).padStart(6, '0');
    var s = sesion() || { nombre: 'Cliente', email: '' };
    var ahora = new Date();
    var fecha = ahora.toLocaleDateString('es-PE') + '  ' + ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    var enteros = Math.floor(total), cent = Math.round((total - enteros) * 100);
    var son = (aLetras(enteros) + ' con ' + String(cent).padStart(2, '0') + '/100 soles').toUpperCase();

    var filas = items.map(function (it) {
      return '<tr><td>' + it.cant + '</td><td class="d">' + esc(it.titulo) + '</td><td>' + money(it.precio).replace('S/ ', '') + '</td><td>' + money(it.precio * it.cant).replace('S/ ', '') + '</td></tr>';
    }).join('');

    $('boleta-contenido').innerHTML =
      '<div class="exito">' +
        '<div class="check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
        '<h2>¡Compra realizada!</h2>' +
        '<p>Gracias por tu compra, ' + esc(s.nombre.split(' ')[0]) + '. Aquí está tu boleta.</p>' +
      '</div>' +
      '<div class="boleta">' +
        '<div class="emisor"><b>GAMEVERSE</b><span>Tienda de videojuegos</span><span>RUC 20000000001</span>' +
          '<div class="tipo">BOLETA DE VENTA ELECTRÓNICA<em>' + numero + '</em></div></div>' +
        '<div class="datos"><b>Fecha:</b><span>' + fecha + '</span><b>Cliente:</b><span>' + esc(s.nombre) + '</span>' +
          (s.email ? '<b>Correo:</b><span>' + esc(s.email) + '</span>' : '') + '</div>' +
        '<table><thead><tr><th>Cant.</th><th>Descripción</th><th>P. Unit.</th><th>Importe</th></tr></thead><tbody>' + filas + '</tbody></table>' +
        '<div class="tot">' +
          '<div><span>Op. gravada</span><span>' + money(gravada) + '</span></div>' +
          '<div><span>IGV (18%)</span><span>' + money(igv) + '</span></div>' +
          '<div class="g"><span>TOTAL</span><span>' + money(total) + '</span></div>' +
          '<div class="son">SON: ' + son + '</div></div>' +
        '<div class="pie"><strong>¡Gracias por tu compra!</strong>Conserva esta boleta como comprobante.' +
          '<div class="demo">Documento de práctica académica, sin validez tributaria.</div></div>' +
      '</div>' +
      '<div class="boleta-actions">' +
        '<button class="btn btn-ghost" id="btn-imprimir">Imprimir / Guardar PDF</button>' +
        '<button class="btn btn-primary" id="btn-seguir">Seguir comprando</button>' +
      '</div>';

    $('btn-imprimir').addEventListener('click', function () { window.print(); });
    $('btn-seguir').addEventListener('click', cerrarBoleta);

    Cart.clear();
    cerrar();
    modal.classList.add('show');
    modal.scrollTop = 0;
  }
  function cerrarBoleta() { modal.classList.remove('show'); }
  pagarBtn.addEventListener('click', pagar);
  modal.addEventListener('click', function (e) { if (e.target === modal) cerrarBoleta(); });

  /* ---------- Inicio ---------- */
  dibujar();
  if (/carrito/.test(location.search + location.hash)) abrir();
})();
