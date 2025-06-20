const valueField = document.getElementById("input");
const value = input.addEventListener("input" , (e) => {
    valueField.textContent = e.target.value;
    console.log(valueField.textContent)
})

console.log(value);
