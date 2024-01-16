function render_random_box(item) {
  let template = document.getElementById("random-template").content.cloneNode(true);

  let a = template.querySelector(".random-template-a");
  a.setAttribute("href", item.permalink);
  a.setAttribute("title", item.title);

  let img = template.querySelector(".random-template-img");
  img.setAttribute("src", item.featured_image);

  let title = template.querySelector(".random-template-title");
  title.innerText = item.title;

  let p = template.querySelector(".random-template-p");
  p.innerText = item.name;

  document.getElementById("random-render-box").appendChild(template);
}

function getRandomSubset(arr, size) {
  let subset = [];
  if(size >= arr.length) {
    return arr;
  }
  while(subset.length < size) {
    let randomIndex = Math.floor(Math.random() * arr.length);
    let randomElement = arr[randomIndex];
    if(subset.includes(randomElement)) {
      continue;
    }
    subset.push(randomElement);
  }
  return subset;
}

function render_random() {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "/index.json", true);
  xhr.onreadystatechange = function() {
    if (xhr.status === 200) {
      let data = JSON.parse(xhr.responseText);
      let list = getRandomSubset(data, 20);
      for (var i = 0; i < list.length; i++) {
        render_random_box(list[i]);
      }
    }
  };
  xhr.send();
}
render_random();