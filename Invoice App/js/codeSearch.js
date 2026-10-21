// codeSearch.js - Code suggestion/autocomplete for invoice rows

function suggestCode(input) {
    let query = input.value.toUpperCase();
    let dropdownId = input.getAttribute("list");
    let dropdown = document.getElementById(dropdownId);

    dropdown.innerHTML = ''; // Reset dropdown

    let suggestions = priceList.filter(item => item.code.includes(query));

    suggestions.forEach(item => {
        let option = document.createElement('option');
        option.value = item.code;
        dropdown.appendChild(option);
    });

    input.addEventListener('change', function () {
        let selectedItem = priceList.find(item => item.code === input.value);
        if (selectedItem) {
            let row = input.closest('tr');
            row.querySelector('.description').value = selectedItem.description;
            row.querySelector('.price').value = selectedItem.price.toFixed(2);
        }
    });
}

function searchItem() {
    let query = document.getElementById("searchBar").value.toLowerCase();
    let resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = "";

    if (query.trim() === "") {
        resultsDiv.style.display = "none";
        return;
    }

    let foundItem = priceList.find(item =>
        item.code.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    );

    resultsDiv.style.display = "block";

    if (foundItem) {
        resultsDiv.innerHTML = `<p><strong>${foundItem.description}</strong> - ${foundItem.price}</p>`;
    } else {
        resultsDiv.innerHTML = "<p style='color: red;'>Item not found</p>";
    }
}
