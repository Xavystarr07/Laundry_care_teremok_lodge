// hotelData.js - Hotel names and their associated unit numbers

const hotelUnitMap = {
    "Teremok Lodge": [],
};

// Returns the full hotel options HTML string (used when building rows dynamically)
function getHotelOptionsHTML(selectedHotel = "") {
    const hotels = [
        "Teremok Lodge"
    ];
    return hotels.map(h =>
        `<option value="${h}" ${h === selectedHotel ? "selected" : ""}>${h === "Bermudas" ? "Bermudas" : h}</option>`
    ).join('');
}

function updateUnitDatalist(hotelSelect) {
    const unitInput = hotelSelect.closest('tr').querySelector('.unit-number');
    const datalistId = 'unit-options-' + Math.random().toString(36).substr(2, 5);
    let datalist = document.createElement('datalist');
    datalist.id = datalistId;

    const selectedHotel = hotelSelect.value;
    const units = hotelUnitMap[selectedHotel] || [];

    datalist.innerHTML = units.map(unit => `<option value="${unit}">`).join("");
    document.body.appendChild(datalist);

    unitInput.setAttribute('list', datalistId);
}

// On page load, restore previously selected hotel from localStorage
window.addEventListener('load', function () {
    const selectedHotel = localStorage.getItem('selectedHotel');
    const hotelSelect = document.getElementById('hotelSelect');
    if (selectedHotel && hotelSelect) {
        hotelSelect.value = selectedHotel;
    }
});

// Save selected hotel to localStorage on change
document.addEventListener('DOMContentLoaded', function () {
    const hotelSelect = document.getElementById('hotelSelect');
    if (hotelSelect) {
        hotelSelect.addEventListener('change', function () {
            localStorage.setItem('selectedHotel', this.value);
        });
    }
});
