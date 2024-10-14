function requeteApi(){
    fetch("https://localhost:8000/api/v1/titles/9008642?format=api")
   .then((response) => response.json())
   .then((json) => console.log(json));
}
console.log(requeteApi)