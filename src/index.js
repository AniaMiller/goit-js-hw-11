function insertPlaceholderText() {
    var input = document.querySelector('input[name="query"]');
    input.placeholder = 'Please input what do you search ...';
  }
  
  window.addEventListener('load', insertPlaceholderText);