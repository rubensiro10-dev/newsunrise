function showNotification(elementId, message, type) {
  var el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = 'notification show notification-' + type;
}

window.onload = function () {
  if (document.getElementById('reservedTable')) {
    var orders = JSON.parse(localStorage.getItem('orders')) || [];
    var table = document.getElementById('reservedTable');
    var tbody = table.querySelector('tbody') || table;

    orders.forEach(function (order) {
      var row = tbody.insertRow();
      row.insertCell(0).textContent = order.name;
      row.insertCell(1).textContent = order.phone;
      row.insertCell(2).textContent = order.date;
      row.insertCell(3).textContent = order.dish;
    });
  }
};

function validateForm() {
  var form = document.forms['orderForm'];
  var name = form['name'].value.trim();
  var phone = form['phone'].value.trim();
  var date = form['date'].value;
  var dish = form['dish'].value;

  if (name.split(' ').filter(Boolean).length < 2) {
    showNotification('formNotification', 'Please enter your full name (first and last).', 'error');
    return false;
  }

  if (!/^\d{10}$/.test(phone)) {
    showNotification('formNotification', 'Phone number must be exactly 10 digits.', 'error');
    return false;
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var orderDate = new Date(date);
  if (orderDate < today) {
    showNotification('formNotification', 'Please select today\'s date or a future date.', 'error');
    return false;
  }

  if (dish === '') {
    showNotification('formNotification', 'Please select a dish from the menu.', 'error');
    return false;
  }

  var orders = JSON.parse(localStorage.getItem('orders')) || [];
  orders.push({ name: name, phone: phone, date: date, dish: dish });
  localStorage.setItem('orders', JSON.stringify(orders));

  showNotification('formNotification', 'Your order has been reserved successfully. We look forward to serving you.', 'success');
  form.reset();
  return false;
}

function clearOrders() {
  if (!confirm('Are you sure you want to clear all reserved orders?')) return;

  localStorage.removeItem('orders');
  var table = document.getElementById('reservedTable');
  var tbody = table.querySelector('tbody') || table;
  while (tbody.rows.length > 0) {
    tbody.deleteRow(0);
  }
  showNotification('reservationNotification', 'All orders have been cleared.', 'success');
}
