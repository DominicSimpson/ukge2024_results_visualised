const { renderDOM } = require('./helpers');
global.fetch = require('node-fetch');

let dom;
let document;

describe('index.html', () => {
  beforeEach(async () => {
    dom = await renderDOM('./index.html');
    document = await dom.window.document;
  })
  
  it('has a reset zoom button with an icon', () => {
    const btn = document.querySelector('#reset-zoom')
    expect(btn).toBeTruthy();

    const icon = btn.querySelector('i');
    expect(icon).toBeTruthy();
    expect(icon.classList.contains('fa-compress')).toBe(true);
  });

  it('can trigger a click event on the reset button', () => {
    const btn = document.querySelector('#reset-zoom');
    let clicked = false;

    btn.addEventListener('click', () => {
      clicked = true;
    });

    btn.click();
    expect(clicked).toBe(true);
  })
})

