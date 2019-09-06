const form = document.querySelector('form');
const name = document.querySelector('#name');
const cost = document.querySelector('#cost');
const error = document.querySelector('#error');
 

// event lister when button is clicked
form.addEventListener('submit', (event) => {

  event.preventDefault();

  if (name.value && cost.value) {
    const item = {
      name : name.value,
      cost : parseInt(cost.value) // ensure that we update DB with the right data type
    };

    db.collection('expenses')
      .add(item)
      .then( res => {
        name.value = ""
        cost.value = ""
        error.textContent = ""
    })



  } else {
    error.textContent = "Please enter values before submitting";
  }
})