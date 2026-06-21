// Show welcome alert when homepage loads
window.onload = function() {
  // If we are on reserved.html, load orders instead of showing alert
  if (document.getElementById("reservedTable")) {
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    let table = document.getElementById("reservedTable");

    orders.forEach(order => {
      let newRow = table.insertRow();
      newRow.insertCell(0).innerText = order.name;
      newRow.insertCell(1).innerText = order.phone;
      newRow.insertCell(2).innerText = order.date;
      newRow.insertCell(3).innerText = order.dish;
    });
  } else {
    // Default homepage alert
    alert("Welcome to Sunrise Restaurant!");
  }
};

// Validate order form before submission
function validateForm() {
  let form = document.forms["orderForm"];
  let name = form["name"].value.trim();
  let phone = form["phone"].value.trim();
  let date = form["date"].value;
  let dish = form["dish"].value;

  // Full name must be at least two words
  if (name.split(" ").length < 2) {
    alert("Full name must contain at least two words.");
    return false;
  }

  // Phone number must be exactly 10 digits
  if (!/^\d{10}$/.test(phone)) {
    alert("Phone number must be exactly 10 digits.");
    return false;
  }

  // Date must be today or in the future
  let today = new Date();
  today.setHours(0,0,0,0);
  let orderDate = new Date(date);
  if (orderDate < today) {
    alert("Date of ordering must be today or in the future.");
    return false;
  }

  // Dish must not be empty
  if (dish === "") {
    alert("Please select a dish.");
    return false;
  }

  // Save order in localStorage
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  orders.push({ name, phone, date, dish });
  localStorage.setItem("orders", JSON.stringify(orders));

  alert("Order reserved successfully!");
  return false; // prevent actual form submission
}

// Clear all orders (for reserved.html)
function clearOrders() {
  localStorage.removeItem("orders");
  let table = document.getElementById("reservedTable");
  // remove all rows except header
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
  alert("All orders cleared!");
}

// Highlight menu item when clicked (menu.html)
function highlightItem(itemId) {
  document.getElementById(itemId).style.backgroundColor = "yellow";
}
